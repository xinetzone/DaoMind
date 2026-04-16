# DaoMind & Modulux

> 道家哲学遇见现代 TypeScript —— "无名，万物之始也；有名，万物之母也。" — 帛书《道德经》

[![npm](https://img.shields.io/npm/v/@daomind/nothing?label=%40daomind%2Fnothing)](https://www.npmjs.com/package/@daomind/nothing)
[![Tests](https://img.shields.io/badge/tests-817%20passed-brightgreen)](https://github.com/xinetzone/DaoMind)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)

## 简介

**DaoMind** 是基于道家哲学宇宙论的现代化 TypeScript 框架，采用 pnpm monorepo 架构设计。核心思想来自帛书版《道德经》：

- **无（daoNothing）**：潜在性空间，编译期类型契约，零运行时开销
- **有（daoAnything）**：显化容器，运行时模块注册与生命周期管理
- **行动（daoAgents）**：自主实体，任务执行、事件观察、协调调度
- **应用（daoApps）**：可执行程序层，状态机驱动的应用生命周期
- **时序（daoTimes）**：定时器与调度，per-app 资源追踪与精准清理
- **道宇宙（daoCollective）**：根节点门面，统一入口，系统快照，DaoUniverse* 层次化桥接器

## 特性

- **20+ 独立包**，从基础契约到完整生态，按需引入零冗余
- **817 测试用例**（46 套件），TypeScript 5.9 严格模式，100% 类型安全
- **零运行时开销**：类型定义编译后完全消失
- **哲学一致**：每一个 API 命名都有对应的道家哲学根据
- **DaoOption\<T\> + DaoResult\<T,E\>**：函数式错误处理，无 null/undefined 异常
- **DaoUniverse* 桥接体系**：14 个分层桥接器，将所有子包统一融入宇宙门面

## 快速开始

```bash
# 使用脚手架创建项目
pnpx create-daomind my-app

# 进入项目并安装依赖
cd my-app && pnpm install

# 启动开发服务器
pnpm dev
```

或直接安装单个包：

```bash
pnpm add @daomind/collective   # 根节点（推荐，包含所有核心包的再导出）
pnpm add @daomind/nothing      # 仅需类型与虚空事件总线
pnpm add @daomind/anything     # 仅需模块容器
pnpm add @daomind/agents       # 仅需 Agent 系统
pnpm add @daomind/times        # 仅需定时器与任务调度
```

## 用法示例

### 方式一：DaoUniverse* 分层桥接体系（推荐）

```typescript
import {
  DaoUniverse,
  DaoUniverseMonitor,
  DaoUniverseAgents,
  DaoUniverseApps,
  DaoUniverseTimes,
  DaoUniverseModules,
} from '@daomind/collective';

// 1. 构建 DaoUniverse* 层次结构
const universe = new DaoUniverse();
const monitor  = new DaoUniverseMonitor(universe);
const agents   = new DaoUniverseAgents(monitor);
const apps     = new DaoUniverseApps(agents);
const times    = new DaoUniverseTimes(apps);
const modules  = new DaoUniverseModules(apps);

// 2. 注册并启动应用
apps.register({ id: 'my-app', name: '示例应用', version: '1.0.0', entry: './app' });
await apps.start('my-app');

// 3. 为应用分配定时资源（自动与 appId 绑定）
const handle = times.setInterval('my-app', () => console.log('心跳'), { interval: 1000 });
times.scheduleTask('my-app', { executeAt: Date.now() + 5000, handler: () => '任务执行', priority: 1 });

// 4. 注册 IoC 模块（activate 后广播给所有 Agent）
modules.register({ name: 'auth', version: '1.0.0', path: './modules/auth' });
await modules.initialize('auth');
await modules.activate('auth');
// → agents.history() 中出现 'module:activated' 消息

// 5. 停止应用时一键清理全部时序资源
await apps.stop('my-app');
times.clearAllForApp('my-app');

// 6. 系统快照
console.log(apps.snapshot());   // { total: 1, running: 0, stopped: 1, ... }
console.log(times.snapshot());  // { totalTimers: 0, pendingTasks: 0, byApp: {} }
console.log(modules.snapshot()); // { total: 1, active: 1, ... }
```

### 方式二：函数式错误处理（DaoResult / DaoOption）

```typescript
import { daoTryAsync, daoIsOk, daoUnwrapOr, daoFromNullable } from '@daomind/nothing';

// 异步错误处理
const result = await daoTryAsync(() => fetch('/api/data').then(r => r.json()));
if (daoIsOk(result)) {
  console.log(result.value);
} else {
  console.error(result.error.message);
}

// 可空值处理
const opt = daoFromNullable(user?.profile);
const name = daoUnwrapOr(opt, '匿名用户');
```

### 方式三：三大内置 Agent 协同

```typescript
import { TaskAgent, ObserverAgent, CoordinatorAgent, daoAgentMessenger } from '@daomind/agents';
import { daoNothingVoid } from '@daomind/nothing';

// 清空事件总线（测试隔离）
daoNothingVoid.void();

// TaskAgent —— 优先级任务队列
const task = new TaskAgent('task-1');
await task.initialize();
await task.activate();
await task.execute('enqueue', { id: 'job-1', action: 'render', priority: 5 });
await task.execute('run-next');

// ObserverAgent —— 系统事件监听
const obs = new ObserverAgent('observer-1');
await obs.initialize();
const history = await obs.execute('get-history', { limit: 20 });

// CoordinatorAgent —— Agent 名册与任务分派
const coord = new CoordinatorAgent('coord-1');
await coord.initialize();
await coord.activate();
await coord.execute('add-agent', { agentId: 'task-1' });
await coord.execute('assign', { agentId: 'task-1', action: 'enqueue', payload: { id: 'j2', action: 'cleanup' } });
```

### 方式四：DaoUniverseTimes 定时器管理

```typescript
import { DaoUniverse, DaoUniverseMonitor, DaoUniverseAgents,
         DaoUniverseApps, DaoUniverseTimes } from '@daomind/collective';

const universe = new DaoUniverse();
const apps  = new DaoUniverseApps(new DaoUniverseAgents(new DaoUniverseMonitor(universe)));
const times = new DaoUniverseTimes(apps);

apps.register({ id: 'worker', name: 'Worker', version: '1.0.0', entry: './worker' });

// setInterval — 绑定到 'worker' 应用
const h1 = times.setInterval('worker', () => doWork(), { interval: 500 });
// setTimeout — 绑定到 'worker' 应用
const h2 = times.setTimeout('worker',  () => cleanup(), 10000);
// 调度任务
const taskId = times.scheduleTask('worker', {
  executeAt: Date.now() + 3000,
  handler:   () => runTask(),
  priority:  1,
});

// 时间窗口工具
const win = times.window(60_000);
console.log(times.windowContains(win, Date.now())); // true

// 快照
console.log(times.snapshot());
// { totalTimers: 2, pendingTasks: 1, byApp: { worker: { timers: 2, tasks: 1 } } }

// 应用停止时一键清理（清除该 app 的所有 intervals + timeouts + tasks）
times.clearAllForApp('worker'); // → 返回 3（已清除数量）
```

## 包生态（v2.21.0）

### 核心包

| 包名 | 层级 | 描述 |
|------|------|------|
| `@daomind/nothing` | 无（类型空间） | 类型契约、DaoOption、DaoResult、虚空事件总线 |
| `@daomind/anything` | 有（值空间） | 模块容器、生命周期管理（registered → active → terminated） |
| `@daomind/agents` | 行动层 | DaoBaseAgent、TaskAgent、ObserverAgent、CoordinatorAgent |
| `@daomind/apps` | 应用层 | DaoAppContainer、DaoLifecycleManager，状态机驱动应用生命周期 |
| `@daomind/times` | 时序层 | DaoTimer、DaoScheduler、daoTimeWindow，定时器与任务调度 |
| `@daomind/collective` | 根节点 | DaoUniverse 门面、DaoUniverse* 全系列桥接器、全系统再导出 |

### 功能包

| 包名 | 层级 | 描述 |
|------|------|------|
| `@modulux/qi` | 气（消息总线） | 四通道事件通信（天/地/人/冲） |
| `@daomind/monitor` | 监控 | 阴阳仪表盘、热力图、向量场、告警引擎 |
| `@daomind/verify` | 验证 | 哲学契约验证，wu-you-balance / yin-yang-balance |
| `@daomind/chronos` | 时钟 | 高精度时序心跳，DaoChronos 时间源 |
| `@daomind/feedback` | 反馈 | 四阶段闭环调节（DaoFeedbackRegulator） |
| `@daomind/nexus` | 连接 | 服务发现、负载均衡、路由（DaoNexusRouter） |
| `@daomind/spaces` | 空间 | 命名空间管理与隔离（DaoNamespaceManager） |
| `@daomind/skills` | 技能 | 能力组合、动态扩展（DaoSkillRegistry + Activator） |
| `@daomind/pages` | 组件 | 组件树与状态绑定（DaoComponentTree + DaoStateBinding） |
| `@daomind/docs` | 文档 | 知识图谱与 API 文档追踪（DaoDocStore + DaoKnowledgeGraph） |
| `@daomind/benchmark` | 基准测试 | 性能评估与优化指导 |

### DaoUniverse* 桥接体系（@daomind/collective 内部）

| 桥接器 | 版本 | 集成关系 |
|--------|------|----------|
| `DaoUniverseMonitor` | v2.8.0 | `DaoUniverse × @daomind/monitor` |
| `DaoUniverseClock` | v2.9.0 | `DaoUniverse × @daomind/chronos`（心跳层） |
| `DaoUniverseFeedback` | v2.10.0 | `DaoUniverseClock × @daomind/feedback` |
| `DaoUniverseAudit` | v2.11.0 | `DaoUniverse × @daomind/verify` |
| `DaoUniverseScheduler` | v2.12.0 | `DaoUniverseClock × @daomind/times`（调度层） |
| `DaoUniverseSkills` | v2.13.0 | `DaoUniverseScheduler × @daomind/skills` |
| `DaoUniverseNexus` | v2.14.0 | `DaoUniverseMonitor × @daomind/nexus` |
| `DaoUniverseDocs` | v2.15.0 | `DaoUniverseAudit × @daomind/docs` |
| `DaoUniverseSpaces` | v2.16.0 | `DaoUniverseNexus × @daomind/spaces` |
| `DaoUniversePages` | v2.17.0 | `DaoUniverseScheduler × @daomind/pages` |
| `DaoUniverseAgents` | v2.18.0 | `DaoUniverseMonitor × @daomind/agents` |
| `DaoUniverseApps` | v2.19.0 | `DaoUniverseAgents × @daomind/apps` |
| `DaoUniverseTimes` | v2.20.0 | `DaoUniverseApps × @daomind/times`（per-app 定时器） |
| `DaoUniverseModules` | v2.21.0 | `DaoUniverseApps × @daomind/anything`（IoC × Agent 广播） |

## 架构概览

```
daoNothing ─────── 无名层（类型契约 + DaoNothingVoid 事件总线 + DaoOption/DaoResult）
    │
daoAnything ─────── 有名层（DaoAnythingContainer 模块注册与生命周期）
    │
daoAgents ──────── 行动层（DaoBaseAgent + Messenger + Registry）
    │               ├── TaskAgent（优先级任务队列）
    │               ├── ObserverAgent（事件监听与历史）
    │               └── CoordinatorAgent（Agent 名册与任务分派）
daoApps ─────────── 应用层（DaoAppContainer 状态机 + DaoLifecycleManager）
    │
daotimes ─────────── 时序层（DaoTimer + DaoScheduler + daoTimeWindow）
    │
daoCollective ───── 根节点（DaoUniverse 统一门面 + DaoUniverse* 分层桥接体系）
    │
    └── DaoUniverse（全局宇宙快照）
          ├── DaoUniverseMonitor (v2.8.0)  ← @daomind/monitor 监控桥接
          │       ├── DaoUniverseAgents (v2.18.0) ← @daomind/agents × Monitor
          │       │       └── DaoUniverseApps (v2.19.0) ← @daomind/apps × Agents
          │       │               ├── DaoUniverseTimes   (v2.20.0) ← @daomind/times × Apps
          │       │               └── DaoUniverseModules (v2.21.0) ← @daomind/anything × Apps
          │       ├── DaoUniverseClock (v2.9.0)
          │       │       ├── DaoUniverseFeedback  (v2.10.0)
          │       │       ├── DaoUniverseScheduler (v2.12.0)
          │       │       │       ├── DaoUniverseSkills (v2.13.0)
          │       │       │       └── DaoUniversePages  (v2.17.0)
          │       └── DaoUniverseNexus (v2.14.0)
          │               └── DaoUniverseSpaces (v2.16.0)
          └── DaoUniverseAudit (v2.11.0)
                  └── DaoUniverseDocs (v2.15.0)
```

## 开发环境

| 依赖 | 最低版本 |
|------|---------|
| Node.js | 18.0+ |
| TypeScript | 5.9+ |
| pnpm | 8.0+ |
| Git | 2.20+ |

## 构建与测试

```bash
# 安装所有工作区依赖
pnpm install

# 构建所有包
pnpm -r run build

# 运行全量测试（817 个，46 套件）
pnpm test

# 运行单包测试
npx jest packages/daoCollective --no-coverage

# 运行特定桥接器测试
npx jest packages/daoCollective/src/__tests__/universe-times.test.ts --no-coverage
```

## 发布

npm 发布通过 GitHub Actions 手动触发（`workflow_dispatch`），防止 2FA 阻断 CI：

```bash
# Actions → publish-npm → Run workflow
```

## 文档站

- **指南**：https://xinetzone.github.io/DaoMind/guide/
- **API 参考**：https://xinetzone.github.io/DaoMind/api/
- **示例**：https://xinetzone.github.io/DaoMind/examples/

## 版本历史

| 版本 | 测试数 | 亮点 |
|------|--------|------|
| v2.21.0 | 817 | DaoUniverseModules — @daomind/anything × DaoUniverseApps IoC 容器 × Agent 广播 |
| v2.20.0 | 788 | DaoUniverseTimes — @daomind/times × DaoUniverseApps per-app 定时器追踪 |
| v2.19.0 | 756 | DaoUniverseApps — @daomind/apps × DaoUniverseAgents 应用状态机 × Agent 广播 |
| v2.18.0 | 723 | DaoUniverseAgents — @daomind/agents × DaoUniverseMonitor 生命周期 × 监控 |
| v2.17.0 | 691 | DaoUniversePages — @daomind/pages × DaoUniverseScheduler 组件树 × 时序刷新 |
| v2.16.0 | 665 | DaoUniverseSpaces — @daomind/spaces × DaoUniverseNexus 命名空间 × 路由 |
| v2.15.0 | 641 | DaoUniverseDocs — @daomind/docs × DaoUniverseAudit 知识图谱 × 哲学审查 |
| v2.14.0 | 617 | DaoUniverseNexus — @daomind/nexus × DaoUniverseMonitor 服务网格 |
| v2.13.0 | 592 | DaoUniverseSkills — @daomind/skills × DaoUniverseScheduler 时序技能 |
| v2.12.0 | 565 | DaoUniverseScheduler — @daomind/times × DaoUniverseClock 时序调度 |
| v2.11.0 | 535 | DaoUniverseAudit — @daomind/verify × DaoUniverse 哲学审查 |
| v2.10.0 | 510 | DaoUniverseFeedback — @daomind/feedback × DaoUniverseClock 闭环反馈 |
| v2.9.0  | 478 | DaoUniverseClock — @daomind/chronos × DaoCollective 时序心跳 |
| v2.8.0  | 446 | DaoUniverseMonitor — @daomind/monitor × DaoUniverse 健康监控 |
| v2.6.0  | 345 | DaoUniverse 根节点门面、@daomind/collective 完整实装 |
| v2.5.0  | 320 | DaoOption\<T\> + DaoResult\<T,E\> 函数式类型工具、CI 测试步骤 |
| v2.4.0  | 281 | TaskAgent / ObserverAgent / CoordinatorAgent 三大内置 Agent |
| v2.3.0  | 248 | DaoAgentContainerBridge 生命周期桥接 |
| v2.2.0  | —   | daoApps 应用层初版 |
| v2.1.0  | —   | daoAgents 智能体系统初版 |

## License

[MIT](LICENSE) © DaoMind Team
