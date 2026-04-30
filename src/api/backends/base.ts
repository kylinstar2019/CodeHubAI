// ============================================
// Backend API - 多后端 API 基类
// ============================================

import type { ExtendedServerConfig, BackendStatus, ModelInfo, ChatOptions, UnifiedResponse, UnifiedMessage } from '../../types/backend'

export abstract class BackendAPI {
  protected config: ExtendedServerConfig

  constructor(config: ExtendedServerConfig) {
    this.config = config
  }

  abstract sendMessage(
    messages: UnifiedMessage[],
    options?: ChatOptions
  ): Promise<UnifiedResponse>

  abstract sendMessageStream(
    messages: UnifiedMessage[],
    options?: ChatOptions
  ): AsyncGenerator<UnifiedResponse>

  abstract listModels(): Promise<ModelInfo[]>

  abstract checkHealth(): Promise<BackendStatus>

  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const { apiKey, authType } = this.config

    if (apiKey) {
      switch (authType) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${apiKey}`
          break
        case 'x-api-key':
          headers['x-api-key'] = apiKey
          break
        case 'basic':
          headers['Authorization'] = `Basic ${apiKey}`
          break
      }
    }

    return headers
  }
}