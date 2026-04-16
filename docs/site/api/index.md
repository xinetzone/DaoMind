# DaoMind & Modulux - API 参考文档

完整的 API 参考文档，涵盖所有核心包和接口。

> 📘 **版本**: 2.5.0  
> 📅 **更新日期**: 2026-04-16

---

## 📚 目录

- [核心包](#核心包)
  - [@daomind/nothing](#daomindnothing) - 类型定义（无名层）
  - [@daomind/anything](#daomindanything) - 模块系统（有名层）
  - [@daomind/agents](#daomindagents) - Agent 系统
- [功能包](#功能包)
  - [@daomind/chronos](#daomindchronos) - 时间管理
  - [@daomind/spaces](#daomindspaces) - 空间组织
  - [@modulux/qi](#moduluxqi) - 消息总线
  - [@daomind/feedback](#daomindfeedback) - 反馈机制
  - [@daomind/verify](#daomindverify) - 验证系统
- [工具包](#工具包)
  - [@daomind/monitor](#daomindmonitor) - 监控系统
  - [@daomind/benchmark](#daomindbenchmark) - 性能测试

---

## 核心包

### @daomind/nothing

**零运行时类型定义包**，实现"无名"（Nameless）哲学层。v2.5.0 起新增 `DaoOption<T>` 和 `DaoResult<T,E>` 函数式类型工具。

> 🎯 **设计理念**: 纯类型定义 + 虚空事件总线 + 函数式错误处理，零魔法、显式优先。

#### 安装

```bash
npm install @daomind/nothing
```

#### 导入

```typescript
import type {
  ExistenceContract,
  EmptyInterface,
  MutabilityContract,
} from '@daomind/nothing';
```

---

#### `ExistenceContract`

**存在性契约** - 标记实体的存在状态。

```typescript
interface ExistenceContract {
  readonly existentialType: 'nothing' | 'anything';
}
```

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `existentialType` | `'nothing' \| 'anything'` | 存在性类型标记 |

**哲学含义**:
- `'nothing'`: 处于"无名"状态（类型定义）
- `'anything'`: 处于"有名"状态（实例化）

**使用示例**:

```typescript
// 定义一个模块类型
interface UserModule extends ExistenceContract {
  readonly name: string;
  readonly email: string;
}

// 创建实例（从"无名"到"有名"）
const user: UserModule = {
  existentialType: 'anything',  // 标记为"有名"状态
  name: 'Alice',
  email: 'alice@example.com',
};
```

**最佳实践**:
- ✅ 所有自定义类型都应继承 `ExistenceContract`
- ✅ 实例化时始终设置 `existentialType: 'anything'`
- ✅ 使用 `type` 导入以确保零运行时

---

#### `EmptyInterface`

**空接口** - 所有接口的原型，表示纯粹的"无"。

```typescript
interface EmptyInterface {
  readonly [key: string]: never;
}
```

**使用场景**:
- 表示完全空的对象
- 作为泛型约束的基础
- 哲学概念的技术映射

**示例**:

```typescript
// 空对象表示"无"的状态
const nothingness: EmptyInterface = {};

// 作为泛型约束
function createEmpty<T extends EmptyInterface>(): T {
  return {} as T;
}
```

---

#### `MutabilityContract<T>`

**变易性契约** - 描述实体如何随时间变化。

```typescript
interface MutabilityContract<T> {
  readonly from: T;
  readonly to: T;
  readonly transition: 'gradual' | 'sudden' | 'cyclic';
}
```

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `from` | `T` | 变化前的状态 |
| `to` | `T` | 变化后的状态 |
| `transition` | `'gradual' \| 'sudden' \| 'cyclic'` | 变化方式 |

**变化类型**:
- `'gradual'`: 渐进式变化（如温度缓慢升高）
- `'sudden'`: 突变（如状态切换）
- `'cyclic'`: 循环往复（如昼夜交替）

**示例**:

```typescript
// 描述用户状态变化
interface UserState {
  status: 'active' | 'inactive';
  lastLogin: number;
}

const stateChange: MutabilityContract<UserState> = {
  from: { status: 'inactive', lastLogin: 0 },
  to: { status: 'active', lastLogin: Date.now() },
  transition: 'sudden',
};
```

---

### @daomind/anything

**模块系统包**，实现"有名"（Named）哲学层。

> 🎯 **设计理念**: 具体实现，运行时实体，管理模块生命周期。

#### 安装

```bash
npm install @daomind/anything
```

#### 导入

```typescript
import type {
  DaoModuleMeta,
  ModuleLifecycle,
  DaoModuleRegistration,
} from '@daomind/anything';

import { DaoAnythingContainer } from '@daomind/anything';
```

---

#### `DaoModuleMeta`

**模块元数据接口** - "有名"状态的标准实现。

```typescript
interface DaoModuleMeta extends ExistenceContract {
  readonly id: string;
  readonly name: string;
  readonly lifecycle: ModuleLifecycle;
  readonly createdAt: number;
  readonly registeredAt: number;
  readonly activatedAt?: number;
}
```

**字段说明**:

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | `string` | ✅ | 唯一标识符（建议使用 UUID） |
| `name` | `string` | ✅ | 模块名称 |
| `lifecycle` | `ModuleLifecycle` | ✅ | 生命周期状态 |
| `createdAt` | `number` | ✅ | 创建时间戳（毫秒） |
| `registeredAt` | `number` | ✅ | 注册时间戳（毫秒） |
| `activatedAt` | `number` | ❌ | 激活时间戳（可选） |

**使用示例**:

```typescript
interface TodoModule extends DaoModuleMeta {
  readonly title: string;
  readonly completed: boolean;
}

function createTodo(title: string): TodoModule {
  const now = Date.now();
  return {
    existentialType: 'anything',
    id: crypto.randomUUID(),
    name: `Todo:${title}`,
    lifecycle: 'active',
    createdAt: now,
    registeredAt: now,
    activatedAt: now,
    title,
    completed: false,
  };
}
```

---

#### `ModuleLifecycle`

**模块生命周期状态枚举**。

```typescript
type ModuleLifecycle =
  | 'registered'    // 已注册
  | 'initialized'   // 已初始化
  | 'active'        // 活跃中
  | 'suspending'    // 暂停中
  | 'terminated';   // 已终止
```

**状态流转图**:

```
registered → initialized → active → suspending → terminated
    ↓            ↓           ↓          ↓           ↓
  创建完成      初始化完成    正常运行    暂时挂起    彻底销毁
```

**状态说明**:

| 状态 | 说明 | 可执行操作 |
|------|------|-----------|
| `registered` | 模块已创建，未初始化 | 初始化、注销 |
| `initialized` | 初始化完成，未激活 | 激活、注销 |
| `active` | 正常运行中 | 暂停、终止 |
| `suspending` | 暂时挂起 | 恢复、终止 |
| `terminated` | 已销毁 | 无（终态） |

---

#### `DaoAnythingContainer`

**模块容器类** - 管理模块的注册、查找和生命周期。

```typescript
class DaoAnythingContainer {
  constructor();
  
  register<T extends DaoModuleMeta>(module: T): void;
  get<T extends DaoModuleMeta>(id: string): T | undefined;
  has(id: string): boolean;
  remove(id: string): boolean;
  clear(): void;
  size(): number;
  list(): DaoModuleMeta[];
}
```

**方法详解**:

##### `register<T>(module: T): void`

注册一个模块到容器。

```typescript
const container = new DaoAnythingContainer();
const todo = createTodo('学习 DaoMind');

container.register(todo);
```

**参数**:
- `module`: 要注册的模块实例

**异常**:
- 如果 `id` 已存在，抛出错误

---

##### `get<T>(id: string): T | undefined`

根据 ID 获取模块。

```typescript
const todo = container.get<TodoModule>('todo-id-123');
if (todo) {
  console.log(todo.title);
}
```

**参数**:
- `id`: 模块唯一标识

**返回**:
- 模块实例，如果不存在返回 `undefined`

---

##### `has(id: string): boolean`

检查模块是否存在。

```typescript
if (container.has('todo-id-123')) {
  console.log('模块存在');
}
```

---

##### `remove(id: string): boolean`

移除模块。

```typescript
const removed = container.remove('todo-id-123');
console.log(removed ? '移除成功' : '模块不存在');
```

**返回**:
- `true`: 移除成功
- `false`: 模块不存在

---

##### `clear(): void`

清空容器。

```typescript
container.clear();
console.log(container.size()); // 0
```

---

##### `size(): number`

获取容器中模块数量。

```typescript
const count = container.size();
console.log(`共有 ${count} 个模块`);
```

---

##### `list(): DaoModuleMeta[]`

列出所有模块。

```typescript
const modules = container.list();
modules.forEach(m => console.log(m.name));
```

---

### @daomind/agents

**Agent 系统包** - 自主行动实体。v2.4.0 起提供 `TaskAgent` / `ObserverAgent` / `CoordinatorAgent` 三种内置实现。

#### 安装

```bash
npm install @daomind/agents
```

#### 导入

```typescript
import type { DaoAgent, DaoAgentCapability, AgentState } from '@daomind/agents';
import { DaoBaseAgent, daoAgentMessenger, daoAgentRegistry } from '@daomind/agents';
import { TaskAgent, ObserverAgent, CoordinatorAgent } from '@daomind/agents';
```

---

#### `DaoAgent`

**Agent 接口** - 具有自主行动能力的实体。v2.5.0 起新增 `send()` / `onMessage()` 声明。

```typescript
interface DaoAgent extends ExistenceContract {
  readonly id: string;
  readonly agentType: string;
  readonly state: AgentState;
  readonly createdAt: number;
  readonly capabilities: ReadonlyArray<DaoAgentCapability>;
  
  initialize(): Promise<void>;
  activate(): Promise<void>;
  rest(): Promise<void>;
  terminate(): Promise<void>;
  execute<T>(action: string, payload?: unknown): Promise<T>;
  send(to: string | '*', action: string, payload?: unknown): void;
  onMessage(handler: MessageHandler): void;
}
```

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | Agent 唯一标识 |
| `agentType` | `string` | Agent 类型（如 'translator', 'analyzer'） |
| `state` | `AgentState` | 当前状态 |
| `createdAt` | `number` | 创建时间戳 |
| `capabilities` | `ReadonlyArray<DaoAgentCapability>` | 能力列表 |

**方法说明**:

| 方法 | 说明 |
|------|------|
| `initialize()` | 初始化 Agent |
| `activate()` | 激活 Agent |
| `rest()` | 使 Agent 休眠 |
| `terminate()` | 终止 Agent |
| `execute<T>(action, payload?)` | 执行特定动作 |

---

#### `AgentState`

**Agent 状态枚举**。

```typescript
type AgentState =
  | 'dormant'     // 休眠
  | 'awakening'   // 唤醒中
  | 'active'      // 活跃
  | 'resting'     // 休息中
  | 'deceased';   // 已终止
```

**状态流转**:

```
dormant → awakening → active → resting → deceased
  ↓         ↓          ↓         ↓         ↓
 休眠      正在启动    工作中    休息      终止
```

---

#### `DaoAgentCapability`

**Agent 能力定义**。

```typescript
interface DaoAgentCapability {
  readonly name: string;
  readonly version: string;
  readonly description?: string;
}
```

**示例**:

```typescript
const translateCapability: DaoAgentCapability = {
  name: 'translate',
  version: '1.0.0',
  description: '翻译文本的能力',
};

const agent: DaoAgent = {
  id: crypto.randomUUID(),
  existentialType: 'anything',
  agentType: 'translator',
  state: 'active',
  createdAt: Date.now(),
  capabilities: [translateCapability],
  
  async initialize() { /* ... */ },
  async activate() { /* ... */ },
  async rest() { /* ... */ },
  async terminate() { /* ... */ },
  async execute<T>(action: string, payload?: unknown): Promise<T> {
    // 执行逻辑
    return {} as T;
  },
};
```

---

## 功能包

### @modulux/qi

**消息总线** - 事件驱动通信。

#### 安装

```bash
npm install @modulux/qi
```

#### `QiBus`

**消息总线类**。

```typescript
class QiBus {
  constructor();
  
  publish(message: QiMessage): void;
  subscribe(type: string, handler: (msg: QiMessage) => void): () => void;
  unsubscribe(type: string, handler: (msg: QiMessage) => void): void;
}
```

**使用示例**:

```typescript
import { QiBus } from '@modulux/qi';

const bus = new QiBus();

// 订阅消息
const unsubscribe = bus.subscribe('user.created', (msg) => {
  console.log('新用户:', msg.payload);
});

// 发布消息
bus.publish({
  type: 'user.created',
  payload: { userId: '001', username: 'Alice' },
  source: 'user-service',
});

// 取消订阅
unsubscribe();
```

---

### @daomind/verify

**验证系统** - 基于道家哲学的代码检查。

#### 安装

```bash
npm install @daomind/verify
```

#### 检查项

| 检查 | 说明 | 哲学依据 |
|------|------|----------|
| `wu-you-balance` | 检查"无"与"有"的平衡 | 无名与有名 |
| `yin-yang-balance` | 检查阴阳平衡 | 阴阳调和 |
| `qi-fluency` | 检查"气"的流动性 | 气的畅通 |
| `wu-wei-verification` | 检查"无为"原则 | 无为而治 |
| `naming-convention` | 检查命名规范 | 正名 |

#### 使用

```bash
# 运行所有检查
npx dao-verify

# 运行特定检查
npx dao-verify --check wu-you-balance
```

---

## 工具包

### @daomind/monitor

**监控系统** - 系统健康监测（基于中医经络理论）。

#### 安装

```bash
npm install @daomind/monitor
```

---

### @daomind/benchmark

**性能测试** - 基准测试工具。

#### 安装

```bash
npm install @daomind/benchmark
```

#### 测试套件

- `nothing-size`: 零运行时验证
- `startup`: 启动性能
- `latency`: 延迟测试
- `throughput`: 吞吐量测试
- `memory`: 内存使用

#### 使用

```bash
npx dao-benchmark
```

---

## 类型工具

### 类型守卫

```typescript
import {
  isExistenceContract,
  isDaoModuleMeta,
  isDaoAgent,
} from '@daomind/nothing';

// 运行时类型检查
if (isExistenceContract(obj)) {
  console.log(obj.existentialType);
}
```

---

## 常见模式

### 模式 1: 创建模块工厂函数

```typescript
import type { DaoModuleMeta } from '@daomind/anything';

interface MyModule extends DaoModuleMeta {
  readonly data: string;
}

function createMyModule(data: string): MyModule {
  const now = Date.now();
  return {
    existentialType: 'anything',
    id: crypto.randomUUID(),
    name: `MyModule:${data}`,
    lifecycle: 'active',
    createdAt: now,
    registeredAt: now,
    activatedAt: now,
    data,
  };
}
```

### 模式 2: 实现 Agent

```typescript
import type { DaoAgent, DaoAgentCapability } from '@daomind/agents';

class MyAgent implements DaoAgent {
  readonly id: string;
  readonly existentialType = 'anything' as const;
  readonly agentType = 'custom';
  readonly createdAt: number;
  readonly capabilities: ReadonlyArray<DaoAgentCapability>;
  state: AgentState = 'dormant';
  
  constructor(capabilities: DaoAgentCapability[]) {
    this.id = crypto.randomUUID();
    this.createdAt = Date.now();
    this.capabilities = capabilities;
  }
  
  async initialize(): Promise<void> {
    this.state = 'awakening';
    // 初始化逻辑
    this.state = 'active';
  }
  
  async activate(): Promise<void> {
    this.state = 'active';
  }
  
  async rest(): Promise<void> {
    this.state = 'resting';
  }
  
  async terminate(): Promise<void> {
    this.state = 'deceased';
  }
  
  async execute<T>(action: string, payload?: unknown): Promise<T> {
    // 执行逻辑
    return {} as T;
  }
}
```

### 模式 3: 使用消息总线

```typescript
import { QiBus } from '@modulux/qi';

class EventDrivenSystem {
  private bus = new QiBus();
  
  setupHandlers(): void {
    this.bus.subscribe('event.type', this.handleEvent.bind(this));
  }
  
  private handleEvent(msg: QiMessage): void {
    console.log('收到事件:', msg);
  }
  
  publishEvent(data: unknown): void {
    this.bus.publish({
      type: 'event.type',
      payload: data,
      source: 'system',
    });
  }
}
```

---

## 版本兼容性

| 包版本 | TypeScript | Node.js |
|--------|-----------|---------|
| 2.x | >=5.0.0 | >=18.0.0 |
| 1.x | >=4.5.0 | >=16.0.0 |

---

## 相关资源

- [快速开始](../GETTING-STARTED.md)
- [交互式教程](../tutorials/INTERACTIVE-TUTORIAL.md)
- [FAQ](../FAQ.md)
- [最佳实践](./BEST-PRACTICES.md)
- [示例代码](../examples/)

---

**文档版本**: 2.5.0  
**最后更新**: 2026-04-16  
**维护者**: DaoMind Team
