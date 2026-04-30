import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/ui/Button'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import {
  GlobeIcon,
  PlusIcon,
  TrashIcon,
  WifiIcon,
  WifiOffIcon,
  SpinnerIcon,
  KeyIcon,
  PencilIcon,
} from '../../../components/Icons'
import { useServerStore, useRouter } from '../../../hooks'
import { messageStore } from '../../../store'
import { SettingsCard } from './SettingsUI'
import type { ServerConfig, ServerHealth } from '../../../store/serverStore'

// ============================================
// Server Item
// ============================================

function ServerItem({
  server,
  health,
  isActive,
  onSelect,
  onDelete,
  onEdit,
  onCheckHealth,
}: {
  server: ServerConfig
  health: ServerHealth | null
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  onEdit: (updates: { name: string; url: string; username?: string; password?: string }) => void
  onCheckHealth: () => void
}) {
  const { t } = useTranslation(['settings', 'common'])
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const statusIcon = () => {
    if (!health || health.status === 'checking') return <SpinnerIcon size={12} className="animate-spin text-text-400" />
    if (health.status === 'online') return <WifiIcon size={12} className="text-success-100" />
    if (health.status === 'unauthorized') return <KeyIcon size={12} className="text-warning-100" />
    return <WifiOffIcon size={12} className="text-danger-100" />
  }

  const statusTitle = () => {
    if (!health) return t('servers.checkHealth')
    switch (health.status) {
      case 'checking':
        return t('servers.checking')
      case 'online':
        return `${t('servers.onlineLatency', { latency: health.latency })}${health.version ? ` · OpenCode v${health.version}` : ''}`
      case 'unauthorized':
        return t('servers.invalidCredentials')
      case 'offline':
        return health.error || t('common:offline')
      case 'error':
        return health.error || t('common:error')
      default:
        return t('common:unknown')
    }
  }

  if (editing) {
    return (
      <EditServerForm
        server={server}
        onSave={updates => {
          onEdit(updates)
          setEditing(false)
        }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <>
      <div
        onClick={onSelect}
        className={`group flex items-center gap-3 p-2.5 rounded-lg border transition-colors
          ${
            isActive ? 'border-accent-main-100/40 bg-accent-main-100/5' : 'border-border-200/40 hover:border-border-300'
          }`}
      >
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            onSelect()
          }}
          aria-current={isActive ? 'true' : undefined}
          className="min-w-0 flex flex-1 items-center gap-3 bg-transparent border-none p-0 text-left"
        >
          <GlobeIcon size={14} className={isActive ? 'text-accent-main-100' : 'text-text-400'} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[length:var(--fs-md)] font-medium text-text-100 truncate">{server.name}</span>
              {isActive && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[length:var(--fs-xxs)] font-medium text-accent-main-100 bg-accent-main-100/10 shrink-0">
                  {t('servers.current')}
                </span>
              )}
            </div>
            <div className="text-[length:var(--fs-xs)] text-text-400 truncate font-mono flex items-center gap-1">
              {server.url}
              {server.auth?.password && <KeyIcon size={10} className="shrink-0 text-text-400" />}
            </div>
          </div>
        </button>
        <button
          type="button"
          className="p-2 rounded hover:bg-bg-200 transition-colors"
          onClick={e => {
            e.stopPropagation()
            onCheckHealth()
          }}
          title={statusTitle()}
          aria-label={statusTitle()}
        >
          {statusIcon()}
        </button>
        {!server.isDefault && (
          <>
            <button
              type="button"
              className="p-2 rounded text-text-400 hover:text-accent-main-100 hover:bg-accent-main-100/10 transition-all"
              onClick={e => {
                e.stopPropagation()
                setEditing(true)
              }}
              title={t('servers.editServer')}
              aria-label={t('servers.editServer')}
            >
              <PencilIcon size={12} />
            </button>
            <button
              type="button"
              className="p-2 rounded text-text-400 hover:text-danger-100 hover:bg-danger-100/10 transition-all"
              onClick={e => {
                e.stopPropagation()
                setConfirmDelete(true)
              }}
              title={t('common:remove')}
              aria-label={t('common:remove')}
            >
              <TrashIcon size={12} />
            </button>
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false)
          onDelete()
        }}
        title={t('servers.deleteServer')}
        description={t('servers.deleteServerConfirm', { name: server.name })}
        confirmText={t('common:delete')}
        cancelText={t('common:cancel')}
        variant="danger"
      />
    </>
  )
}

