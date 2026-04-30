// ============================================
// 助手类型定义
// ============================================

export type AssistantType = 'opencode' | 'claude-code'

export interface AssistantInfo {
  type: AssistantType
  name: string
  description: string
  icon: string
}

export const ASSISTANTS: Record<AssistantType, AssistantInfo> = {
  opencode: {
    type: 'opencode',
    name: 'OpenCode',
    description: '本地编码助手，内置免费模型池',
    icon: 'opencode',
  },
  'claude-code': {
    type: 'claude-code',
    name: 'Claude Code',
    description: 'Anthropic 编码助手，需配置自己的 API',
    icon: 'claude',
  },
}

// ============================================
// 用户 API 提供商配置
// ============================================

export type ProviderType = 'anthropic' | 'openai' | 'ollama'

export interface ApiProvider {
  id: string
  name: string
  type: ProviderType
  url: string
  apiKey?: string
  models: string[]
  isActive?: boolean
}

export interface ApiConfig {
  providers: ApiProvider[]
  activeProviderId?: string
  activeModel?: string
}

// ============================================
// 配置同步状态
// ============================================

export interface SyncStatus {
  lastSyncTime: number | null
  opencode: {
    synced: boolean
    path: string
    error?: string
  }
  claudeCode: {
    synced: boolean
    path: string
    error?: string
  }
}

// ============================================
// 默认配置
// ============================================

export const DEFAULT_API_CONFIG: ApiConfig = {
  providers: [],
  activeProviderId: undefined,
  activeModel: undefined,
}

// ============================================
// OpenCode 免费模型
// ============================================

export const OPENCODE_FREE_MODELS = [
  { id: 'opencode-zen', name: 'OpenCode Zen' },
  { id: 'big-pickle', name: 'Big Pickle' },
  { id: 'gpt-5-nano', name: 'GPT-5 Nano' },
  { id: 'hy3-preview-free', name: 'Hy3 Preview Free' },
  { id: 'minimax-m2-5-free', name: 'MiniMax M2.5 Free' },
  { id: 'nemotron-3-super-free', name: 'Nemotron 3 Super Free' },
]
