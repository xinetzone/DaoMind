/** DaoUniverseApps — 道宇宙应用状态机 × Agent 生命周期广播
 * 帛书依据："为之于未有，治之于未乱"（道经·六十四章）
 *           "图难于其易，为大于其细"（道经·六十三章）
 *
 * 架构：DaoUniverseAgents → DaoUniverseApps
 *       独立 DaoAppContainer + DaoLifecycleManager，
 *       应用状态变更自动通过 agents.send() 向全体 Agent 广播，
 *       实现"应用起停"与"Agent 感知"的解耦闭环。
 *
 *   DaoUniverse
 *      └── DaoUniverseMonitor
 *              └── DaoUniverseAgents
 *                      └── DaoUniverseApps  ← app 状态机 × agent 广播
 */

import { DaoAppContainer, DaoLifecycleManager } from '@daomind/apps';
import type { AppState, DaoAppDefinition, DaoAppInstance } from '@daomind/apps';
import type { DaoUniverseAgents } from './universe-agents';

/** 应用系统快照 */
export interface AppsSnapshot {
  readonly timestamp:  number;
  /** 已注册应用总数 */
  readonly total:      number;
  /** 处于 running 状态的应用数量 */
  readonly running:    number;
  /** 处于 registered 状态的应用数量 */
  readonly registered: number;
  /** 处于 stopped 状态的应用数量 */
  readonly stopped:    number;
  /** 各状态分布 */
  readonly byState:    Partial<Record<AppState, number>>;
}

export class DaoUniverseApps {
  /** 独立应用容器，不污染全局 daoAppContainer 单例 */
  private readonly _container: DaoAppContainer;
  /** 独立生命周期管理器，不污染全局 daoLifecycleManager 单例 */
  private readonly _lifecycle: DaoLifecycleManager;

  constructor(private readonly _agents: DaoUniverseAgents) {
    this._container = new DaoAppContainer();
    this._lifecycle = new DaoLifecycleManager();
  }

  // ── 注册/卸载 ─────────────────────────────────────────────────────────────

  /**
   * register — 注册应用定义
   * @throws 若 id 已注册
   */
  register(definition: DaoAppDefinition): void {
    this._container.register(definition);
  }

  /**
   * unregister — 卸载应用（运行中或启动中时抛出）
   * @returns true（已卸载），false（不存在）
   */
  unregister(id: string): boolean {
    return this._container.unregister(id);
  }

  // ── 生命周期 ──────────────────────────────────────────────────────────────

  /**
   * start — 启动应用（registered/stopped/error → running）
   *
   * 成功后向全体 Agent 广播 'app:started' 消息
   * @throws 若依赖未就绪或状态不允许
   */
  async start(id: string): Promise<void> {
    const before = this._container.get(id);
    if (!before) throw new Error(`[daoApps] 应用未注册: ${id}`);
    const fromState = before.state;
    await this._container.start(id);
    this._lifecycle.emit(id, fromState, 'running');
    // 广播给全体 Agent（via agents.send）
    this._agents.send('daoApps', '*', 'app:started', { id });
  }

  /**
   * stop — 停止应用（running → stopped）
   *
   * 成功后向全体 Agent 广播 'app:stopped' 消息
   * @throws 若应用未处于 running 状态
   */
  async stop(id: string): Promise<void> {
    const before = this._container.get(id);
    if (!before) throw new Error(`[daoApps] 应用未注册: ${id}`);
    const fromState = before.state;
    await this._container.stop(id);
    this._lifecycle.emit(id, fromState, 'stopped');
    this._agents.send('daoApps', '*', 'app:stopped', { id });
  }

  /**
   * restart — 重启应用（stop → start）
   */
  async restart(id: string): Promise<void> {
    await this._container.restart(id);
    // restart 内部会 stop → start，但我们需要通过 lifecycle 记录
    // _container.restart 已处理状态机，这里补发生命周期事件
    this._lifecycle.emit(id, 'stopped', 'running');
    this._agents.send('daoApps', '*', 'app:restarted', { id });
  }

  // ── 查询 ──────────────────────────────────────────────────────────────────

  /**
   * getApp — 获取应用实例（含当前状态）
   */
  getApp(id: string): DaoAppInstance | undefined {
    return this._container.get(id);
  }

  /**
   * listAll — 列出所有已注册应用
   */
  listAll(): ReadonlyArray<DaoAppInstance> {
    return this._container.listAll();
  }

  /**
   * listByState — 按状态过滤应用
   */
  listByState(state: AppState): ReadonlyArray<DaoAppInstance> {
    return this._container.listByState(state);
  }

  // ── 生命周期钩子 ──────────────────────────────────────────────────────────

  /**
   * onStateChange — 注册应用状态变更监听器
   *
   * @returns 解绑函数（调用即取消订阅）
   */
  onStateChange(
    appId:    string,
    callback: (from: AppState, to: AppState) => void,
  ): () => void {
    return this._lifecycle.onStateChange(appId, callback);
  }

  /**
   * getHistory — 获取应用状态转换历史
   */
  getHistory(
    appId:   string,
    limit?:  number,
  ): ReadonlyArray<{ from: AppState; to: AppState; timestamp: number }> {
    return this._lifecycle.getHistory(appId, limit) as ReadonlyArray<{
      from: AppState;
      to: AppState;
      timestamp: number;
    }>;
  }

  // ── 快照 ──────────────────────────────────────────────────────────────────

  /**
   * snapshot — 应用系统快照（同步）
   */
  snapshot(): AppsSnapshot {
    const apps = this._container.listAll();
    const byState: Partial<Record<AppState, number>> = {};
    for (const app of apps) {
      byState[app.state] = (byState[app.state] ?? 0) + 1;
    }
    return {
      timestamp:  Date.now(),
      total:      apps.length,
      running:    byState['running']    ?? 0,
      registered: byState['registered'] ?? 0,
      stopped:    byState['stopped']    ?? 0,
      byState,
    };
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get agents():    DaoUniverseAgents { return this._agents;    }
  get container(): DaoAppContainer   { return this._container; }
  get lifecycle(): DaoLifecycleManager { return this._lifecycle; }
}
