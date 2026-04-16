# DaoMind 开发计划 — v2.20.0 + v2.21.0

## Context

v2.19.0（DaoUniverseApps）已完成，756 tests / 44 suites 全绿，双远端已推送。

本轮目标：继续向 `@daomind/collective` 集成剩余包。

已集成但无 DaoUniverse* bridge 的包：
- `@daomind/times` — DaoTimer / DaoScheduler / daoTimeWindow（已在 index.ts 再导出）
- `@daomind/anything` — DaoAnythingContainer（已在 index.ts 再导出）

本轮扩展两个新 bridge 类（紧接 DaoUniverseApps 分叉）：
```
DaoUniverseApps (v2.19.0)
  ├── DaoUniverseTimes   (v2.20.0) ← @daomind/times × DaoUniverseApps
  └── DaoUniverseModules (v2.21.0) ← @daomind/anything × DaoUniverseApps
```

---

## 已知约束

| 约束 | 说明 |
|------|------|
| DaoTimer | 独立实例（`new DaoTimer()`），不污染全局 `daoTimer` 单例 |
| DaoScheduler | 独立实例（`new DaoScheduler()`），不污染全局 `daoScheduler` 单例 |
| DaoScheduler.next() | 异步等待最近任务，测试中只用 `pending()` 验证任务数量 |
| DaoAnythingContainer | 独立实例（`new DaoAnythingContainer()`），不污染全局 `daoContainer` 单例 |
| DaoAnythingContainer.resolve() | 内部 `import(path)` 文件系统，测试中只测"未激活抛出"路径 |
| beforeEach | 始终调用 `daoNothingVoid.void()` 重置全局状态 |

---

## v2.20.0 — DaoUniverseTimes

**帛书依据**："曲则全，枉则直，洼则盈，弊则新"（道经·二十二章）
**文件**：`packages/daoCollective/src/universe-times.ts`

### 接口

```typescript
export interface TimesSnapshot {
  readonly timestamp:    number;
  readonly totalTimers:  number;          // _intervalHandles.size + _timeoutHandles.size
  readonly pendingTasks: number;          // _scheduler.pending()
  readonly byApp:        Record<string, { timers: number; tasks: number }>;
}

export class DaoUniverseTimes {
  private readonly _timer:    DaoTimer;
  private readonly _scheduler: DaoScheduler;
  // per-app 追踪（用于 clearAllForApp）
  private readonly _appIntervals = new Map<string, Set<DaoTimerHandle>>();
  private readonly _appTimeouts  = new Map<string, Set<DaoTimerHandle>>();
  private readonly _appTasks     = new Map<string, Set<string>>();
  // 全量句柄集（区分类型，用于 clearTimer）
  private readonly _intervalHandles = new Map<DaoTimerHandle, string>(); // handle→appId
  private readonly _timeoutHandles  = new Map<DaoTimerHandle, string>(); // handle→appId

  constructor(private readonly _apps: DaoUniverseApps)

  // ── 间隔定时器 ──────────────────────────────────
  setInterval(appId: string, cb: () => void, options: DaoTimerOptions): DaoTimerHandle
  // ── 单次定时器 ──────────────────────────────────
  setTimeout(appId: string, cb: () => void, delay: number): DaoTimerHandle
  // ── 取消定时器（interval / timeout 均可）────────
  clearTimer(handle: DaoTimerHandle): void
  // ── 清除某应用全部定时器+任务 ──────────────────
  clearAllForApp(appId: string): number  // 返回已清除数量
  // ── 任务调度 ─────────────────────────────────────
  scheduleTask<T>(appId: string, task: Omit<DaoScheduledTask<T>, 'id'>): string
  cancelTask(taskId: string): boolean
  // ── 时间窗口工具 ─────────────────────────────────
  window(duration: number): DaoTimeWindow  // daoTimeWindow.now(duration)
  windowContains(win: DaoTimeWindow, ts: number): boolean
  windowOverlaps(a: DaoTimeWindow, b: DaoTimeWindow): boolean
  // ── 快照 ─────────────────────────────────────────
  snapshot(): TimesSnapshot

  // ── Getters ──────────────────────────────────────
  get apps(): DaoUniverseApps
  get timer(): DaoTimer
  get scheduler(): DaoScheduler
}
```

### 实现细节

- `setInterval(appId, cb, options)` → `_timer.setInterval(cb, options)` 返回 handle，
  存入 `_appIntervals.get(appId)` Set + `_intervalHandles.set(handle, appId)`
