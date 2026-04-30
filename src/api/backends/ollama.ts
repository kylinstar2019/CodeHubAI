// ============================================
// Ollama Backend API
// ============================================

import { BackendAPI } from './base'
import type { UnifiedMessage, UnifiedResponse, ChatOptions, ModelInfo, BackendStatus } from '../../types/backend'

export class OllamaAPI extends BackendAPI {
  async sendMessage(
    messages: UnifiedMessage[],
    options?: ChatOptions
  ): Promise<UnifiedResponse> {
    const url = `${this.config.url}/api/chat`
    const model = options?.model || this.config.defaultModel || 'llama3'

    const body = {
      model,
      messages: messages.map(m => this.convertMessage(m)),
      stream: false,
      options: {
        num_ctx: options?.maxTokens || 4096,
        temperature: options?.temperature,
      },
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`)
    }

    return this.convertResponse(await response.json())
  }

  async *sendMessageStream(
    messages: UnifiedMessage[],
    options?: ChatOptions
  ): AsyncGenerator<UnifiedResponse> {
    const url = `${this.config.url}/api/chat`
    const model = options?.model || this.config.defaultModel || 'llama3'

    const body = {
      model,
      messages: messages.map(m => this.convertMessage(m)),
      stream: true,
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
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
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line)
            yield this.convertStreamChunk(data)
          } catch { /* skip */ }
        }
      }
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    const response = await fetch(`${this.config.url}/api/tags`)
    if (!response.ok) throw new Error(`Ollama error: ${response.status}`)

    const data = await response.json()
    return (data.models || []).map((m: any) => ({
      id: m.name,
      name: m.name,
      provider: 'ollama',
      contextLimit: 4096,
      outputLimit: 4096,
      capabilities: {
        reasoning: false,
        images: true,
        pdf: false,
        audio: false,
        video: false,
        toolcall: true,
      },
      status: 'active' as const,
    }))
  }

  async checkHealth(): Promise<BackendStatus> {
    const start = Date.now()
    try {
      const response = await fetch(`${this.config.url}/api/version`)
      if (response.ok) {
        const data = await response.json()
        return {
          connection: 'connected',
          lastChecked: Date.now(),
          latency: Date.now() - start,
          version: data.version,
        }
      }
      return { connection: 'error', lastChecked: Date.now(), error: `HTTP ${response.status}` }
    } catch (e) {
      return { connection: 'disconnected', lastChecked: Date.now(), error: String(e) }
    }
  }

  private convertMessage(msg: UnifiedMessage): any {
    return { role: msg.role, content: msg.content }
  }

  private convertResponse(data: any): UnifiedResponse {
    return {
      id: `ollama-${Date.now()}`,
      model: data.model || '',
      content: data.message?.content || '',
      stopReason: data.done ? 'end_turn' : undefined,
      usage: { inputTokens: data.prompt_eval_count || 0, outputTokens: data.eval_count || 0 },
    }
  }

  private convertStreamChunk(data: any): UnifiedResponse {
    return {
      id: `ollama-${Date.now()}`,
      model: data.model || '',
      content: data.message?.content || '',
      stopReason: data.done ? 'end_turn' : undefined,
    }
  }
}