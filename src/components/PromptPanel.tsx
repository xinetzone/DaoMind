import React, { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { PROMPT_TEMPLATES, TEMPLATE_CATEGORIES, type PromptTemplate } from '../data/promptTemplates'

interface Props {
  onSelect: (prompt: string) => void
  onClose: () => void
}

export function PromptPanel({ onSelect, onClose }: Props): React.JSX.Element {
  const [activeCategory, setActiveCategory] = useState<string>(TEMPLATE_CATEGORIES[0])
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent): void {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Delay so the toggle click doesn't immediately close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick)
    }, 0)
    return (): void => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [onClose])

  const filtered = PROMPT_TEMPLATES.filter((t) => t.category === activeCategory)

  function handleSelect(t: PromptTemplate): void {
    onSelect(t.prompt)
    onClose()
  }

  return (
    <div className="prompt-panel" ref={panelRef}>
      {/* Header */}
      <div className="prompt-panel-header">
        <span className="prompt-panel-title">提示词模板</span>
        <button className="prompt-panel-close" onClick={onClose} aria-label="关闭">
          <X size={14} />
        </button>
      </div>

      {/* Category tabs */}
      <div className="prompt-panel-tabs">
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`prompt-tab${activeCategory === cat ? ' active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="prompt-panel-grid">
        {filtered.map((t) => (
          <button
            key={t.id}
            className="prompt-card"
            onClick={() => handleSelect(t)}
            title={t.prompt}
          >
            <span className="prompt-card-title">{t.title}</span>
            <span className="prompt-card-preview">{t.prompt.slice(0, 36)}…</span>
          </button>
        ))}
      </div>
    </div>
  )
}
