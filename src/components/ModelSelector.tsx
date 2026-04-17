import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { AI_MODELS, type AIModel } from '../data/models'

interface Props {
  model: AIModel
  onSelect: (id: string) => void
  disabled?: boolean
}

export function ModelSelector({ model, onSelect, disabled }: Props): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent): void => {
      setTimeout(() => {
        if (ref.current && !ref.current.contains(e.target as Node)) {
          setOpen(false)
        }
      }, 0)
    }
    document.addEventListener('mousedown', handler)
    return (): void => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSelect = (id: string): void => {
    onSelect(id)
    setOpen(false)
  }

  return (
    <div className="model-selector" ref={ref}>
      <button
        className={`model-trigger${open ? ' active' : ''}`}
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        title="切换模型"
        type="button"
      >
        <span className="model-trigger-vendor">{model.vendor}</span>
        <span className="model-trigger-name">{model.name}</span>
        <ChevronDown size={12} className={`model-trigger-caret${open ? ' open' : ''}`} />
      </button>

      {open && (
        <div className="model-dropdown">
          {AI_MODELS.map((m) => (
            <button
              key={m.id}
              className={`model-option${m.id === model.id ? ' selected' : ''}`}
              onClick={() => handleSelect(m.id)}
              type="button"
            >
              <div className="model-option-left">
                <div className="model-option-row">
                  <span className="model-option-name">{m.name}</span>
                  <span className="model-option-vendor">{m.vendor}</span>
                  {m.badge && <span className="model-badge">{m.badge}</span>}
                </div>
                <span className="model-option-desc">{m.desc}</span>
              </div>
              {m.id === model.id && (
                <Check size={13} className="model-option-check" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
