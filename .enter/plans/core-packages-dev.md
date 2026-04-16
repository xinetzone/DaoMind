# DaoMind v2.18.0 & v2.19.0 开发计划

## 当前状态
- v2.17.0 已完成：DaoUniversePages（daoPages × DaoUniverseScheduler）
- 691 tests，42 suites，全绿
- 已 push 到 origin + github，已打 tag v2.17.0

## 未集成包分析

daoCollective `package.json` 包含 15 个依赖，其中仍无 `DaoUniverse*` 类的包：

| 包 | 待集成原因 |
|---|---|
| `@daomind/agents` | DaoAgentRegistry + DaoAgentMessenger + agent lifecycle，无 DaoUniverseAgents |
| `@daomind/apps` | DaoAppContainer + DaoLifecycleManager，无 DaoUniverseApps |

其余已集成：`nothing / anything / qi(bridge) / monitor / chronos / feedback / verify / times / skills / nexus / docs / spaces / pages`

---

## v2.18.0 计划：DaoUniverseAgents（agents × DaoUniverseMonitor）

### 帛书：「知人者智，自知者明；胜人者有力，自胜者强」（道经·三十三章）

### 架构位置

```
DaoUniverse
  ├── DaoUniverseMonitor (v2.8.0)
  │       ├── DaoUniverseAgents (v2.18.0) ← NEW: agents × 监控健康反馈
  │       ├── DaoUniverseNexus (v2.14.0) → DaoUniverseSpaces (v2.16.0)
  │       └── DaoUniverseClock → DaoUniverseFeedback / DaoUniverseScheduler
  │               └── DaoUniverseSkills / DaoUniversePages
  └── DaoUniverseAudit → DaoUniverseDocs
```

### 关键设计约束（来自代码分析）

1. **DaoBaseAgent 硬绑定全局 messenger**：
   - `DaoBaseAgent.send()` 内部调用 `daoAgentMessenger`（全局单例），不可注入替换
   - 因此 `DaoUniverseAgents` 使用全局 `daoAgentMessenger` 做消息代理
   - 独立 `DaoAgentRegistry` 实例跟踪本 universe 的 agents

2. **monitor 集成方式**：
   - `DaoUniverseMonitor.feed()` 读取 `_universe.snapshot()`（非本 registry）
   - 本类通过直接调用 `monitor.heatmapEngine.record()` 向 monitor 输入数据
   - `snapshot()` 调用时同步向 heatmap 注入当前 agent 分布

### API 设计

```typescript
// packages/daoCollective/src/universe-agents.ts

export interface AgentsSnapshot {
  readonly timestamp:   number;
  readonly total:       number;
  readonly active:      number;    // byState['active'] ?? 0
  readonly dormant:     number;    // byState['dormant'] ?? 0
  readonly byType:      Record<string, number>;
  readonly subscribers: number;    // daoAgentMessenger.subscriberCount()
}

export class DaoUniverseAgents {
  private readonly _registry: DaoAgentRegistry;

  constructor(private readonly _monitor: DaoUniverseMonitor) {
    this._registry = new DaoAgentRegistry();
  }

  // 生命周期
  spawn<T extends DaoBaseAgent>(AgentClass: new (id: string) => T, id: string): T
  //  → new AgentClass(id) + _registry.register(agent) + heatmap.record(...)
  terminate(id: string): Promise<boolean>
  //  → agent.terminate() + _registry.unregister(id)
  activate(id: string): Promise<boolean>
  //  → agent.activate()；不存在返回 false
  rest(id: string): Promise<boolean>
  //  → agent.rest()；不存在返回 false

  // 查询
  getAgent(id: string): DaoAgent | undefined
  listAll(): ReadonlyArray<DaoAgent>
  findByCapability(cap: string): ReadonlyArray<DaoAgent>
  findByType(type: string): ReadonlyArray<DaoAgent>

  // 消息（代理全局 daoAgentMessenger）
  send(from: string, to: string | '*', action: string, payload?: unknown): void
  history(filter?: MessageFilter): ReadonlyArray<AgentMessage>

  // 快照（同时向 monitor.heatmapEngine 注入 agent 分布数据）
  snapshot(): AgentsSnapshot

  // Getters
  get monitor(): DaoUniverseMonitor
  get registry(): DaoAgentRegistry
}
```

### 测试规划（~32 测试）

| 分组 | 数量 |
|------|------|
| 构建 | 4 |
| spawn（创建+注册+heatmap）| 4 |
| terminate（卸载+注销）| 3 |
| activate/rest（状态机）| 5 |
| 查询（getAgent/listAll/findBy*）| 5 |
| 消息（send/history）| 4 |
| snapshot（计数/byType/subscribers）| 4 |
| E2E | 3 |

### 需要创建/修改的文件