- `setTimeout(appId, cb, delay)` → `_timer.setTimeout(cb, delay)` 返回 handle，
  存入 `_appTimeouts.get(appId)` Set + `_timeoutHandles.set(handle, appId)`
- `clearTimer(handle)` → 检查 `_intervalHandles` 或 `_timeoutHandles` 确定类型，
  调用对应 clear 方法，从 Map + appId Set 中删除
- `clearAllForApp(appId)` → 清除该 appId 下所有 intervals + timeouts + tasks，
  返回清除总数
- `scheduleTask(appId, task)` → `_scheduler.schedule(task)` 返回 taskId，
  存入 `_appTasks.get(appId)` Set
- `cancelTask(taskId)` → `_scheduler.cancel(taskId)`，同时从 `_appTasks` 各 Set 移除
- `snapshot()` → 遍历 `_appIntervals` + `_appTimeouts` + `_appTasks` 构建 `byApp`

### 测试（universe-times.test.ts）— 目标 ~30 个

```
构建（4）
  ✓ 可构建 DaoUniverseTimes
  ✓ apps/timer/scheduler getter 正确
  ✓ 初始 snapshot 全零
  ✓ apps getter 为传入的 DaoUniverseApps 实例

setInterval（5）
  ✓ 返回 DaoTimerHandle（Symbol）
  ✓ snapshot.totalTimers 递增
  ✓ byApp 记录 appId 对应 timers 数量
  ✓ immediate=true 立即触发回调
  ✓ maxFires 限制触发次数

setTimeout（4）
  ✓ 返回 DaoTimerHandle（Symbol）
  ✓ snapshot.totalTimers 包含 timeout 句柄
  ✓ delay=0 后回调执行
  ✓ byApp 记录 appId 对应 timers 数量

clearTimer（3）
  ✓ 清除 interval 后 totalTimers 减少
  ✓ 清除 timeout 后 totalTimers 减少
  ✓ 重复 clearTimer 不抛出（幂等）

clearAllForApp（4）
  ✓ 清除该 app 全部 timers + tasks，返回正确数量
  ✓ 不影响其他 app 的 timers
  ✓ 清除后 byApp 不包含该 app（或计数为0）
  ✓ appId 不存在时返回 0

scheduleTask / cancelTask（5）
  ✓ scheduleTask 返回 taskId（字符串）
  ✓ pendingTasks 递增
  ✓ cancelTask 返回 true，pendingTasks 减少
  ✓ cancelTask 不存在 id 返回 false
  ✓ byApp 记录 appId 对应 tasks 数量

window 工具（4）
  ✓ window(duration) 返回有效 DaoTimeWindow
  ✓ windowContains：ts 在窗口内返回 true
  ✓ windowContains：ts 在窗口外返回 false
  ✓ windowOverlaps：重叠返回 true，不重叠返回 false

E2E（3）
  ✓ 多应用 timer 互不干扰
  ✓ DaoUniverseTimes 可从 @daomind/collective 导入
  ✓ clearAllForApp 清理多类型资源并广播 app:stopped 后验证
```

---

## v2.21.0 — DaoUniverseModules

**帛书依据**："为之于未有，治之于未乱"（道经·六十四章）
**文件**：`packages/daoCollective/src/universe-modules.ts`

### 接口

```typescript
export interface ModulesSnapshot {
  readonly timestamp:  number;
  readonly total:      number;
  readonly active:     number;
  readonly registered: number;
  readonly terminated: number;
  readonly byLifecycle: Partial<Record<ModuleLifecycle, number>>;
}

export class DaoUniverseModules {
  private readonly _container: DaoAnythingContainer;

  constructor(private readonly _apps: DaoUniverseApps)

  // ── 注册与生命周期 ────────────────────────────────────
  register(module: DaoModuleRegistration): void
  initialize(name: string): Promise<void>
  activate(name: string): Promise<void>     // → agents.send('daoModules','*','module:activated',{name})
  deactivate(name: string): Promise<void>
  terminate(name: string): Promise<void>

  // ── 查询 ─────────────────────────────────────────────
  getModule(name: string): DaoModuleMeta | undefined
  listModules(): ReadonlyArray<DaoModuleMeta>
  listByLifecycle(lifecycle: ModuleLifecycle): ReadonlyArray<DaoModuleMeta>

  // ── resolve（透传，测试中只测非激活路径）─────────────
  resolve<T>(name: string): Promise<T>

  // ── 快照 ─────────────────────────────────────────────
  snapshot(): ModulesSnapshot

  // ── Getters ──────────────────────────────────────────
  get apps(): DaoUniverseApps
  get container(): DaoAnythingContainer
}
```

### 实现细节

