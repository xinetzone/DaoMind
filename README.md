# DaoMind & Modulux

> 道家哲学遇见现代 TypeScript —— "无名，万物之始也；有名，万物之母也。" — 帛书《道德经》

[![npm](https://img.shields.io/npm/v/@daomind/nothing?label=%40daomind%2Fnothing)](https://www.npmjs.com/package/@daomind/nothing)
[![Tests](https://img.shields.io/badge/tests-345%20passed-brightgreen)](https://github.com/xinetzone/DaoMind)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)

## 简介

**DaoMind** 是基于道家哲学宇宙论的现代化 TypeScript 框架，采用 pnpm monorepo 架构设计。核心思想来自帛书版《道德经》：

- **无（daoNothing）**：潜在性空间，编译期类型契约，零运行时开销
- **有（daoAnything）**：显化容器，运行时模块注册与生命周期管理
- **行动（daoAgents）**：自主实体，任务执行、事件观察、协调调度
- **应用（daoApps）**：可执行程序层，状态机驱动的应用生命周期
- **道宇宙（daoCollective）**：根节点门面，统一入口，系统快照

## 特性

- **19+ 独立包**，从基础契约到完整生态，按需引入零冗余
- **345 测试用例**（31 套件），TypeScript 5.9 严格模式，100% 类型安全
- **零运行时开销**：类型定义编译后完全消失
- **哲学一致**：每一个 API 命名都有对应的道家哲学根据
- **DaoOption\<T\> + DaoResult\<T,E\>**：函数式错误处理，无 null/undefined 异常

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
```

## 用法示例

### 方式一：通过 DaoUniverse 统一门面（推荐）

```typescript
import { daoUniverse, TaskAgent, ObserverAgent } from '@daomind/collective';

// 工厂方法：创建 Agent + 自动注册
const worker = daoUniverse.createAgent(TaskAgent, 'worker-1');
await worker.initialize();
await worker.activate();

// 添加任务
await worker.execute('enqueue', { id: 't1', action: 'process', priority: 10 });

// 注册应用
const app = daoUniverse.createApp({
  id: 'my-app', name: '我的应用', version: '1.0.0', entry: './app',
});
await daoUniverse.appContainer.start('my-app');

// 系统全局快照
const snap = daoUniverse.snapshot();
console.log(snap.agents.byState);  // { active: 1 }
console.log(snap.apps.byState);    // { running: 1 }
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
await obs.initialize();  // 开始监听 daoNothingVoid
const history = await obs.execute('get-history', { limit: 20 });

// CoordinatorAgent —— Agent 名册与任务分派
const coord = new CoordinatorAgent('coord-1');
await coord.initialize();
await coord.activate();
await coord.execute('add-agent', { agentId: 'task-1' });
await coord.execute('assign', { agentId: 'task-1', action: 'enqueue', payload: { id: 'j2', action: 'cleanup' } });
```

## 包生态（v2.6.0）

| 包名 | 层级 | 描述 |
|------|------|------|
| `@daomind/nothing` | 无（类型空间） | 类型契约、DaoOption、DaoResult、虚空事件总线 |
| `@daomind/anything` | 有（值空间） | 模块容器、生命周期管理 |
| `@daomind/agents` | 行动层 | DaoBaseAgent、TaskAgent、ObserverAgent、CoordinatorAgent |
| `@daomind/apps` | 应用层 | DaoAppContainer、状态机驱动应用生命周期 |
| `@daomind/collective` | 根节点 | DaoUniverse 门面、全系统再导出 |
| `@modulux/qi` | 气（消息总线） | 四通道事件通信（天/地/人/冲） |
| `@daomind/monitor` | 监控 | 阴阳仪表盘、热力图、向量场、告警引擎 |
| `@daomind/verify` | 验证 | 数据校验与契约验证 |
| `@daomind/chronos` | 时间 | 定时任务与时间管理 |
| `@daomind/feedback` | 反馈 | 四阶段生命周期调节 |
| `@daomind/nexus` | 连接 | 系统集成与负载均衡 |
| `@daomind/spaces` | 空间 | 命名空间与隔离管理 |
| `@daomind/skills` | 技能 | 能力组合与动态扩展 |
| `@daomind/benchmark` | 基准测试 | 性能评估与优化指导 |

## 架构概览

```
daoNothing ─────── 无名层（类型契约 + DaoNothingVoid 事件总线 + DaoOption/DaoResult）
    │
daoAnything ─────── 有名层（DaoAnythingContainer 模块注册与生命周期）
    │
daoAgents ──────── 行动层（DaoBaseAgent + Messenger + Registry + Bridge）
    │               ├── TaskAgent（优先级任务队列）
    │               ├── ObserverAgent（事件监听与历史）
    │               └── CoordinatorAgent（Agent 名册与任务分派）
daoApps ─────────── 应用层（DaoAppContainer 状态机）
    │
daoCollective ───── 根节点（DaoUniverse 统一门面 + 全系统再导出）
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

# 运行全量测试（345 个，31 套件）
pnpm test

# 运行单包测试
npx jest packages/daoCollective --no-coverage
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
| v2.6.0 | 345 | DaoUniverse 根节点门面、@daomind/collective 完整实装 |
| v2.5.0 | 320 | DaoOption\<T\> + DaoResult\<T,E\> 函数式类型工具、CI 测试步骤 |
| v2.4.0 | 281 | TaskAgent / ObserverAgent / CoordinatorAgent 三大内置 Agent |
| v2.3.0 | 248 | DaoAgentContainerBridge 生命周期桥接 |
| v2.2.0 | — | daoApps 应用层初版 |
| v2.1.0 | — | daoAgents 智能体系统初版 |

## License

[MIT](LICENSE) © DaoMind Team
