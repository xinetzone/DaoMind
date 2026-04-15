# @daomind/agents

Agent 系统包 — 提供有状态智能模块和消息总线。

## 安装

```bash
pnpm add @daomind/agents
```

## 核心 API

### `defineAgent(config)`

定义一个 Agent：

```typescript
import { defineAgent } from '@daomind/agents';

const counterAgent = defineAgent({
  id: 'counter',
  
  initialState: { count: 0 },
  
  handlers: {
    INCREMENT: ({ state }) => ({ count: state.count + 1 }),
    DECREMENT: ({ state }) => ({ count: state.count - 1 }),
    RESET: () => ({ count: 0 }),
  }
});
```

### `agent.create()`

创建 Agent 实例：

```typescript
const counter = counterAgent.create();

counter.send({ type: 'INCREMENT' });
counter.send({ type: 'INCREMENT' });

console.log(counter.getState()); // { count: 2 }
```

### `agent.subscribe(listener)`

订阅状态变化：

```typescript
const unsubscribe = counter.subscribe((state, prevState) => {
  console.log(`${prevState.count} → ${state.count}`);
});

counter.send({ type: 'INCREMENT' }); // 0 → 1

// 取消订阅
unsubscribe();
```

### `createMessageBus()`

创建消息总线：

```typescript
import { createMessageBus } from '@daomind/agents';

const bus = createMessageBus();

// 发布消息
bus.publish('user:login', { userId: '123', timestamp: Date.now() });

// 订阅消息
const unsubscribe = bus.subscribe('user:login', (event) => {
  console.log(`用户 ${event.userId} 登录`);
});

// 通配符订阅
bus.subscribe('user:*', (event, topic) => {
  console.log(`用户事件: ${topic}`);
});
```

## 类型定义

```typescript
// Agent 消息类型
type AgentMessage<T extends string = string, P = unknown> = {
  type: T;
  payload?: P;
  meta?: {
    timestamp?: number;
    source?: string;
  };
};

// Agent 实例类型
type AgentInstance<S, M extends AgentMessage> = {
  send(message: M): void;
  getState(): Readonly<S>;
  subscribe(listener: StateListener<S>): () => void;
  reset(): void;
};
```

## 与 @daomind/anything 集成

```typescript
import { defineModule } from '@daomind/anything';
import { defineAgent } from '@daomind/agents';

const cartAgent = defineAgent({ /* ... */ });

// 将 Agent 封装为模块
const cartModule = defineModule({
  id: 'cart',
  setup() {
    const cart = cartAgent.create();
    return {
      addItem: (item) => cart.send({ type: 'ADD_ITEM', payload: item }),
      removeItem: (id) => cart.send({ type: 'REMOVE_ITEM', payload: id }),
      getItems: () => cart.getState().items,
      subscribe: (listener) => cart.subscribe(listener),
    };
  }
});
```
