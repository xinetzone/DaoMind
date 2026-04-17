import { useState, useCallback } from 'react'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './useAIChat'
import type { Message } from './useAIChat'

export interface MindNode {
  text: string
  children: MindNode[]
}

export interface UseMindMapReturn {
  tree: MindNode | null
  loading: boolean
  error: string | null
  generate: (messages: Message[]) => Promise<void>
  reset: () => void
}

export function useMindMap(): UseMindMapReturn {
  const [tree, setTree] = useState<MindNode | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (messages: Message[]) => {
    setLoading(true)
    setError(null)
    setTree(null)

    const payload = messages
      .filter((m) => !m.isStreaming)
      .map((m) => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/dao-mindmap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ messages: payload }),
      })
      const data = (await res.json()) as { tree?: MindNode; error?: string }
      if (!res.ok || data.error) throw new Error(data.error ?? '生成失败')
      if (!data.tree) throw new Error('无效的返回数据')
      setTree(data.tree)
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成思维导图失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setTree(null)
    setError(null)
    setLoading(false)
  }, [])

  return { tree, loading, error, generate, reset }
}