// ============================================
// Edit Server Form (inline)
// ============================================

function EditServerForm({
  server,
  onSave,
  onCancel,
}: {
  server: ServerConfig
  onSave: (updates: { name: string; url: string; username?: string; password?: string }) => void
  onCancel: () => void
}) {
  const { t } = useTranslation(['settings', 'common'])
  const [name, setName] = useState(server.name)
  const [url, setUrl] = useState(server.url)
  const [username, setUsername] = useState(server.auth?.username || '')
  const [password, setPassword] = useState(server.auth?.password || '')
  const [showAuth, setShowAuth] = useState(!!server.auth?.password)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError(t('servers.nameRequired'))
      return
    }
    if (!url.trim()) {
      setError(t('servers.urlRequired'))
      return
    }
    try {
      new URL(url)
    } catch {
      setError(t('servers.invalidUrl'))
      return
    }
    onSave({
      name: name.trim(),
      url: url.trim(),
      username: password.trim() ? username.trim() || 'opencode' : undefined,
      password: password.trim() || undefined,
    })
  }

  const inputCls =
    'w-full h-8 px-3 text-[length:var(--fs-md)] bg-bg-000 border border-border-200 rounded-md focus:outline-none focus:border-accent-main-100/50 text-text-100 placeholder:text-text-400'

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 rounded-lg border border-accent-main-100/30 bg-accent-main-100/[0.02] space-y-2.5"
    >
      <div>
        <label className="block text-[length:var(--fs-xs)] font-medium text-text-300 mb-1">{t('servers.name')}</label>
        <input
          type="text"
          value={name}
          onChange={e => {
            setName(e.target.value)
            setError('')
          }}
          placeholder={t('servers.namePlaceholder')}
          className={inputCls}
          autoFocus
        />
      </div>
      <div>
        <label className="block text-[length:var(--fs-xs)] font-medium text-text-300 mb-1">{t('servers.url')}</label>
        <input
          type="text"
          value={url}
          onChange={e => {
            setUrl(e.target.value)
            setError('')
          }}
          placeholder={t('servers.urlPlaceholder')}
          className={`${inputCls} font-mono`}
        />
      </div>

      <button
        type="button"
        onClick={() => setShowAuth(!showAuth)}
        className="flex items-center gap-1.5 text-[length:var(--fs-xs)] text-accent-main-100 hover:text-accent-main-200 transition-colors"
      >
        <KeyIcon size={10} />
        {showAuth ? t('servers.hideAuth') : t('servers.addAuth')}
      </button>

      {showAuth && (
        <>
          <div>
            <label className="block text-[length:var(--fs-xs)] font-medium text-text-300 mb-1">{t('servers.username')}</label>
            <input
              type="text"
              value={username}
              onChange={e => {
                setUsername(e.target.value)
                setError('')
              }}
              placeholder={t('servers.usernamePlaceholder')}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-[length:var(--fs-xs)] font-medium text-text-300 mb-1">{t('servers.password')}</label>
            <input
              type="password"
              value={password}
              onChange={e => {
                setPassword(e.target.value)
                setError('')
              }}
              placeholder={t('servers.passwordPlaceholder')}
              className={inputCls}
            />
          </div>
        </>
      )}

      {error && <p className="text-[length:var(--fs-xs)] text-danger-100">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          {t('common:cancel')}
        </Button>
        <Button type="submit" size="sm">
          {t('common:save')}
        </Button>
      </div>
    </form>
  )
}

// ============================================
// Add Server Form
// ============================================

type BackendType = 'opencode' | 'ollama' | 'anthropic' | 'openai'

