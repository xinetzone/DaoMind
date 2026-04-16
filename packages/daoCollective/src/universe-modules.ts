/** DaoUniverseModules — 道宇宙模块 IoC 容器 × Agent 生命周期广播
 * 帛书依据："为之于未有，治之于未乱"（道经·六十四章）
 *           "知常曰明，不知常，妄作凶"（道经·十六章）
 *
 * 架构：DaoUniverseApps → DaoUniverseModules
 *       独立 DaoAnythingContainer（不污染全局 daoContainer 单例），
 *       模块激活/终止后通过 apps.agents.send() 向全体 Agent 广播。
 *
 *   DaoUniverse
 *      └── DaoUniverseMonitor
 *              └── DaoUniverseAgents
 *                      └── DaoUniverseApps
 *                              └── DaoUniverseModules ← IoC 容器 × Agent 广播
 */

import { DaoAnythingContainer } from '@daomind/anything';
import type { DaoModuleRegistration, DaoModuleMeta, ModuleLifecycle } from '@daomind/anything';
import type { DaoUniverseApps } from './universe-apps';

/** 模块系统快照 */
export interface ModulesSnapshot {
  readonly timestamp:   number;
  /** 已注册模块总数 */
  readonly total:       number;
  /** active 状态模块数 */
  readonly active:      number;
  /** registered 状态模块数 */
  readonly registered:  number;
  /** terminated 状态模块数 */
  readonly terminated:  number;
  /** 各生命周期状态分布 */
  readonly byLifecycle: Partial<Record<ModuleLifecycle, number>>;
}

export class DaoUniverseModules {
  /** 独立 IoC 容器，不污染全局 daoContainer 单例 */
  private readonly _container: DaoAnythingContainer;

  constructor(private readonly _apps: DaoUniverseApps) {
    this._container = new DaoAnythingContainer();
  }

  // ── 注册 ──────────────────────────────────────────────────────────────────

  /**
   * register — 注册模块定义
   * @throws 若 name 已注册
   */
  register(module: DaoModuleRegistration): void {
    this._container.register(module);
  }

  // ── 生命周期 ──────────────────────────────────────────────────────────────

  /**
   * initialize — registered → initialized
   * @throws 若模块不存在或状态不允许
   */
  async initialize(name: string): Promise<void> {
    await this._container.initialize(name);
  }

  /**
   * activate — initialized → active
   *
   * 成功后向全体 Agent 广播 'module:activated' 消息
   * @throws 若模块不存在或状态不允许
   */
  async activate(name: string): Promise<void> {
    await this._container.activate(name);
    this._apps.agents.send('daoModules', '*', 'module:activated', { name });
  }

  /**
   * deactivate — active → suspending
   * @throws 若模块不存在或状态不允许
   */
  async deactivate(name: string): Promise<void> {
    await this._container.deactivate(name);
  }

  /**
   * terminate — 任意状态 → terminated
   *
   * 成功后向全体 Agent 广播 'module:terminated' 消息
   * @throws 若模块不存在或状态不允许
   */
  async terminate(name: string): Promise<void> {
    await this._container.terminate(name);
    this._apps.agents.send('daoModules', '*', 'module:terminated', { name });
  }

  // ── 查询 ──────────────────────────────────────────────────────────────────

  /**
   * getModule — 获取模块元数据（含当前生命周期状态）
   */
  getModule(name: string): DaoModuleMeta | undefined {
    return this._container.getModule(name);
  }

  /**
   * listModules — 列出所有已注册模块
   */
  listModules(): ReadonlyArray<DaoModuleMeta> {
    return this._container.listModules();
  }

  /**
   * listByLifecycle — 按生命周期状态过滤模块
   */
  listByLifecycle(lifecycle: ModuleLifecycle): ReadonlyArray<DaoModuleMeta> {
    return this._container.listModules().filter(m => m.lifecycle === lifecycle);
  }

  /**
   * resolve — 解析并加载已激活模块的实例（透传 DaoAnythingContainer.resolve）
   *
   * 注意：内部使用动态 import(path)，测试中只测"未激活抛出"路径
   * @throws 若模块不存在或未处于 active 状态
   */
  async resolve<T>(name: string): Promise<T> {
    return this._container.resolve<T>(name);
  }

  // ── 快照 ──────────────────────────────────────────────────────────────────

  /**
   * snapshot — 模块系统快照（同步）
   */
  snapshot(): ModulesSnapshot {
    const modules = this._container.listModules();
    const byLifecycle: Partial<Record<ModuleLifecycle, number>> = {};
    for (const m of modules) {
      byLifecycle[m.lifecycle] = (byLifecycle[m.lifecycle] ?? 0) + 1;
    }
    return {
      timestamp:  Date.now(),
      total:      modules.length,
      active:     byLifecycle['active']     ?? 0,
      registered: byLifecycle['registered'] ?? 0,
      terminated: byLifecycle['terminated'] ?? 0,
      byLifecycle,
    };
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get apps():      DaoUniverseApps      { return this._apps;      }
  get container(): DaoAnythingContainer { return this._container; }
}
