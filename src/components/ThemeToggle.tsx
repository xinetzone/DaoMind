import React from 'react'
import { Sun, Moon, Feather } from 'lucide-react'
import type { Theme } from '../hooks/useTheme'

interface Props {
  theme: Theme
  setTheme: (t: Theme) => void
}

const THEMES: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: '浅色', icon: <Sun size={14} /> },
  { value: 'dark',  label: '深色', icon: <Moon size={14} /> },
  { value: 'ink',   label: '水墨', icon: <Feather size={14} /> },
]

/**
 * ThemeToggle — 道统主题切换器
 * 三个图标按钮，当前主题高亮，点击立即切换。
 */
export function ThemeToggle({ theme, setTheme }: Props): React.JSX.Element {
  return (
    <div className="theme-toggle" role="group" aria-label="主题切换">
      {THEMES.map(({ value, label, icon }) => (
        <button
          key={value}
          className={`theme-btn${theme === value ? ' active' : ''}`}
          onClick={() => setTheme(value)}
          title={label}
          aria-label={label}
          aria-pressed={theme === value}
        >
          {icon}
        </button>
      ))}
    </div>
  )
}
