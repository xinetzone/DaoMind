const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Types (mirrors DaoFacadeSnapshot + HealthBoard) ───────────────────────────
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
interface BenchSim    { totalRuns: number; lastRunAt: number; lastHealth: number; historySize: number }
interface DiagSim     { totalDiagnoses: number; lastDiagnosisAt: number; lastAuditScore: number; lastBenchHealth: number }
interface HealthEntry { timestamp: number; monitorScore: number; qiNodes: number }
interface HealthBoard {
  trend: HealthTrend; latestScore: number; totalChecks: number; history: HealthEntry[]
}
interface CollectiveSnapshot {
  timestamp: number; monitorHealth: number
  system: SystemSim; qi: QiSim; bench: BenchSim; diagnostic: DiagSim; healthBoard: HealthBoard
}

// ── Same makeRand as dao-monitor ──────────────────────────────────────────────
function makeRand(seed: number) {
  return (offset: number, max: number): number => {
    const x = Math.imul(seed + offset * 1013904223, 1664525) >>> 0
    return x % Math.max(1, max)
  }
}

// ── Compute trend from 3 recent scores ───────────────────────────────────────
function computeTrend(history: HealthEntry[]): HealthTrend {
  if (history.length < 2) return 'unknown'
  const recent = history.slice(-3)
  const deltas: number[] = []
  for (let i = 1; i < recent.length; i++) {
    deltas.push(recent[i]!.monitorScore - recent[i-1]!.monitorScore)
  }
  if (deltas.every(d => d > 0.5))  return 'improving'
  if (deltas.every(d => d < -0.5)) return 'degrading'
  return 'stable'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  try {
    const now  = Date.now()
    const seed = Math.floor(now / 5000)
    const rand = makeRand(seed)

    // ── System ──────────────────────────────────────────────────────────────
    const active  = 3 + rand(1, 5)
    const dormant = 1 + rand(2, 3)
    const error   = rand(3, 2)
    const coordinator = 1 + rand(4, 3)
    const observer    = 1 + rand(5, 2)
    const worker      = 1 + rand(6, 4)
    const running = 2 + rand(7, 4)
    const stopped = rand(8, 2)
    const idle    = rand(9, 1)
    const modCreated  = 5 + rand(10, 5)
    const modInited   = 3 + rand(11, 4)
    const modDisposed = rand(12, 2)
    const evTotal = 80 + rand(13, 40)

    const system: SystemSim = {
      agents: {
        total: active + dormant + error,
        byState: { active, dormant, error },
        byType:  { coordinator, observer, worker },
      },
      apps: {
        total: running + stopped + idle,
        byState: { running, stopped, idle },
      },
      modules: {
        total: modCreated + modInited + modDisposed,
        byLifecycle: { created: modCreated, initialized: modInited, disposed: modDisposed },
      },
      events: {
        total: evTotal,
        byType: {
          lifecycle: 20 + rand(14, 20),
          message:   15 + rand(15, 15),
          heartbeat: 10 + rand(16, 12),
          error:      rand(17,  5),
        },
      },
    }

    // ── Qi Bus ──────────────────────────────────────────────────────────────
    const qi: QiSim = {
      totalEmitted: 200 + rand(20, 80),
      totalDropped: rand(21, 5),
      channelsStats: {
        tian:  40 + rand(22, 20),
        di:    30 + rand(23, 15),
        ren:   50 + rand(24, 25),
        chong: 20 + rand(25, 10),
      },
      registeredNodes: 4 + rand(26, 4),
    }

    // ── Benchmark ───────────────────────────────────────────────────────────
    const benchRuns   = 5 + rand(30, 10)
    const benchHealth = 60 + rand(31, 30)
    const bench: BenchSim = {
      totalRuns:   benchRuns,
      lastRunAt:   now - rand(32, 300000),
      lastHealth:  benchHealth,
      historySize: benchRuns,
    }

    // ── Diagnostic ──────────────────────────────────────────────────────────
    const diagnostic: DiagSim = {
      totalDiagnoses:  3 + rand(40, 8),
      lastDiagnosisAt: now - rand(41, 600000),
      lastAuditScore:  55 + rand(42, 35),
      lastBenchHealth: benchHealth,
    }

    // ── Health History (last 5 × 5-second windows) ──────────────────────────
    const history: HealthEntry[] = []
    for (let i = 4; i >= 0; i--) {
      const pastSeed = seed - i
      const pr = makeRand(pastSeed)
      history.push({
        timestamp:    now - i * 5000,
        monitorScore: 60 + pr(50, 30),
        qiNodes:       4 + pr(51, 4),
      })
    }
    const trend = computeTrend(history)
    const latestEntry = history[history.length - 1]!

    const healthBoard: HealthBoard = {
      trend,
      latestScore: latestEntry.monitorScore,
      totalChecks: 5 + rand(60, 20),
      history,
    }

    // ── Monitor health (same formula as dao-monitor) ─────────────────────────
    let monitorHealth = 100
    if (error > 1)   monitorHealth -= 10
    if (stopped > 1) monitorHealth -= 5
    monitorHealth = Math.max(0, Math.min(100, monitorHealth))

    const snapshot: CollectiveSnapshot = {
      timestamp: now, monitorHealth,
      system, qi, bench, diagnostic, healthBoard,
    }

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
