# P13 · 道识 · 会话摘要

## Context
Currently `useSessions.ts` generates a title by slicing the first user message to 22 chars. This is low-quality. P13 uses AI to automatically generate a concise title (≤10 Chinese chars) and one-line summary (≤30 chars) after the first complete exchange. The summary is stored on the Session object and shown in the sidebar.

## Files

| File | Action |
|------|--------|
| `supabase/functions/dao-summary/index.ts` | NEW — Deno Edge Function |
| `src/hooks/useSessions.ts` | ADD `summary?: string` + `updateTitle()` |
| `src/hooks/useSessionSummary.ts` | NEW — hook wrapping Edge Function |
| `src/pages/ChatPage.tsx` | ADD trigger useEffect + import hook |
| `src/components/SessionSidebar.tsx` | SHOW summary subtitle |
| `src/index.css` | ADD `.sidebar-item-summary` style |

---

## 1. Edge Function `dao-summary/index.ts`

```typescript
// Non-streaming GLM-5 call
// System prompt: 从对话提取核心主题，返回 JSON { title, summary }
// title: ≤10字，summary: ≤28字
// Input: last 4 messages (2 exchanges max)
// Returns: { title: string, summary: string }
```

CORS headers + error handling (same pattern as dao-mindmap).

---

## 2. `useSessions.ts` — additions

```typescript
// Session interface: add summary?: string
// New method: updateTitle(title: string, summary: string) => void
//   Updates current session's title + summary in state + localStorage
```

---

## 3. `useSessionSummary.ts` (NEW, ~40 lines)

```typescript
export function useSessionSummary(updateTitle: (title: string, summary: string) => void) {
  const generate = async (messages: Message[], sessionId: string) => {
    // POST to /functions/v1/dao-summary
    // On success: call updateTitle(title, summary)
  }
  return { generate }
}
```

---

## 4. `ChatPage.tsx` — trigger logic

```typescript
const summaryDoneRef = useRef<string | null>(null)  // stores sessionId when done

// Reset when session switches
useEffect(() => { summaryDoneRef.current = null }, [currentSessionId])

// Trigger after first complete exchange
useEffect(() => {
  if (
    !isLoading &&
    messages.length === 2 &&
    messages[1]?.role === 'assistant' &&
    !messages[1]?.isStreaming &&
    currentSessionId &&
    summaryDoneRef.current !== currentSessionId
  ) {
    summaryDoneRef.current = currentSessionId
    void generate(messages, currentSessionId)
  }
}, [isLoading, messages, currentSessionId])
```

---

## 5. `SessionSidebar.tsx` — show summary

Below `<span className="sidebar-item-title">`, add:
```tsx
{s.summary && <span className="sidebar-item-summary">{s.summary}</span>}
```

Restructure sidebar-item layout to flex-column for title+summary stack.

---

## 6. `src/index.css` — `.sidebar-item-summary`

```css
.sidebar-item-summary {
  font-size: 0.72rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
  opacity: 0.75;
  line-height: 1.3;
}
```

Also update `.sidebar-item` to `align-items: flex-start` and add a left column flex area for title+summary.

---

## Verification

1. Start a new chat, send first message
2. After AI responds, sidebar title should auto-update to AI-generated title (~3s delay)
3. Hovering sidebar item shows summary subtitle in smaller text
4. Switching sessions resets trigger so no duplicate generation
5. Existing sessions without summary show no subtitle line