| 文件 | 操作 |
|------|------|
| `retrospectives/2026-04-16-daomind-v2.17.0.md` | 新建（v2.17.0 复盘） |
| `packages/daoCollective/src/universe-agents.ts` | 新建 |
| `packages/daoCollective/src/__tests__/universe-agents.test.ts` | 新建 |
| `packages/daoCollective/src/index.ts` | 追加 DaoUniverseAgents 导出 |
| `src/App.tsx` | 版本 v2.17.0 → v2.18.0，测试数 691 → ~723 |

> **注意**：`packages/daoCollective/package.json` 和 `tsconfig.json` 中 `@daomind/agents` 已存在，无需修改。

---

## v2.19.0 计划：DaoUniverseApps（apps × DaoUniverseAgents）

### 帛书：「为之于未有，治之于未乱」（道经·六十四章）

### 架构位置（追加到 v2.18.0 之后）

```
DaoUniverse
  ├── DaoUniverseMonitor
  │       ├── DaoUniverseAgents (v2.18.0)
  │       │       └── DaoUniverseApps (v2.19.0) ← NEW: apps × agent lifecycle 广播
  ...
```

### API 设计

```typescript
export interface AppsSnapshot {
  readonly timestamp:  number;
  readonly total:      number;
  readonly running:    number;
  readonly registered: number;
  readonly stopped:    number;
  readonly byState:    Partial<Record<AppState, number>>;
}

export class DaoUniverseApps {
  private readonly _container:  DaoAppContainer;
  private readonly _lifecycle:  DaoLifecycleManager;

  constructor(private readonly _agents: DaoUniverseAgents) {
    this._container = new DaoAppContainer();
    this._lifecycle = new DaoLifecycleManager();
  }

  // 注册/卸载
  register(definition: DaoAppDefinition): void
  unregister(id: string): boolean

  // 生命周期
  async start(id: string): Promise<void>
  //  → _container.start(id) + _lifecycle.emit(id, from, 'running') + agents.send(...)
  async stop(id: string): Promise<void>
  //  → _container.stop(id) + _lifecycle.emit(id, from, 'stopped') + agents.send(...)
  async restart(id: string): Promise<void>
  //  → stop + start

  // 查询
  getApp(id: string): DaoAppInstance | undefined
  listAll(): ReadonlyArray<DaoAppInstance>
  listByState(state: AppState): ReadonlyArray<DaoAppInstance>

  // 生命周期钩子
  onStateChange(appId: string, cb: (from: AppState, to: AppState) => void): () => void
  getHistory(appId: string, limit?: number): ReadonlyArray<...>

  // 快照
  snapshot(): AppsSnapshot

  // Getters
  get agents(): DaoUniverseAgents
  get container(): DaoAppContainer
  get lifecycle(): DaoLifecycleManager
}
```

### 集成亮点
- `start()` / `stop()` 成功后通过 `agents.send('daoApps', '*', 'app:started/stopped', { id })` 广播 → 所有 agent 订阅者可感知应用状态变更
- `_lifecycle.emit()` 记录状态转换历史（最多 100 条/应用）
- `onStateChange()` 返回解绑函数（dispose pattern）

### 测试规划（~30 测试）

| 分组 | 数量 |
|------|------|
| 构建 | 4 |
| register/unregister | 4 |
| start/stop/restart | 6 |
| 查询（getApp/listAll/listByState）| 4 |
| lifecycle hooks（onStateChange/history）| 5 |
| snapshot | 4 |
| E2E | 3 |

### 新增文件

| 文件 | 操作 |
|------|------|
| `retrospectives/2026-04-16-daomind-v2.18.0.md` | 新建（v2.18.0 复盘） |
| `packages/daoCollective/src/universe-apps.ts` | 新建 |
| `packages/daoCollective/src/__tests__/universe-apps.test.ts` | 新建 |
| `packages/daoCollective/src/index.ts` | 追加 DaoUniverseApps 导出 |
| `src/App.tsx` | 版本 v2.18.0 → v2.19.0，测试数更新 |

---

## 最终架构（v2.19.0 完成后）

```
DaoUniverse
  ├── DaoUniverseMonitor (v2.8.0)
  │       ├── DaoUniverseAgents (v2.18.0) ← agent 生命周期 × 监控反馈
  │       │       └── DaoUniverseApps (v2.19.0) ← app 状态机 × agent 广播
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

**最终指标预测**：~751 tests，44 suites

---

## 执行顺序

### v2.18.0
1. 写 `retrospectives/2026-04-16-daomind-v2.17.0.md`
2. 实现 `universe-agents.ts`
3. 写 `universe-agents.test.ts`（~32 tests）
4. 更新 `index.ts` + `App.tsx`
5. 运行全量测试
6. `git commit + tag v2.18.0 + push origin + github`

### v2.19.0
7. 写 `retrospectives/2026-04-16-daomind-v2.18.0.md`
8. 实现 `universe-apps.ts`
9. 写 `universe-apps.test.ts`（~30 tests）
10. 更新 `index.ts` + `App.tsx`
11. 运行全量测试
12. `git commit + tag v2.19.0 + push origin + github`
