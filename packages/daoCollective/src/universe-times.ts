/** DaoUniverseTimes — 道宇宙定时器管理 × 应用生命周期感知
 * 帛书依据："曲则全，枉则直，洼则盈，弊则新"（道经·二十二章）
 *           "归根曰静，是谓复命"（道经·十六章）
 *
 * 架构：DaoUniverseApps → DaoUniverseTimes
 *       独立 DaoTimer + DaoScheduler（不污染全局单例），
 *       per-app 追踪所有定时器和调度任务，
 *       clearAllForApp() 一键清理某应用全部时序资源。
 *
 *   DaoUniverse
 *      └── DaoUniverseMonitor
 *              └── DaoUniverseAgents
 *                      └── DaoUniverseApps
 *                              └── DaoUniverseTimes  ← 定时器 × 任务调度 × 时间窗口
 */

import { DaoTimer, DaoScheduler, daoTimeWindow } from '@daomind/times';
import type { DaoTimerHandle, DaoTimerOptions, DaoScheduledTask, DaoTimeWindow } from '@daomind/times';
import type { DaoUniverseApps } from './universe-apps';

/** 时序系统快照 */
export interface TimesSnapshot {
  readonly timestamp:    number;
  /** 当前活跃的 interval + timeout 句柄总数 */
  readonly totalTimers:  number;
  /** 调度器中已到期待执行任务数量 */
  readonly pendingTasks: number;
  /** 各应用的资源分布 */
  readonly byApp: Record<string, { timers: number; tasks: number }>;
}

export class DaoUniverseTimes {
  private readonly _timer:    DaoTimer;
  private readonly _scheduler: DaoScheduler;

  /** interval 句柄 → appId */
  private readonly _intervalHandles = new Map<DaoTimerHandle, string>();
  /** timeout 句柄 → appId */
  private readonly _timeoutHandles  = new Map<DaoTimerHandle, string>();
  /** taskId → appId */
  private readonly _taskOwner       = new Map<string, string>();

  constructor(private readonly _apps: DaoUniverseApps) {
    this._timer     = new DaoTimer();
    this._scheduler = new DaoScheduler();
  }

  // ── 间隔定时器 ────────────────────────────────────────────────────────────

  /**
   * setInterval — 为指定应用注册间隔定时器
   *
   * 返回 DaoTimerHandle（Symbol），通过 clearTimer(handle) 取消
   */
  setInterval(appId: string, callback: () => void, options: DaoTimerOptions): DaoTimerHandle {
    const handle = this._timer.setInterval(callback, options);
    this._intervalHandles.set(handle, appId);
    return handle;
  }

  /**
   * setTimeout — 为指定应用注册单次定时器
   *
   * 返回 DaoTimerHandle（Symbol），通过 clearTimer(handle) 取消
   */
  setTimeout(appId: string, callback: () => void, delay: number): DaoTimerHandle {
    const handle = this._timer.setTimeout(callback, delay);
    this._timeoutHandles.set(handle, appId);
    return handle;
  }

  /**
   * clearTimer — 取消间隔或单次定时器
   *
   * 自动识别类型（interval / timeout），幂等调用无副作用
   */
  clearTimer(handle: DaoTimerHandle): void {
    if (this._intervalHandles.has(handle)) {
      this._timer.clearInterval(handle);
      this._intervalHandles.delete(handle);
    } else if (this._timeoutHandles.has(handle)) {
      this._timer.clearTimeout(handle);
      this._timeoutHandles.delete(handle);
    }
    // 若已不存在，幂等忽略
  }

  /**
   * clearAllForApp — 清除指定应用的全部定时器和调度任务
   *
   * @returns 已清除的资源总数（intervals + timeouts + tasks）
   */
  clearAllForApp(appId: string): number {
    let count = 0;

    // 清除 intervals
    for (const [handle, owner] of this._intervalHandles) {
      if (owner === appId) {
        this._timer.clearInterval(handle);
        this._intervalHandles.delete(handle);
        count++;
      }
    }

    // 清除 timeouts
    for (const [handle, owner] of this._timeoutHandles) {
      if (owner === appId) {
        this._timer.clearTimeout(handle);
        this._timeoutHandles.delete(handle);
        count++;
      }
    }

    // 清除 tasks
    for (const [taskId, owner] of this._taskOwner) {
      if (owner === appId) {
        this._scheduler.cancel(taskId);
        this._taskOwner.delete(taskId);
        count++;
      }
    }

    return count;
  }

  // ── 调度任务 ──────────────────────────────────────────────────────────────

  /**
   * scheduleTask — 为指定应用调度延迟任务
   *
   * @returns taskId（字符串），通过 cancelTask(taskId) 取消
   */
  scheduleTask<T>(appId: string, task: Omit<DaoScheduledTask<T>, 'id'>): string {
    const taskId = this._scheduler.schedule(task);
    this._taskOwner.set(taskId, appId);
    return taskId;
  }

  /**
   * cancelTask — 取消调度任务
   *
   * @returns true（已取消），false（不存在）
   */
  cancelTask(taskId: string): boolean {
    const cancelled = this._scheduler.cancel(taskId);
    if (cancelled) this._taskOwner.delete(taskId);
    return cancelled;
  }

  // ── 时间窗口工具 ──────────────────────────────────────────────────────────

  /**
   * window — 创建以当前时间为起点的时间窗口
   */
  window(duration: number): DaoTimeWindow {
    return daoTimeWindow.now(duration);
  }

  /**
   * windowContains — 检查时间戳是否在窗口内
   */
  windowContains(win: DaoTimeWindow, ts: number): boolean {
    return daoTimeWindow.contains(win, ts);
  }

  /**
   * windowOverlaps — 检查两个窗口是否重叠
   */
  windowOverlaps(a: DaoTimeWindow, b: DaoTimeWindow): boolean {
    return daoTimeWindow.overlaps(a, b);
  }

  // ── 快照 ──────────────────────────────────────────────────────────────────

  /**
   * snapshot — 时序系统快照（同步）
   */
  snapshot(): TimesSnapshot {
    const byApp: Record<string, { timers: number; tasks: number }> = {};

    for (const owner of this._intervalHandles.values()) {
      if (!byApp[owner]) byApp[owner] = { timers: 0, tasks: 0 };
      byApp[owner]!.timers++;
    }
    for (const owner of this._timeoutHandles.values()) {
      if (!byApp[owner]) byApp[owner] = { timers: 0, tasks: 0 };
      byApp[owner]!.timers++;
    }
    for (const owner of this._taskOwner.values()) {
      if (!byApp[owner]) byApp[owner] = { timers: 0, tasks: 0 };
      byApp[owner]!.tasks++;
    }

    return {
      timestamp:    Date.now(),
      totalTimers:  this._intervalHandles.size + this._timeoutHandles.size,
      pendingTasks: this._scheduler.pending(),
      byApp,
    };
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get apps():      DaoUniverseApps { return this._apps;      }
  get timer():     DaoTimer        { return this._timer;     }
  get scheduler(): DaoScheduler    { return this._scheduler; }
}
