import React from 'react'
import {
  RefreshCw, Pause, Play, TrendingUp, TrendingDown, Minus, HelpCircle,
  Layers, Cpu, AppWindow, Box, Zap, Activity, GitBranch,
} from 'lucide-react'
import { useEdgeFetch } from '../hooks/useEdgeFetch'

// ── Types ─────────────────────────────────────────────────────────────────────
type HealthTrend = 'improving' | 'stable' | 'degrading' | 'unknown'

interface SystemSim {
  agents:  { total: number; byState: Record<string,number>; byType: Record<string,number> }
  apps:    { total: number; byState: Record<string,number> }
  modules: { total: number; byLifecycle: Record<string,number> }
  events:  { total: number; byType: Record<string,number> }
}
interface QiSim {
  totalEmitted: number; totalDropped: number
  channelsStats: Record<string,number>; registeredNodes: number
}
interface BenchSim    { totalRuns: number; lastRunAt: number; lastHealth: number }
interface DiagSim     { totalDiagnoses: number; lastDiagnosisAt: number; lastAuditScore: number; lastBenchHealth: number }
interface HealthEntry { timestamp: number; monitorScore: number; qiNodes: number }
interface HealthBoard { trend: HealthTrend; latestScore: number; totalChecks: number; history: HealthEntry[] }
interface CollectiveSnapshot {
  timestamp: number; monitorHealth: number
  system: SystemSim; qi: QiSim; bench: BenchSim; diagnostic: DiagSim; healthBoard: HealthBoard
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function scoreColor(s: number): string {
  if (s >= 80) return 'var(--col-good)'
  if (s >= 55) return 'var(--col-warn)'
  return 'var(--col-crit)'
}
function relTime(ts: number): string {
  const d = Math.round((Date.now() - ts) / 1000)
  if (d < 60)   return `${d}s 前`
  if (d < 3600) return `${Math.round(d/60)}m 前`
  return `${Math.round(d/3600)}h 前`
}

// ── Sub-components ────────────────────────────────────────────────────────────

function HealthRing({ score, size = 80 }: { score: number; size?: number }): React.JSX.Element {
  const r   = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = scoreColor(score)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="coll-health-ring">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text
        x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={size * 0.22} fontWeight="700"
      >{score}</text>
    </svg>
  )
}

function TrendBadge({ trend }: { trend: HealthTrend }): React.JSX.Element {
  const map: Record<HealthTrend, { cls: string; icon: React.JSX.Element; label: string }> = {
    improving: { cls: 'trend-improving', icon: <TrendingUp size={12} />, label: '向好' },
    stable:    { cls: 'trend-stable',    icon: <Minus size={12} />,       label: '平稳' },
    degrading: { cls: 'trend-degrading', icon: <TrendingDown size={12} />, label: '下降' },
    unknown:   { cls: 'trend-unknown',   icon: <HelpCircle size={12} />,   label: '未知' },
  }
  const { cls, icon, label } = map[trend]
  return <span className={`coll-trend-badge ${cls}`}>{icon}{label}</span>
}

function StatCard({ icon, label, value, sub }: {
  icon: React.JSX.Element; label: string; value: string | number; sub?: string
}): React.JSX.Element {
  return (
    <div className="coll-stat-card">
      <div className="coll-stat-icon">{icon}</div>
      <div className="coll-stat-body">
        <div className="coll-stat-value">{value}</div>
        <div className="coll-stat-label">{label}</div>
        {sub && <div className="coll-stat-sub">{sub}</div>}
      </div>
    </div>
  )
}

function StateBar({ label, value, total, cls }: {
  label: string; value: number; total: number; cls: string
}): React.JSX.Element {
  const pct = total > 0 ? Math.round(value / total * 100) : 0
  return (
    <div className="coll-state-row">
      <span className="coll-state-label">{label}</span>
      <div className="coll-state-track">
        <div className={`coll-state-fill ${cls}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="coll-state-num">{value}</span>
    </div>
  )
}

function Sparkline({ history, width = 200, height = 48 }: {
  history: HealthEntry[]; width?: number; height?: number
}): React.JSX.Element {
  if (history.length < 2) return <div className="coll-spark-empty">数据不足</div>
  const scores = history.map(h => h.monitorScore)
  const min = Math.min(...scores) - 5
  const max = Math.max(...scores) + 5
  const toX = (i: number): number => (i / (history.length - 1)) * width
  const toY = (s: number): number => height - ((s - min) / (max - min)) * height
  const points = history.map((h, i) => `${toX(i).toFixed(1)},${toY(h.monitorScore).toFixed(1)}`).join(' ')
  const lx = toX(history.length - 1)
  return (
    <div className="coll-spark-wrap">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* gradient area */}
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--col-good)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--col-good)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,${height} ${points} ${lx},${height}`}
          fill="url(#sparkGrad)"
        />
        <polyline points={points} fill="none" stroke="var(--col-good)" strokeWidth="2" strokeLinejoin="round" />
        {/* dots */}
        {history.map((h, i) => (
          <circle key={i} cx={toX(i)} cy={toY(h.monitorScore)} r="3" fill="var(--col-good)" />
        ))}
      </svg>
      <div className="coll-spark-labels">
        {history.map((h, i) => (
          <span key={i} style={{ left: `${(i / (history.length-1)) * 100}%` }}>
            {h.monitorScore}
          </span>
        ))}
      </div>
    </div>
  )
}

