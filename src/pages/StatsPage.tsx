import React from 'react'
import { MessageCircle, MessagesSquare, Hash, Flame, BarChart2, Trophy } from 'lucide-react'
import { useSessions } from '../hooks/useSessions'
import { useStats } from '../hooks/useStats'
import { DataIOPanel } from '../components/DataIOPanel'

function KpiCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  accent?: boolean
}): React.JSX.Element {
  return (
    <div className={`stats-kpi-card${accent ? ' accent' : ''}`}>
      <div className="stats-kpi-icon">{icon}</div>
      <div className="stats-kpi-body">
        <span className="stats-kpi-value">{value}</span>
        <span className="stats-kpi-label">{label}</span>
        {sub && <span className="stats-kpi-sub">{sub}</span>}
      </div>
    </div>
  )
}

export function StatsPage(): React.JSX.Element {
  const { sessions, replaceAllSessions, mergeSessions } = useSessions()
  const stats = useStats(sessions)

  const maxBar = Math.max(...stats.last7Days.map((d) => d.count), 1)
  const maxTop = Math.max(...stats.topSessions.map((s) => s.messageCount), 1)

  return (
    <div className="stats-page">
      <div className="stats-header">
        <BarChart2 size={18} className="stats-header-icon" />
        <h2 className="stats-header-title">道数 · 使用统计</h2>
        <span className="stats-header-sub">基于本地会话数据</span>
      </div>

      {/* KPI Cards */}
      <div className="stats-kpi-grid">
        <KpiCard
          icon={<MessagesSquare size={20} />}
          label="总会话数"
          value={stats.totalSessions}
          sub={`今日 ${stats.todaySessions} 条`}
          accent
        />
        <KpiCard
          icon={<MessageCircle size={20} />}
          label="总消息数"
          value={stats.totalMessages}
          sub={`均 ${stats.avgMessagesPerSession} 条/会话`}
        />
        <KpiCard
          icon={<Hash size={20} />}
          label="估算 Token"
          value={stats.estimatedTokens.toLocaleString()}
          sub={`${stats.totalChars.toLocaleString()} 字符`}
        />
        <KpiCard
          icon={<Flame size={20} />}
          label="AI 回复"
          value={stats.totalAssistantMessages}
          sub={`用户提问 ${stats.totalUserMessages}`}
        />
      </div>

      <div className="stats-charts-row">
        {/* 7-day bar chart */}
        <div className="stats-chart-card">
          <h3 className="stats-chart-title">最近 7 天会话趋势</h3>
          <div className="stats-bar-chart">
            {stats.last7Days.map((d) => (
              <div key={d.date} className="stats-bar-col">
                <span className="stats-bar-val">{d.count > 0 ? d.count : ''}</span>
                <div
                  className="stats-bar"
                  style={{ height: `${Math.max((d.count / maxBar) * 100, d.count > 0 ? 8 : 2)}%` }}
                />
                <span className="stats-bar-label">{d.date.slice(3)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* User vs AI ratio */}
        <div className="stats-chart-card">
          <h3 className="stats-chart-title">消息构成</h3>
          {stats.totalMessages > 0 ? (
            <div className="stats-ratio-wrap">
              <div className="stats-ratio-bar">
                <div
                  className="stats-ratio-seg user"
                  style={{
                    width: `${(stats.totalUserMessages / stats.totalMessages) * 100}%`,
                  }}
                />
                <div
                  className="stats-ratio-seg assistant"
                  style={{
                    width: `${(stats.totalAssistantMessages / stats.totalMessages) * 100}%`,
                  }}
                />
              </div>
              <div className="stats-ratio-legend">
                <span className="stats-ratio-dot user" />
                <span>用户提问 {stats.totalUserMessages}</span>
                <span className="stats-ratio-dot assistant" />
                <span>AI 回复 {stats.totalAssistantMessages}</span>
              </div>
            </div>
          ) : (
            <p className="stats-empty">暂无数据</p>
          )}
        </div>
      </div>

      {/* Top sessions */}
      {stats.topSessions.length > 0 && (
        <div className="stats-chart-card stats-top">
          <h3 className="stats-chart-title">
            <Trophy size={14} />
            最活跃会话 Top 5
          </h3>
          <div className="stats-top-list">
            {stats.topSessions.map((s, i) => (
              <div key={i} className="stats-top-item">
                <span className="stats-top-rank">{i + 1}</span>
                <span className="stats-top-title">{s.title}</span>
                <div
                  className="stats-top-bar"
                  style={{ width: `${(s.messageCount / maxTop) * 60}%` }}
                />
                <span className="stats-top-count">{s.messageCount} 条</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.totalSessions === 0 && (
        <div className="stats-onboarding">
          <BarChart2 size={36} className="stats-onboarding-icon" />
          <p>还没有会话记录</p>
          <p className="stats-onboarding-sub">开始对话后，统计数据将显示在这里</p>
        </div>
      )}

      <DataIOPanel
        sessions={sessions}
        onReplace={replaceAllSessions}
        onMerge={mergeSessions}
      />
    </div>
  )
}
