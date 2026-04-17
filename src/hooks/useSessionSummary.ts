import { useCallback } from 'react'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './useAIChat'
import type { Message } from './useAIChat'

interface SummaryResult {
  title: string
  summary: string
}

export function useSessionSummary(
  updateTitle: (title: string, summary: string) => void,
): {
  generateSummary: (messages: Message[]) => Promise<void>
} {
  const generateSummary = useCallback(
    async (messages: Message[]) => {
      try {
        const payload = messages.map((m) => ({ role: m.role, content: m.content }))
        const res = await fetch(`${SUPABASE_URL}/functions/v1/dao-summary`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ messages: payload }),
        })
        if (!res.ok) return
        const data = (await res.json()) as SummaryResult & { error?: string }
        if (data.error || !data.title) return
        updateTitle(data.title, data.summary ?? '')
      } catch {
        // Silently ignore — title generation is non-critical
      }
    },
    [updateTitle],
  )

  return { generateSummary }
}
