/** DaoUniversePages — 道宇宙页面组件树 × 时序驱动刷新
 * 帛书依据："致虚极，守静笃；万物并作，吾以观复"（道经·十六章）
 *           "圣人处无为之事，行不言之教"（道经·二章）
 *
 * 架构：DaoUniverseScheduler → DaoUniversePages
 *       组件树 × 状态绑定 × 调度器驱动的时序刷新，
 *       实现"守静"中的组件状态与"万物并作"的调度心跳的动态一致。
 *
 *   DaoUniverse
 *      └── DaoUniverseMonitor
 *              └── DaoUniverseClock
 *                      └── DaoUniverseScheduler
 *                              └── DaoUniversePages  ← 组件树 × 状态绑定 × 时序刷新
 */

import { DaoComponentTree, DaoStateBinding } from '@daomind/pages';
import type { DaoComponent, DaoViewSnapshot, BindingPath } from '@daomind/pages';
import type { DaoUniverseScheduler } from './universe-scheduler';

/** 页面系统综合快照 */
export interface PagesSnapshot {
  readonly timestamp:        number;
  /** 当前已挂载组件总数（含嵌套子组件） */
  readonly totalMounted:     number;
  /** 已注册状态绑定数量 */
  readonly totalBindings:    number;
  /** 当前待执行的刷新任务数量 */
  readonly pendingRefreshes: number;
  /** 组件树版本号（null = 尚未挂载任何组件） */
  readonly viewVersion:      number | null;
}

export class DaoUniversePages {
  /** 独立组件树，不污染全局 daoComponentTree 单例 */
  private readonly _tree:    DaoComponentTree;
  /** 独立状态绑定，不污染全局 daoStateBinding 单例 */
  private readonly _binding: DaoStateBinding;
  /** componentId → 待执行的刷新 taskId */
  private readonly _refreshTasks = new Map<string, string>();

  constructor(private readonly _scheduler: DaoUniverseScheduler) {
    this._tree    = new DaoComponentTree();
    this._binding = new DaoStateBinding();
    // 绑定 updater：状态路径变更 → 触发对应组件 prop 更新
    this._binding.setUpdater((componentId, property, value) => {
      this._tree.update(componentId, { [property]: value });
    });
  }

  // ── 组件生命周期 ──────────────────────────────────────────────────────────

  /**
   * mount — 挂载组件到组件树
   *
   * 第一个 mount 的组件自动成为 root
   * @throws 若 componentId 已挂载
   * @returns 组件 id
   */
  mount(component: Omit<DaoComponent, 'state'>): string {
    return this._tree.mount(component);
  }

  /**
   * unmount — 卸载组件（含子组件），同步取消该组件的待刷新任务
   * @returns true（成功卸载），false（不存在或已卸载）
   */
  unmount(id: string): boolean {
    const result = this._tree.unmount(id);
    if (result) {
      // 卸载时同步取消该组件的刷新任务
      const taskId = this._refreshTasks.get(id);
      if (taskId) {
        this._scheduler.cancel(taskId);
        this._refreshTasks.delete(id);
      }
    }
    return result;
  }

  /**
   * update — 手动更新组件 props
   * @returns true（已更新），false（组件不存在或未处于 mounted 状态）
   */
  update(id: string, props: Record<string, unknown>): boolean {
    return this._tree.update(id, props);
  }

  /**
   * getComponent — 获取当前组件信息
   */
  getComponent(id: string): DaoComponent | undefined {
    return this._tree.get(id);
  }

  // ── 状态绑定 ──────────────────────────────────────────────────────────────

  /**
   * bind — 将状态路径绑定到组件属性
   *
   * 当 notify(path, value) 被调用时，自动更新绑定组件的对应 prop
   */
  bind(
    path:        BindingPath,
    componentId: string,
    property:    string,
    transform?:  (value: unknown) => unknown,
  ): void {
    this._binding.bind(path, componentId, property, transform);
  }

  /**
   * unbind — 解除状态路径对某组件的所有绑定
   * @returns true（已解绑），false（不存在该绑定）
   */
  unbind(path: BindingPath, componentId: string): boolean {
    return this._binding.unbind(path, componentId);
  }

  /**
   * notify — 通知状态路径值变更
   *
   * 触发与该路径匹配的所有绑定 → binding updater → tree.update()
   */
  notify(path: BindingPath, value: unknown): void {
    this._binding.notify(path, value);
  }

  // ── 时序驱动刷新 ──────────────────────────────────────────────────────────

  /**
   * scheduleRefresh — 注册一个延迟执行的组件 props 刷新任务
   *
   * - 若该组件已有待刷新任务，旧任务先被取消
   * - 任务执行后自动从 _refreshTasks 中移除（一次性任务）
   * - 调用 scheduler.flush() 可立即触发到期任务
   *
   * @param componentId  目标组件 ID
   * @param delayMs      延迟执行毫秒数（0 = 立即到期）
   * @param propsFactory 返回新 props 的工厂函数
   * @returns 调度器任务 ID
   */
  scheduleRefresh(
    componentId:  string,
    delayMs:      number,
    propsFactory: () => Record<string, unknown>,
  ): string {
    // 取消旧任务（若存在）
    const oldTaskId = this._refreshTasks.get(componentId);
    if (oldTaskId) this._scheduler.cancel(oldTaskId);

    const taskId = this._scheduler.schedule(() => {
      this._tree.update(componentId, propsFactory());
      this._refreshTasks.delete(componentId);   // 执行后自动清除注册记录
    }, delayMs);

    this._refreshTasks.set(componentId, taskId);
    return taskId;
  }

  /**
   * cancelRefresh — 取消该组件的待刷新任务
   * @returns true（任务存在且已取消），false（无待刷新任务）
   */
  cancelRefresh(componentId: string): boolean {
    const taskId = this._refreshTasks.get(componentId);
    if (!taskId) return false;
    this._scheduler.cancel(taskId);
    this._refreshTasks.delete(componentId);
    return true;
  }

  // ── 视图快照 & 综合快照 ───────────────────────────────────────────────────

  /**
   * viewSnapshot — 最新组件树视图快照
   * @returns null 若尚未挂载任何组件
   */
  viewSnapshot(): DaoViewSnapshot | null {
    return this._tree.getSnapshot();
  }

  /**
   * snapshot — 页面系统综合快照（同步）
   */
  snapshot(): PagesSnapshot {
    let totalMounted = 0;
    this._tree.traverse(() => { totalMounted++; });

    return {
      timestamp:        Date.now(),
      totalMounted,
      totalBindings:    this._binding.getBindings().length,
      pendingRefreshes: this._refreshTasks.size,
      viewVersion:      this._tree.getSnapshot()?.version ?? null,
    };
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get scheduler(): DaoUniverseScheduler { return this._scheduler; }
  get tree():      DaoComponentTree      { return this._tree;      }
  get binding():   DaoStateBinding       { return this._binding;   }
}
