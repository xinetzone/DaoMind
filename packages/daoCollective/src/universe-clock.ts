/** DaoUniverseClock — 道宇宙时序心跳
 * 帛书依据："逝曰远，远曰反"（乙本·二十五章）— 运动归于循环，时间循环驱动系统自省
 *
 * 架构：DaoChronos.sync() → _doTick() → DaoUniverseMonitor.capture() → callbacks
 *
 *   DaoUniverse
 *      └── DaoUniverseMonitor   ← 状态快照
 *              └── DaoUniverseClock  ← 定时心跳（daoChronos 驱动）
 */

import { DaoChronos } from '@daomind/chronos';
import type { DaoChronosPoint } from '@daomind/chronos';
import type { MonitorSnapshot } from '@daomind/monitor';
import type { DaoUniverseMonitor } from './universe-monitor';

export type ClockTickCallback = (snap: MonitorSnapshot, point: DaoChronosPoint) => void;

export class DaoUniverseClock {
  private readonly _chronos: DaoChronos;
  private _unsync?: () => void;
  private _ticks = 0;
  private _lastTick?: DaoChronosPoint;
  private readonly _callbacks = new Set<ClockTickCallback>();

  constructor(
    private readonly _monitor: DaoUniverseMonitor,
    intervalMs = 1000,
  ) {
    this._chronos = new DaoChronos({ source: 'system', tickInterval: intervalMs });
  }

  /**
   * start — 启动定时心跳（幂等）
   * 内部调用 DaoChronos.sync()，每隔 intervalMs 触发一次 _doTick()
   */
  start(): void {
    if (this._unsync) return;
    this._unsync = this._chronos.sync((point) => {
      this._doTick(point);
    });
  }

  /**
   * stop — 停止定时心跳（幂等）
   */
  stop(): void {
    if (!this._unsync) return;
    this._unsync();
    this._unsync = undefined;
  }

  /**
   * tick — 手动触发一次心跳（不依赖定时器，测试友好）
   * @returns 当次 MonitorSnapshot
   */
  tick(): MonitorSnapshot {
    const point = this._chronos.now();
    return this._doTick(point);
  }

  /**
   * onTick — 订阅 tick 事件
   * @returns 取消订阅函数
   */
  onTick(callback: ClockTickCallback): () => void {
    this._callbacks.add(callback);
    return () => {
      this._callbacks.delete(callback);
    };
  }

  /**
   * elapsed — 距离最后一次 tick 的毫秒数
   * @returns 若未 tick 过则返回 undefined
   */
  elapsed(): number | undefined {
    if (!this._lastTick) return undefined;
    return this._chronos.elapsed(this._lastTick);
  }

  /** ticks — 累计 tick 次数 */
  get ticks(): number { return this._ticks; }

  /** isRunning — 定时心跳是否正在运行 */
  get isRunning(): boolean { return !!this._unsync; }

  /** lastTick — 最后一次 tick 的 DaoChronosPoint */
  get lastTick(): DaoChronosPoint | undefined { return this._lastTick; }

  /** chronos — 底层 DaoChronos 实例 */
  get chronos(): DaoChronos { return this._chronos; }

  /** monitor — 关联的 DaoUniverseMonitor */
  get monitor(): DaoUniverseMonitor { return this._monitor; }

  // ── 私有 ──────────────────────────────────────────────────────────────────

  private _doTick(point: DaoChronosPoint): MonitorSnapshot {
    const snap = this._monitor.capture();
    this._ticks++;
    this._lastTick = point;
    for (const cb of this._callbacks) {
      cb(snap, point);
    }
    return snap;
  }
}
