# DaoMind & Modulux - API 参考文档

完整的 API 参考文档，涵盖所有核心包、功能包和 DaoUniverse* 桥接体系。

> **版本**: 2.46.3  
> **更新日期**: 2026-04-17  
> **测试**: 1000 个测试，52 个套件，全部通过

---

## 目录

- [核心包](#核心包)
  - [@daomind/nothing](#daomindnothing) — 类型契约、函数式工具（无名层）
  - [@daomind/anything](#daomindanything) — 模块容器（有名层）
  - [@daomind/agents](#daomindagents) — Agent 系统（行动层）
  - [@daomind/apps](#daomindapps) — 应用生命周期（应用层）
  - [@daomind/times](#daomindtimes) — 定时器与调度（时序层）
  - [@daomind/collective](#daomindcollective) — 根节点门面
- [功能包](#功能包)
  - [@modulux/qi](#moduluxqi) — 消息总线
  - [@daomind/monitor](#daomindmonitor) — 监控系统
  - [@daomind/chronos](#daomindchronos) — 时钟
  - [@daomind/feedback](#daomindfeedback) — 反馈机制
  - [@daomind/verify](#daomindverify) — 验证系统
  - [@daomind/nexus](#daomindnexus) — 服务网格
  - [@daomind/spaces](#daomindspaces) — 命名空间
  - [@daomind/skills](#daomindskills) — 技能系统
  - [@daomind/pages](#daomindpages) — 组件树
  - [@daomind/docs](#daominddocs) — 知识图谱
  - [@daomind/benchmark](#daomindbenchmark) — 性能测试
- [DaoUniverse* 桥接体系](#daouniverse-桥接体系)
  - [DaoUniverseMonitor](#daoUniverseMonitor)
  - [DaoUniverseClock](#daouniverseclock)
  - [DaoUniverseFeedback](#daouniversefeedback)
  - [DaoUniverseAudit](#daouniverseaudit)
  - [DaoUniverseScheduler](#daouniversescheduler)
  - [DaoUniverseSkills](#daouniverseskills)
  - [DaoUniverseNexus](#daouniversenexus)
  - [DaoUniverseDocs](#daouniversedocs)
  - [DaoUniverseSpaces](#daouniversespaces)
  - [DaoUniversePages](#daouniversepages)
  - [DaoUniverseAgents](#daouniverseagents)
  - [DaoUniverseApps](#daouniverseapps)
  - [DaoUniverseTimes](#daouniversetimes)
  - [DaoUniverseModules](#daouniversemodules)
  - [DaoUniverseQi](#daouniverseqi)
  - [DaoUniverseBenchmark](#daouniversebenchmark)
  - [DaoUniverseDiagnostic](#daouniversediagnostic)
- [类型工具](#类型工具)
- [常见模式](#常见模式)

---

## 核心包

### @daomind/nothing

**零运行时类型定义包**，实现"无名"（Nameless）哲学层。

> **设计理念**: 纯类型定义，编译后完全消失，零运行时开销。

```bash
pnpm add @daomind/nothing
```

```typescript
import type {
  ExistenceContract,
  DaoOption,
  DaoResult,
} from '@daomind/nothing';
import { daoNothingVoid, daoTryAsync, daoIsOk, daoFromNullable } from '@daomind/nothing';
```

---

#### `ExistenceContract`

存在性契约，标记实体的存在状态。

```typescript
interface ExistenceContract {
  readonly existentialType: 'nothing' | 'anything';
}
```

---

#### `DaoOption<T>`

可选值包装，替代 `null/undefined`。

```typescript
type DaoOption<T> = DaoSome<T> | DaoNone;

// 工具函数
daoFromNullable<T>(value: T | null | undefined): DaoOption<T>
daoIsSome<T>(opt: DaoOption<T>): opt is DaoSome<T>
daoIsNone<T>(opt: DaoOption<T>): opt is DaoNone
daoUnwrapOr<T>(opt: DaoOption<T>, fallback: T): T
daoMapOption<T, U>(opt: DaoOption<T>, fn: (v: T) => U): DaoOption<U>
```

**示例**:
```typescript
import { daoFromNullable, daoUnwrapOr } from '@daomind/nothing';

const opt = daoFromNullable(user?.name);
const name = daoUnwrapOr(opt, '匿名');
```

---

#### `DaoResult<T, E>`

操作结果包装，替代 `try/catch`。

```typescript
type DaoResult<T, E = Error> = DaoOk<T> | DaoErr<E>;

// 工具函数
daoTryAsync<T>(fn: () => Promise<T>): Promise<DaoResult<T, Error>>
daoIsOk<T, E>(r: DaoResult<T, E>): r is DaoOk<T>
daoIsErr<T, E>(r: DaoResult<T, E>): r is DaoErr<E>
daoUnwrap<T, E>(r: DaoResult<T, E>): T  // 失败时抛出
```

**示例**:
```typescript
import { daoTryAsync, daoIsOk } from '@daomind/nothing';

const result = await daoTryAsync(() => fetch('/api').then(r => r.json()));
if (daoIsOk(result)) {
  console.log(result.value);
} else {
  console.error(result.error);
}
```

---

#### `DaoNothingVoid` / `daoNothingVoid`

全局虚空事件总线，所有消息的底层存储。

```typescript
class DaoNothingVoid {
  emit(event: DaoNothingEvent): void
  history(): ReadonlyArray<DaoNothingEvent>
  void(): void      // 清空历史（测试隔离）
}

const daoNothingVoid: DaoNothingVoid;
```

---

#### `DaoModuleGraphNode` / `DaoModuleGraphSnapshot` （v2.46.3）

依赖图节点与快照的纯类型描述，属于"无名"类型空间（零运行时）。

```typescript
/** 依赖图单节点 */
interface DaoModuleGraphNode {
  readonly name:         string
  readonly dependencies: readonly string[]  // 此节点直接依赖的模块
  readonly dependents:   readonly string[]  // 直接依赖此节点的模块
  readonly depth:        number             // 拓扑深度（从根节点的最长路径）
}

/** 依赖图全图不可变快照 */
interface DaoModuleGraphSnapshot {
  readonly nodes:            ReadonlyArray<DaoModuleGraphNode>
  readonly topologicalOrder: ReadonlyArray<string>  // Kahn 算法结果；有环时为 []
  readonly hasCycle:         boolean
  readonly cycleNodes:       ReadonlyArray<string>  // 参与循环的节点；无环时为 []
  readonly totalModules:     number
  readonly maxDepth:         number
}
```

```typescript
import type { DaoModuleGraphNode, DaoModuleGraphSnapshot } from '@daomind/nothing';
```

---

### @daomind/anything

**模块容器包**，实现"有名"（Named）哲学层。

```bash
pnpm add @daomind/anything
```

```typescript
import type { DaoModuleRegistration, ModuleLifecycle, DaoModuleMeta } from '@daomind/anything';
import { DaoAnythingContainer, daoContainer, DaoModuleGraph, daoModuleGraph } from '@daomind/anything';
```

---

#### `ModuleLifecycle`

```typescript
type ModuleLifecycle =
  | 'registered'    // 已注册（初始状态）
  | 'initialized'   // 已初始化
  | 'active'        // 活跃中
  | 'suspending'    // 暂停中
  | 'terminated';   // 已终止（终态）
```

**状态流转**: `registered → initialized → active → suspending → terminated`

---

#### `DaoAnythingContainer`

IoC 容器，管理模块的注册与生命周期。

```typescript
class DaoAnythingContainer {
  register(module: DaoModuleRegistration): void
  initialize(name: string): Promise<void>
  activate(name: string): Promise<void>
  deactivate(name: string): Promise<void>
  terminate(name: string): Promise<void>
  resolve<T>(name: string): Promise<T>        // 动态 import，需模块处于 active 状态
  getModule(name: string): DaoModuleMeta | undefined
  listModules(): ReadonlyArray<DaoModuleMeta>
}
```

> `daoContainer` 是全局单例。在 `DaoUniverseModules` 中使用独立 `new DaoAnythingContainer()` 以避免污染全局。

---

#### `DaoModuleGraph` / `daoModuleGraph` （v2.46.3）

模块依赖图引擎，建立有向无环图（DAG），通过拓扑排序给出初始化顺序，检测循环依赖。

```typescript
class DaoModuleGraph {
  // 添加模块及其依赖（幂等）
  addModule(name: string, deps?: readonly string[]): void
  addFromRegistrations(regs: ReadonlyArray<DaoModuleRegistration>): void

  // 查询
  getDependencies(name: string): ReadonlyArray<string>       // 直接依赖
  getDependents(name: string): ReadonlyArray<string>         // 直接被依赖者
  getTransitiveDependencies(name: string): ReadonlySet<string> // 所有传递性依赖（BFS）

  // 拓扑排序（Kahn 算法）
  topologicalOrder(): ReadonlyArray<string> | null  // 有环返回 null

  // 循环检测（DFS 颜色标记法）
  hasCycle(): boolean
  findCycleNodes(): ReadonlyArray<string>

  // 管理
  removeModule(name: string): boolean
  has(name: string): boolean
  get size(): number
  moduleNames(): ReadonlyArray<string>
  clear(): void

  // 生成不可变快照
  snapshot(): DaoModuleGraphSnapshot
}

const daoModuleGraph: DaoModuleGraph;  // 全局单例
```

**示例**：

```typescript
import { DaoModuleGraph, DaoAnythingContainer } from '@daomind/anything';

const graph = new DaoModuleGraph();
graph.addModule('db',   []);
graph.addModule('auth', ['db']);
graph.addModule('api',  ['auth', 'db']);

const order = graph.topologicalOrder()!; // ['db', 'auth', 'api']

const container = new DaoAnythingContainer();
for (const name of order) {
  container.register({ name, version: '1.0.0', path: `./${name}` });
  await container.initialize(name);
  await container.activate(name);
}
```

---

### @daomind/agents

**Agent 系统包**，自主行动实体。

```bash
pnpm add @daomind/agents
```

```typescript
import type { DaoAgent, DaoAgentCapability, AgentState } from '@daomind/agents';
import {
  DaoBaseAgent,
  TaskAgent,
  ObserverAgent,
  CoordinatorAgent,
  DaoAgentRegistry,
  daoAgentRegistry,
  daoAgentMessenger,
} from '@daomind/agents';
```

---

#### `AgentState`

```typescript
type AgentState =
  | 'dormant'     // 休眠（初始状态）
  | 'awakening'   // 唤醒中
  | 'active'      // 活跃
  | 'resting'     // 休息中
  | 'deceased';   // 已终止（终态）
```

---

#### `DaoBaseAgent`

所有 Agent 的基类。

```typescript
abstract class DaoBaseAgent {
  readonly id: string;
  readonly agentType: string;
  get state(): AgentState

  initialize(): Promise<void>
  activate(): Promise<void>
  rest(): Promise<void>
  terminate(): Promise<void>
  execute<T>(action: string, payload?: unknown): Promise<T>
  send(to: string | '*', action: string, payload?: unknown): void
}
```

---

#### `TaskAgent`

优先级任务队列 Agent。

```typescript
class TaskAgent extends DaoBaseAgent {
  // execute 支持的动作:
  // 'enqueue' — 入队: { id, action, priority?, payload? }
  // 'run-next' — 执行优先级最高的任务
  // 'peek' — 查看队头任务（不执行）
  // 'list' — 列出所有待处理任务
  // 'clear' — 清空任务队列
}
```

---

#### `ObserverAgent`

事件总线历史监听 Agent。

```typescript
class ObserverAgent extends DaoBaseAgent {
  // execute 支持的动作:
  // 'get-history' — 获取消息历史: { limit? }
  // 'clear-history' — 清空历史
}
```

---

#### `CoordinatorAgent`

Agent 名册与任务分派 Agent。

```typescript
class CoordinatorAgent extends DaoBaseAgent {
  // execute 支持的动作:
  // 'add-agent'    — 注册 Agent: { agentId }
  // 'remove-agent' — 注销 Agent: { agentId }
  // 'assign'       — 分派任务:   { agentId, action, payload? }
  // 'list-agents'  — 列出所有 Agent
}
```

---

#### `daoAgentMessenger`

全局消息总线（`DaoBaseAgent` 内部硬绑定此单例）。

```typescript
interface DaoAgentMessenger {
  send(from: string, to: string | '*', action: string, payload?: unknown): void
  history(filter?: MessageFilter): ReadonlyArray<AgentMessage>
  subscriberCount(): number
}
```

---

### @daomind/apps

**应用生命周期包**，状态机驱动。

```bash
pnpm add @daomind/apps
```

```typescript
import type { AppState, DaoAppDefinition, DaoAppInstance } from '@daomind/apps';
import { DaoAppContainer, daoAppContainer, DaoLifecycleManager, daoLifecycleManager } from '@daomind/apps';
```

---

#### `AppState`

```typescript
type AppState =
  | 'registered'   // 已注册
  | 'starting'     // 启动中
  | 'running'      // 运行中
  | 'stopping'     // 停止中
  | 'stopped'      // 已停止
  | 'error';       // 错误
```

---

#### `DaoAppContainer`

```typescript
class DaoAppContainer {
  register(def: DaoAppDefinition): void
  unregister(id: string): boolean
  start(id: string): Promise<void>      // 检查 dependencies 是否全部 running
  stop(id: string): Promise<void>
  restart(id: string): Promise<void>
  get(id: string): DaoAppInstance | undefined
  listAll(): ReadonlyArray<DaoAppInstance>
  listByState(state: AppState): ReadonlyArray<DaoAppInstance>
}
```

---

#### `DaoLifecycleManager`

```typescript
class DaoLifecycleManager {
  emit(appId: string, from: AppState, to: AppState): void
  onStateChange(appId: string, cb: (from: AppState, to: AppState) => void): () => void
  getHistory(appId: string, limit?: number): ReadonlyArray<{ from, to, timestamp }>
}
```

---

### @daomind/times

**定时器与调度包**，时序层。

```bash
pnpm add @daomind/times
```

```typescript
import type { DaoTimerHandle, DaoTimerOptions, DaoScheduledTask, DaoTimeWindow } from '@daomind/times';
import { DaoTimer, DaoScheduler, daoTimer, daoScheduler, daoTimeWindow } from '@daomind/times';
```

---

#### `DaoTimer`

```typescript
class DaoTimer {
  setInterval(callback: () => void, options: DaoTimerOptions): DaoTimerHandle
  setTimeout(callback: () => void, delay: number): DaoTimerHandle
  clearInterval(handle: DaoTimerHandle): void
  clearTimeout(handle: DaoTimerHandle): void
}

interface DaoTimerOptions {
  interval:    number        // 间隔毫秒
  immediate?:  boolean       // 立即触发一次（默认 false）
  maxFires?:   number        // 最大触发次数（默认无限）
}
```

---

#### `DaoScheduler`

```typescript
class DaoScheduler {
  schedule<T>(task: Omit<DaoScheduledTask<T>, 'id'>): string  // 返回 taskId
  cancel(taskId: string): boolean
  pending(): number  // 返回 executeAt <= Date.now() 的任务数
  flush(): void      // 执行所有已到期任务
}

interface DaoScheduledTask<T> {
  id:         string
  executeAt:  number    // 执行时间戳
  handler:    () => T
  priority:   number    // 数字越大优先级越高
}
```

---

#### `daoTimeWindow`

时间窗口工具（全局无状态对象）。

```typescript
const daoTimeWindow = {
  now(duration: number): DaoTimeWindow          // 以当前时间为起点
  contains(win: DaoTimeWindow, ts: number): boolean
  overlaps(a: DaoTimeWindow, b: DaoTimeWindow): boolean
};

interface DaoTimeWindow {
  start:    number
  end:      number
  duration: number
}
```

---

### @daomind/collective

**根节点包**，再导出所有子包并提供 `DaoUniverse` 门面与全系列 `DaoUniverse*` 桥接器。

```bash
pnpm add @daomind/collective
```

```typescript
import {
  DaoUniverse, daoUniverse,
  DaoUniverseMonitor,
  DaoUniverseClock,
  DaoUniverseFeedback,
  DaoUniverseAudit,
  DaoUniverseScheduler,
  DaoUniverseSkills,
  DaoUniverseNexus,
  DaoUniverseDocs,
  DaoUniverseSpaces,
  DaoUniversePages,
  DaoUniverseAgents,
  DaoUniverseApps,
  DaoUniverseTimes,
  DaoUniverseModules,
  // ... 所有子包的再导出
} from '@daomind/collective';
```

---

#### `DaoUniverse`

全局宇宙快照，基础门面。

```typescript
class DaoUniverse {
  snapshot(): DaoSystemSnapshot
  // DaoSystemSnapshot 包含 agents / apps / monitor 等子系统快照
}

const daoUniverse: DaoUniverse;  // 全局单例
```

---

## 功能包

### @modulux/qi

**消息总线**，四通道事件通信（天/地/人/冲）。

```bash
pnpm add @modulux/qi
```

```typescript
import { DaoQi, daoQi } from '@modulux/qi';
import type { DaoMessage, QiChannelType } from '@modulux/qi';

type QiChannelType = 'heaven' | 'earth' | 'human' | 'void';
```

---

### @daomind/monitor

**监控系统**，阴阳仪表盘、热力图、向量场、告警引擎（基于中医经络理论）。

```bash
pnpm add @daomind/monitor
```

```typescript
import { daoMonitor, DaoHeatmapEngine } from '@daomind/monitor';

// 核心：heatmap 记录
daoMonitor.heatmapEngine.record(channel, type, category, { rate, latency, errorRate });
```

---

### @daomind/chronos

**高精度时钟**，DaoChronos 时间源。

```bash
pnpm add @daomind/chronos
```

```typescript
import { DaoChronos, daoGetChronos } from '@daomind/chronos';

const clock = daoGetChronos();
clock.now()    // 当前时间戳
clock.tick()   // 手动触发一个心跳
```

---

### @daomind/feedback

**闭环反馈调节**，四阶段生命周期。

```bash
pnpm add @daomind/feedback
```

```typescript
import { DaoFeedbackRegulator, DaoFeedbackLifecycle } from '@daomind/feedback';
import type { FeedbackRegulatorConfig, RegulationResult } from '@daomind/feedback';
```

---

### @daomind/verify

**哲学契约验证**，wu-you-balance / yin-yang-balance / naming-convention 等检查。

```bash
pnpm add @daomind/verify
```

```typescript
import { DaoVerificationReporter, DAO_VERIFICATION_CATEGORY_LABELS } from '@daomind/verify';

// 检查项
// 'wu-you-balance'     — 无/有平衡
// 'yin-yang-balance'   — 阴阳平衡
// 'qi-fluency'         — 气的流动性
// 'wu-wei-verification'— 无为原则
// 'naming-convention'  — 命名规范
```

---

### @daomind/nexus

**服务网格**，服务发现、负载均衡、路由。

```bash
pnpm add @daomind/nexus
```

```typescript
import {
  DaoServiceDiscovery, daoServiceDiscovery,
  DaoNexusRouter,      daoNexusRouter,
  DaoLoadBalancer,     daoLoadBalancer,
} from '@daomind/nexus';
```

---

### @daomind/spaces

**命名空间管理**，隔离与组织。

```bash
pnpm add @daomind/spaces
```

```typescript
import { DaoNamespaceManager, daoNamespace } from '@daomind/spaces';
import type { DaoSpaceId, DaoSpace } from '@daomind/spaces';
```

---

### @daomind/skills

**技能系统**，能力组合与动态扩展。

```bash
pnpm add @daomind/skills
```

```typescript
import {
  DaoSkillRegistry,  daoSkillRegistry,
  DaoSkillActivator, daoSkillActivator,
  DaoSkillScorer,    daoSkillScorer,
  DaoSkillCombiner,  daoSkillCombiner,
} from '@daomind/skills';
import type { SkillId, SkillState, DaoSkillDefinition } from '@daomind/skills';
```

---

### @daomind/pages

**组件树与状态绑定**。

```bash
pnpm add @daomind/pages
```

```typescript
import {
  DaoComponentTree, daoComponentTree,
  DaoStateBinding,  daoStateBinding,
} from '@daomind/pages';
import type { DaoComponent, DaoViewSnapshot, BindingPath } from '@daomind/pages';
```

---

### @daomind/docs

**知识图谱与 API 文档追踪**。

```bash
pnpm add @daomind/docs
```

```typescript
import {
  daoDocStore,       DaoDocStore,
  daoApiDocs,        DaoApiDocs,
  daoVersionTracker, DaoVersionTracker,
  daoKnowledgeGraph, DaoKnowledgeGraph,
} from '@daomind/docs';
import type { DocType, DaoDocEntry, DaoKnowledgeNode } from '@daomind/docs';
```

---

### @daomind/benchmark

**性能基准测试**，评估与优化指导。

```bash
pnpm add @daomind/benchmark
```

```typescript
// 测试套件: nothing-size / startup / latency / throughput / memory
// CLI: npx dao-benchmark
```

---

## DaoUniverse* 桥接体系

所有桥接器均由 `@daomind/collective` 导出，遵循统一设计原则：
- 构造函数接受上层桥接器引用（或 DaoUniverse 根节点）
- 内部创建**独立的子系统实例**（不污染全局单例）
- 暴露 `snapshot()` 方法
- 对外暴露底层资源的 getter（`monitor`, `agents`, `container` 等）

---

### DaoUniverseMonitor

**v2.8.0** — `DaoUniverse × @daomind/monitor` 监控桥接。

```typescript
import { DaoUniverseMonitor } from '@daomind/collective';

const monitor = new DaoUniverseMonitor(universe);

monitor.feed()                     // 触发一次监控数据采集
monitor.capture(): MonitorSnapshot // 获取快照
monitor.heatmapEngine              // 直接访问 heatmap 引擎
monitor.monitor                    // 底层 daoMonitor 实例
monitor.universe                   // 上层 DaoUniverse
```

---

### DaoUniverseClock

**v2.9.0** — `DaoUniverseMonitor × @daomind/chronos` 时序心跳。

```typescript
const clock = new DaoUniverseClock(monitor);

clock.tick(count?: number): void    // 手动触发心跳
clock.onTick(cb: ClockTickCallback): () => void  // 注册心跳回调
clock.snapshot(): ClockSnapshot
clock.monitor                        // 上层 DaoUniverseMonitor
```

---

### DaoUniverseFeedback

**v2.10.0** — `DaoUniverseClock × @daomind/feedback` 闭环反馈。

```typescript
const feedback = new DaoUniverseFeedback(clock);

feedback.regulate(signal: number): RegulationResult
feedback.snapshot(): FeedbackSnapshot
feedback.clock                       // 上层 DaoUniverseClock
feedback.regulator                   // 底层 DaoFeedbackRegulator
```

---

### DaoUniverseAudit

**v2.11.0** — `DaoUniverse × @daomind/verify` 哲学契约审查。

```typescript
const audit = new DaoUniverseAudit(universe);

audit.run(): AuditSnapshot          // 执行全量哲学审查
audit.snapshot(): AuditSnapshot
audit.universe                       // 上层 DaoUniverse
audit.reporter                       // 底层 DaoVerificationReporter
```

---

### DaoUniverseScheduler

**v2.12.0** — `DaoUniverseClock × @daomind/times` 时序任务调度。

```typescript
const scheduler = new DaoUniverseScheduler(clock);

scheduler.schedule(task): string         // 返回 taskId
scheduler.cancel(taskId): boolean
scheduler.flush(): number                // 执行所有到期任务，返回执行数量
scheduler.snapshot(): SchedulerSnapshot
scheduler.clock                          // 上层 DaoUniverseClock

interface ExecutionRecord {
  taskId:    string
  executedAt: number
  result:    unknown
  duration:  number
}
```

---

### DaoUniverseSkills

**v2.13.0** — `DaoUniverseScheduler × @daomind/skills` 时序技能生命周期。

```typescript
const skills = new DaoUniverseSkills(scheduler);

skills.register(def): void
skills.activate(id): Promise<void>
skills.deactivate(id): Promise<void>
skills.snapshot(): SkillsSnapshot
skills.scheduler                         // 上层 DaoUniverseScheduler
skills.registry                          // 底层 DaoSkillRegistry
```

---

### DaoUniverseNexus

**v2.14.0** — `DaoUniverseMonitor × @daomind/nexus` 服务网格 × 宇宙健康。

```typescript
const nexus = new DaoUniverseNexus(monitor);

nexus.register(service): void
nexus.dispatch(req): Promise<NexusDispatchResult>
nexus.snapshot(): NexusMetrics
nexus.monitor                             // 上层 DaoUniverseMonitor
nexus.router                              // 底层 DaoNexusRouter
```

---

### DaoUniverseDocs

**v2.15.0** — `DaoUniverseAudit × @daomind/docs` 知识图谱 × 哲学文档管理。

```typescript
const docs = new DaoUniverseDocs(audit);

docs.addDoc(entry): void
docs.addNode(node): void
docs.snapshot(): DocsSnapshot
docs.audit                                // 上层 DaoUniverseAudit
docs.docStore                             // 底层 DaoDocStore
docs.knowledgeGraph                       // 底层 DaoKnowledgeGraph
```

---

### DaoUniverseSpaces

**v2.16.0** — `DaoUniverseNexus × @daomind/spaces` 命名空间 × 服务网格路由。

```typescript
const spaces = new DaoUniverseSpaces(nexus);

spaces.create(id, config?): DaoSpace
spaces.resolve(locator): DaoSpace | undefined
spaces.snapshot(): SpacesSnapshot
spaces.nexus                              // 上层 DaoUniverseNexus
spaces.namespace                          // 底层 DaoNamespaceManager
```

---

### DaoUniversePages

**v2.17.0** — `DaoUniverseScheduler × @daomind/pages` 组件树 × 时序驱动刷新。

```typescript
const pages = new DaoUniversePages(scheduler);

pages.mount(component): void
pages.bind(path, updater): () => void     // 返回 dispose 函数
pages.snapshot(): PagesSnapshot
pages.scheduler                           // 上层 DaoUniverseScheduler
pages.componentTree                       // 底层 DaoComponentTree
pages.stateBinding                        // 底层 DaoStateBinding
```

---

### DaoUniverseAgents

**v2.18.0** — `DaoUniverseMonitor × @daomind/agents` Agent 生命周期 × 监控健康反馈。

```typescript
const agents = new DaoUniverseAgents(monitor);

agents.spawn<T extends DaoBaseAgent>(AgentClass, id): T
  // 创建 Agent + 注册到独立 registry + heatmapEngine.record()

agents.terminate(id): Promise<boolean>
agents.activate(id): Promise<boolean>
agents.rest(id): Promise<boolean>
agents.getAgent(id): DaoBaseAgent | undefined
agents.listAll(): ReadonlyArray<DaoBaseAgent>
agents.findByCapability(cap): ReadonlyArray<DaoBaseAgent>
agents.findByType(type): ReadonlyArray<DaoBaseAgent>
agents.send(from, to, action, payload?): void  // 代理 daoAgentMessenger
agents.history(filter?): ReadonlyArray<AgentMessage>
agents.snapshot(): AgentsSnapshot

interface AgentsSnapshot {
  timestamp:   number
  total:       number
  active:      number
  dormant:     number
  byType:      Record<string, number>
  subscribers: number
}
```

> **注意**: `DaoUniverseAgents` 内部使用独立的 `DaoAgentRegistry`（与全局 `daoAgentRegistry` 隔离），但 `send/history` 代理全局 `daoAgentMessenger`（因为 `DaoBaseAgent` 硬绑定该单例）。

---

### DaoUniverseApps

**v2.19.0** — `DaoUniverseAgents × @daomind/apps` 应用状态机 × Agent 生命周期广播。

```typescript
const apps = new DaoUniverseApps(agents);

apps.register(def): void
apps.unregister(id): boolean
apps.start(id): Promise<void>    // 成功后广播 'app:started'
apps.stop(id): Promise<void>     // 成功后广播 'app:stopped'
apps.restart(id): Promise<void>  // 成功后广播 'app:restarted'
apps.getApp(id): DaoAppInstance | undefined
apps.listAll(): ReadonlyArray<DaoAppInstance>
apps.listByState(state): ReadonlyArray<DaoAppInstance>
apps.onStateChange(appId, cb): () => void   // 返回 dispose 函数
apps.getHistory(appId, limit?): ReadonlyArray<{ from, to, timestamp }>
apps.snapshot(): AppsSnapshot

interface AppsSnapshot {
  timestamp:   number
  total:       number
  running:     number
  registered:  number
  stopped:     number
  byState:     Partial<Record<AppState, number>>
}
```

---

### DaoUniverseTimes

**v2.20.0** — `DaoUniverseApps × @daomind/times` per-app 定时器追踪 × 时间窗口工具。

```typescript
const times = new DaoUniverseTimes(apps);

// 间隔定时器（绑定到 appId）
times.setInterval(appId, callback, options): DaoTimerHandle
times.setTimeout(appId, callback, delay): DaoTimerHandle
times.clearTimer(handle): void          // 自动识别 interval/timeout，幂等

// 一键清理
times.clearAllForApp(appId): number     // 返回已清除的资源总数

// 调度任务（绑定到 appId）
times.scheduleTask<T>(appId, task): string     // 返回 taskId
times.cancelTask(taskId): boolean

// 时间窗口工具
times.window(duration): DaoTimeWindow
times.windowContains(win, ts): boolean
times.windowOverlaps(a, b): boolean

times.snapshot(): TimesSnapshot

interface TimesSnapshot {
  timestamp:    number
  totalTimers:  number   // interval + timeout 句柄总数
  pendingTasks: number   // 已到期待执行任务数
  byApp: Record<string, { timers: number; tasks: number }>
}

// Getters
times.apps       // 上层 DaoUniverseApps
times.timer      // 底层 DaoTimer（独立实例）
times.scheduler  // 底层 DaoScheduler（独立实例）
```

---

### DaoUniverseModules

**v2.24.0** — `DaoUniverseApps × @daomind/anything` IoC 容器 × Agent 生命周期广播。

```typescript
const modules = new DaoUniverseModules(apps);

modules.register(module): void
modules.initialize(name): Promise<void>
modules.activate(name): Promise<void>    // 成功后广播 'module:activated'
modules.deactivate(name): Promise<void>
modules.terminate(name): Promise<void>   // 成功后广播 'module:terminated'
modules.getModule(name): DaoModuleMeta | undefined
modules.listModules(): ReadonlyArray<DaoModuleMeta>
modules.listByLifecycle(lifecycle): ReadonlyArray<DaoModuleMeta>
modules.resolve<T>(name): Promise<T>     // 需模块处于 active 状态

modules.snapshot(): ModulesSnapshot

interface ModulesSnapshot {
  timestamp:   number
  total:       number
  active:      number
  registered:  number
  terminated:  number
  byLifecycle: Partial<Record<ModuleLifecycle, number>>
}

// Getters
modules.apps       // 上层 DaoUniverseApps
modules.container  // 底层 DaoAnythingContainer（独立实例）
```

---

### DaoUniverseQi

**v2.22.0** — `DaoUniverseNexus × @modulux/qi` 混元气总线 × 服务网格路由融合。

```typescript
const qi = new DaoUniverseQi(nexus);

qi.addNode(nodeId: string, target?: string): void    // 注册路由节点
qi.removeNode(nodeId: string, target?: string): void // 移除路由节点（幂等）
qi.broadcast(messageType, body): Promise<void>       // 无签名广播（绕过 TianQiChannel 时间戳 Bug）
qi.report(sourceId, messageType, metrics): Promise<void>  // 地气度量上报
qi.subscribe(channelType, handler): () => void       // 订阅特定通道，返回取消订阅函数
qi.probe(target): Promise<number>                    // 探测目标往返延迟（ms）
qi.snapshot(): QiSnapshot

interface QiSnapshot {
  timestamp:       number
  totalEmitted:    number  // 已发送消息总数
  totalDropped:    number  // 被丢弃消息总数
  channelsStats:   Record<string, number>
  registeredNodes: number
}

// Getters
qi.nexus   // 上层 DaoUniverseNexus
qi.bus     // 底层 HunyuanBus
qi.tian    // TianQiChannel（天气广播，注意签名 Bug 已在 broadcast() 绕过）
qi.di      // DiQiChannel（地气度量聚合缓冲）
qi.ren     // RenQiChannel（人气 P2P 通信）
qi.chong   // ChongQiRegulator（中气调控器，帛书：阴阳居间调和）
```

---

### DaoUniverseBenchmark

**v2.23.0** — `DaoUniverseMonitor × @daomind/benchmark` 性能基准测试 × 宇宙健康感知。

```typescript
const bench = new DaoUniverseBenchmark(monitor);

bench.runQuick(): Promise<BenchmarkRunRecord>         // 3 快速套件 + 前后 health() 采集
bench.runAll(): Promise<BenchmarkRunRecord>           // 6 完整套件 + 前后 health() 采集
bench.runSuite(name: string): Promise<DaoBenchmarkResult>  // 单套件（不追加 history）
bench.generateReport(format?: 'text'|'json'|'markdown'): string
bench.history(): ReadonlyArray<BenchmarkRunRecord>
bench.clearHistory(): void
bench.snapshot(): BenchmarkSnapshot

interface BenchmarkRunRecord {
  timestamp:    number
  healthBefore: number  // monitor.health() before run
  healthAfter:  number  // monitor.health() after run
  report:       DaoPerformanceReport
}

interface BenchmarkSnapshot {
  timestamp:   number
  totalRuns:   number
  lastRunAt:   number | null
  lastHealth:  number | undefined
  historySize: number
}

// Getters
bench.monitor  // 上层 DaoUniverseMonitor
bench.runner   // 底层 DaoBenchmarkRunner（独立实例）
```

---

### DaoUniverseDiagnostic

**v2.24.0** — `DaoUniverseAudit × DaoUniverseBenchmark` 宇宙综合诊断，并行双轴执行。

```typescript
const diag = new DaoUniverseDiagnostic(audit, benchmark);

diag.diagnose(): Promise<DiagnosticRecord>           // Promise.all 并行：哲学审查 + 性能基准
diag.generateReport(record, format?: 'text'|'json'|'markdown'): string
diag.history(): ReadonlyArray<DiagnosticRecord>
diag.clearHistory(): void
diag.snapshot(): DiagnosticSnapshot

interface DiagnosticRecord {
  timestamp:     number
  auditReport:   DaoVerificationReport   // 哲学一致性六维报告
  benchRecord:   BenchmarkRunRecord      // 性能基准 + 宇宙健康前后值
  runtimeHealth: number                  // = benchRecord.healthAfter
}

interface DiagnosticSnapshot {
  timestamp:        number
  totalDiagnoses:   number
  lastDiagnosisAt:  number | null
  lastAuditScore:   number | undefined   // DaoVerificationReport.overallScore
  lastBenchHealth:  number | undefined   // BenchmarkRunRecord.healthAfter
  historySize:      number
}

// Getters
diag.audit      // 关联的 DaoUniverseAudit
diag.benchmark  // 关联的 DaoUniverseBenchmark

// 典型用法
const record = await diag.diagnose();
// → auditReport.overallScore: 哲学得分
// → benchRecord.report.summary: 性能套件摘要
// → runtimeHealth: 宇宙当前健康分数

const md = diag.generateReport(record, 'markdown');
// → 生成含 摘要卡片 + 哲学六维表 + 性能套件表 + 建议列表 的完整 Markdown
```

---


---

## 消费者层（Consumer Layer）

> 消费者层是 DaoUniverse* 桥接体系之上的**纯消费者组件**，自 v2.25.0 起引入。
> 它们不拥有任何子系统实例，只读取桥接体系数据进行聚合、分析、建议。

---

### DaoUniverseFacade

**v2.25.0** — 全栈自动装配门面，一行构建完整 17 桥接器宇宙。

```typescript
import { DaoUniverseFacade } from '@daomind/collective';

const facade = new DaoUniverseFacade();
// 内部自动依次构建全部 17 个 DaoUniverse* 桥接器实例

// 访问各层桥接器
facade.universe     // DaoUniverse
facade.monitor      // DaoUniverseMonitor
facade.clock        // DaoUniverseClock
facade.feedback     // DaoUniverseFeedback
facade.audit        // DaoUniverseAudit
facade.scheduler    // DaoUniverseScheduler
facade.nexus        // DaoUniverseNexus
facade.docs         // DaoUniverseDocs
facade.spaces       // DaoUniverseSpaces
facade.qi           // DaoUniverseQi
facade.skills       // DaoUniverseSkills
facade.pages        // DaoUniversePages
facade.agents       // DaoUniverseAgents
facade.apps         // DaoUniverseApps
facade.times        // DaoUniverseTimes
facade.modules      // DaoUniverseModules
facade.benchmark    // DaoUniverseBenchmark
facade.diagnostic   // DaoUniverseDiagnostic

facade.snapshot(): FacadeSnapshot

interface FacadeSnapshot {
  timestamp: number
  universe:  ReturnType<DaoUniverse['snapshot']>
  monitor:   MonitorSnapshot
  // ... 各桥接器快照
}
```

---

### DaoUniverseHealthBoard

**v2.26.0** — 宇宙健康蒸馏仪表盘，趋势感知（纯消费者）。

```typescript
import { DaoUniverseHealthBoard } from '@daomind/collective';

const board = new DaoUniverseHealthBoard(facade);

board.measure(): HealthRecord       // 采集一次健康快照
board.trend(): HealthTrend          // 'stable' | 'improving' | 'degrading'
board.history(): ReadonlyArray<HealthRecord>
board.clearHistory(): void
board.snapshot(): HealthBoardSnapshot

export type HealthTrend = 'stable' | 'improving' | 'degrading';

interface HealthRecord {
  readonly timestamp: number
  readonly score:     number    // 0~1
  readonly trend:     HealthTrend
}

interface HealthBoardSnapshot {
  readonly timestamp:    number
  readonly latestScore:  number | null
  readonly trend:        HealthTrend
  readonly historySize:  number
}

// Getters
board.facade   // 关联的 DaoUniverseFacade
```

---

### DaoUniverseOptimizer

**v2.27.0** — 宇宙优化建议引擎（二级消费者，基于 HealthBoard 历史）。  
帛书宇宙生成论映射：道→一（Facade）→二（HealthBoard）→三（Optimizer）→万物（建议）。

```typescript
import { DaoUniverseOptimizer } from '@daomind/collective';

const optimizer = new DaoUniverseOptimizer(board);

optimizer.analyze(): OptimizationReport      // 读取 board.history()，生成分析报告
optimizer.recommend(): readonly Recommendation[]  // analyze().recommendations 快捷方式
optimizer.history(): ReadonlyArray<OptimizationReport>
optimizer.clearHistory(): void
optimizer.snapshot(): OptimizerSnapshot

export type RecommendationLevel = 'info' | 'warn' | 'critical';
export type RecommendationArea  = 'monitor' | 'qi' | 'apps' | 'bench' | 'diag' | 'system';

interface Recommendation {
  readonly level:   RecommendationLevel
  readonly area:    RecommendationArea
  readonly message: string
}

interface OptimizationReport {
  readonly timestamp:        number
  readonly trend:            HealthTrend
  readonly sampleCount:      number
  readonly averageScore:     number
  readonly minScore:         number
  readonly maxScore:         number
  readonly scoreRange:       number
  readonly recommendations:  readonly Recommendation[]
}

interface OptimizerSnapshot {
  readonly timestamp:   number
  readonly analysisCount: number
  readonly lastAnalysisAt: number | null
  readonly lastReportSize: number
}

// Getters
optimizer.board   // 关联的 DaoUniverseHealthBoard

// 典型用法：一键宇宙健康评估 + 优化建议
const facade    = new DaoUniverseFacade();
const board     = new DaoUniverseHealthBoard(facade);
const optimizer = new DaoUniverseOptimizer(board);

board.measure();          // 采集基准健康值
const report = optimizer.analyze();
console.log(report.recommendations);
// → [{ level: 'info', area: 'system', message: '系统健康状况良好...' }]
```

## 类型工具

### 类型守卫

```typescript
import { daoIsOk, daoIsErr, daoIsSome, daoIsNone } from '@daomind/nothing';

// DaoResult 守卫
if (daoIsOk(result))  { /* result.value 可用 */ }
if (daoIsErr(result)) { /* result.error 可用 */ }

// DaoOption 守卫
if (daoIsSome(opt)) { /* opt.value 可用 */ }
if (daoIsNone(opt)) { /* 无值 */ }
```

---

## 常见模式

### 模式 1：完整 DaoUniverse* 层次构建（含消费者层）

```typescript
// 方式 A：手动逐层构建（精细控制）
import {
  DaoUniverse, DaoUniverseMonitor, DaoUniverseAgents,
  DaoUniverseApps, DaoUniverseTimes, DaoUniverseModules,
  DaoUniverseNexus, DaoUniverseQi, DaoUniverseAudit,
  DaoUniverseBenchmark, DaoUniverseDiagnostic,
  DaoUniverseFacade, DaoUniverseHealthBoard, DaoUniverseOptimizer,
} from '@daomind/collective';

const universe   = new DaoUniverse();
const monitor    = new DaoUniverseMonitor(universe);
const agents     = new DaoUniverseAgents(monitor);
const apps       = new DaoUniverseApps(agents);
const times      = new DaoUniverseTimes(apps);
const modules    = new DaoUniverseModules(apps);
const nexus      = new DaoUniverseNexus(monitor);
const qi         = new DaoUniverseQi(nexus);
const audit      = new DaoUniverseAudit(universe);
const benchmark  = new DaoUniverseBenchmark(monitor);
const diagnostic = new DaoUniverseDiagnostic(audit, benchmark);

// 方式 B：消费者层（v2.25.0+，推荐生产环境）
const facade    = new DaoUniverseFacade();      // 一行装配全部 17 桥接器
const board     = new DaoUniverseHealthBoard(facade);   // 健康蒸馏
const optimizer = new DaoUniverseOptimizer(board);      // 优化建议引擎
```

### 模式 5：宇宙综合诊断

```typescript
const diag = new DaoUniverseDiagnostic(audit, benchmark);

// 并行运行哲学审查 + 性能基准（Promise.all）
const record = await diag.diagnose();
console.log(`哲学得分: ${record.auditReport.overallScore}`);
console.log(`宇宙健康: ${record.runtimeHealth}`);
console.log(`性能套件: ${record.benchRecord.report.summary.totalSuites}`);

const md = diag.generateReport(record, 'markdown');
// 生成包含摘要卡片 + 哲学六维 + 性能套件表的完整报告
```

### 模式 2：应用启动 + 定时器 + 停止清理

```typescript
apps.register({ id: 'worker', name: 'Worker', version: '1.0.0', entry: './worker' });
await apps.start('worker');

// 绑定时序资源
const h = times.setInterval('worker', () => poll(), { interval: 1000 });
const taskId = times.scheduleTask('worker', { executeAt: Date.now() + 5000, handler: report, priority: 1 });

// 停止时一键清理
await apps.stop('worker');
times.clearAllForApp('worker'); // 清除 h + taskId
```

### 模式 3：模块生命周期 + Agent 广播监听

```typescript
modules.register({ name: 'auth', version: '1.0.0', path: './auth' });
await modules.initialize('auth');
await modules.activate('auth');

// 验证广播
const hist = agents.history({ action: 'module:activated' });
console.log(hist.at(-1)?.payload); // { name: 'auth' }
```

### 模式 4：时间窗口检测

```typescript
const win = times.window(30_000); // 30 秒窗口
const isRecent = times.windowContains(win, someTimestamp);

const winA = times.window(10_000);
const winB = { start: Date.now() + 5000, end: Date.now() + 15000, duration: 10000 };
console.log(times.windowOverlaps(winA, winB)); // true（重叠）
```

---

## 版本兼容性

| 版本 | TypeScript | Node.js | 测试数 |
|------|-----------|---------|--------|
| v2.46.3 | >=5.9.0 | >=18.0.0 | 1000 |
| v2.27.2 | >=5.9.0 | >=18.0.0 | 1000 |
| v2.27.0 | >=5.9.0 | >=18.0.0 | 1000 |
| v2.26.0 | >=5.9.0 | >=18.0.0 | 971 |
| v2.25.0 | >=5.9.0 | >=18.0.0 | 941 |
| v2.24.0 | >=5.9.0 | >=18.0.0 | 908 |
| v2.23.0 | >=5.9.0 | >=18.0.0 | 877 |
| v2.22.0 | >=5.9.0 | >=18.0.0 | 847 |
| v2.21.0 | >=5.9.0 | >=18.0.0 | 817 |
| v2.18.0 | >=5.9.0 | >=18.0.0 | 723 |
| v2.6.0  | >=5.0.0 | >=18.0.0 | 345 |
| v2.x    | >=5.0.0 | >=18.0.0 | — |
| v1.x    | >=4.5.0 | >=16.0.0 | — |

---

## 相关资源

- [快速开始](../GETTING-STARTED.md)
- [最佳实践](./BEST-PRACTICES.md)
- [FAQ](../FAQ.md)
- [示例代码](../examples/)

---

**文档版本**: 2.46.3  
**最后更新**: 2026-04-17  
**维护者**: DaoMind Team
