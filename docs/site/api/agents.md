# @daomind/agents

**行动** 核心包 — 具有自主行为、消息通信能力的 Agent 系统。

> "为而不争。"  
> —— 马王堆汉墓帛书《老子》乙本

## 安装

```bash
pnpm add @daomind/agents @daomind/nothing
```

---

## 核心概念

DaoMind Agent 系统分四层：

```
DaoBaseAgent          ← 继承此类实现自定义 Agent
    ↕ send/onMessage
DaoAgentMessenger     ← 点对点 + 广播消息总线（底层用 daoNothingVoid）
    ↕ mount/unmount
DaoAgentContainerBridge ← Agent 与 daoAnything 容器的生命周期同步
    ↕ register/findByCapability
DaoAgentRegistry      ← 全局 Agent 注册中心
```

---

## 实现自定义 Agent

继承 `DaoBaseAgent` 并实现 `execute()` 方法：

```typescript
import { DaoBaseAgent } from '@daomind/agents';
import type { DaoAgentCapability } from '@daomind/agents';

class MyAgent extends DaoBaseAgent {
  readonly agentType = 'my-agent';
  readonly capabilities: ReadonlyArray<DaoAgentCapability> = [
    { name: 'my-capability', version: '1.0.0', description: '做某事' },
  ];

  async execute<T>(action: string, payload?: unknown): Promise<T> {
    switch (action) {
      case 'greet':
        return `你好，${payload}！` as T;
      default:
        throw new Error(`未知操作: ${action}`);
    }
  }
}

// 使用
const agent = new MyAgent('my-agent-1');
await agent.initialize();   // dormant → awakening
await agent.activate();     // awakening → active

const greeting = await agent.execute<string>('greet', '道友');
// => '你好，道友！'

await agent.terminate();    // → deceased
```

---

## DaoBaseAgent

### 生命周期

```
dormant → awakening → active → resting → dormant（可循环）
    ↓         ↓          ↓        ↓
initialize() activate()  rest()  activate()
                          └────────────────→ terminate() → deceased
```

| 方法 | 状态转换 |
|------|---------|
| `initialize()` | dormant → awakening |
| `activate()` | awakening / resting → active |
| `rest()` | active → resting |
| `terminate()` | 任意 → deceased |

### 消息通信

```typescript
// 发送消息给指定 Agent
agent.send('target-agent-id', 'do-something', { key: 'value' });

// 广播给所有订阅者
agent.send('*', 'announce', { message: '开始了' });

// 接收消息
agent.onMessage((msg) => {
  console.log(msg.from, msg.action, msg.payload);
});
```

### `execute<T>(action, payload?)`

抽象方法，子类必须实现。规范：

```typescript
async execute<T>(action: string, payload?: unknown): Promise<T> {
  switch (action) {
    case 'my-action': return doSomething(payload) as T;
    default: throw new Error(`[MyAgent] 未知操作: ${action}`);
  }
}
```

---

## DaoAgentMessenger

独立的 Agent 间消息总线，底层基于 `daoNothingVoid`。

```typescript
import { daoAgentMessenger } from '@daomind/agents';
```

### API

```typescript
// 发送消息（from → to，或广播 '*'）
daoAgentMessenger.send('agent-a', 'agent-b', 'do-work', { data: 42 });

// 订阅消息（接收发给自己和广播消息）
daoAgentMessenger.subscribe('agent-b', (msg) => {
  console.log(msg.action, msg.payload);
});

// 取消订阅
daoAgentMessenger.unsubscribe('agent-b');

// 查询消息历史（所有 / 按条件过滤）
const all = daoAgentMessenger.history();
const fromA = daoAgentMessenger.history({ from: 'agent-a' });
const myMsgs = daoAgentMessenger.history({ to: 'agent-b', action: 'do-work' });
```

### `AgentMessage` 结构

```typescript
interface AgentMessage {
  readonly id: string;          // 唯一 ID
  readonly from: string;        // 发送者 agentId
  readonly to: string | '*';    // 接收者 agentId 或广播
  readonly action: string;      // 消息类型
  readonly payload?: unknown;   // 载荷
  readonly timestamp: number;   // 时间戳
}
```

---

## DaoAgentRegistry

全局 Agent 注册中心。

```typescript
import { daoAgentRegistry } from '@daomind/agents';

// 注册
daoAgentRegistry.register(agent);

// 查找
const agent = daoAgentRegistry.get('my-agent-1');

// 按能力查找
const agents = daoAgentRegistry.findByCapability('execute-task');

// 注销
daoAgentRegistry.unregister('my-agent-1');
```

---

## DaoAgentContainerBridge

将 Agent 生命周期事件同步到 `DaoAnythingContainer`。

```typescript
import { daoAgentContainerBridge } from '@daomind/agents';
import { DaoAnythingContainer } from '@daomind/anything';

const container = new DaoAnythingContainer();
const agent = new MyAgent('task-1');

// 绑定：Agent 状态变化时自动同步容器生命周期
daoAgentContainerBridge.mount(agent, container);

await agent.initialize(); // 容器内模块随之初始化
await agent.activate();   // 容器内模块随之激活

// 解绑
daoAgentContainerBridge.unmount('task-1');

// 清理资源（移除 daoNothingVoid 监听器）
daoAgentContainerBridge.dispose();
```

