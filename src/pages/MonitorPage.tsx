import React, { useState, useEffect, useCallback, useRef } from 'react'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../hooks/useAIChat'
import { Activity, Pause, Play, RefreshCw, Thermometer, Wind, Gauge, Bell, Stethoscope } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
type QiChannel   = 'tian' | 'di' | 'ren' | 'chong'
type Direction   = 'downstream' | 'upstream' | 'lateral' | 'balancing'
type Severity    = 'warning' | 'critical' | 'info'
type Condition   = 'deficient' | 'excess' | 'balanced'
type Trend       = 'rising' | 'falling' | 'stable'
type GaugeStatus = 'balanced' | 'yin_excess' | 'yang_excess' | 'critical'

interface HeatmapPoint {
  channelType: QiChannel; sourceNode: string; targetNode: string
  messageRate: number; avgLatency: number; errorRate: number; timestamp: number
}
interface FlowVector {
  from: string; to: string; magnitude: number
  direction: Direction; pressure: number
}
interface YinYangGauge {
  pairId: string; yinNode: string; yangNode: string
  yinValue: number; yangValue: number
  ratio: number; idealRatio: number
  status: GaugeStatus; deviation: number; timestamp: number
}
interface MeridianAlert {
  id: string; severity: Severity; channelType: QiChannel
  affectedNodes: string[]; reason: string
  description: string; detectedAt: number
}
interface QiDiagnosis {
  nodeId: string; condition: Condition
  incomingRate: number; outgoingRate: number
  activityScore: number; trend: Trend
  recommendation: string; timestamp: number
}
interface MonitorSnapshot {
  timestamp: number; systemHealth: number
  heatmaps: HeatmapPoint[]; flowVectors: FlowVector[]
  gauges: YinYangGauge[]; alerts: MeridianAlert[]
  diagnoses: QiDiagnosis[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const CHANNEL_LABELS: Record<QiChannel, string> = {
  tian: '天气', di: '地气', ren: '人气', chong: '冲气',
}
const CHANNEL_COLORS: Record<QiChannel, string> = {
  tian: '#6ea8fe', di: '#75b798', ren: '#f0ad4e', chong: '#d7aefb',
}
const DIR_LABELS: Record<Direction, string> = {
  downstream: '顺行↓', upstream: '逆行↑', lateral: '横向→', balancing: '均衡⇌',
}
const DIR_COLORS: Record<Direction, string> = {
  downstream: '#3d8bcd', upstream: '#d4756a', lateral: '#6c757d', balancing: '#20c997',
}
const STATUS_LABELS: Record<GaugeStatus, string> = {
  balanced: '调和', yin_excess: '阴盛', yang_excess: '阳盛', critical: '危急',
}
const STATUS_COLORS: Record<GaugeStatus, string> = {
  balanced: '#20c997', yin_excess: '#6ea8fe', yang_excess: '#f0ad4e', critical: '#d4756a',
}
const COND_LABELS: Record<Condition, string> = {
  balanced: '气机调和', deficient: '气虚', excess: '气滞',
}
const COND_COLORS: Record<Condition, string> = {
  balanced: '#20c997', deficient: '#f0ad4e', excess: '#d4756a',
}
const TREND_ICON: Record<Trend, string> = {
  rising: '↑', falling: '↓', stable: '─',
}
const SEV_COLORS: Record<Severity, string> = {
  critical: '#d4756a', warning: '#f0ad4e', info: '#6ea8fe',
}
const SEV_LABELS: Record<Severity, string> = {
  critical: '危急', warning: '警告', info: '信息',
}

function healthColor(h: number): string {
  if (h >= 80) return '#20c997'
  if (h >= 60) return '#f0ad4e'
  return '#d4756a'
}

function timeAgo(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000)
  if (s < 60) return `${s}s 前`
  if (s < 3600) return `${Math.floor(s / 60)}m 前`
  return `${Math.floor(s / 3600)}h 前`
}

// ── Health Ring ───────────────────────────────────────────────────────────────
function HealthRing({ score }: { score: number }): React.JSX.Element {
  const r = 52, cx = 64, cy = 64
  const circ = 2 * Math.PI * r
  const dash  = (score / 100) * circ
  const color = healthColor(score)
  return (
    <div className="mon-health-ring">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10"/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize="24" fontWeight="700">{score}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11">系统健康</text>
      </svg>
    </div>
  )
}

// ── Heatmap Panel ─────────────────────────────────────────────────────────────
function HeatmapPanel({ data }: { data: HeatmapPoint[] }): React.JSX.Element {
  const maxRate = Math.max(...data.map(d => d.messageRate), 1)
  return (
    <div className="mon-panel">
      <div className="mon-panel-hdr">
        <Thermometer size={14} />
        <span>五感热力图</span>
      </div>
      <div className="mon-heatmap">
        {data.map((p) => {
          const intensity = p.messageRate / maxRate
          const bg = `${CHANNEL_COLORS[p.channelType]}${Math.round(intensity * 180).toString(16).padStart(2,'0')}`
          return (
            <div key={`${p.channelType}-${p.sourceNode}`} className="mon-heat-cell" style={{ background: bg }}>
              <div className="mon-heat-top">
                <span className="mon-heat-ch" style={{ color: CHANNEL_COLORS[p.channelType] }}>
                  {CHANNEL_LABELS[p.channelType]}
                </span>
                <span className="mon-heat-rate">{p.messageRate}/s</span>
              </div>
              <div className="mon-heat-nodes">{p.sourceNode} → {p.targetNode}</div>
              <div className="mon-heat-bot">
                <span>延迟 {p.avgLatency}ms</span>
                <span className="mon-heat-err" style={{ color: p.errorRate > 0.05 ? '#d4756a' : 'rgba(255,255,255,0.4)' }}>
                  ERR {(p.errorRate * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Flow Vector Panel ─────────────────────────────────────────────────────────
function FlowPanel({ data }: { data: FlowVector[] }): React.JSX.Element {
  const maxMag = Math.max(...data.map(d => d.magnitude), 1)
  return (
    <div className="mon-panel">
      <div className="mon-panel-hdr">
        <Wind size={14} />
        <span>气机向量场</span>
      </div>
      <div className="mon-flow-list">
        {data.map((v) => {
          const pct = (v.magnitude / maxMag) * 100
          const dColor = DIR_COLORS[v.direction]
          return (
            <div key={`${v.from}-${v.to}`} className="mon-flow-item">
              <div className="mon-flow-nodes">
                <span className="mon-node">{v.from}</span>
                <span className="mon-flow-arrow">──▶</span>
                <span className="mon-node">{v.to}</span>
              </div>
              <div className="mon-flow-bar-wrap">
                <div className="mon-flow-bar" style={{ width: `${pct}%`, background: dColor }} />
              </div>
              <div className="mon-flow-meta">
                <span className="mon-dir-badge" style={{ background: `${dColor}22`, color: dColor }}>
                  {DIR_LABELS[v.direction]}
                </span>
                <span className="mon-flow-num">Mag {v.magnitude}</span>
                <span className="mon-flow-num">P {(v.pressure * 100).toFixed(0)}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Yin-Yang Gauge Panel ──────────────────────────────────────────────────────
function GaugePanel({ data }: { data: YinYangGauge[] }): React.JSX.Element {
  return (
    <div className="mon-panel">
      <div className="mon-panel-hdr">
        <Gauge size={14} />
        <span>阴阳仪表</span>
      </div>
      <div className="mon-gauge-list">
        {data.map((g) => {
          const total = g.yinValue + g.yangValue || 1
          const yinPct  = (g.yinValue  / total) * 100
          const yangPct = (g.yangValue / total) * 100
          const sColor = STATUS_COLORS[g.status]
          return (
            <div key={g.pairId} className="mon-gauge-item">
              <div className="mon-gauge-hdr-row">
                <span className="mon-gauge-pair">{g.pairId}</span>
                <span className="mon-gauge-status" style={{ color: sColor }}>
                  {STATUS_LABELS[g.status]}
                </span>
              </div>
              <div className="mon-gauge-track">
                <div className="mon-gauge-yin"  style={{ width: `${yinPct}%`  }} title={`阴 ${g.yinValue}`} />
                <div className="mon-gauge-yang" style={{ width: `${yangPct}%` }} title={`阳 ${g.yangValue}`} />
              </div>
              <div className="mon-gauge-labels">
                <span className="mon-yin-lbl">阴 {g.yinValue}</span>
                <span className="mon-ratio-lbl" style={{ color: sColor }}>
                  比率 {g.ratio.toFixed(2)} / 理想 {g.idealRatio}
                </span>
                <span className="mon-yang-lbl">阳 {g.yangValue}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Alerts Panel ──────────────────────────────────────────────────────────────
function AlertsPanel({ data }: { data: MeridianAlert[] }): React.JSX.Element {
  return (
    <div className="mon-panel">
      <div className="mon-panel-hdr">
        <Bell size={14} />
        <span>经络告警</span>
        {data.length > 0 && (
          <span className="mon-alert-count">{data.length}</span>
        )}
      </div>
      {data.length === 0 ? (
        <div className="mon-empty">✓ 无告警，运行正常</div>
      ) : (
        <div className="mon-alert-list">
          {data.map((a) => (
            <div key={a.id} className="mon-alert-item" style={{ borderLeftColor: SEV_COLORS[a.severity] }}>
              <div className="mon-alert-top">
                <span className="mon-sev-badge" style={{ background: `${SEV_COLORS[a.severity]}22`, color: SEV_COLORS[a.severity] }}>
                  {SEV_LABELS[a.severity]}
                </span>
                <span className="mon-ch-badge" style={{ color: CHANNEL_COLORS[a.channelType] }}>
                  {CHANNEL_LABELS[a.channelType]}
                </span>
                <span className="mon-alert-time">{timeAgo(a.detectedAt)}</span>
              </div>
              <p className="mon-alert-desc">{a.description}</p>
              <div className="mon-alert-nodes">
                {a.affectedNodes.map(n => <code key={n}>{n}</code>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Diagnosis Panel ───────────────────────────────────────────────────────────
function DiagPanel({ data }: { data: QiDiagnosis[] }): React.JSX.Element {
  return (
    <div className="mon-panel mon-panel-wide">
      <div className="mon-panel-hdr">
        <Stethoscope size={14} />
        <span>节点气机诊断</span>
      </div>
      <div className="mon-diag-grid">
        {data.map((d) => {
          const cColor = COND_COLORS[d.condition]
          return (
            <div key={d.nodeId} className="mon-diag-card">
              <div className="mon-diag-top">
                <span className="mon-diag-node">{d.nodeId}</span>
                <span className="mon-diag-trend" title={d.trend}>{TREND_ICON[d.trend]}</span>
              </div>
              <div className="mon-diag-cond" style={{ color: cColor }}>{COND_LABELS[d.condition]}</div>
              <div className="mon-diag-bars">
                <div className="mon-diag-bar-row">
                  <span>入气</span>
                  <div className="mon-diag-track">
                    <div className="mon-diag-fill in-fill"
                      style={{ width: `${Math.min(100, d.incomingRate * 3)}%` }} />
                  </div>
                  <span>{d.incomingRate}</span>
                </div>
                <div className="mon-diag-bar-row">
                  <span>出气</span>
                  <div className="mon-diag-track">
                    <div className="mon-diag-fill out-fill"
                      style={{ width: `${Math.min(100, d.outgoingRate * 3)}%` }} />
                  </div>
                  <span>{d.outgoingRate}</span>
                </div>
              </div>
              <div className="mon-diag-score">
                活跃度 <span style={{ color: cColor }}>{d.activityScore}</span>
              </div>
              <p className="mon-diag-rec">{d.recommendation}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── MonitorPage ───────────────────────────────────────────────────────────────
export function MonitorPage(): React.JSX.Element {
  const [snapshot, setSnapshot] = useState<MonitorSnapshot | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [paused,   setPaused]   = useState(false)
  const [lastTick, setLastTick] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchSnapshot = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/dao-monitor`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as MonitorSnapshot
      setSnapshot(data)
      setLastTick(Date.now())
      setError(null)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch + auto-refresh every 5s
  useEffect(() => {
    void fetchSnapshot()
  }, [fetchSnapshot])

  useEffect(() => {
    if (paused) {
      if (timerRef.current) clearInterval(timerRef.current)
    } else {
      timerRef.current = setInterval(() => void fetchSnapshot(), 5000)
    }
    return (): void => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [paused, fetchSnapshot])

  const tickAge = lastTick ? Math.round((Date.now() - lastTick) / 1000) : null

  return (
    <div className="monitor-page">
      {/* Top bar */}
      <div className="mon-topbar">
        <div className="mon-topbar-left">
          <Activity size={16} className="mon-topbar-icon" />
          <span className="mon-topbar-title">道监 · 五感仪表盘</span>
          {tickAge !== null && (
            <span className="mon-topbar-age">{tickAge}s 前更新</span>
          )}
        </div>
        <div className="mon-topbar-right">
          <button className="mon-ctrl-btn" onClick={() => void fetchSnapshot()} title="立即刷新">
            <RefreshCw size={13} />
          </button>
          <button
            className={`mon-ctrl-btn ${paused ? 'active' : ''}`}
            onClick={() => setPaused(p => !p)}
            title={paused ? '继续自动刷新' : '暂停自动刷新'}
          >
            {paused ? <Play size={13} /> : <Pause size={13} />}
            <span>{paused ? '继续' : '暂停'}</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="mon-loading">
          <div className="mon-spinner" />
          <span>正在采集五感数据…</span>
        </div>
      )}

      {error && (
        <div className="mon-error">⚠ 数据获取失败：{error}</div>
      )}

      {snapshot && !loading && (
        <div className="mon-body">
          {/* Overview row */}
          <div className="mon-overview">
            <HealthRing score={snapshot.systemHealth} />
            <div className="mon-overview-stats">
              <div className="mon-stat">
                <span className="mon-stat-val">{snapshot.heatmaps.length}</span>
                <span className="mon-stat-lbl">气道</span>
              </div>
              <div className="mon-stat">
                <span className="mon-stat-val">{snapshot.flowVectors.length}</span>
                <span className="mon-stat-lbl">向量</span>
              </div>
              <div className="mon-stat">
                <span className="mon-stat-val" style={{ color: snapshot.alerts.length > 0 ? '#f0ad4e' : '#20c997' }}>
                  {snapshot.alerts.length}
                </span>
                <span className="mon-stat-lbl">告警</span>
              </div>
              <div className="mon-stat">
                <span className="mon-stat-val">{snapshot.diagnoses.length}</span>
                <span className="mon-stat-lbl">节点</span>
              </div>
            </div>
          </div>

          {/* Main grid */}
          <div className="mon-grid">
            <HeatmapPanel  data={snapshot.heatmaps}     />
            <FlowPanel     data={snapshot.flowVectors}   />
            <GaugePanel    data={snapshot.gauges}        />
            <AlertsPanel   data={snapshot.alerts}        />
            <DiagPanel     data={snapshot.diagnoses}     />
          </div>
        </div>
      )}
    </div>
  )
}
