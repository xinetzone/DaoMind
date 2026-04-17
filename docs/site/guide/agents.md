# Agent 系统

Agent 是 DaoMind 中具有自主行为、内部状态机和消息通信能力的智能模块单元。

## 什么是 Agent？

Agent 继承 `DaoBaseAgent`，具备：

- **生命周期状态机** — `dormant → awakening → active → resting → deceased`
- **自主执行** — 通过 `execute(action, payload)` 驱动逻辑
- **消息通信** — 通过 `send()` / `onMessage()` 与其他 Agent 解耦通信
- **事件观照** — 状态变化自动发布到 `daoNothingVoid` 全局事件总线

---

## 创建自定义 Agent

继承 `DaoBaseAgent` 并实现 `execute()` 方法：

```typescript
import { DaoBaseAgent } from '@daomind/agents'
import type { DaoAgentCapability } from '@daomind/agents'

class CounterAgent extends DaoBaseAgent {
  readonly agentType = 'counter'
  readonly capabilities: ReadonlyArray<DaoAgentCapability> = [
    { name: 'count', version: '1.0.0', description: '计数操作' },
  ]

  private count = 0

  async execute<T>(action: string, payload?: unknown): Promise<T> {
    switch (action) {
      case 'increment':
        this.count += (payload as number | undefined) ?? 1
        return this.count as T
      case 'decrement':
        this.count -= (payload as number | undefined) ?? 1
        return this.count as T
      case 'reset':
        this.count = 0
        return this.count as T
      case 'get':
        return this.count as T
      default:
        throw new Error(`[CounterAgent] 未知操作: ${action}`)
    }
  }
}
```

## 使用 Agent

```typescript
const counter = new CounterAgent('counter-1')

// 生命周期
await counter.initialize() // dormant → awakening
await counter.activate() // awakening → active

// 执行操作
await counter.execute('increment') // 1
await counter.execute('increment', 4) // 5
await counter.execute('decrement', 2) // 3

const value = await counter.execute<number>('get') // 3

// 休眠 / 恢复
await counter.rest() // active → resting
await counter.activate() // resting → active

// 终止
await counter.terminate() // → deceased
```

---

## Agent 间消息通信

Agent 通过 `DaoAgentMessenger`（底层走 `daoNothingVoid`）互相通信，**不直接持有对方引用**。

```typescript
const agentA = new CounterAgent('agent-a')
const agentB = new CounterAgent('agent-b')

await agentA.initialize()
await agentA.activate()
await agentB.initialize()
await agentB.activate()

// agentB 监听消息
agentB.onMessage((msg) => {
  console.log(`[${msg.from} → ${msg.to}] ${msg.action}:`, msg.payload)
})

// agentA 向 agentB 发送消息
agentA.send('agent-b', 'increment', 5)
// 输出: [agent-a → agent-b] increment: 5

// 广播给所有订阅者
agentA.send('*', 'reset')
```

---

## 内置 Agent

DaoMind 提供三种开箱即用的 Agent 覆盖常见场景。

### TaskAgent — 优先级任务队列

```typescript
import { TaskAgent } from '@daomind/agents'

const tasks = new TaskAgent('task-runner')
await tasks.initialize()
await tasks.activate()

// 入队（priority 越大越先执行）
await tasks.execute('enqueue', { id: 'urgent', action: 'send-email', priority: 10 })
await tasks.execute('enqueue', { id: 'normal', action: 'generate-report', priority: 1 })

// 执行最高优先级（'urgent' 先执行）
const result = await tasks.execute('run-next')
// 完成后自动广播 task:completed

// 批量执行所有剩余任务
await tasks.execute('run-all')

// 查看队列状态
const status = await tasks.execute<{ pending: number; completed: number }>('status')
```

### ObserverAgent — 系统事件观察者

```typescript
import { ObserverAgent } from '@daomind/agents'

const observer = new ObserverAgent('system-eye')
await observer.initialize() // 开始监听 daoNothingVoid 事件
await observer.activate()

// 其他包的操作会触发事件...

// 系统快照
const snap = await observer.execute<{
  totalObservations: number
  lifecycleEvents: number
  messageEvents: number
}>('get-snapshot')

console.log(`共观察到 ${snap.totalObservations} 个事件`)
console.log(`其中生命周期事件 ${snap.lifecycleEvents} 个`)

// 按类型查历史
const agentEvents = await observer.execute('get-by-type', { type: 'agent:lifecycle' })

await observer.terminate() // 自动清除监听器
```

### CoordinatorAgent — 多 Agent 调度

```typescript
import { CoordinatorAgent, TaskAgent, daoAgentRegistry } from '@daomind/agents'

// 建立 Agent 群
const worker1 = new TaskAgent('worker-1')
const worker2 = new TaskAgent('worker-2')
const coord = new CoordinatorAgent('boss')

for (const a of [worker1, worker2, coord]) {
  daoAgentRegistry.register(a)
  await a.initialize()
  await a.activate()
}

// 建立协调关系
await coord.execute('add-agent', { agentId: 'worker-1' })
await coord.execute('add-agent', { agentId: 'worker-2' })

// 分配任务给指定 Agent
await coord.execute('assign', {
  agentId: 'worker-1',
  action: 'enqueue',
  payload: { id: 'j1', action: 'process-data', priority: 5 },
})

// 广播给所有托管 Agent
await coord.execute('broadcast', { action: 'run-all' })

// 查看名册状态
const roster = await coord.execute('get-roster')
console.log(`托管 ${roster.rosterSize} 个 Agent`)
```

---

## 注册中心

```typescript
import { daoAgentRegistry } from '@daomind/agents'

// 注册 Agent（供全局查找）
daoAgentRegistry.register(agent)

// 按 ID 查找
const agent = daoAgentRegistry.get('worker-1')

// 按能力查找
const taskAgents = daoAgentRegistry.findByCapability('execute-task')

// 注销
daoAgentRegistry.unregister('worker-1')
```

---

## 最佳实践

### 1. 生命周期管理

```typescript
// ✅ 正确：按顺序初始化
await agent.initialize()
await agent.activate()
// 使用 agent...
await agent.terminate()

// ❌ 错误：跳过 initialize 直接 activate
await agent.activate() // 抛出错误：非法状态转换
```

### 2. 消息通信

```typescript
// ✅ 使用消息总线，不直接持有对方引用
agentA.send('agent-b', 'action', payload)

// ❌ 不要直接调用
;(agentB as TaskAgent).execute('action', payload) // 破坏松耦合
```

### 3. ObserverAgent 内存安全

```typescript
// ✅ 确保调用 terminate() 移除监听器
const observer = new ObserverAgent('obs')
await observer.initialize()
// ... 使用 ...
await observer.terminate() // 自动 removeListener，无内存泄漏

// ❌ 不要跳过 terminate
process.exit() // 若未 terminate，EventEmitter 监听器可能泄漏
```

### 4. 测试时重置事件总线

```typescript
import { daoNothingVoid } from '@daomind/nothing'
import { DaoAgentContainerBridge } from '@daomind/agents'

let bridge: DaoAgentContainerBridge

beforeEach(() => {
  daoNothingVoid.void() // ← 先清空，移除所有旧监听器
  bridge = new DaoAgentContainerBridge() // ← 再注册新监听器
})

afterEach(() => {
  bridge.dispose()
})
```
