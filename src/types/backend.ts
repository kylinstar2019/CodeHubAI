// ============================================
// Backend Types - 多后端支持类型定义
// ============================================

/** 后端服务器类型 */
export type BackendType = 'opencode' | 'ollama' | 'anthropic' | 'openai' | 'claude-code'

/** 连接状态 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

/** 后端连接状态 */
export interface BackendStatus {
  connection: ConnectionStatus
  lastChecked: number
  latency?: number
  error?: string
  version?: string
}

/** MCP 服务器配置 */
export interface MCPServerConfig {
  id: string
  name: string
  type: 'local' | 'remote'
  command?: string[]
  url?: string
  enabled: boolean
  status?: 'starting' | 'running' | 'stopped' | 'error'
  tools?: string[]
  error?: string
}

/** Skill 配置 */
export interface SkillConfig {
  id: string
  name: string
  description: string
  enabled: boolean
  prompt?: string
  tools?: string[]
}

/** 模型能力 */
export interface ModelCapabilities {
  reasoning: boolean
  images: boolean
  pdf: boolean
  audio: boolean
  video: boolean
  toolcall: boolean
}

/** 模型信息 */
export interface ModelInfo {
  id: string
  name: string
  provider: string
  contextLimit: number
  outputLimit: number
  capabilities: ModelCapabilities
  status: 'active' | 'available' | 'unavailable'
}

/** API 配置 */
export interface APIConfig {
  baseUrl: string
  apiKey?: string
  authType?: 'bearer' | 'x-api-key' | 'basic' | 'none'
  headers?: Record<string, string>
}

/** 扩展的服务器配置 - 用于第三方后端 */
export interface ExtendedServerConfig {
  /** 基础配置 */
  id: string
  name: string
  url: string
  isDefault?: boolean
  auth?: { username: string; password: string }

  /** 多后端扩展字段 */
  backendType?: BackendType
  apiKey?: string
  authType?: 'none' | 'bearer' | 'x-api-key' | 'basic'
  models?: ModelInfo[]
  defaultModel?: string
  mcpServers?: MCPServerConfig[]
  skills?: SkillConfig[]
  status?: BackendStatus
  createdAt?: number
  updatedAt?: number
}

/** 统一消息格式 */
export interface UnifiedMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  toolCalls?: ToolCall[]
  toolCallId?: string
}

/** 工具调用 */
export interface ToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

/** 工具定义 */
export interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown>
}

/** 聊天选项 */
export interface ChatOptions {
  model?: string
  maxTokens?: number
  temperature?: number
  system?: string
  tools?: ToolDefinition[]
}

/** 统一响应 */
export interface UnifiedResponse {
  id: string
  model: string
  content: string
  stopReason?: 'end_turn' | 'tool_use' | 'max_tokens'
  usage?: { inputTokens: number; outputTokens: number }
}