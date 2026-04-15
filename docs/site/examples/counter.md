# Counter 示例

使用 Agent 构建一个带状态的计数器。

## 完整代码

```typescript
// counter.ts
import { defineAgent } from '@daomind/agents';

// 状态类型
type CounterState = {
  count: number;
  min: number;
  max: number;
};

// 消息类型
type CounterMessage =
  | { type: 'INCREMENT'; amount?: number }
  | { type: 'DECREMENT'; amount?: number }
  | { type: 'SET'; value: number }
  | { type: 'RESET' };

// 定义 Agent
const counterAgent = defineAgent<CounterState, CounterMessage>({
  id: 'counter',
  
  initialState: {
    count: 0,
    min: -Infinity,
    max: Infinity,
  },
  
  handlers: {
    INCREMENT({ state, message }) {
      const next = state.count + (message.amount ?? 1);
      return { ...state, count: Math.min(next, state.max) };
    },
    
    DECREMENT({ state, message }) {
      const next = state.count - (message.amount ?? 1);
      return { ...state, count: Math.max(next, state.min) };
    },
    
    SET({ state, message }) {
      const clamped = Math.min(Math.max(message.value, state.min), state.max);
      return { ...state, count: clamped };
    },
    
    RESET({ state }) {
      return { ...state, count: 0 };
    },
  }
});

// 使用
const counter = counterAgent.create();

// 订阅状态变化
counter.subscribe(state => {
  console.log(`Count: ${state.count}`);
});

counter.send({ type: 'INCREMENT' });          // Count: 1
counter.send({ type: 'INCREMENT', amount: 5 }); // Count: 6
counter.send({ type: 'DECREMENT', amount: 2 }); // Count: 4
counter.send({ type: 'SET', value: 100 });    // Count: 100
counter.send({ type: 'RESET' });              // Count: 0
```

## 带边界的计数器

```typescript
// 限制范围在 0-10 之间
const boundedCounter = counterAgent.create();
boundedCounter.send({ type: 'SET', value: 0 });

// 修改初始状态
const limitedAgent = defineAgent<CounterState, CounterMessage>({
  id: 'limited-counter',
  initialState: { count: 0, min: 0, max: 10 },
  handlers: counterAgent.handlers, // 复用 handlers
});

const limited = limitedAgent.create();
limited.send({ type: 'SET', value: 15 }); // 被限制为 10
console.log(limited.getState().count); // 10
```
