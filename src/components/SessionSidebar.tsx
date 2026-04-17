import React from 'react'
import { Plus, Trash2, MessageSquare } from 'lucide-react'
import type { Session } from '../hooks/useSessions'

interface Props {
  sessions: Session[]
  currentSessionId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
  isOpen: boolean
}

function formatRelativeDate(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  if (diff < 172_800_000) return '昨天'
  return new Date(ts).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function dateGroup(ts: number): 'today' | 'yesterday' | 'earlier' {
  const now = new Date()
  const d = new Date(ts)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  if (d.getTime() >= today) return 'today'
  if (d.getTime() >= today - 86_400_000) return 'yesterday'
  return 'earlier'
}

const GROUP_LABELS: Record<string, string> = {
  today: '今天',
  yesterday: '昨天',
  earlier: '更早',
}

export function SessionSidebar({
  sessions,
  currentSessionId,
  onSelect,
  onCreate,
  onDelete,
  isOpen,
}: Props): React.JSX.Element {
  const groups: Record<string, Session[]> = { today: [], yesterday: [], earlier: [] }
  for (const s of sessions) {
    groups[dateGroup(s.updatedAt)]!.push(s)
  }

  return (
    <div className={`session-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <span className="sidebar-title">历史对话</span>
        <button className="sidebar-new-btn" onClick={onCreate} title="新对话">
          <Plus size={14} />
        </button>
      </div>

      <div className="sidebar-list">
        {sessions.length === 0 ? (
          <div className="sidebar-empty">暂无历史记录</div>
        ) : (
          (['today', 'yesterday', 'earlier'] as const).map((key) => {
            const list = groups[key]!
            if (list.length === 0) return null
            return (
              <div key={key} className="sidebar-group">
                <div className="sidebar-group-label">{GROUP_LABELS[key]}</div>
                {list.map((s) => (
                  <div
                    key={s.id}
                    className={`sidebar-item ${s.id === currentSessionId ? 'active' : ''}`}
                    onClick={() => onSelect(s.id)}
                  >
                    <MessageSquare size={11} className="sidebar-item-icon" />
                    <div className="sidebar-item-body">
                      <span className="sidebar-item-title">{s.title}</span>
                      {s.summary && (
                        <span className="sidebar-item-summary">{s.summary}</span>
                      )}
                    </div>
                    <div className="sidebar-item-meta">
                      <span className="sidebar-item-time">{formatRelativeDate(s.updatedAt)}</span>
                      <button
                        className="sidebar-item-del"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(s.id)
                        }}
                        title="删除"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
