/**
 * useTheme — 道统 · 全局主题 Hook
 *
 * 三套主题：浅色 (light) / 深色 (dark) / 水墨 (ink)
 * 持久化：localStorage → document.documentElement.dataset.theme
 * 初始化优先级：localStorage > prefers-color-scheme > 'light'
 */

import { useState, useEffect, useCallback } from 'react'

export type Theme = 'light' | 'dark' | 'ink'

const STORAGE_KEY = 'daomind-theme'

function detectInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored === 'light' || stored === 'dark' || stored === 'ink') return stored
  } catch {
    // ignore
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // ignore
  }
}

export function useTheme(): { theme: Theme; setTheme: (t: Theme) => void } {
  const [theme, setThemeState] = useState<Theme>(detectInitialTheme)

  // Apply theme to <html> on mount and on change
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = useCallback((t: Theme): void => {
    setThemeState(t)
  }, [])

  return { theme, setTheme }
}