function AddServerForm({
  onAdd,
  onAddThirdParty,
  onCancel,
}: {
  onAdd: (name: string, url: string, username?: string, password?: string) => void
  onAddThirdParty: (name: string, url: string, backendType: BackendType, apiKey?: string, authType?: 'bearer' | 'x-api-key') => void
  onCancel: () => void
}) {
  const { t } = useTranslation(['settings', 'common'])
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showAuth, setShowAuth] = useState(false)
  const [backendType, setBackendType] = useState<BackendType>('opencode')
  const [apiKey, setApiKey] = useState('')
  const [authType, setAuthType] = useState<'bearer' | 'x-api-key'>('bearer')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError(t('servers.nameRequired'))
      return
    }
    if (!url.trim()) {
      setError(t('servers.urlRequired'))
      return
    }
    try {
      new URL(url)
    } catch {
      setError(t('servers.invalidUrl'))
      return
    }

    if (backendType === 'opencode') {
      onAdd(
        name.trim(),
        url.trim(),
        password.trim() ? username.trim() || 'opencode' : undefined,
        password.trim() || undefined,
      )
    } else {
      onAddThirdParty(
        name.trim(),
        url.trim(),
        backendType,
        apiKey.trim() || undefined,
        apiKey.trim() ? authType : undefined,
      )
    }
  }

  const isCrossOrigin = (() => {
    if (!url.trim()) return false
    try {
      const serverUrl = new URL(url)
      return serverUrl.origin !== window.location.origin
    } catch {
      return false
    }
  })()

  const inputCls =
    'w-full h-8 px-3 text-[length:var(--fs-md)] bg-bg-000 border border-border-200 rounded-md focus:outline-none focus:border-accent-main-100/50 text-text-100 placeholder:text-text-400'

  return (
    <form onSubmit={handleSubmit} className="p-3 rounded-lg border border-border-200 bg-bg-050 space-y-2.5">
      <div>
        <label className="block text-[length:var(--fs-xs)] font-medium text-text-300 mb-1">Backend Type</label>
        <select
          value={backendType}
          onChange={e => {
            setBackendType(e.target.value as BackendType)
            setError('')
          }}
          className={inputCls}
        >
          <option value="opencode">OpenCode Server</option>
          <option value="ollama">Ollama</option>
          <option value="anthropic">Anthropic (Claude)</option>
          <option value="openai">OpenAI Compatible</option>
        </select>
      </div>
      <div>
        <label className="block text-[length:var(--fs-xs)] font-medium text-text-300 mb-1">{t('servers.name')}</label>
        <input
          type="text"
          value={name}
          onChange={e => {
            setName(e.target.value)
            setError('')
          }}
          placeholder={t('servers.namePlaceholder')}
          className={inputCls}
          autoFocus
        />
      </div>
      <div>
        <label className="block text-[length:var(--fs-xs)] font-medium text-text-300 mb-1">{t('servers.url')}</label>
        <input
          type="text"
          value={url}
          onChange={e => {
            setUrl(e.target.value)
            setError('')
          }}
          placeholder={t('servers.urlPlaceholder')}
          className={`${inputCls} font-mono`}
        />
      </div>

      {backendType === 'opencode' ? (
        <>
          <button
            type="button"
            onClick={() => setShowAuth(!showAuth)}
            className="flex items-center gap-1.5 text-[length:var(--fs-xs)] text-accent-main-100 hover:text-accent-main-200 transition-colors"
          >
            <KeyIcon size={10} />
            {showAuth ? t('servers.hideAuth') : t('servers.addAuth')}
          </button>

          {showAuth && (
            <>
              <div>
                <label className="block text-[length:var(--fs-xs)] font-medium text-text-300 mb-1">{t('servers.username')}</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => {
                    setUsername(e.target.value)
                    setError('')
                  }}
                  placeholder={t('servers.usernamePlaceholder')}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[length:var(--fs-xs)] font-medium text-text-300 mb-1">{t('servers.password')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  placeholder={t('servers.passwordPlaceholder')}
                  className={inputCls}
                />
              </div>

              {isCrossOrigin && password.trim() && (
                <div className="text-[length:var(--fs-xs)] text-warning-100 bg-warning-bg border border-warning-100/20 rounded-md px-2.5 py-2 leading-relaxed">
                  {t('servers.crossOriginWarning')}{' '}
                  <a
                    href="https://github.com/anomalyco/opencode/issues/10047"
                    target="_blank"
                    rel="noopener"
                    className="underline hover:no-underline"
                  >
                    #10047
                  </a>
                </div>
              )}

              <div className="text-[length:var(--fs-xs)] text-text-400 leading-relaxed">{t('servers.credentialsStorage')}</div>
            </>
          )}
        </>
      ) : (
        <>
          <div>
            <label className="block text-[length:var(--fs-xs)] font-medium text-text-300 mb-1">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => {
                setApiKey(e.target.value)
                setError('')
              }}
              placeholder="Enter API key..."
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-[length:var(--fs-xs)] font-medium text-text-300 mb-1">Auth Type</label>
            <select
              value={authType}
              onChange={e => setAuthType(e.target.value as 'bearer' | 'x-api-key')}
              className={inputCls}
            >
              <option value="bearer">Bearer Token</option>
              <option value="x-api-key">x-api-key Header</option>
            </select>
          </div>
        </>
      )}

      {error && <p className="text-[length:var(--fs-xs)] text-danger-100">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          {t('common:cancel')}
        </Button>
        <Button type="submit" size="sm">
          {t('common:add')}
        </Button>
      </div>
    </form>
  )
}

