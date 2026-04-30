// ============================================
// 助手选择器组件
// ============================================

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDownIcon, CpuIcon, ThinkingIcon } from './Icons'
import { assistantStore } from '../store/assistantStore'
import type { AssistantType } from '../types/assistant'
import { ASSISTANTS } from '../types/assistant'

interface AssistantSelectorProps {
  onSwitch?: (assistant: AssistantType) => void
  onNeedConfig?: () => void
}

export function AssistantSelector({ onSwitch, onNeedConfig }: AssistantSelectorProps) {
  const { t } = useTranslation(['common'])
  const [isOpen, setIsOpen] = useState(false)
  const [currentAssistant, setCurrentAssistant] = useState<AssistantType>(assistantStore.getAssistant())
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsubscribe = assistantStore.subscribe(() => {
      setCurrentAssistant(assistantStore.getAssistant())
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (type: AssistantType) => {
    if (type === 'claude-code' && !assistantStore.hasUserApiConfigured()) {
      setIsOpen(false)
      onNeedConfig?.()
      return
    }

    const success = assistantStore.setAssistant(type)
    if (success) {
      setCurrentAssistant(type)
      onSwitch?.(type)
    }
    setIsOpen(false)
  }

  const current = ASSISTANTS[currentAssistant]

  const getIcon = (type: AssistantType) => {
    switch (type) {
      case 'opencode':
        return <ThinkingIcon size={14} className="text-accent-main-100" />
      case 'claude-code':
        return <CpuIcon size={14} className="text-purple-400" />
      default:
        return <ThinkingIcon size={14} />
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border-200 bg-bg-100 hover:bg-bg-150 hover:border-border-300 transition-colors text-text-200"
        aria-label={t('assistant.select')}
      >
        {getIcon(currentAssistant)}
        <span className="text-[length:var(--fs-md)] font-medium">{current.name}</span>
        <ChevronDownIcon size={12} className="text-text-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[200px] bg-bg-000 border border-border-200 rounded-lg shadow-lg z-50 py-1">
          {(Object.keys(ASSISTANTS) as AssistantType[]).map(type => {
            const info = ASSISTANTS[type]
            const isActive = type === currentAssistant
            const isDisabled = type === 'claude-code' && !assistantStore.hasUserApiConfigured()

            return (
              <button
                key={type}
                onClick={() => handleSelect(type)}
                disabled={isDisabled}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                  isActive
                    ? 'bg-accent-main-100/10 text-accent-main-100'
                    : isDisabled
                    ? 'text-text-400 cursor-not-allowed opacity-50'
                    : 'text-text-200 hover:bg-bg-100'
                }`}
              >
                {getIcon(type)}
                <div className="flex-1">
                  <div className="text-[length:var(--fs-md)] font-medium">{info.name}</div>
                  <div className="text-[length:var(--fs-xs)] text-text-400">{info.description}</div>
                </div>
                {isActive && (
                  <span className="text-[length:var(--fs-xs)] text-accent-main-100 font-medium">
                    {t('common:active')}
                  </span>
                )}
                {isDisabled && (
                  <span className="text-[length:var(--fs-xs)] text-warning-100">
                    {t('assistant.needConfig')}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}