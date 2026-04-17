import { useState, useEffect, useCallback, useRef } from 'react'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './useAIChat'

/**
 * useEdgeFetch<T> — 通用 Edge Function 轮询 Hook
 *
 * 封装 fetch + SUPABASE 认证 + 自动轮询 + 暂停/手动刷新
 * 替代 MonitorPage / CollectivePage 中重复的 ~80 行逻辑
 */
export function useEdgeFetch<T>(functionName: string, intervalMs: number): {
  data: T | null
  loading: boolean
  error: string | null
  paused: boolean
  lastFetchAt: number | null
  setPaused: (v: boolean) => void
  refresh: () => void
} {
  const [data, setData]               = useState<T | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [paused, setPaused]           = useState(false)
  const [lastFetchAt, setLastFetchAt] = useState<number | null>(null)
  const timerRef                      = useRef<ReturnType<typeof setInterval> | null>(null)

  const doFetch = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
        headers: {
          apikey:        SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json() as T)
      setLastFetchAt(Date.now())
    } catch (e) {
      setError(e instanceof Error ? e.message : '请求失败')
    } finally {
      setLoading(false)
    }
  }, [functionName])

  useEffect((): (() => void) => {
    void doFetch()
    if (!paused) {
      timerRef.current = setInterval(() => { void doFetch() }, intervalMs)
    }
    return (): void => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [paused, doFetch, intervalMs])

  return { data, loading, error, paused, lastFetchAt, setPaused, refresh: (): void => { void doFetch() } }
}