// ============================================
// Tab: Servers
// ============================================

export function ServersSettings() {
  const { t } = useTranslation(['settings', 'common'])
  const [addingServer, setAddingServer] = useState(false)
  const {
    servers,
    activeServer,
    addServer,
    addThirdPartyServer,
    removeServer,
    updateServer,
    setActiveServer,
    checkHealth,
    checkAllHealth,
    getHealth,
  } = useServerStore()
  const { navigateHome, sessionId: routeSessionId } = useRouter()
  const orderedServers = useMemo(() => {
    if (!activeServer) return servers
    const active = servers.find(s => s.id === activeServer.id)
    if (!active) return servers
    return [active, ...servers.filter(s => s.id !== active.id)]
  }, [servers, activeServer])

  useEffect(() => {
    checkAllHealth()
  }, [checkAllHealth])

  // 切换服务器：设置 active + 清理当前 session + 导航回首页
  const handleSelectServer = useCallback(
    (id: string) => {
      if (activeServer?.id === id) return // 没变，不做事

      // 清理当前 session 的 store 状态
      if (routeSessionId) {
        messageStore.clearSession(routeSessionId)
      }

      setActiveServer(id) // 内部触发 serverChangeListeners → reconnectSSE()
      navigateHome()
    },
    [activeServer?.id, routeSessionId, setActiveServer, navigateHome],
  )

  return (
    <div className="space-y-4">
      <SettingsCard
        title={t('servers.connections')}
        description={t('servers.connectionsDesc')}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={checkAllHealth}
              className="text-[length:var(--fs-xs)] px-2 py-1 rounded-md border border-border-200/60 text-text-300 hover:text-text-100 hover:border-border-300/70 hover:bg-bg-100/60 transition-colors"
            >
              {t('common:refresh')}
            </button>
            {!addingServer && (
              <button
                onClick={() => setAddingServer(true)}
                className="flex items-center gap-1 text-[length:var(--fs-xs)] px-2 py-1 rounded-md border border-accent-main-100/40 text-accent-main-100 hover:text-accent-main-200 hover:border-accent-main-100/60 hover:bg-accent-main-100/5 transition-colors"
              >
                <PlusIcon size={10} /> {t('common:add')}
              </button>
            )}
          </div>
        }
      >
        <div className="space-y-1.5">
          {orderedServers.map(s => (
            <ServerItem
              key={s.id}
              server={s}
              health={getHealth(s.id)}
              isActive={activeServer?.id === s.id}
              onSelect={() => handleSelectServer(s.id)}
              onDelete={() => removeServer(s.id)}
              onEdit={updates => {
                const auth = updates.password
                  ? { username: updates.username || 'opencode', password: updates.password }
                  : undefined
                updateServer(s.id, { name: updates.name, url: updates.url, auth })
                checkHealth(s.id)
              }}
              onCheckHealth={() => checkHealth(s.id)}
            />
          ))}

          {addingServer && (
            <AddServerForm
              onAdd={(n, u, user, pass) => {
                const auth = pass ? { username: user || 'opencode', password: pass } : undefined
                const s = addServer({ name: n, url: u, auth })
                setAddingServer(false)
                checkHealth(s.id)
              }}
              onAddThirdParty={(n, u, backendType, apiKey, authType) => {
                const typeMap: Record<string, 'ollama' | 'anthropic' | 'openai' | 'claude-code'> = {
                  ollama: 'ollama',
                  anthropic: 'anthropic',
                  openai: 'openai',
                }
                const s = addThirdPartyServer({
                  name: n,
                  url: u,
                  backendType: typeMap[backendType] || 'openai',
                  apiKey,
                  authType: authType as 'bearer' | 'x-api-key',
                })
                setAddingServer(false)
                checkHealth(s.id)
              }}
              onCancel={() => setAddingServer(false)}
            />
          )}

          {servers.length === 0 && !addingServer && (
            <div className="text-[length:var(--fs-md)] text-text-400 text-center py-8">{t('servers.noServersConfigured')}</div>
          )}
        </div>
      </SettingsCard>

      {/* Claude Code API 配置 */}
      <ClaudeCodeApiSettings />
    </div>
  )
}

