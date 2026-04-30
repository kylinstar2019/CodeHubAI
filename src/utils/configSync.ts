// ============================================
// 配置同步工具
// 将 IDE 配置同步到 OpenCode 和 Claude Code 配置文件
// ============================================

import type { ApiConfig, AssistantType, SyncStatus } from '../types/assistant'

const isTauriEnv = (): boolean => {
  try {
    return typeof window !== 'undefined' && '__TAURI__' in window
  } catch {
    return false
  }
}

// ============================================
// 配置路径
// ============================================

const CONFIG_DIR_NAME = 'config'
const API_CONFIG_FILE = 'api.json'

// Claude Code 配置路径
const CLAUDE_CODE_CONFIG_PATHS: Record<string, string> = {
  windows: '.claude/settings.json',
  darwin: '.claude/settings.json',
  linux: '.claude/settings.json',
}

// OpenCode 配置路径（如果有的话）
const OPENCODE_CONFIG_PATHS: Record<string, string> = {
  windows: '.opencode/config.json',
  darwin: '.opencode/config.json',
  linux: '.opencode/config.json',
}

// ============================================
// 同步结果
// ============================================

export interface SyncResult {
  success: boolean
  target: AssistantType
  path: string
  error?: string
}

// ============================================
// Claude Code 配置格式
// ============================================

interface ClaudeCodeSettings {
  model?: string
  env?: Record<string, string>
  mcpServers?: Record<string, unknown>
}

function buildClaudeCodeSettings(apiConfig: ApiConfig): ClaudeCodeSettings {
  const settings: ClaudeCodeSettings = {}

  if (apiConfig.activeModel) {
    settings.model = apiConfig.activeModel
  }

  const provider = apiConfig.providers.find(p => p.id === apiConfig.activeProviderId)
  if (provider) {
    settings.env = {} as Record<string, string>

    switch (provider.type) {
      case 'anthropic':
        settings.env['ANTHROPIC_API_KEY'] = provider.apiKey || ''
        if (provider.url && !provider.url.includes('api.anthropic.com')) {
          settings.env['ANTHROPIC_BASE_URL'] = provider.url
        }
        break
      case 'openai':
        settings.env['OPENAI_API_KEY'] = provider.apiKey || ''
        settings.env['OPENAI_BASE_URL'] = provider.url
        break
      case 'ollama':
        settings.env['OLLAMA_BASE_URL'] = provider.url
        break
    }
  }

  return settings
}

// ============================================
// 检查并创建配置文件夹
// ============================================

async function ensureConfigDir(): Promise<string | null> {
  if (!isTauriEnv()) return null

  try {
    const { appConfigDir, join } = await import('@tauri-apps/api/path')
    const { mkdir, exists } = await import('@tauri-apps/plugin-fs')

    const appDir = await appConfigDir()
    const configDir = await join(appDir, CONFIG_DIR_NAME)

    if (!(await exists(configDir))) {
      await mkdir(configDir, { recursive: true })
    }

    return configDir
  } catch (e) {
    console.error('Failed to ensure config dir:', e)
    return null
  }
}

async function getHomeDir(): Promise<string | null> {
  if (!isTauriEnv()) return null

  try {
    const { homeDir } = await import('@tauri-apps/api/path')
    return await homeDir()
  } catch {
    return null
  }
}

// ============================================
// 保存配置到 IDE config 文件夹
// ============================================

export async function saveApiConfigToIde(apiConfig: ApiConfig): Promise<boolean> {
  const configDir = await ensureConfigDir()
  if (!configDir) return false

  try {
    const { join } = await import('@tauri-apps/api/path')
    const { writeTextFile } = await import('@tauri-apps/plugin-fs')

    const filePath = await join(configDir, API_CONFIG_FILE)
    await writeTextFile(filePath, JSON.stringify(apiConfig, null, 2))

    console.log('[ConfigSync] Saved API config to:', filePath)
    return true
  } catch (e) {
    console.error('[ConfigSync] Failed to save API config:', e)
    return false
  }
}

// ============================================
// 同步到 Claude Code 配置
// ============================================

