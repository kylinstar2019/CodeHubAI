// ============================================
// Server Templates - 服务器模板和预设配置
// ============================================

import type { BackendType, ModelInfo, MCPServerConfig, SkillConfig, APIConfig, ExtendedServerConfig } from '../types/backend'

export interface ServerTemplate {
  type: BackendType
  name: string
  api: APIConfig
  models?: ModelInfo[]
  mcpServers?: MCPServerConfig[]
  skills?: SkillConfig[]
}

export const SERVER_TEMPLATES: Record<BackendType, ServerTemplate> = {
  opencode: {
    type: 'opencode',
    name: 'OpenCode',
    api: {
      baseUrl: 'http://127.0.0.1:4096',
      authType: 'none',
    },
    mcpServers: [],
    skills: [],
  },

  ollama: {
    type: 'ollama',
    name: 'Ollama (本地)',
    api: {
      baseUrl: 'http://127.0.0.1:11434',
      authType: 'none',
    },
    mcpServers: [],
    skills: [],
  },

  anthropic: {
    type: 'anthropic',
    name: 'Anthropic',
    api: {
      baseUrl: 'https://api.anthropic.com',
      authType: 'x-api-key',
    },
    models: [],
    mcpServers: [],
    skills: [],
  },

  openai: {
    type: 'openai',
    name: 'OpenAI',
    api: {
      baseUrl: 'https://api.openai.com/v1',
      authType: 'bearer',
    },
    mcpServers: [],
    skills: [],
  },

  'claude-code': {
    type: 'claude-code',
    name: 'Claude Code',
    api: {
      baseUrl: 'https://api.anthropic.com',
      authType: 'x-api-key',
    },
    models: [
      {
        id: 'claude-sonnet-4-20250514',
        name: 'Claude Sonnet 4',
        provider: 'anthropic',
        contextLimit: 200000,
        outputLimit: 16000,
        capabilities: {
          reasoning: true, images: true, pdf: true,
          audio: false, video: false, toolcall: true
        },
        status: 'active',
      },
    ],
    mcpServers: [],
    skills: [],
  },
}

export const THIRD_PARTY_PRESETS: Record<string, ServerTemplate> = {
  'tencent-coding': {
    type: 'anthropic',
    name: '腾讯云 Coding',
    api: {
      baseUrl: 'https://api.lkeap.cloud.tencent.com/coding/anthropic',
      authType: 'x-api-key',
    },
    models: [
      {
        id: 'minimax-m2.5',
        name: 'MiniMax M2.5',
        provider: 'minimax',
        contextLimit: 128000,
        outputLimit: 4096,
        capabilities: { reasoning: true, images: false, pdf: false, audio: false, video: false, toolcall: true },
        status: 'active'
      },
      {
        id: 'kimi-k2.5',
        name: 'Kimi K2.5',
        provider: 'moonshot',
        contextLimit: 128000,
        outputLimit: 4096,
        capabilities: { reasoning: true, images: false, pdf: false, audio: false, video: false, toolcall: true },
        status: 'active'
      },
      {
        id: 'glm-5-0',
        name: 'GLM-5',
        provider: 'zhipu',
        contextLimit: 128000,
        outputLimit: 4096,
        capabilities: { reasoning: true, images: false, pdf: false, audio: false, video: false, toolcall: true },
        status: 'active'
      },
    ],
    mcpServers: [],
    skills: [],
  },

  'deepseek': {
    type: 'openai',
    name: 'DeepSeek',
    api: {
      baseUrl: 'https://api.deepseek.com/v1',
      authType: 'bearer',
    },
    models: [
      {
        id: 'deepseek-chat',
        name: 'DeepSeek Chat',
        provider: 'deepseek',
        contextLimit: 64000,
        outputLimit: 4096,
        capabilities: { reasoning: false, images: false, pdf: false, audio: false, video: false, toolcall: true },
        status: 'active'
      },
      {
        id: 'deepseek-reasoner',
        name: 'DeepSeek Reasoner',
        provider: 'deepseek',
        contextLimit: 64000,
        outputLimit: 4096,
        capabilities: { reasoning: true, images: false, pdf: false, audio: false, video: false, toolcall: true },
        status: 'active'
      },
    ],
    mcpServers: [],
    skills: [],
  },
}

export function createServerFromTemplate(
  template: ServerTemplate,
  name: string,
  url: string,
  apiKey?: string
): ExtendedServerConfig {
  return {
    id: `server-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    url: url.replace(/\/+$/, ''),
    backendType: template.type,
    apiKey,
    authType: template.api.authType,
    models: template.models ? [...template.models] : [],
    defaultModel: template.models?.[0]?.id,
    mcpServers: [],
    skills: [],
    status: { connection: 'disconnected', lastChecked: Date.now() },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}