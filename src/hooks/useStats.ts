import { useMemo } from 'react'
import type { Session } from './useSessions'

export interface DailyCount {
  date: string   // 'MM-DD'
  count: number
}

export interface StatsData {
  totalSessions: number
  totalMessages: number
  totalUserMessages: number
  totalAssistantMessages: number
  totalChars: number
  estimatedTokens: number
  todaySessions: number
  avgMessagesPerSession: number
  last7Days: DailyCount[]
  topSessions: { title: string; messageCount: number }[]
}

function formatMMDD(ts: number): string {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${m}-${day}`
}

export function useStats(sessions: Session[]): StatsData {
  return useMemo(() => {
    const now = Date.now()
    const todayStr = formatMMDD(now)
    const msPerDay = 86_400_000

    // Last 7 days labels
    const last7: DailyCount[] = Array.from({ length: 7 }, (_, i) => ({
      date: formatMMDD(now - (6 - i) * msPerDay),
      count: 0,
    }))
    const dateMap = new Map<string, DailyCount>(last7.map((d) => [d.date, d]))

    let totalMessages = 0
    let totalUserMessages = 0
    let totalAssistantMessages = 0
    let totalChars = 0
    let todaySessions = 0

    for (const s of sessions) {
      const dateKey = formatMMDD(s.createdAt)
      if (dateMap.has(dateKey)) {
        dateMap.get(dateKey)!.count++
      }
      if (dateKey === todayStr) todaySessions++

      for (const m of s.messages) {
        totalMessages++
        totalChars += m.content.length
        if (m.role === 'user') totalUserMessages++
        else totalAssistantMessages++
      }
    }

    const topSessions = [...sessions]
      .filter((s) => s.messages.length > 0)
      .sort((a, b) => b.messages.length - a.messages.length)
      .slice(0, 5)
      .map((s) => ({ title: s.title, messageCount: s.messages.length }))

    return {
      totalSessions: sessions.length,
      totalMessages,
      totalUserMessages,
      totalAssistantMessages,
      totalChars,
      estimatedTokens: Math.round(totalChars / 1.8),
      todaySessions,
      avgMessagesPerSession: sessions.length > 0
        ? Math.round((totalMessages / sessions.length) * 10) / 10
        : 0,
      last7Days: last7,
      topSessions,
    }
  }, [sessions])
}
