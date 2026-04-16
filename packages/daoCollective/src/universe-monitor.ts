/** DaoUniverseMonitor — 道宇宙 × 监控桥接器
 * 将 DaoUniverse 的系统状态映射到 daoMonitor 五大引擎，提供实时健康快照。
 *
 * 数据流：DaoUniverse.snapshot() → feed() → 5 engines → aggregator.capture() → MonitorSnapshot
 */

import {
  DaoHeatmapEngine,
  DaoVectorField,
  DaoYinYangGaugeEngine,
  DaoAlertEngine,
  DaoDiagnosisEngine,
  DaoSnapshotAggregator,
} from '@daomind/monitor';
import type { MonitorSnapshot } from '@daomind/monitor';
import type { DaoUniverse } from './universe';

export class DaoUniverseMonitor {
  private readonly _heatmap  = new DaoHeatmapEngine();
  private readonly _vector   = new DaoVectorField();
  private readonly _gauge    = new DaoYinYangGaugeEngine();
  private readonly _alerts   = new DaoAlertEngine();
  private readonly _diagnosis = new DaoDiagnosisEngine();
  private readonly _aggregator: DaoSnapshotAggregator;

  constructor(private readonly _universe: DaoUniverse) {
    this._aggregator = new DaoSnapshotAggregator(
      this._heatmap,
      this._vector,
      this._gauge,
      this._alerts,
      this._diagnosis,
    );
  }

  /**
   * feed — 读取 DaoUniverse 当前状态，向五大引擎注入数据
   *
   * 映射规则：
   *   agents.byType  → heatmap (ren 通道) + alerts + diagnosis
   *   agents.byState → vectorField (downstream/upstream) + yin-yang gauge
   *   apps.byState   → vectorField (balancing) + yin-yang gauge
   */
  feed(): void {
    const snap       = this._universe.snapshot();
    const allAgents  = this._universe.agentRegistry.listAll();

    const activeAgents  = snap.agents.byState['active']  ?? 0;
    const dormantAgents = snap.agents.byState['dormant'] ?? 0;
    const errorAgents   = snap.agents.byState['error']   ?? 0;
    const totalAgents   = snap.agents.total;
    const runningApps   = snap.apps.byState['running']   ?? 0;
    const stoppedApps   = snap.apps.byState['stopped']   ?? 0;
    const errorRate     = totalAgents > 0 ? errorAgents / totalAgents : 0;

    // ── 1. Heatmap: 每种 agentType 对应一条 ren 通道记录 ─────────────
    for (const [type, count] of Object.entries(snap.agents.byType)) {
      this._heatmap.record('ren', type, 'daoCollective', {
        rate: count,
        latency: 0,
        errorRate,
      });
    }

    // ── 2. VectorField: 气流方向 ─────────────────────────────────────
    if (activeAgents > 0)  this._vector.recordFlow('daoCollective', 'daoAgents', activeAgents, 'downstream');
    if (dormantAgents > 0) this._vector.recordFlow('daoAgents', 'daoCollective', dormantAgents, 'upstream');
    if (runningApps > 0)   this._vector.recordFlow('daoCollective', 'daoApps', runningApps, 'balancing');
    if (stoppedApps > 0)   this._vector.recordFlow('daoApps', 'daoCollective', stoppedApps, 'upstream');

    // ── 3. YinYangGauge: 阴阳对偶（仅在有数据时更新，避免 0/0 → ratio=Infinity）────
    const agentYin  = dormantAgents + errorAgents;
    const agentYang = activeAgents;
    if (agentYin > 0 || agentYang > 0) {
      this._gauge.updatePair('agent-active-dormant', agentYin, agentYang, 1.0);
    }
    if (stoppedApps > 0 || runningApps > 0) {
      this._gauge.updatePair('app-running-stopped', stoppedApps, runningApps, 0.5);
    }

    // ── 4. AlertEngine: 告警检查 ─────────────────────────────────────
    for (const [type, count] of Object.entries(snap.agents.byType)) {
      this._alerts.check('ren', type, 'daoCollective', {
        rate: count,
        latency: 0,
        errorRate,
      });
    }

    // ── 5. DiagnosisEngine: 每个注册 Agent 的气流诊断 ────────────────
    const avgEventsPerAgent = totalAgents > 0
      ? snap.events.total / totalAgents
      : 0;

    for (const agent of allAgents) {
      const outgoing = snap.agents.byType[agent.agentType] ?? 0;
      this._diagnosis.diagnose(agent.id, avgEventsPerAgent, outgoing);
    }
  }

  /** capture — feed() + aggregator.capture() → MonitorSnapshot */
  capture(): MonitorSnapshot {
    this.feed();
    return this._aggregator.capture();
  }

  /** health — 当前系统健康分数 (0–100) */
  health(): number {
    return this.capture().systemHealth;
  }

  /** history — 历次 capture() 快照列表 */
  history(limit?: number): ReadonlyArray<MonitorSnapshot> {
    return this._aggregator.getHistory(limit);
  }

  // ── 各引擎只读 getter（供高级用法）───────────────────────────────
  get heatmapEngine():     DaoHeatmapEngine      { return this._heatmap;    }
  get vectorFieldEngine(): DaoVectorField         { return this._vector;     }
  get gaugeEngine():       DaoYinYangGaugeEngine  { return this._gauge;      }
  get alertEngine():       DaoAlertEngine         { return this._alerts;     }
  get diagnosisEngine():   DaoDiagnosisEngine     { return this._diagnosis;  }
  get aggregatorEngine():  DaoSnapshotAggregator  { return this._aggregator; }
}
