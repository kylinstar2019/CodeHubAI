// ============================================
// SDK Client - 基于 @opencode-ai/sdk 的统一客户端
//
// 职责：
// 1. 根据当前活动服务器动态创建 SDK client
// 2. 整合 baseUrl / auth / tauri fetch
// 3. 为上层 API 模块提供统一的 client 获取方式
// ============================================

import { createOpencodeClient, type OpencodeClient } from '@opencode-ai/sdk/v2/client'
import { serverStore, makeBasicAuthHeader } from '../store/serverStore'
import { isTauri } from '../utils/tauri'

// Tauri fetch 缓存
let _tauriFetch: typeof globalThis.fetch | null = null
let _tauriFetchLoading: Promise<typeof globalThis.fetch> | null = null
let _tauriFetchReady = false

async function getTauriFetch(): Promise<typeof globalThis.fetch> {
  if (_tauriFetch) return _tauriFetch
  if (_tauriFetchLoading) return _tauriFetchLoading
  _tauriFetchLoading = import('@tauri-apps/plugin-http').then(mod => {
    _tauriFetch = mod.fetch as unknown as typeof globalThis.fetch
    _tauriFetchReady = true
    return _tauriFetch
  })
  return _tauriFetchLoading
}

// Client 缓存：按 "baseUrl + authHash" 缓存实例，避免重复创建
let _cachedClient: OpencodeClient | null = null
let _cachedKey = ''

function buildCacheKey(): string {
  const baseUrl = serverStore.getActiveBaseUrl()
  const auth = serverStore.getActiveAuth()
  const authPart = auth?.password ? `${auth.username}:${auth.password}` : ''
  return `${baseUrl}|${authPart}`
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
  const auth = serverStore.getActiveAuth()
  if (auth?.password) {
    headers['Authorization'] = makeBasicAuthHeader(auth)
  }
  return headers
}

/**
 * 创建一个自动使用 Tauri fetch 的 wrapper
 * 在 Tauri 环境中，如果 tauri fetch 还未加载，会等待加载完成
 */
function createTauriAwareFetch(): typeof fetch {
  return async (input, init) => {
    if (isTauri()) {
      const tauriFetch = await getTauriFetch()
      return tauriFetch(input, init)
    }
    return globalThis.fetch(input, init)
  }
}

/**
 * 同步获取 SDK client
 * 在 Tauri 环境中使用 tauri-aware fetch wrapper（内部会异步等待 tauri fetch 加载）
 */
export function getSDKClient(): OpencodeClient {
  const key = buildCacheKey()
  if (_cachedClient && _cachedKey === key) {
    return _cachedClient
  }

  const baseUrl = serverStore.getActiveBaseUrl()
  const headers = buildHeaders()

  _cachedClient = createOpencodeClient({
    baseUrl,
    headers,
    // 在 Tauri 环境中使用 wrapper，它会自动处理 tauri fetch 的异步加载
    ...(isTauri() ? { fetch: createTauriAwareFetch() } : {}),
  })
  _cachedKey = key
  return _cachedClient
}

/**
 * 异步获取 SDK client（确保 tauri fetch 已加载）
 * 在应用初始化时应该先调一次这个，预加载 tauri fetch
 */
export async function getSDKClientAsync(): Promise<OpencodeClient> {
  if (isTauri()) {
    await getTauriFetch()
  }
  return getSDKClient()
}

/**
 * 检查 SDK client 是否已准备好（Tauri fetch 已加载）
 */
export function isSDKClientReady(): boolean {
  return !isTauri() || _tauriFetchReady
}

/**
 * 强制重建 client（服务器切换时调用）
 */
export function invalidateSDKClient(): void {
  _cachedClient = null
  _cachedKey = ''
}

/**
 * 从 SDK 返回值中提取 data，如果有 error 则抛出
 *
 * SDK 默认返回 { data, error, request, response }
 * 我们的上层 API 函数期望直接返回数据，所以需要 unwrap
 */
export function unwrap<T>(result: { data?: T; error?: unknown }): T {
  if (result.error != null) {
    const err = result.error
    if (err instanceof Error) throw err
    if (typeof err === 'string') throw new Error(err)
    throw new Error(JSON.stringify(err))
  }
  return result.data as T
}