- `activate(name)` 调用 `_container.activate(name)` 后，
  通过 `_apps.agents.send('daoModules', '*', 'module:activated', { name })` 广播
- `terminate(name)` 类似广播 `'module:terminated'`
- `listByLifecycle(lifecycle)` → `listModules().filter(m => m.lifecycle === lifecycle)`
- `resolve<T>(name)` 直接透传 `_container.resolve<T>(name)`（测试中只测"未激活抛出"）

### 测试（universe-modules.test.ts）— 目标 ~28 个

```
构建（4）
  ✓ 可构建 DaoUniverseModules
  ✓ apps/container getter 正确
  ✓ 初始 snapshot 全零
  ✓ apps getter 为传入的 DaoUniverseApps 实例

register（3）
  ✓ register 后 getModule 返回 registered 状态
  ✓ listModules 长度增加
  ✓ 重复 register 同一 name 抛出

initialize（3）
  ✓ registered → initialized
  ✓ initialize 不存在的 name 抛出
  ✓ 非法状态转换抛出（active → initialized）

activate（4）
  ✓ initialized → active，getModule.lifecycle = 'active'
  ✓ activate 后 snapshot.active 增加
  ✓ activate 后 agents.history 含 module:activated 消息
  ✓ activate 不存在的 name 抛出

deactivate（2）
  ✓ active → suspending
  ✓ deactivate 不存在的 name 抛出

terminate（3）
  ✓ registered → terminated
  ✓ terminate 后 snapshot.terminated 增加
  ✓ terminate 后 agents.history 含 module:terminated 消息

查询（3）
  ✓ listByLifecycle 按状态过滤
  ✓ getModule 不存在返回 undefined
  ✓ listModules 返回所有模块

resolve（2）
  ✓ resolve 未激活的模块抛出"模块未激活"
  ✓ resolve 未注册的模块抛出"模块未注册"

snapshot（3）
  ✓ byLifecycle 正确统计各状态数量
  ✓ total = 已注册模块总数
  ✓ active / registered / terminated 字段正确

E2E（2）
  ✓ DaoUniverseModules 可从 @daomind/collective 导入
  ✓ 完整 register → initialize → activate → deactivate → terminate 流程
```

---

## 文件变更清单

| 操作 | 文件 |
|------|------|
| NEW | `packages/daoCollective/src/universe-times.ts` |
| NEW | `packages/daoCollective/src/__tests__/universe-times.test.ts` |
| NEW | `packages/daoCollective/src/universe-modules.ts` |
| NEW | `packages/daoCollective/src/__tests__/universe-modules.test.ts` |
| NEW | `retrospectives/2026-04-16-daomind-v2.19.0.md` |
| NEW | `retrospectives/2026-04-16-daomind-v2.20.0.md` |
| EDIT | `packages/daoCollective/src/index.ts` — 新增两个 bridge 导出 |
| EDIT | `src/App.tsx` — v2.19.0→v2.20.0 (756→~786)，v2.20.0→v2.21.0 (~786→~814) |

---

## 架构层次（v2.21.0 后完整）

```
DaoUniverse
  ├── DaoUniverseMonitor (v2.8.0)
  │       ├── DaoUniverseAgents (v2.18.0)
  │       │       └── DaoUniverseApps (v2.19.0)
  │       │               ├── DaoUniverseTimes   (v2.20.0) ← timer + scheduler × apps
  │       │               └── DaoUniverseModules (v2.21.0) ← IoC 容器 × apps
  │       ├── DaoUniverseClock (v2.9.0)
  │       │       ├── DaoUniverseFeedback (v2.10.0)
  │       │       └── DaoUniverseScheduler (v2.12.0)
  │       │               ├── DaoUniverseSkills (v2.13.0)
  │       │               └── DaoUniversePages  (v2.17.0)
  │       └── DaoUniverseNexus (v2.14.0)
  │               └── DaoUniverseSpaces (v2.16.0)
  └── DaoUniverseAudit (v2.11.0)
          └── DaoUniverseDocs (v2.15.0)
```

---

## 验证步骤

1. `pnpm -r run build` — 全部 Done，无 error TS
2. `npx jest packages/daoCollective/src/__tests__/universe-times.test.ts` — ~30 pass
3. `npx jest packages/daoCollective/src/__tests__/universe-modules.test.ts` — ~28 pass
4. `npx jest --no-coverage` — 全部通过（目标 ~814 tests）
5. `git log --oneline -3` — v2.20.0 + v2.21.0 各为独立 commit + tag
6. `git push origin main --tags && git push github main --tags` — 双远端推送
