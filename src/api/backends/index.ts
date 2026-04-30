// ============================================
// Backend API Factory
// ============================================

import type { ExtendedServerConfig, BackendStatus, ModelInfo, ChatOptions, UnifiedResponse, UnifiedMessage } from '../../types/backend'
import { BackendAPI } from './base'
import { OllamaAPI } from './ollama'
import { AnthropicAPI } from './anthropic'

const apiCache = new Map<string, BackendAPI>()

export function createBackendAPI(config: ExtendedServerConfig): BackendAPI {
  switch (config.backendType) {
    case 'ollama':
      return new OllamaAPI(config)
    case 'anthropic':
    case 'claude-code':
    case 'openai':
      return new AnthropicAPI(config)
    default:
      throw new Error(`Unknown backend type: ${config.backendType}`)
  }
}

export function getBackendAPI(config: ExtendedServerConfig): BackendAPI {
  const key = `${config.id}:${config.url}:${config.apiKey || ''}`

  if (!apiCache.has(key)) {
    apiCache.set(key, createBackendAPI(config))
  }

  return apiCache.get(key)!
}

export function clearBackendAPICache(serverId?: string): void {
  if (serverId) {
    for (const key of apiCache.keys()) {
      if (key.startsWith(serverId)) apiCache.delete(key)
    }
  } else {
    apiCache.clear()
  }
}

export async function checkBackendHealth(config: ExtendedServerConfig): Promise<BackendStatus> {
  const api = getBackendAPI(config)
  return api.checkHealth()
}

export async function listBackendModels(config: ExtendedServerConfig): Promise<ModelInfo[]> {
  const api = getBackendAPI(config)
  return api.listModels()
}

export async function sendBackendMessage(
  config: ExtendedServerConfig,
  messages: UnifiedMessage[],
  options?: ChatOptions
): Promise<UnifiedResponse> {
  const api = getBackendAPI(config)
  return api.sendMessage(messages, options)
}

export async function* sendBackendMessageStream(
  config: ExtendedServerConfig,
  messages: UnifiedMessage[],
  options?: ChatOptions
): AsyncGenerator<UnifiedResponse> {
  const api = getBackendAPI(config)
  yield* api.sendMessageStream(messages, options)
}