# v2.17.0 开发计划 — DaoUniversePages

## 当前状态

- 654 tests / 41 suites（全绿）
- 已完成 v2.16.0 DaoUniverseSpaces
- 剩余最后一个待集成包：`@daomind/pages`（DaoComponentTree + DaoStateBinding）

---

## 目标

**v2.17.0 — `daoPages × DaoUniverseScheduler → DaoUniversePages`**

帛书依据："致虚极，守静笃；万物并作，吾以观复"（道经·十六章）

组件树 × 状态绑定 × 时序驱动刷新：组件在调度器心跳下保持与数据的动态一致。

---

## 执行步骤

### Step 1：写 v2.16.0 复盘
- 文件：`retrospectives/2026-04-16-daomind-v2.16.0.md`
- 内容：设计决策 / DaoNamespaceManager 适配 / DaoRouteRule weight 字段 / 测试策略 / 指标

### Step 2：实现 DaoUniversePages

**文件**：`packages/daoCollective/src/universe-pages.ts`

```typescript
import { DaoComponentTree, DaoStateBinding } from '@daomind/pages';
import type { DaoComponent, DaoViewSnapshot, BindingPath } from '@daomind/pages';
import type { DaoUniverseScheduler } from './universe-scheduler';

export interface PagesSnapshot {
  readonly timestamp:       number;
  readonly totalMounted:    number;
  readonly totalBindings:   number;
  readonly pendingRefreshes: number;
  readonly viewVersion:     number | null;
}

export class DaoUniversePages {
  private readonly _tree:    DaoComponentTree;
  private readonly _binding: DaoStateBinding;
  // componentId → taskId（待执行的刷新任务）
  private readonly _refreshTasks = new Map<string, string>();

  constructor(private readonly _scheduler: DaoUniverseScheduler) {
    this._tree    = new DaoComponentTree();
    this._binding = new DaoStateBinding();
    // 绑定 updater：状态变更 → tree.update()
    this._binding.setUpdater((componentId, property, value) => {
      this._tree.update(componentId, { [property]: value });
    });
  }

  // ── 组件生命周期 ──
  mount(component: Omit<DaoComponent, 'state'>): string { ... }
  unmount(id: string): boolean { ... }
  update(id: string, props: Record<string, unknown>): boolean { ... }
  getComponent(id: string): DaoComponent | undefined { ... }

  // ── 状态绑定 ──
  bind(path: BindingPath, componentId: string, property: string,
       transform?: (v: unknown) => unknown): void { ... }
  unbind(path: BindingPath, componentId: string): boolean { ... }
  notify(path: BindingPath, value: unknown): void { ... }

  // ── 时序驱动刷新 ──
  scheduleRefresh(
    componentId: string,
    delayMs: number,
    propsFactory: () => Record<string, unknown>,
  ): string {
    // 取消旧任务（若存在）
    const oldTaskId = this._refreshTasks.get(componentId);
    if (oldTaskId) this._scheduler.cancel(oldTaskId);
    const taskId = this._scheduler.schedule(() => {
      this._tree.update(componentId, propsFactory());
      this._refreshTasks.delete(componentId);   // 执行后自动清除
    }, delayMs);
    this._refreshTasks.set(componentId, taskId);
    return taskId;
  }

  cancelRefresh(componentId: string): boolean {
    const taskId = this._refreshTasks.get(componentId);
    if (!taskId) return false;
    this._scheduler.cancel(taskId);
    this._refreshTasks.delete(componentId);
    return true;
  }

  // ── 视图快照 & 综合快照 ──
  viewSnapshot(): DaoViewSnapshot | null { return this._tree.getSnapshot(); }

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

  // ── Getters ──
  get scheduler(): DaoUniverseScheduler { return this._scheduler; }
  get tree():      DaoComponentTree      { return this._tree;      }
  get binding():   DaoStateBinding       { return this._binding;   }
}
```

### Step 3：基础设施更新

| 文件 | 变更 |
|------|------|
| `packages/daoCollective/package.json` | `@daomind/pages: workspace:^` |
| `packages/daoCollective/tsconfig.json` | `../daoPages` 引用 |
| `packages/daoCollective/src/index.ts` | DaoUniversePages + PagesSnapshot + @daomind/pages 再导出 |

