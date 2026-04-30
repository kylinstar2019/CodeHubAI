// ============================================
// Anthropic Compatible API
// ============================================

import { BackendAPI } from './base'
import type { UnifiedMessage, UnifiedResponse, ChatOptions, ModelInfo, BackendStatus } from '../../types/backend'

export class AnthropicAPI extends BackendAPI {
  async sendMessage(
    messages: UnifiedMessage[],
    options?: ChatOptions
  ): Promise<UnifiedResponse> {
    const url = `${this.config.url}/v1/messages`
    const model = options?.model || this.config.defaultModel || 'claude-sonnet-4-20250514'

    const systemMessages = messages.filter(m => m.role === 'system')
    const chatMessages = messages.filter(m => m.role !== 'system')

    const body: any = {
      model,
      max_tokens: options?.maxTokens || 4096,
      messages: chatMessages.map(m => ({ role: m.role, content: m.content })),
    }

    if (systemMessages.length > 0) {
      body.system = systemMessages.map(m => m.content).join('\n\n')
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getAnthropicHeaders(),
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return {
      id: data.id,
      model: data.model,
      content: data.content?.[0]?.text || '',
      stopReason: data.stop_reason,
      usage: {
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
      },
    }
  }

  async *sendMessageStream(
    messages: UnifiedMessage[],
    options?: ChatOptions
  ): AsyncGenerator<UnifiedResponse> {
    const url = `${this.config.url}/v1/messages`
    const model = options?.model || this.config.defaultModel || 'claude-sonnet-4-20250514'

    const systemMessages = messages.filter(m => m.role === 'system')
    const chatMessages = messages.filter(m => m.role !== 'system')

    const body: any = {
      model,
      max_tokens: options?.maxTokens || 4096,
      messages: chatMessages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
    }

    if (systemMessages.length > 0) {
      body.system = systemMessages.map(m => m.content).join('\n\n')
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getAnthropicHeaders(),
      body: JSON.stringify(body),
    })

    const reader = response.body?.getReader()
    if (!reader) return

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      let eventEnd: number
      while ((eventEnd = buffer.indexOf('\n\n')) !== -1) {
        const event = buffer.slice(0, eventEnd)
        buffer = buffer.slice(eventEnd + 2)

        if (event.startsWith('data: ')) {
          const data = event.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              yield {
                id: parsed.message?.id || '',
                model: parsed.message?.model || '',
                content: parsed.delta.text,
                stopReason: undefined,
              }
            } else if (parsed.type === 'message_stop') {
              yield {
                id: '',
                model: '',
                content: '',
                stopReason: 'end_turn',
              }
            }
          } catch { /* skip */ }
        }
      }
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    return this.config.models || []
  }

  async checkHealth(): Promise<BackendStatus> {
    const start = Date.now()
    try {
      const response = await fetch(`${this.config.url}/v1/messages`, {
        method: 'POST',
        headers: this.getAnthropicHeaders(),
        body: JSON.stringify({
          model: this.config.defaultModel || 'claude-sonnet-4-20250514',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }],
        }),
      })

      if (response.ok || response.status === 400) {
        return { connection: 'connected', lastChecked: Date.now(), latency: Date.now() - start }
      }
      return { connection: 'error', lastChecked: Date.now(), error: `HTTP ${response.status}` }
    } catch (e) {
      return { connection: 'error', lastChecked: Date.now(), error: String(e) }
    }
  }

  private getAnthropicHeaders(): Record<string, string> {
    const headers = this.getHeaders()
    headers['anthropic-version'] = '2023-06-01'

    if (this.config.apiKey && this.config.authType !== 'bearer') {
      headers['x-api-key'] = this.config.apiKey
      delete headers['Authorization']
    }

    return headers
  }
}