---

## 内置 Agent

### TaskAgent — 优先级任务队列

```typescript
import { TaskAgent } from '@daomind/agents';

const agent = new TaskAgent('tasks');
await agent.initialize();
await agent.activate();

// 入队（priority 越大越先执行）
await agent.execute('enqueue', { id: 't1', action: 'low-priority',  priority: 0 });
await agent.execute('enqueue', { id: 't2', action: 'high-priority', priority: 10 });

// 执行最高优先级任务，并广播 task:completed
const result = await agent.execute('run-next');

// 批量执行全部任务
await agent.execute('run-all');

// 队列状态
const status = await agent.execute('status');
// => { pending: 0, completed: 2, agentId: 'tasks' }

// 清空队列
await agent.execute('clear');
```

**完成广播**：每次 `run-next` 后自动 `agent.send('*', 'task:completed', result)`，其他 Agent 可监听。

---

### ObserverAgent — 系统事件观察者

```typescript
import { ObserverAgent } from '@daomind/agents';

const observer = new ObserverAgent('sys-observer');
await observer.initialize(); // ← 开始监听 daoNothingVoid 事件
await observer.activate();

// 系统快照（事件计数）
const snapshot = await observer.execute('get-snapshot');
// => { totalObservations: 42, lifecycleEvents: 20, messageEvents: 15, otherEvents: 7, ... }

// 最近 10 条记录
const recent = await observer.execute('get-history', { limit: 10 });

// 按类型过滤
const lifecycle = await observer.execute('get-by-type', { type: 'agent:lifecycle' });

// 清空本地记录
await observer.execute('clear');

await observer.terminate(); // ← 自动移除监听器，无内存泄漏
```

---

### CoordinatorAgent — 多 Agent 调度

```typescript
import { CoordinatorAgent } from '@daomind/agents';

const coord = new CoordinatorAgent('coordinator');
await coord.initialize();
await coord.activate();

// 管理名册
await coord.execute('add-agent', { agentId: 'task-agent-1' });
await coord.execute('add-agent', { agentId: 'task-agent-2' });

// 向指定 Agent 派发任务
await coord.execute('assign', {
  agentId: 'task-agent-1',
  action: 'enqueue',
  payload: { id: 'job-1', action: 'process', priority: 5 },
});

// 广播给全部名册成员
await coord.execute('broadcast', { action: 'run-all' });

// 名册快照
const roster = await coord.execute('get-roster');
// => { coordinatorId, rosterSize: 2, roster: [...], totalAssignments: 3 }

// 分配历史
const history = await coord.execute('get-assignments', { limit: 10 });

// 按能力查找名册内 Agent
const taskAgents = await coord.execute('find-agent', { capability: 'execute-task' });
```

---

## 三 Agent 协同示例

```typescript
import { TaskAgent, ObserverAgent, CoordinatorAgent } from '@daomind/agents';
import { daoAgentRegistry } from '@daomind/agents';

// 初始化全部
const taskA = new TaskAgent('task-a');
const taskB = new TaskAgent('task-b');
const observer = new ObserverAgent('observer');
const coord = new CoordinatorAgent('coordinator');

for (const agent of [taskA, taskB, observer, coord]) {
  daoAgentRegistry.register(agent);
  await agent.initialize();
  await agent.activate();
}

// 协调者托管两个任务 Agent
await coord.execute('add-agent', { agentId: 'task-a' });
await coord.execute('add-agent', { agentId: 'task-b' });

// 广播任务给所有任务 Agent
await coord.execute('broadcast', { action: 'enqueue',
  payload: { id: 'job-1', action: 'process', priority: 5 } });

// 观察系统状态
const snapshot = await observer.execute('get-snapshot');
console.log('系统事件总数:', snapshot.totalObservations);
```

---

## AgentState 状态机

```typescript
type AgentState = 'dormant' | 'awakening' | 'active' | 'resting' | 'deceased';
```

| 状态 | 含义 | 可转换到 |
|------|------|---------|
| `dormant` | 休眠（初始） | awakening, deceased |
| `awakening` | 启动中 | active, dormant, deceased |
| `active` | 运行中 | resting, deceased |
| `resting` | 休息中 | active, dormant, deceased |
| `deceased` | 已终止（终态） | — |

---

## 完整导出列表

```typescript
import type { DaoAgent, DaoAgentCapability, AgentState } from '@daomind/agents';
import type { AgentMessage, MessageHandler, MessageFilter } from '@daomind/agents';

import { DaoBaseAgent, AGENT_LIFECYCLE_EVENT } from '@daomind/agents';
import { daoAgentMessenger, DaoAgentMessenger } from '@daomind/agents';
import { daoAgentRegistry, DaoAgentRegistry } from '@daomind/agents';
import { daoAgentContainerBridge, DaoAgentContainerBridge } from '@daomind/agents';
import { TaskAgent, ObserverAgent, CoordinatorAgent } from '@daomind/agents';

import type { AgentTask, TaskResult, QueueSnapshot } from '@daomind/agents';
import type { Observation, SystemSnapshot } from '@daomind/agents';
import type { AssignmentRecord, CoordinatorSnapshot } from '@daomind/agents';
```
