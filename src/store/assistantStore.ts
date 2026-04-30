// ============================================
// 助手状态管理
// ============================================

import type { AssistantType, ApiConfig, ApiProvider } from '../types/assistant'
import { DEFAULT_API_CONFIG } from '../types/assistant'

const STORAGE_KEY_ASSISTANT = 'codehubai-assistant'
const STORAGE_KEY_API_CONFIG = 'codehubai-api-config'

type Listener = () => void

interface AssistantState {
  assistant: AssistantType
  apiConfig: ApiConfig
}

class AssistantStore {
  private state: AssistantState = {
    assistant: 'opencode',
    apiConfig: DEFAULT_API_CONFIG,
  }

  private listeners: Set<Listener> = new Set()

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage(): void {
    const savedAssistant = localStorage.getItem(STORAGE_KEY_ASSISTANT)
    if (savedAssistant === 'opencode' || savedAssistant === 'claude-code') {
      this.state.assistant = savedAssistant
    }

    const savedConfig = localStorage.getItem(STORAGE_KEY_API_CONFIG)
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.providers)) {
          this.state.apiConfig = parsed
        }
      } catch {
        // ignore parse error
      }
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY_ASSISTANT, this.state.assistant)
    localStorage.setItem(STORAGE_KEY_API_CONFIG, JSON.stringify(this.state.apiConfig))
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener()
    }
  }

  getAssistant(): AssistantType {
    return this.state.assistant
  }

  getApiConfig(): ApiConfig {
    return this.state.apiConfig
  }

  getActiveProvider(): ApiProvider | undefined {
    if (!this.state.apiConfig.activeProviderId) return undefined
    return this.state.apiConfig.providers.find(p => p.id === this.state.apiConfig.activeProviderId)
  }

  hasUserApiConfigured(): boolean {
    return this.state.apiConfig.providers.length > 0 && this.state.apiConfig.activeProviderId !== undefined
  }

  setAssistant(type: AssistantType): boolean {
    if (type === 'claude-code' && !this.hasUserApiConfigured()) {
      return false
    }

    this.state.assistant = type
    this.saveToStorage()
    this.notify()
    return true
  }

  addProvider(provider: Omit<ApiProvider, 'id'>): ApiProvider {
    const newProvider: ApiProvider = {
      ...provider,
      id: `provider-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    }

    this.state.apiConfig.providers.push(newProvider)
    this.saveToStorage()
    this.notify()
    return newProvider
  }

  updateProvider(id: string, updates: Partial<Omit<ApiProvider, 'id'>>): boolean {
    const index = this.state.apiConfig.providers.findIndex(p => p.id === id)
    if (index === -1) return false

    this.state.apiConfig.providers[index] = {
      ...this.state.apiConfig.providers[index],
      ...updates,
    }
    this.saveToStorage()
    this.notify()
    return true
  }

  removeProvider(id: string): boolean {
    const index = this.state.apiConfig.providers.findIndex(p => p.id === id)
    if (index === -1) return false

    this.state.apiConfig.providers.splice(index, 1)

    if (this.state.apiConfig.activeProviderId === id) {
      this.state.apiConfig.activeProviderId = this.state.apiConfig.providers[0]?.id
      this.state.apiConfig.activeModel = this.state.apiConfig.providers[0]?.models[0]
    }

    this.saveToStorage()
    this.notify()
    return true
  }

  setActiveProvider(providerId: string): boolean {
    const provider = this.state.apiConfig.providers.find(p => p.id === providerId)
    if (!provider) return false

    this.state.apiConfig.activeProviderId = providerId
    this.state.apiConfig.activeModel = provider.models[0] || undefined
    this.saveToStorage()
    this.notify()
    return true
  }

  setActiveModel(modelId: string): boolean {
    const provider = this.getActiveProvider()
    if (!provider || !provider.models.includes(modelId)) return false

    this.state.apiConfig.activeModel = modelId
    this.saveToStorage()
    this.notify()
    return true
  }

  refreshModels(providerId: string, models: string[]): boolean {
    const index = this.state.apiConfig.providers.findIndex(p => p.id === providerId)
    if (index === -1) return false

    this.state.apiConfig.providers[index].models = models

    if (this.state.apiConfig.activeProviderId === providerId) {
      if (!models.includes(this.state.apiConfig.activeModel || '')) {
        this.state.apiConfig.activeModel = models[0] || undefined
      }
    }

    this.saveToStorage()
    this.notify()
    return true
  }
}

export const assistantStore = new AssistantStore()

export function useAssistantStoreSnapshot(): AssistantState {
  return {
    assistant: assistantStore.getAssistant(),
    apiConfig: assistantStore.getApiConfig(),
  }
}