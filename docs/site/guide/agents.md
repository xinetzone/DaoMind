# Agent 系统

Agent 是 DaoMind 中具有自主行为和状态的智能模块单元。

## 什么是 Agent？

Agent 是一种特殊的模块，它：

- **有自己的状态** — 内部状态机
- **响应消息** — 通过消息总线通信
- **自主决策** — 根据状态和消息做出响应

```
普通模块：  输入 → 函数 → 输出
Agent：    消息 → 状态机 → 行为 + 新状态
```

## 创建基础 Agent

```typescript
import { defineAgent } from '@daomind/agents';

// 定义 Agent 状态类型
type CounterState = {
  count: number;
  isRunning: boolean;
};

// 定义消息类型
type CounterMessage = 
  | { type: 'INCREMENT'; amount?: number }
  | { type: 'DECREMENT'; amount?: number }
  | { type: 'RESET' }
  | { type: 'START' }
  | { type: 'STOP' };

const counterAgent = defineAgent<CounterState, CounterMessage>({
  id: 'counter-agent',
  
  // 初始状态
  initialState: {
    count: 0,
    isRunning: false,
  },
  
  // 消息处理器
  handlers: {
    INCREMENT({ state, message }) {
      if (!state.isRunning) return state;
      return { ...state, count: state.count + (message.amount ?? 1) };
    },
    
    DECREMENT({ state, message }) {
      if (!state.isRunning) return state;
      return { ...state, count: state.count - (message.amount ?? 1) };
    },
    
    RESET({ state }) {
      return { ...state, count: 0 };
    },
    
    START({ state }) {
      return { ...state, isRunning: true };
    },
    
    STOP({ state }) {
      return { ...state, isRunning: false };
    },
  }
});
```

## 使用 Agent

```typescript
// 获取 agent 实例
const counter = counterAgent.create();

// 订阅状态变化
counter.subscribe(state => {
  console.log(`Count: ${state.count}, Running: ${state.isRunning}`);
});

// 发送消息
counter.send({ type: 'START' });
counter.send({ type: 'INCREMENT' });
counter.send({ type: 'INCREMENT', amount: 5 });
counter.send({ type: 'DECREMENT' });
counter.send({ type: 'STOP' });

// 输出:
// Count: 0, Running: true
// Count: 1, Running: true
// Count: 6, Running: true
// Count: 5, Running: true
// Count: 5, Running: false
```

## Agent 间通信

通过消息总线实现 Agent 间通信：

```typescript
import { createMessageBus } from '@daomind/agents';

const bus = createMessageBus();

// Agent A：发布者
const producerAgent = defineAgent({
  id: 'producer',
  // ...
  handlers: {
    PRODUCE({ state, context }) {
      // 通过总线广播
      context.bus.publish('data:ready', { payload: state.data });
      return state;
    }
  }
});

// Agent B：订阅者
const consumerAgent = defineAgent({
  id: 'consumer',
  // ...
  setup({ bus }) {
    // 订阅来自其他 agent 的消息
    bus.subscribe('data:ready', (event) => {
      this.send({ type: 'PROCESS', data: event.payload });
    });
  }
});
```

## 有状态 Agent vs 无状态模块

| 特性 | 普通模块 | Agent |
|------|---------|-------|
| 状态 | 无/简单 | 复杂状态机 |
| 通信 | 直接调用 | 消息传递 |
| 生命周期 | 简单 | 完整状态转换 |
| 适用场景 | 工具函数 | 业务逻辑 |

## 下一步

- [API 参考 - @daomind/agents](/api/agents)
- [示例：聊天应用](/examples/chat-app)
- [示例：多 Agent 系统](/examples/multi-agent)
