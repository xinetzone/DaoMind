/**
 * useFeedback — 道反 · 消息反馈 Hook
 *
 * 帛书《道德经》乙本·四十章：「反也者，道之动也」
 * 用户对 AI 回复的点赞/踩，即是信息系统最直接的反馈信号。
 *
 * 对应 daoFeedback.DaoFeedbackSignal 概念映射：
 *   rating='up'   → level='opportunity', category='behavior', metrics={quality:1}
 *   rating='down' → level='warning',     category='behavior', metrics={quality:0}
 *
 * 架构：
 *   1. 乐观更新 localStorage（立即响应 UI）
 *   2. 异步 POST 到 Supabase REST API（message_feedback 表）
 *   3. 失败静默 — 不阻塞 UI，localStorage 保留本地状态
 */

import { useState, useCallback } from 'react'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './useAIChat'

export type FeedbackRating = 'up' | 'down'

const STORAGE_KEY = 'daomind-feedback'

function loadMap(): Record<string, FeedbackRating> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, FeedbackRating>
  } catch {
    return {}
  }
}

function saveMap(map: Record<string, FeedbackRating>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

function makeKey(sessionId: string, index: number): string {
  return `${sessionId}:${index}`
}

export function useFeedback(sessionId: string | null): {
  getFeedback: (index: number) => FeedbackRating | null
  submitFeedback: (index: number, content: string, rating: FeedbackRating) => void
} {
  const [feedbackMap, setFeedbackMap] = useState<Record<string, FeedbackRating>>(loadMap)

  const getFeedback = useCallback((index: number): FeedbackRating | null => {
    if (!sessionId) return null
    return feedbackMap[makeKey(sessionId, index)] ?? null
  }, [feedbackMap, sessionId])

  const submitFeedback = useCallback((index: number, content: string, rating: FeedbackRating): void => {
    if (!sessionId) return

    // 1. 乐观更新（localStorage + state）
    const key = makeKey(sessionId, index)
    setFeedbackMap((prev) => {
      const next = { ...prev, [key]: rating }
      saveMap(next)
      return next
    })

    // 2. 异步持久化到 Supabase（道反信号归元）
    fetch(`${SUPABASE_URL}/rest/v1/message_feedback`, {
      method:  'POST',
      headers: {
        apikey:         SUPABASE_ANON_KEY,
        Authorization:  `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer:         'return=minimal',
      },
      body: JSON.stringify({
        session_id:      sessionId,
        message_index:   index,
        message_content: content.slice(0, 500),
        rating,
      }),
    }).catch(() => {
      // 静默失败 — localStorage 状态已保留，不影响 UX
    })
  }, [sessionId])

  return { getFeedback, submitFeedback }
}