export async function syncToClaudeCode(apiConfig: ApiConfig): Promise<SyncResult> {
  if (!isTauriEnv()) {
    return {
      success: false,
      target: 'claude-code',
      path: '',
      error: 'Not running in Tauri environment',
    }
  }

  try {
    const { join } = await import('@tauri-apps/api/path')
    const { exists, readTextFile, writeTextFile, mkdir } = await import('@tauri-apps/plugin-fs')

    const home = await getHomeDir()
    if (!home) {
      return {
        success: false,
        target: 'claude-code',
        path: '',
        error: 'Cannot get home directory',
      }
    }

    const configPath = await join(home, CLAUDE_CODE_CONFIG_PATHS.windows)
    const configDir = await join(home, '.claude')

    const settings = buildClaudeCodeSettings(apiConfig)

    let existingSettings: ClaudeCodeSettings = {}
    if (await exists(configPath)) {
      try {
        const content = await readTextFile(configPath)
        existingSettings = JSON.parse(content)
      } catch {
        existingSettings = {}
      }
    }

    const mergedSettings = {
      ...existingSettings,
      ...settings,
    }

    if (!(await exists(configDir))) {
      await mkdir(configDir, { recursive: true })
    }

    await writeTextFile(configPath, JSON.stringify(mergedSettings, null, 2))

    console.log('[ConfigSync] Synced to Claude Code:', configPath)

    return {
      success: true,
      target: 'claude-code',
      path: configPath,
    }
  } catch (e) {
    console.error('[ConfigSync] Failed to sync to Claude Code:', e)
    return {
      success: false,
      target: 'claude-code',
      path: '',
      error: String(e),
    }
  }
}

// ============================================
// 同步到 OpenCode 配置（预留接口）
// ============================================

export async function syncToOpenCode(apiConfig: ApiConfig, model: string): Promise<SyncResult> {
  if (!isTauriEnv()) {
    return {
      success: false,
      target: 'opencode',
      path: '',
      error: 'Not running in Tauri environment',
    }
  }

  try {
    const { join } = await import('@tauri-apps/api/path')
    const { exists, readTextFile, writeTextFile, mkdir } = await import('@tauri-apps/plugin-fs')

    const home = await getHomeDir()
    if (!home) {
      return {
        success: false,
        target: 'opencode',
        path: '',
        error: 'Cannot get home directory',
      }
    }

    const configRelativePath = OPENCODE_CONFIG_PATHS.windows
    const configPath = await join(home, configRelativePath)
    const configDir = await join(home, '.opencode')

    const opencodeConfig: Record<string, unknown> = {
      model,
      updatedAt: new Date().toISOString(),
    }

    const provider = apiConfig.providers.find(p => p.id === apiConfig.activeProviderId)
    if (provider && provider.type !== 'ollama') {
      opencodeConfig.apiKey = provider.apiKey
      opencodeConfig.apiUrl = provider.url
      opencodeConfig.apiType = provider.type
    }

    let existingConfig: Record<string, unknown> = {}
    if (await exists(configPath)) {
      try {
        const content = await readTextFile(configPath)
        existingConfig = JSON.parse(content)
      } catch {
        existingConfig = {}
      }
    }

    const mergedConfig = {
      ...existingConfig,
      ...opencodeConfig,
    }

    if (!(await exists(configDir))) {
      await mkdir(configDir, { recursive: true })
    }

    await writeTextFile(configPath, JSON.stringify(mergedConfig, null, 2))

    console.log('[ConfigSync] Synced to OpenCode:', configPath)

    return {
      success: true,
      target: 'opencode',
      path: configPath,
    }
  } catch (e) {
    console.error('[ConfigSync] Failed to sync to OpenCode:', e)
    return {
      success: false,
      target: 'opencode',
      path: '',
      error: String(e),
    }
  }
}

// ============================================
// 同步当前助手配置
// ============================================

export async function syncCurrentAssistantConfig(
  assistant: AssistantType,
  apiConfig: ApiConfig,
  model: string
): Promise<{ opencode?: SyncResult; claudeCode?: SyncResult }> {
  const results: { opencode?: SyncResult; claudeCode?: SyncResult } = {}

  await saveApiConfigToIde(apiConfig)

  if (assistant === 'opencode') {
    results.opencode = await syncToOpenCode(apiConfig, model)
  } else if (assistant === 'claude-code') {
    results.claudeCode = await syncToClaudeCode(apiConfig)
  }

  return results
}

// ============================================
// 获取同步状态
// ============================================

export async function getSyncStatus(): Promise<SyncStatus> {
  const home = await getHomeDir()
  if (!home) {
    return {
      lastSyncTime: null,
      opencode: { synced: false, path: '' },
      claudeCode: { synced: false, path: '' },
    }
  }

  const { join } = await import('@tauri-apps/api/path')
  const { exists } = await import('@tauri-apps/plugin-fs')

  const opencodePath = await join(home, OPENCODE_CONFIG_PATHS.windows)
  const claudeCodePath = await join(home, CLAUDE_CODE_CONFIG_PATHS.windows)

  return {
    lastSyncTime: Date.now(),
    opencode: {
      synced: await exists(opencodePath),
      path: opencodePath,
    },
    claudeCode: {
      synced: await exists(claudeCodePath),
      path: claudeCodePath,
    },
  }
}