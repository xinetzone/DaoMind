/** DaoUniverseFeedback — 道宇宙闭环自调节
 * 帛书依据："反也者，道之动也"（乙本·四十章）
 *           "大曰逝，逝曰远，远曰反"（乙本·二十五章）
 *
 * 架构：DaoUniverseClock.onTick() → health score → FeedbackRegulator S型曲线 → RegulationResult
 *
 *   DaoUniverse
 *      └── DaoUniverseMonitor
 *              └── DaoUniverseClock
 *                      └── DaoUniverseFeedback  ← 闭环反馈（daoFeedback 驱动）
 */

import { DaoFeedbackRegulator } from '@daomind/feedback';
import type { FeedbackRegulatorConfig, RegulationResult } from '@daomind/feedback';
import type { MonitorSnapshot } from '@daomind/monitor';
import type { DaoChronosPoint } from '@daomind/chronos';
import type { DaoUniverseClock } from './universe-clock';

const MAX_HISTORY = 200;

/** 单次调节记录 */
export interface FeedbackEntry {
  readonly timestamp: number;
  readonly health: number;
  readonly result: RegulationResult;
}

export class DaoUniverseFeedback {
  private readonly _regulator: DaoFeedbackRegulator;
  private readonly _history: FeedbackEntry[] = [];
  private _unsubscribe?: () => void;
  private _lastResult?: RegulationResult;

  constructor(
    private readonly _clock: DaoUniverseClock,
    config?: Partial<FeedbackRegulatorConfig>,
    private readonly _windowMs = 60_000,
  ) {
    this._regulator = new DaoFeedbackRegulator(config);
  }

  /**
   * attach — 订阅 Clock.onTick()，每次心跳自动将健康分数转换为 regulate()（幂等）
   */
  attach(): void {
    if (this._unsubscribe) return;
    this._unsubscribe = this._clock.onTick((snap: MonitorSnapshot, _point: DaoChronosPoint) => {
      this.regulate(snap.systemHealth);
    });
  }

  /**
   * detach — 取消订阅（幂等）
   */
  detach(): void {
    if (!this._unsubscribe) return;
    this._unsubscribe();
    this._unsubscribe = undefined;
  }

  /**
   * regulate — 手动传入健康分数，执行 S 型曲线调节并记录结果
   * @param health 0–100（100 = 完美，0 = 系统崩溃）
   * @returns RegulationResult
   */
  regulate(health: number): RegulationResult {
    // 健康分数越低 → 信号强度越高 → 需要更多调节
    const signalStrength = Math.max(0, 100 - health);
    const result = this._regulator.regulate(signalStrength, this._windowMs);
    // 按恢复速率衰减当前累积强度，为下一窗口做准备
    this._regulator.tick();
    this._lastResult = result;
    this._history.push({ timestamp: Date.now(), health, result });
    if (this._history.length > MAX_HISTORY) this._history.shift();
    return result;
  }

  /**
   * tick — 以 Clock → Monitor 最新快照的健康分数手动触发一次 regulate()
   * @returns RegulationResult，若 monitor 尚无历史快照则返回 null
   */
  tick(): RegulationResult | null {
    const snaps = this._clock.monitor.history();
    if (snaps.length === 0) return null;
    const latest = snaps[snaps.length - 1];
    return latest ? this.regulate(latest.systemHealth) : null;
  }

  /**
   * history — 历史调节记录
   * @param limit 最多返回最近 N 条，默认全部
   */
  history(limit?: number): ReadonlyArray<FeedbackEntry> {
    if (!limit) return [...this._history];
    return this._history.slice(-limit);
  }

  /** lastResult — 最近一次调节结果 */
  get lastResult(): RegulationResult | undefined { return this._lastResult; }

  /** isAttached — 是否已订阅 Clock */
  get isAttached(): boolean { return !!this._unsubscribe; }

  /** regulator — 底层 DaoFeedbackRegulator 实例 */
  get regulator(): DaoFeedbackRegulator { return this._regulator; }

  /** clock — 关联的 DaoUniverseClock */
  get clock(): DaoUniverseClock { return this._clock; }
}
