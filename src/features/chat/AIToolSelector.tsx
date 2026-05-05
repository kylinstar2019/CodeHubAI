import { useState, useRef, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDownIcon } from '../../components/Icons'
import { DropdownMenu } from '../../components/ui'

export type AITool = 'opencode' | 'claude-code' | 'codex'

interface AIToolSelectorProps {
  selectedTool: AITool
  onSelect: (tool: AITool) => void
  disabled?: boolean
}

const TOOL_OPTIONS: { value: AITool; label: string; description: string }[] = [
  { value: 'opencode', label: 'OpenCode', description: '本地AI代码助手' },
  { value: 'claude-code', label: 'Claude Code', description: 'Anthropic Claude代码助手' },
  { value: 'codex', label: 'Codex', description: 'OpenAI Codex代码助手' },
]

export const AIToolSelector = memo(function AIToolSelector({
  selectedTool,
  onSelect,
  disabled = false,
}: AIToolSelectorProps) {
  const { t } = useTranslation('chat')
  void t // 暂时 unused，保留以备后续使用
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedToolLabel = TOOL_OPTIONS.find(opt => opt.value === selectedTool)?.label || 'OpenCode'

  const openMenu = useCallback(() => {
    if (disabled) return
    setIsOpen(true)
  }, [disabled])

  const closeMenu = useCallback(() => {
    setIsOpen(false)
    triggerRef.current?.focus()
  }, [])

  const handleSelect = useCallback((tool: AITool) => {
    onSelect(tool)
    closeMenu()
  }, [onSelect, closeMenu])

  return (
    <div ref={containerRef} className="relative font-sans" data-dropdown-open={isOpen || undefined}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={() => (isOpen ? closeMenu() : openMenu())}
        disabled={disabled}
        aria-expanded={isOpen}
        className="group flex items-center gap-2 px-2 py-1.5 text-text-200 rounded-lg hover:bg-bg-200 hover:text-text-100 transition-all duration-150 active:scale-95 cursor-pointer text-[length:var(--fs-base)]"
        title={selectedToolLabel}
      >
        <span className="font-medium truncate max-w-[120px]">{selectedToolLabel}</span>
        <div className={`opacity-50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDownIcon size={10} />
        </div>
      </button>

      {/* Dropdown Menu */}
      <DropdownMenu
        triggerRef={triggerRef}
        isOpen={isOpen}
        position="bottom"
        align="left"
        width="200px"
        minWidth="180px"
        maxWidth="min(200px, calc(100vw - 24px))"
        mobileFullWidth
        className="!p-1 overflow-hidden"
      >
        <div className="flex flex-col py-1">
          {TOOL_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`
                flex flex-col items-start gap-0.5 px-3 py-2 rounded-md text-left transition-colors duration-100
                ${selectedTool === option.value 
                  ? 'bg-accent-main-100/10 text-accent-main-100' 
                  : 'text-text-200 hover:bg-bg-200/40 hover:text-text-100'
                }
              `}
            >
              <span className={`font-medium text-[length:var(--fs-base)] ${selectedTool === option.value ? 'text-accent-main-100' : 'text-text-100'}`}>
                {option.label}
              </span>
              <span className="text-[length:var(--fs-xs)] text-text-400">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </DropdownMenu>
    </div>
  )
})