**注意**：`@daomind/pages` 再导出：
```typescript
export type { ComponentState, DaoComponent, DaoViewSnapshot, BindingPath, DaoBinding } from '@daomind/pages';
export { daoComponentTree, DaoComponentTree, daoStateBinding, DaoStateBinding } from '@daomind/pages';
export type { PagesSnapshot } from './universe-pages';
export { DaoUniversePages } from './universe-pages';
```

### Step 4：测试文件（~34 tests）

**文件**：`packages/daoCollective/src/__tests__/universe-pages.test.ts`

```typescript
// makeStack: universe → monitor → clock → scheduler → pages
function makeStack() {
  const universe  = new DaoUniverse();
  const monitor   = new DaoUniverseMonitor(universe);
  const clock     = new DaoUniverseClock(monitor);
  const scheduler = new DaoUniverseScheduler(clock);
  const pages     = new DaoUniversePages(scheduler);
  return { universe, monitor, clock, scheduler, pages };
}
```

**测试分组**：
1. **构建**（4）：pages 已创建 / scheduler getter / tree getter / binding getter
2. **mount/unmount**（4）：mount → getComponent / version 增长 / unmount → undefined / 重复 mount 抛出
3. **update**（3）：更新 props / unmounted 组件 update 返回 false / 不存在 ID 返回 false
4. **bind/unbind/notify**（5）：bind → getBindings() / notify → tree.update（通过 binding updater）/ unbind 返回 true / 不存在 unbind 返回 false / transform 函数
5. **scheduleRefresh/cancelRefresh**（5）：注册 task / flush → props 更新 / cancelRefresh 取消 / 旧 task 自动取消 / pendingRefreshes 计数
6. **viewSnapshot**（3）：初始为 null / mount 后有 snapshot / update 后 version 增长
7. **snapshot()**（5）：totalMounted / totalBindings / pendingRefreshes / viewVersion / 全为0时
8. **E2E**（5）：完整 Universe→Scheduler→Pages / 导入测试 / notify→组件prop更新 / scheduler.flush → refresh 执行 / traverse 计数

总计：~34 tests → 654 + 34 = **688 tests**

### Step 5：全量验证

```bash
pnpm install && pnpm -r run build
npx jest --no-coverage  # 目标：688 tests，42 suites，0 FAIL
```

### Step 6：更新 homepage

`src/App.tsx`：
- 版本徽章：v2.16.0 → **v2.17.0**
- 测试数：654 → **688**
- footer 版本：v2.16.0 → **v2.17.0**

### Step 7：Git commit + tag + push

```bash
git add -A
git commit -m "feat(pages): v2.17.0 — DaoUniversePages..."
git tag -a v2.17.0 -m "release: v2.17.0 — DaoUniversePages"
git push github main:main && git push github v2.17.0
git push origin main && git push origin v2.17.0
```

### Step 8：task-execution-summary（技能触发）

使用 `task-execution-summary-skill` 生成本次 DaoMind v2.8.0→v2.17.0 完整开发会话总结报告，
保存到 `retrospectives/2026-04-16-daomind-session-summary.md`

---

## 最终架构（v2.17.0 完成后）

```
DaoUniverse
  ├── DaoUniverseMonitor (v2.8.0)
  │       ├── DaoUniverseClock (v2.9.0)
  │       │       ├── DaoUniverseFeedback (v2.10.0)
  │       │       └── DaoUniverseScheduler (v2.12.0)
  │       │               ├── DaoUniverseSkills (v2.13.0)
  │       │               └── DaoUniversePages  (v2.17.0) ← 新
  │       └── DaoUniverseNexus (v2.14.0)
  │               └── DaoUniverseSpaces (v2.16.0)
  └── DaoUniverseAudit (v2.11.0)
          └── DaoUniverseDocs (v2.15.0)
```

所有 `@daomind/*` 包（daoPages 包含）完成集成，daoCollective 达到最终形态。

---

## 关键注意事项

1. **DaoComponentTree.mount()** 签名：`Omit<DaoComponent, 'state'>` — `state` 自动设为 `'mounted'`
2. **DaoStateBinding.setUpdater()** 必须在构造时调用，使 notify → tree.update 自动生效
3. **scheduleRefresh()** 任务执行后需从 `_refreshTasks` 删除（避免 cancelRefresh 误报 true）
4. **snapshot().totalMounted** 用 `traverse()` 计数（DaoComponentTree 无 size API）
5. **测试中** 调用 `scheduler.flush()` 触发 scheduleRefresh 任务执行
</content>
</invoke>