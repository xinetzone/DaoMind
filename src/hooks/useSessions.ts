import { useState, useCallback } from 'react'
import type { Message } from './useAIChat'

export interface Session {
  id: string
  title: string
  summary?: string
  createdAt: number
  updatedAt: number
  messages: Message[]
}

const STORAGE_KEY = 'daomind-sessions'
const CURRENT_KEY = 'daomind-current-session'

function generateId(): string {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function titleFromMessages(messages: Message[]): string {
  const first = messages.find((m) => m.role === 'user')
  if (!first) return '新对话'
  return first.content.slice(0, 22) + (first.content.length > 22 ? '…' : '')
}

function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session[]) : []
  } catch {
    return []
  }
}

function saveSessions(sessions: Session[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  } catch {
    // Storage quota exceeded — silently ignore
  }
}

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>(() => loadSessions())
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    const storedId = localStorage.getItem(CURRENT_KEY)
    const existing = loadSessions()
    return storedId && existing.some((s) => s.id === storedId) ? storedId : null
  })

  const currentSession = sessions.find((s) => s.id === currentSessionId) ?? null

  /** 创建新会话并设为当前，返回新 id */
  const createSession = useCallback((): string => {
    const id = generateId()
    const session: Session = {
      id,
      title: '新对话',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    }
    setSessions((prev) => {
      const next = [session, ...prev]
      saveSessions(next)
      return next
    })
    setCurrentSessionId(id)
    localStorage.setItem(CURRENT_KEY, id)
    return id
  }, [])

  /** 切换到指定会话 */
  const switchSession = useCallback((id: string) => {
    setCurrentSessionId(id)
    localStorage.setItem(CURRENT_KEY, id)
  }, [])

  /** 将最新消息同步到当前会话（由 ChatPage 在 messages 变化时调用） */
  const updateCurrentMessages = useCallback(
    (messages: Message[]) => {
      if (!currentSessionId) return
      setSessions((prev) => {
        const next = prev.map((s) => {
          if (s.id !== currentSessionId) return s
          return {
            ...s,
            title: titleFromMessages(messages),
            updatedAt: Date.now(),
            messages,
          }
        })
        saveSessions(next)
        return next
      })
    },
    [currentSessionId],
  )

  /** AI 生成标题后更新当前会话的 title + summary */
  const updateTitle = useCallback(
    (title: string, summary: string) => {
      if (!currentSessionId) return
      setSessions((prev) => {
        const next = prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, title, summary, updatedAt: Date.now() }
            : s,
        )
        saveSessions(next)
        return next
      })
    },
    [currentSessionId],
  )

  /** 删除指定会话，自动切换到最近一条 */
  const deleteSession = useCallback(
    (id: string) => {
      const next = sessions.filter((s) => s.id !== id)
      saveSessions(next)
      setSessions(next)
      if (currentSessionId === id) {
        const newId = next[0]?.id ?? null
        setCurrentSessionId(newId)
        if (newId) localStorage.setItem(CURRENT_KEY, newId)
        else localStorage.removeItem(CURRENT_KEY)
      }
    },
    [sessions, currentSessionId],
  )

  /** 用导入数据覆盖所有会话 */
  const replaceAllSessions = useCallback((incoming: Session[]) => {
    saveSessions(incoming)
    setSessions(incoming)
    const firstId = incoming[0]?.id ?? null
    setCurrentSessionId(firstId)
    if (firstId) localStorage.setItem(CURRENT_KEY, firstId)
    else localStorage.removeItem(CURRENT_KEY)
  }, [])

  /** 与现有会话合并（按 id 去重，现有优先，新增追加到末尾） */
  const mergeSessions = useCallback((incoming: Session[]) => {
    setSessions((prev) => {
      const existingIds = new Set(prev.map((s) => s.id))
      const newOnes = incoming.filter((s) => !existingIds.has(s.id))
      const next = [...prev, ...newOnes]
      saveSessions(next)
      return next
    })
  }, [])

  return {
    sessions,
    currentSessionId,
    currentSession,
    createSession,
    switchSession,
    updateCurrentMessages,
    updateTitle,
    deleteSession,
    replaceAllSessions,
    mergeSessions,
  }
}
