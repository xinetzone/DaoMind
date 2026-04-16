/** DaoUniverseScheduler — 道宇宙时序驱动调度
 * 帛书依据："待时而动"（系辞传）
 *           "为学日益，为道日损，损之又损，以至於無爲"（乙本·四十八章）
 *
 * 架构：DaoUniverseClock.onTick() → flush() → DaoScheduler.next() × N → ExecutionRecord
 *
 *   DaoUniverse
 *      └── DaoUniverseMonitor
 *              └── DaoUniverseClock
 *                      └── DaoUniverseScheduler  ← 时序驱动任务调度（daotimes 驱动）
 */

import { DaoScheduler } from '@daomind/times';
import type { DaoUniverseClock } from './universe-clock';

const MAX_EXECUTIONS = 200;

/** 单次任务执行记录 */
export interface ExecutionRecord {
  readonly taskId: string;
  readonly executedAt: number;
  readonly status: 'success' | 'error';
}

export class DaoUniverseScheduler {
  private readonly _scheduler: DaoScheduler;
  private _unsubscribe?: () => void;
  private readonly _executions: ExecutionRecord[] = [];

  constructor(private readonly _clock: DaoUniverseClock) {
    this._scheduler = new DaoScheduler();
  }

  /**
   * attach — 订阅 Clock.onTick()，每次心跳自动 flush() 执行到期任务（幂等）
   */
  attach(): void {
    if (this._unsubscribe) return;
    this._unsubscribe = this._clock.onTick(() => {
      void this.flush();
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
   * schedule — 注册任务
   * @param handler 任务处理函数
   * @param delayMs 延迟毫秒数（默认 0 = 立即到期）
   * @param priority 优先级（越大越先执行，默认 1）
   * @returns taskId
   */
  schedule<T>(handler: () => T | Promise<T>, delayMs = 0, priority = 1): string {
    // 用闭包捕获 id：handler 被调用时 capturedId 已赋值
    let capturedId = '';
    const wrapped = async (): Promise<T> => {
      try {
        const result = await Promise.resolve(handler());
        this._pushExecution({ taskId: capturedId, executedAt: Date.now(), status: 'success' });
        return result;
      } catch (err) {
        this._pushExecution({ taskId: capturedId, executedAt: Date.now(), status: 'error' });
        throw err;
      }
    };
    capturedId = this._scheduler.schedule({
      executeAt: Date.now() + delayMs,
      handler:   wrapped,
      priority,
    });
    return capturedId;
  }

  /**
   * cancel — 取消尚未执行的任务
   * @returns true 若任务存在且已取消
   */
  cancel(taskId: string): boolean {
    return this._scheduler.cancel(taskId);
  }

  /**
   * flush — 执行所有当前到期的任务
   * DaoScheduler.pending() > 0 时 next() 立即返回（不等待），可安全循环
   * @returns 本次执行的任务数量
   */
  async flush(): Promise<number> {
    let count = 0;
    while (this._scheduler.pending() > 0) {
      try {
        await this._scheduler.next();
      } catch {
        // 错误已在 wrapped handler 中记录到 executions，此处静默处理
      }
      count++;
    }
    return count;
  }

  /**
   * pending — 当前到期（executeAt ≤ now）待执行的任务数
   */
  pending(): number {
    return this._scheduler.pending();
  }

  /**
   * executions — 历史执行记录
   * @param limit 最多返回最近 N 条，默认全部
   */
  executions(limit?: number): ReadonlyArray<ExecutionRecord> {
    if (!limit) return [...this._executions];
    return this._executions.slice(-limit);
  }

  /** isAttached — 是否已订阅 Clock */
  get isAttached(): boolean { return !!this._unsubscribe; }

  /** clock — 关联的 DaoUniverseClock */
  get clock(): DaoUniverseClock { return this._clock; }

  /** scheduler — 底层 DaoScheduler 实例 */
  get scheduler(): DaoScheduler { return this._scheduler; }

  private _pushExecution(record: ExecutionRecord): void {
    this._executions.push(record);
    if (this._executions.length > MAX_EXECUTIONS) this._executions.shift();
  }
}