function QiChannelRow({ name, label, count, max, cls }: {
  name: string; label: string; count: number; max: number; cls: string
}): React.JSX.Element {
  const pct = max > 0 ? Math.round(count / max * 100) : 0
  return (
    <div className="qi-channel-row">
      <span className="qi-ch-name">{name}</span>
      <span className="qi-ch-label">{label}</span>
      <div className="qi-ch-track">
        <div className={`qi-ch-fill ${cls}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="qi-ch-count">{count}</span>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function CollectivePage(): React.JSX.Element {
  const { data: snap, loading, error, paused, setPaused, refresh } =
    useEdgeFetch<CollectiveSnapshot>('dao-collective', 10000)

  if (!snap && loading) {
    return (
      <div className="collective-layout collective-loading">
        <RefreshCw size={28} className="spin" />
        <span>正在连接宇宙…</span>
      </div>
    )
  }

  if (!snap && error) {
    return (
      <div className="collective-layout collective-error">
        <span>连接失败：{error}</span>
        <button className="coll-btn" onClick={refresh}>重试</button>
      </div>
    )
  }

  if (!snap) return <div className="collective-layout collective-loading" />

  const { system, qi, bench, diagnostic, healthBoard, monitorHealth } = snap
  const qiMax = Math.max(...Object.values(qi.channelsStats), 1)
  const agentTotal = system.agents.total || 1
  const appTotal   = system.apps.total   || 1
  const modTotal   = system.modules.total || 1
  const evTotal    = system.events.total  || 1

  return (
    <div className="collective-layout">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="collective-header">
        <div className="coll-header-left">
          <Layers size={18} className="coll-header-icon" />
          <div>
            <div className="coll-header-title">宇宙健康板</div>
            <div className="coll-header-sub">DaoCollective · 全局状态</div>
          </div>
        </div>

        <div className="coll-health-center">
          <HealthRing score={healthBoard.latestScore} size={90} />
          <div className="coll-health-meta">
            <TrendBadge trend={healthBoard.trend} />
            <span className="coll-health-checks">{healthBoard.totalChecks} 次检查</span>
          </div>
        </div>

        <div className="coll-header-right">
          <div className="coll-header-actions">
            <button
              className="coll-icon-btn"
              title={paused ? '恢复自动刷新' : '暂停自动刷新'}
              onClick={() => setPaused(!paused)}
            >
              {paused ? <Play size={14} /> : <Pause size={14} />}
            </button>
            <button
              className={`coll-icon-btn ${loading ? 'spinning' : ''}`}
              title="立即刷新"
              onClick={refresh}
            >
              <RefreshCw size={14} />
            </button>
          </div>
          <div className="coll-header-ts">
            {paused ? '已暂停' : '每 10s 刷新'}
          </div>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────── */}
      <div className="coll-stat-row">
        <StatCard icon={<Cpu size={16} />}      label="活跃智能体" value={system.agents.byState['active'] ?? 0} sub={`共 ${system.agents.total} 个`} />
        <StatCard icon={<AppWindow size={16} />} label="运行中应用" value={system.apps.byState['running'] ?? 0} sub={`共 ${system.apps.total} 个`} />
        <StatCard icon={<Zap size={16} />}       label="气机节点"  value={qi.registeredNodes} sub={`已发 ${qi.totalEmitted}`} />
        <StatCard icon={<Activity size={16} />}  label="综合诊断"  value={diagnostic.totalDiagnoses} sub={`审计 ${diagnostic.lastAuditScore}分`} />
      </div>

      {/* ── Body Grid ──────────────────────────────────────────── */}
      <div className="collective-body">

        {/* 气机总线 */}
        <div className="collective-panel">
          <div className="collective-panel-title"><Zap size={13} />混元气总线</div>
          <div className="qi-panel-stats">
            <span className="qi-stat-item">已发 <b>{qi.totalEmitted}</b></span>
            <span className="qi-stat-item">丢包 <b>{qi.totalDropped}</b></span>
            <span className="qi-stat-item">节点 <b>{qi.registeredNodes}</b></span>
          </div>
          <div className="qi-channels">
            <QiChannelRow name="天" label="tian" count={qi.channelsStats['tian']  ?? 0} max={qiMax} cls="qi-tian" />
            <QiChannelRow name="地" label="di"   count={qi.channelsStats['di']    ?? 0} max={qiMax} cls="qi-di"   />
            <QiChannelRow name="人" label="ren"  count={qi.channelsStats['ren']   ?? 0} max={qiMax} cls="qi-ren"  />
            <QiChannelRow name="冲" label="chong" count={qi.channelsStats['chong'] ?? 0} max={qiMax} cls="qi-chong" />
          </div>
        </div>

        {/* 智能体状态 */}
        <div className="collective-panel">
          <div className="collective-panel-title"><Cpu size={13} />智能体</div>
          <div className="coll-section-label">状态分布（共 {system.agents.total}）</div>
          <StateBar label="活跃" value={system.agents.byState['active']  ?? 0} total={agentTotal} cls="fill-active"  />
          <StateBar label="休眠" value={system.agents.byState['dormant'] ?? 0} total={agentTotal} cls="fill-dormant" />
          <StateBar label="出错" value={system.agents.byState['error']   ?? 0} total={agentTotal} cls="fill-error"   />
          <div className="coll-section-label" style={{ marginTop: '0.75rem' }}>类型分布</div>
          {Object.entries(system.agents.byType).map(([type, cnt]) => (
            <div key={type} className="coll-type-row">
              <GitBranch size={11} />
              <span className="coll-type-name">{type}</span>
              <span className="coll-type-cnt">{cnt}</span>
            </div>
          ))}
        </div>

        {/* 应用 + 模块 */}
        <div className="collective-panel">
          <div className="collective-panel-title"><AppWindow size={13} />应用 · 模块</div>
          <div className="coll-section-label">应用状态（共 {system.apps.total}）</div>
          <StateBar label="运行" value={system.apps.byState['running'] ?? 0} total={appTotal} cls="fill-running" />
          <StateBar label="停止" value={system.apps.byState['stopped'] ?? 0} total={appTotal} cls="fill-stopped" />
          <StateBar label="空闲" value={system.apps.byState['idle']    ?? 0} total={appTotal} cls="fill-idle"    />
          <div className="coll-section-label" style={{ marginTop: '0.75rem' }}>模块生命周期（共 {system.modules.total}）</div>
          <StateBar label="已创建"  value={system.modules.byLifecycle['created']     ?? 0} total={modTotal} cls="fill-created"  />
          <StateBar label="已初始化" value={system.modules.byLifecycle['initialized'] ?? 0} total={modTotal} cls="fill-inited"   />
          <StateBar label="已销毁"  value={system.modules.byLifecycle['disposed']    ?? 0} total={modTotal} cls="fill-disposed" />
        </div>

        {/* 事件总线 */}
        <div className="collective-panel">
          <div className="collective-panel-title"><Box size={13} />事件总线</div>
          <div className="coll-events-total">共 <b>{system.events.total}</b> 条事件</div>
          {Object.entries(system.events.byType).map(([type, cnt]) => (
            <div key={type} className="coll-state-row">
              <span className="coll-state-label">{type}</span>
              <div className="coll-state-track">
                <div className="coll-state-fill fill-event" style={{ width: `${Math.round(cnt/evTotal*100)}%` }} />
              </div>
              <span className="coll-state-num">{cnt}</span>
            </div>
          ))}
          <div className="coll-section-label" style={{ marginTop: '0.75rem' }}>监控健康分</div>
          <div className="coll-monitor-health">
            <div className="coll-mh-bar">
              <div className="coll-mh-fill" style={{
                width: `${monitorHealth}%`,
                background: scoreColor(monitorHealth),
              }} />
            </div>
            <span style={{ color: scoreColor(monitorHealth), fontWeight: 600, fontSize: '0.8rem' }}>
              {monitorHealth}
            </span>
          </div>
        </div>

        {/* 健康趋势 */}
        <div className="collective-panel coll-panel-spark">
          <div className="collective-panel-title"><TrendingUp size={13} />健康趋势（近 5 次）</div>
          <Sparkline history={healthBoard.history} width={320} height={60} />
          <div className="coll-spark-meta">
            最新评分 <b>{healthBoard.latestScore}</b> · 趋势 <TrendBadge trend={healthBoard.trend} />
          </div>
        </div>

        {/* 基准 & 诊断 */}
        <div className="collective-panel">
          <div className="collective-panel-title"><Activity size={13} />基准 · 综合诊断</div>
          <div className="coll-bench-grid">
            <div className="coll-bench-item">
              <div className="coll-bench-val"
                style={{ color: scoreColor(bench.lastHealth) }}>{bench.lastHealth}</div>
              <div className="coll-bench-key">基准健康分</div>
            </div>
            <div className="coll-bench-item">
              <div className="coll-bench-val">{bench.totalRuns}</div>
              <div className="coll-bench-key">基准运行次数</div>
            </div>
            <div className="coll-bench-item">
              <div className="coll-bench-val"
                style={{ color: scoreColor(diagnostic.lastAuditScore) }}>{diagnostic.lastAuditScore}</div>
              <div className="coll-bench-key">审计评分</div>
            </div>
            <div className="coll-bench-item">
              <div className="coll-bench-val">{diagnostic.totalDiagnoses}</div>
              <div className="coll-bench-key">诊断次数</div>
            </div>
          </div>
          <div className="coll-bench-ts">
            最近基准：{relTime(bench.lastRunAt)} · 最近诊断：{relTime(diagnostic.lastDiagnosisAt)}
          </div>
        </div>

      </div>
    </div>
  )
}
