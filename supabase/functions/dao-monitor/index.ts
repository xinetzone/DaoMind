const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Types (matches @daomind/monitor MonitorSnapshot) ──────────────────────────
type QiChannel = 'tian' | 'di' | 'ren' | 'chong'
type Direction = 'downstream' | 'upstream' | 'lateral' | 'balancing'
type Severity  = 'warning' | 'critical' | 'info'
type Condition = 'deficient' | 'excess' | 'balanced'
type Trend     = 'rising' | 'falling' | 'stable'
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
interface SimSnapshot {
  timestamp: number; systemHealth: number
  heatmaps: HeatmapPoint[]; flowVectors: FlowVector[]
  gauges: YinYangGauge[]; alerts: MeridianAlert[]
  diagnoses: QiDiagnosis[]
}

// ── Deterministic pseudo-random seeded by 5-second window ─────────────────────
function makeRand(seed: number) {
  return (offset: number, max: number): number => {
    const x = Math.imul(seed + offset * 1013904223, 1664525) >>> 0
    return x % max
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  try {
    const now  = Date.now()
    const seed = Math.floor(now / 5000)
    const rand = makeRand(seed)
    const randf = (o: number) => rand(o, 1000) / 1000

    // ── Heatmap ─────────────────────────────────────────────────────
    const heatmaps: HeatmapPoint[] = [
      { channelType: 'tian',  sourceNode: 'daoNexus',   targetNode: 'daoCollective',
        messageRate: 12 + rand(1, 20),  avgLatency: 4 + rand(2, 8),  errorRate: +(randf(3)  * 0.08).toFixed(3), timestamp: now },
      { channelType: 'ren',   sourceNode: 'daoAgents',  targetNode: 'daoCollective',
        messageRate:  8 + rand(4, 15),  avgLatency: 2 + rand(5, 5),  errorRate: +(randf(6)  * 0.05).toFixed(3), timestamp: now },
      { channelType: 'di',    sourceNode: 'daoApps',    targetNode: 'daoCollective',
        messageRate:  5 + rand(7, 10),  avgLatency: 6 + rand(8, 12), errorRate: +(randf(9)  * 0.03).toFixed(3), timestamp: now },
      { channelType: 'chong', sourceNode: 'daoMonitor', targetNode: 'daoCollective',
        messageRate:  3 + rand(10, 6),  avgLatency: 1 + rand(11, 3), errorRate: +(randf(12) * 0.01).toFixed(3), timestamp: now },
    ]

    // ── Flow Vectors ─────────────────────────────────────────────────
    const flowVectors: FlowVector[] = [
      { from: 'daoCollective', to: 'daoAgents',     magnitude: 15 + rand(20, 10), direction: 'downstream', pressure: +(0.20 + randf(21) * 0.30).toFixed(2) },
      { from: 'daoAgents',     to: 'daoCollective', magnitude:  5 + rand(22,  6), direction: 'upstream',   pressure: +(0.10 + randf(23) * 0.20).toFixed(2) },
      { from: 'daoCollective', to: 'daoApps',       magnitude:  8 + rand(24,  8), direction: 'balancing',  pressure: +(0.15 + randf(25) * 0.20).toFixed(2) },
      { from: 'daoNexus',      to: 'daoCollective', magnitude: 12 + rand(26, 12), direction: 'downstream', pressure: +(0.30 + randf(27) * 0.35).toFixed(2) },
      { from: 'daoVerify',     to: 'daoMonitor',    magnitude:  3 + rand(28,  4), direction: 'lateral',    pressure: +(0.05 + randf(29) * 0.10).toFixed(2) },
    ]

    // ── Yin-Yang Gauges ──────────────────────────────────────────────
    const makeGauge = (pairId: string, yBase: number, gBase: number, ideal: number, o: number): YinYangGauge => {
      const yin  = yBase + rand(o,   Math.max(1, yBase))
      const yang = gBase + rand(o+1, Math.max(1, gBase))
      const ratio = yang > 0 ? yin / yang : 0
      const dev   = Math.min(1, Math.abs(ratio - ideal) / Math.max(ideal, 0.001))
      let status: GaugeStatus
      if (dev > 0.8) status = 'critical'
      else if (ratio < ideal * 0.6) status = 'yang_excess'
      else if (ratio > ideal * 1.4) status = 'yin_excess'
      else status = 'balanced'
      return {
        pairId, yinNode: `${pairId}_yin`, yangNode: `${pairId}_yang`,
        yinValue: yin, yangValue: yang,
        ratio: +ratio.toFixed(3), idealRatio: ideal,
        status, deviation: +dev.toFixed(3), timestamp: now,
      }
    }

    const gauges: YinYangGauge[] = [
      makeGauge('agent-active-dormant', 3,  8,  1.0, 30),
      makeGauge('app-running-stopped',  2,  6,  0.5, 40),
      makeGauge('tian-di-balance',      5, 12,  2.0, 50),
    ]

    // ── Alerts ───────────────────────────────────────────────────────
    const alerts: MeridianAlert[] = []
    if (seed % 5 === 1) alerts.push({
      id: `w-${seed}`, severity: 'warning', channelType: 'ren',
      affectedNodes: ['daoAgents'], reason: 'congestion',
      description: '人气通道 daoAgents 消息堆积，建议扩容处理单元',
      detectedAt: now - rand(61, 60000),
    })
    if (seed % 11 === 3) alerts.push({
      id: `c-${seed}`, severity: 'critical', channelType: 'tian',
      affectedNodes: ['daoNexus', 'daoCollective'], reason: 'latency_spike',
      description: '天气通道延迟峰值，枢纽与宇宙间连接不畅',
      detectedAt: now - rand(71, 30000),
    })
    if (seed % 7 === 2) alerts.push({
      id: `i-${seed}`, severity: 'info', channelType: 'di',
      affectedNodes: ['daoApps'], reason: 'disconnection',
      description: '地气通道检测到应用容器暂时性断连，已自动重连',
      detectedAt: now - rand(81, 120000),
    })

    // ── Diagnoses ────────────────────────────────────────────────────
    const makeDiag = (nodeId: string, inBase: number, outBase: number, o: number): QiDiagnosis => {
      const inc   = inBase  + rand(o,   Math.max(1, inBase))
      const out   = outBase + rand(o+1, Math.max(1, outBase))
      const score = Math.min(100, Math.round((inc + out) * 2.5))
      const delta = inc - out
      const trend: Trend = Math.abs(delta) < 2 ? 'stable' : delta > 0 ? 'rising' : 'falling'
      const ratio = out > 0 ? inc / out : 0
      let condition: Condition
      if (ratio > 2.0) condition = 'deficient'
      else if (ratio < 0.4) condition = 'excess'
      else condition = 'balanced'
      const rec: Record<Condition, string> = {
        deficient: '建议增加出气量，疏通下行通道',
        excess:    '建议限制入气速率，避免气机壅塞',
        balanced:  '气机调和，可继续当前运行模式',
      }
      return { nodeId, condition, incomingRate: inc, outgoingRate: out, activityScore: score, trend, recommendation: rec[condition], timestamp: now }
    }

    const diagnoses: QiDiagnosis[] = [
      makeDiag('daoCollective', 28, 25, 60),
      makeDiag('daoAgents',     15,  8, 61),
      makeDiag('daoApps',        8,  8, 62),
      makeDiag('daoNexus',       5, 12, 63),
      makeDiag('daoVerify',      3,  3, 64),
    ]

    // ── System Health ────────────────────────────────────────────────
    let health = 100
    for (const a of alerts) {
      if (a.severity === 'critical') health -= 15
      else if (a.severity === 'warning') health -= 5
    }
    for (const g of gauges) {
      if (g.status === 'critical') health -= 8
      else if (g.status !== 'balanced') health -= 3
    }
    for (const d of diagnoses) {
      if (d.condition !== 'balanced') health -= 2
    }
    health = Math.max(0, Math.min(100, health))

    const snapshot: SimSnapshot = { timestamp: now, systemHealth: health, heatmaps, flowVectors, gauges, alerts, diagnoses }

    return new Response(JSON.stringify(snapshot), {
      headers: { 'Content-Type': 'application/json', ...cors },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...cors },
    })
  }
})