// ============================================
// Claude Code API 配置组件
// ============================================

function ClaudeCodeApiSettings() {
  const { t } = useTranslation(['settings', 'common'])
  const [providers, setProviders] = useState<Array<{
    id: string
    name: string
    type: 'anthropic' | 'openai' | 'ollama'
    url: string
    apiKey: string
    models: string[]
  }>>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('codehubai-api-providers')
      if (saved) setProviders(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  const saveProviders = (list: typeof providers) => {
    setProviders(list)
    localStorage.setItem('codehubai-api-providers', JSON.stringify(list))
  }

  return (
    <SettingsCard
      title="Claude Code API 配置"
      description="配置您的大模型 API，用于 Claude Code 编程助手"
    >
      <div className="space-y-3">
        {providers.map(p => (
          <div key={p.id} className="p-3 rounded-lg border border-border-200 bg-bg-050">
            {editing === p.id ? (
              <EditProviderForm
                provider={p}
                onSave={updates => {
                  saveProviders(providers.map(x => x.id === p.id ? { ...x, ...updates } : x))
                  setEditing(null)
                }}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[length:var(--fs-md)] font-medium text-text-100">{p.name}</div>
                  <div className="text-[length:var(--fs-xs)] text-text-400">{p.url}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditing(p.id)}
                    className="text-[length:var(--fs-xs)] px-2 py-1 rounded border border-border-200 text-text-300 hover:text-text-100 hover:bg-bg-100 transition-colors"
                  >
                    {t('common:edit')}
                  </button>
                  <button
                    onClick={() => saveProviders(providers.filter(x => x.id !== p.id))}
                    className="text-[length:var(--fs-xs)] px-2 py-1 rounded border border-danger-100/40 text-danger-100 hover:bg-danger-100/10 transition-colors"
                  >
                    {t('common:remove')}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {adding && (
          <AddProviderForm
            onAdd={p => {
              saveProviders([...providers, { ...p, id: `provider-${Date.now()}` }])
              setAdding(false)
            }}
            onCancel={() => setAdding(false)}
          />
        )}

        {!adding && providers.length === 0 && (
          <div className="text-[length:var(--fs-sm)] text-text-400 text-center py-4">
            暂未配置 API，点击下方按钮添加
          </div>
        )}

        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="w-full py-2 rounded-md border border-dashed border-border-300 text-text-400 hover:text-text-200 hover:border-accent-main-100/50 hover:bg-accent-main-100/5 transition-colors text-[length:var(--fs-sm)]"
          >
            + 添加 API 提供商
          </button>
        )}
      </div>
    </SettingsCard>
  )
}

function AddProviderForm({
  onAdd,
  onCancel,
}: {
  onAdd: (p: { name: string; type: 'anthropic' | 'openai' | 'ollama'; url: string; apiKey: string; models: string[] }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<'anthropic' | 'openai' | 'ollama'>('openai')
  const [url, setUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [models, setModels] = useState('')

  const presets = [
    { name: '腾讯云', type: 'anthropic' as const, url: 'https://api.lkeap.cloud.tencent.com/coding/anthropic' },
    { name: 'DeepSeek', type: 'openai' as const, url: 'https://api.deepseek.com/v1' },
    { name: 'Ollama 本地', type: 'ollama' as const, url: 'http://127.0.0.1:11434' },
  ]

  const inputCls =
    'w-full h-8 px-3 text-[length:var(--fs-md)] bg-bg-000 border border-border-200 rounded-md focus:outline-none focus:border-accent-main-100/50 text-text-100 placeholder:text-text-400'

  return (
    <div className="p-3 rounded-lg border border-accent-main-100/30 bg-accent-main-100/[0.02] space-y-2.5">
      <div className="flex flex-wrap gap-1.5">
        {presets.map(p => (
          <button
            key={p.name}
            onClick={() => {
              setName(p.name)
              setType(p.type)
              setUrl(p.url)
            }}
            className="text-[length:var(--fs-xs)] px-2 py-1 rounded border border-border-200 text-text-300 hover:text-text-100 hover:bg-bg-100 transition-colors"
          >
            {p.name}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-[length:var(--fs-xs)] text-text-300 mb-1">名称</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="如：腾讯云、DeepSeek"
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-[length:var(--fs-xs)] text-text-300 mb-1">类型</label>
        <select
          value={type}
          onChange={e => setType(e.target.value as typeof type)}
          className={inputCls}
        >
          <option value="anthropic">Anthropic 兼容</option>
          <option value="openai">OpenAI 兼容</option>
          <option value="ollama">Ollama</option>
        </select>
      </div>

      <div>
        <label className="block text-[length:var(--fs-xs)] text-text-300 mb-1">API 地址</label>
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://api.example.com/v1"
          className={`${inputCls} font-mono`}
        />
      </div>

      {type !== 'ollama' && (
        <div>
          <label className="block text-[length:var(--fs-xs)] text-text-300 mb-1">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-xxx"
            className={`${inputCls} font-mono`}
          />
        </div>
      )}

      <div>
        <label className="block text-[length:var(--fs-xs)] text-text-300 mb-1">模型列表（逗号分隔）</label>
        <input
          type="text"
          value={models}
          onChange={e => setModels(e.target.value)}
          placeholder="deepseek-chat, deepseek-coder"
          className={inputCls}
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          取消
        </Button>
        <Button
          size="sm"
          onClick={() => {
            if (!name.trim() || !url.trim()) return
            onAdd({
              name: name.trim(),
              type,
              url: url.trim(),
              apiKey: apiKey.trim(),
              models: models.split(',').map(s => s.trim()).filter(Boolean),
            })
          }}
        >
          添加
        </Button>
      </div>
    </div>
  )
}

function EditProviderForm({
  provider,
  onSave,
  onCancel,
}: {
  provider: { name: string; type: string; url: string; apiKey: string; models: string[] }
  onSave: (updates: { name: string; type: 'anthropic' | 'openai' | 'ollama'; url: string; apiKey: string; models: string[] }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(provider.name)
  const [type, setType] = useState(provider.type as 'anthropic' | 'openai' | 'ollama')
  const [url, setUrl] = useState(provider.url)
  const [apiKey, setApiKey] = useState(provider.apiKey)
  const [models, setModels] = useState(provider.models.join(', '))

  const inputCls =
    'w-full h-8 px-3 text-[length:var(--fs-md)] bg-bg-000 border border-border-200 rounded-md focus:outline-none focus:border-accent-main-100/50 text-text-100 placeholder:text-text-400'

  return (
    <div className="space-y-2.5">
      <div>
        <label className="block text-[length:var(--fs-xs)] text-text-300 mb-1">名称</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-[length:var(--fs-xs)] text-text-300 mb-1">类型</label>
        <select
          value={type}
          onChange={e => setType(e.target.value as typeof type)}
          className={inputCls}
        >
          <option value="anthropic">Anthropic 兼容</option>
          <option value="openai">OpenAI 兼容</option>
          <option value="ollama">Ollama</option>
        </select>
      </div>

      <div>
        <label className="block text-[length:var(--fs-xs)] text-text-300 mb-1">API 地址</label>
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          className={`${inputCls} font-mono`}
        />
      </div>

      {type !== 'ollama' && (
        <div>
          <label className="block text-[length:var(--fs-xs)] text-text-300 mb-1">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className={`${inputCls} font-mono`}
          />
        </div>
      )}

      <div>
        <label className="block text-[length:var(--fs-xs)] text-text-300 mb-1">模型列表</label>
        <input
          type="text"
          value={models}
          onChange={e => setModels(e.target.value)}
          className={inputCls}
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          取消
        </Button>
        <Button
          size="sm"
          onClick={() => {
            onSave({
              name: name.trim(),
              type,
              url: url.trim(),
              apiKey: apiKey.trim(),
              models: models.split(',').map(s => s.trim()).filter(Boolean),
            })
          }}
        >
          保存
        </Button>
      </div>
    </div>
  )
}
