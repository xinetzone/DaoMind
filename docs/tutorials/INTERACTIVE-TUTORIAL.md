# DaoMind & Modulux - 交互式教程

欢迎来到 DaoMind 交互式教程！通过这个教程，你将逐步学习如何使用 DaoMind 构建应用。

> 💡 **学习方式**: 每个章节都包含理论讲解、代码示例和实践任务。建议按顺序完成。

---

## 📚 教程目录

- [第 1 章：理解"无名"与"有名"](#第-1-章理解无名与有名)
- [第 2 章：创建第一个模块](#第-2-章创建第一个模块)
- [第 3 章：使用 Agent 系统](#第-3-章使用-agent-系统)
- [第 4 章：时空管理](#第-4-章时空管理)
- [第 5 章：数据流与消息](#第-5-章数据流与消息)
- [第 6 章：综合实战](#第-6-章综合实战)

---

## 第 1 章：理解"无名"与"有名"

### 🎯 学习目标
- 理解道家哲学中的"无名"和"有名"概念
- 掌握 TypeScript 类型空间与值空间的区别
- 学会使用 @daomind/nothing 包

### 📖 理论讲解

#### 道家哲学基础

在道家哲学中：
- **无名**（Wúmíng）：未被定义、未被命名的原初状态，万物的开始
- **有名**（Yǒumíng）：已被定义、已被命名的显化状态，万物的具体形态

#### TypeScript 映射

```typescript
// "无名"阶段 - 类型定义（Type Space）
// 这只是一个"概念"，编译后不存在
type Person = {
  name: string;
  age: number;
};

// "有名"阶段 - 值定义（Value Space）
// 这是一个实际存在的对象
const alice: Person = {
  name: 'Alice',
  age: 30
};
```

### 💻 代码示例

```typescript
// lesson1-nameless-named.ts

// 步骤 1: 导入"无名"层的契约
import type { ExistenceContract } from '@daomind/nothing';

// 步骤 2: 定义你的类型（"无名"阶段）
interface Book extends ExistenceContract {
  readonly title: string;
  readonly author: string;
  readonly pages: number;
}

// 步骤 3: 创建实例（"命名"过程，到"有名"阶段）
const daoDeJing: Book = {
  existentialType: 'anything',  // 标记为"有名"状态
  title: '道德经',
  author: '老子',
  pages: 5000,
};

// 步骤 4: 使用
console.log('📖 书籍:', daoDeJing);
console.log('✨ 类型检查:', typeof daoDeJing); // 'object'
console.log('🎯 存在性类型:', daoDeJing.existentialType); // 'anything'
```

### ✏️ 实践任务

**任务 1.1**: 定义一个 `Movie` 类型
```typescript
// TODO: 定义 Movie 接口，继承 ExistenceContract
// 属性：title(string), director(string), year(number), rating(number)

interface Movie extends ExistenceContract {
  // 在这里添加你的属性
}

// TODO: 创建一个电影实例
const favoriteMovie: Movie = {
  // 在这里填写属性
};
```

**任务 1.2**: 理解类型消失
```typescript
// 运行下面的代码，观察编译前后的差异

// 编译前（TypeScript）
type Shape = { area: number };
const square: Shape = { area: 100 };

// 编译后（JavaScript）
// type Shape 完全消失！
// const square = { area: 100 };

// ❓ 思考：为什么说类型是"无名"（零运行时）？
```

### ✅ 检查点
- [ ] 理解"无名"代表未命名的潜在状态
- [ ] 理解"有名"代表已命名的显化状态  
- [ ] 知道 TypeScript 类型在编译后消失
- [ ] 能够定义 ExistenceContract 的子类型

---

## 第 2 章：创建第一个模块

### 🎯 学习目标
- 使用 @daomind/anything 创建模块
- 理解 DaoModuleMeta 接口
- 掌握模块生命周期

### 📖 理论讲解

#### DaoModuleMeta 结构

```typescript
interface DaoModuleMeta extends ExistenceContract {
  readonly id: string;              // 唯一标识
  readonly name: string;            // 模块名称
  readonly lifecycle: ModuleLifecycle;  // 生命周期状态
  readonly createdAt: number;       // 创建时间戳
  readonly registeredAt: number;    // 注册时间戳
  readonly activatedAt?: number;    // 激活时间戳（可选）
}
```

#### 生命周期状态
```
created → registered → active → inactive → destroyed
  ↓          ↓           ↓          ↓          ↓
 创建       注册        激活       非活跃      销毁
```

### 💻 代码示例

```typescript
// lesson2-module.ts
import type { DaoModuleMeta } from '@daomind/anything';

// 步骤 1: 定义你的模块类型
interface UserModule extends DaoModuleMeta {
  readonly username: string;
  readonly email: string;
  readonly role: 'admin' | 'user' | 'guest';
}

// 步骤 2: 创建模块工厂函数
function createUserModule(
  username: string,
  email: string,
  role: 'admin' | 'user' | 'guest' = 'user'
): UserModule {
  const now = Date.now();
  
  return {
    // ExistenceContract
    existentialType: 'anything',
    
    // DaoModuleMeta
    id: crypto.randomUUID(),
    name: `User:${username}`,
    lifecycle: 'active',
    createdAt: now,
    registeredAt: now,
    activatedAt: now,
    
    // UserModule 特有属性
    username,
    email,
    role,
  };
}

// 步骤 3: 使用
const admin = createUserModule('alice', 'alice@example.com', 'admin');
const user = createUserModule('bob', 'bob@example.com');

console.log('👤 管理员:', admin);
console.log('👤 普通用户:', user);
```

### ✏️ 实践任务

**任务 2.1**: 创建产品模块
```typescript
// TODO: 定义 ProductModule 接口
interface ProductModule extends DaoModuleMeta {
  // 添加属性：productName, price, category, inStock
}

// TODO: 实现 createProduct 工厂函数
function createProduct(
  productName: string,
  price: number,
  category: string
): ProductModule {
  // 实现创建逻辑
}

// TODO: 创建几个产品实例并打印
```

**任务 2.2**: 实现模块状态转换
```typescript
// TODO: 实现状态转换函数
function activateModule<T extends DaoModuleMeta>(module: T): T {
  // 将模块从 'registered' 转换到 'active'
}

function deactivateModule<T extends DaoModuleMeta>(module: T): T {
  // 将模块从 'active' 转换到 'inactive'
}

// 测试你的实现
```

### ✅ 检查点
- [ ] 理解 DaoModuleMeta 的所有字段
- [ ] 能够创建模块工厂函数
- [ ] 理解模块生命周期状态
- [ ] 能够实现状态转换逻辑

---

## 第 3 章：使用 Agent 系统

### 🎯 学习目标
- 理解 DaoAgent 概念
- 定义 Agent 能力（Capabilities）
- 创建和使用 Agent

### 📖 理论讲解

#### 什么是 Agent？

Agent 是具有**自主行动能力**的实体：
- 有明确的状态（active/idle/error）
- 有特定的能力集合
- 可以执行任务
- 可以与其他 Agent 协作

#### Agent 结构

```typescript
interface DaoAgent extends ExistenceContract {
  readonly id: string;
  readonly agentType: string;
  readonly state: AgentState;
  readonly createdAt: number;
  readonly capabilities: ReadonlyArray<DaoAgentCapability>;
}
```

### 💻 代码示例

```typescript
// lesson3-agent.ts
import type { DaoAgent, DaoAgentCapability } from '@daomind/agents';

// 步骤 1: 定义 Agent 能力
const translateCapability: DaoAgentCapability = {
  name: 'translate',
  description: '翻译文本的能力',
  parameters: {
    text: 'string',
    from: 'string',
    to: 'string'
  }
};

const summarizeCapability: DaoAgentCapability = {
  name: 'summarize',
  description: '总结文本的能力',
  parameters: {
    text: 'string',
    maxLength: 'number'
  }
};

// 步骤 2: 创建 Agent
function createTranslatorAgent(): DaoAgent {
  return {
    id: crypto.randomUUID(),
    existentialType: 'anything',
    createdAt: Date.now(),
    agentType: 'translator',
    state: 'active',
    capabilities: [translateCapability, summarizeCapability],
  };
}

// 步骤 3: 使用 Agent
const agent = createTranslatorAgent();

console.log('🤖 Agent 创建成功');
console.log('  类型:', agent.agentType);
console.log('  状态:', agent.state);
console.log('  能力数:', agent.capabilities.length);

// 步骤 4: 执行能力（简化示例）
function executeCapability(
  agent: DaoAgent,
  capabilityName: string,
  params: Record<string, unknown>
): void {
  const capability = agent.capabilities.find(c => c.name === capabilityName);
  
  if (!capability) {
    console.error(`❌ Agent 没有 "${capabilityName}" 能力`);
    return;
  }
  
  console.log(`✨ 执行能力: ${capability.description}`);
  console.log('  参数:', params);
  // 这里应该是实际的执行逻辑
}

executeCapability(agent, 'translate', {
  text: 'Hello World',
  from: 'en',
  to: 'zh'
});
```

### ✏️ 实践任务

**任务 3.1**: 创建数据分析 Agent
```typescript
// TODO: 定义数据分析相关的能力
const analyzeCapability: DaoAgentCapability = {
  // 定义能力：分析数据
};

const visualizeCapability: DaoAgentCapability = {
  // 定义能力：可视化数据
};

// TODO: 创建数据分析 Agent
function createDataAnalystAgent(): DaoAgent {
  // 实现创建逻辑
}
```

**任务 3.2**: 实现 Agent 协作
```typescript
// TODO: 创建两个 Agent，让它们协作完成任务
// Agent 1: 文本提取器（从文件中提取文本）
// Agent 2: 文本分析器（分析提取的文本）

// 提示：可以通过传递数据来实现协作
```

### ✅ 检查点
- [ ] 理解 Agent 的概念和用途
- [ ] 能够定义 Agent 能力
- [ ] 能够创建不同类型的 Agent
- [ ] 理解 Agent 之间的协作模式

---

## 第 4 章：时空管理

### 🎯 学习目标
- 理解"宙"（时间）和"宇"（空间）概念
- 使用 @daomind/chronos 管理时间流
- 使用 @daomind/spaces 组织空间

### 📖 理论讲解

#### 中国哲学中的宙宇

- **宙**（Zhòu）：时间之流，过去到未来的连续体
- **宇**（Yǔ）：空间之域，上下四方的范围

#### DaoMind 中的实现

```typescript
// 时间流（Chronos）
interface ChronosFlow {
  startTime: Date;
  endTime?: Date;
  flowType: 'linear' | 'cyclic' | 'branching';
}

// 空间组织（Spaces）
interface SpaceOrganization {
  name: string;
  dimension: number;
  boundary: SpaceBoundary;
}
```

### 💻 代码示例

```typescript
// lesson4-spacetime.ts
import type { ChronosFlow } from '@daomind/chronos';
import type { SpaceOrganization } from '@daomind/spaces';

// 步骤 1: 创建时间流
function createProjectTimeline(
  startDate: Date,
  endDate: Date
): ChronosFlow {
  return {
    id: crypto.randomUUID(),
    existentialType: 'anything',
    createdAt: Date.now(),
    startTime: startDate,
    endTime: endDate,
    flowType: 'linear',
    milestones: [],
  };
}

// 步骤 2: 创建空间
function createWorkspace(name: string): SpaceOrganization {
  return {
    id: crypto.randomUUID(),
    existentialType: 'anything',
    createdAt: Date.now(),
    name,
    dimension: 3,
    boundary: {
      type: 'bounded',
      constraints: {}
    },
    subspaces: [],
  };
}

// 步骤 3: 使用时空
const timeline = createProjectTimeline(
  new Date('2026-01-01'),
  new Date('2026-12-31')
);

const workspace = createWorkspace('Development Team');

console.log('⏰ 时间流:', timeline);
console.log('🌍 工作空间:', workspace);

// 步骤 4: 在时空中放置事件
interface Event {
  id: string;
  name: string;
  time: Date;
  space: string;  // workspace ID
}

const kickoffMeeting: Event = {
  id: crypto.randomUUID(),
  name: 'Project Kickoff',
  time: new Date('2026-01-15'),
  space: workspace.id,
};

console.log('📅 事件:', kickoffMeeting);
```

### ✏️ 实践任务

**任务 4.1**: 创建项目管理系统的时空结构
```typescript
// TODO: 创建一个项目的完整时空结构
// 1. 创建项目时间线（包含多个里程碑）
// 2. 创建多层级的空间（公司 → 部门 → 团队）
// 3. 在时空中安排多个事件
```

**任务 4.2**: 实现时空查询
```typescript
// TODO: 实现以下查询函数

// 查询特定时间范围内的事件
function findEventsInTimeRange(
  events: Event[],
  start: Date,
  end: Date
): Event[] {
  // 实现
}

// 查询特定空间内的事件
function findEventsInSpace(
  events: Event[],
  spaceId: string
): Event[] {
  // 实现
}
```

### ✅ 检查点
- [ ] 理解"宙"和"宇"的哲学含义
- [ ] 能够创建时间流和空间结构
- [ ] 理解时空的层次组织
- [ ] 能够在时空中查询和管理对象

---

## 第 5 章：数据流与消息

### 🎯 学习目标
- 理解"气"（Qi）的概念
- 使用消息总线进行通信
- 实现事件驱动架构

### 📖 理论讲解

#### "气"的哲学含义

在中医和道家哲学中，"气"是：
- 生命能量的流动
- 信息和物质的载体
- 连接万物的纽带

#### 在 DaoMind 中的体现

```typescript
// Qi 作为数据流和消息系统
interface QiMessage {
  type: string;
  payload: unknown;
  source: string;
  target?: string;
}
```

### 💻 代码示例

```typescript
// lesson5-qi.ts
import { QiBus } from '@modulux/qi';

// 步骤 1: 创建消息总线
const bus = new QiBus();

// 步骤 2: 定义消息类型
interface UserCreatedMessage {
  type: 'user.created';
  payload: {
    userId: string;
    username: string;
    email: string;
  };
}

interface OrderPlacedMessage {
  type: 'order.placed';
  payload: {
    orderId: string;
    userId: string;
    amount: number;
  };
}

// 步骤 3: 订阅消息
bus.subscribe('user.created', (message) => {
  console.log('📧 收到用户创建消息:', message.payload);
  // 处理逻辑：发送欢迎邮件
});

bus.subscribe('order.placed', (message) => {
  console.log('🛒 收到订单消息:', message.payload);
  // 处理逻辑：更新库存、发送确认邮件
});

// 步骤 4: 发布消息
bus.publish({
  type: 'user.created',
  payload: {
    userId: 'user-001',
    username: 'alice',
    email: 'alice@example.com'
  },
  source: 'user-service',
});

bus.publish({
  type: 'order.placed',
  payload: {
    orderId: 'order-001',
    userId: 'user-001',
    amount: 99.99
  },
  source: 'order-service',
});
```

### ✏️ 实践任务

**任务 5.1**: 构建事件驱动的博客系统
```typescript
// TODO: 定义以下消息类型
// - post.created（文章创建）
// - post.published（文章发布）
// - comment.added（评论添加）
// - like.added（点赞）

// TODO: 实现订阅者
// - 文章发布时，通知所有关注者
// - 有新评论时，通知文章作者
// - 点赞数达到100时，发送祝贺消息
```

**任务 5.2**: 实现请求-响应模式
```typescript
// TODO: 在消息总线上实现请求-响应模式
// 提示：使用关联ID（correlation ID）来匹配请求和响应

class RequestResponse {
  async request(type: string, payload: unknown): Promise<unknown> {
    // 实现请求并等待响应
  }
  
  respondTo(type: string, handler: (req: unknown) => unknown): void {
    // 实现响应处理器
  }
}
```

### ✅ 检查点
- [ ] 理解"气"作为数据流的比喻
- [ ] 能够使用消息总线发布和订阅
- [ ] 理解事件驱动架构的优势
- [ ] 能够实现复杂的消息模式

---

## 第 6 章：综合实战

### 🎯 学习目标
- 综合运用前5章的知识
- 构建一个完整的应用
- 理解架构设计最佳实践

### 💻 综合项目：任务管理系统

我们将构建一个完整的任务管理系统，包含：
- 用户管理（Module）
- 任务处理（Agent）
- 时间规划（Chronos）
- 空间组织（Spaces）
- 事件通信（Qi）

#### 项目结构

```typescript
// project-structure.ts

// 1. 定义核心类型
import type { DaoModuleMeta } from '@daomind/anything';
import type { DaoAgent } from '@daomind/agents';
import type { ChronosFlow } from '@daomind/chronos';
import type { SpaceOrganization } from '@daomind/spaces';
import { QiBus } from '@modulux/qi';

// 2. 任务模块
interface Task extends DaoModuleMeta {
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  assignee?: string;  // user ID
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
}

// 3. 任务处理 Agent
interface TaskAgent extends DaoAgent {
  assignedTasks: string[];  // task IDs
}

// 4. 消息总线
const messageBus = new QiBus();

// 5. 核心功能实现
class TaskManagementSystem {
  private tasks: Map<string, Task> = new Map();
  private agents: Map<string, TaskAgent> = new Map();
  private timeline: ChronosFlow;
  private workspace: SpaceOrganization;
  
  constructor() {
    this.timeline = this.createTimeline();
    this.workspace = this.createWorkspace();
    this.setupMessageHandlers();
  }
  
  // 创建时间线
  private createTimeline(): ChronosFlow {
    return {
      id: crypto.randomUUID(),
      existentialType: 'anything',
      createdAt: Date.now(),
      startTime: new Date(),
      flowType: 'linear',
    };
  }
  
  // 创建工作空间
  private createWorkspace(): SpaceOrganization {
    return {
      id: crypto.randomUUID(),
      existentialType: 'anything',
      createdAt: Date.now(),
      name: 'Task Management Workspace',
      dimension: 3,
      boundary: { type: 'bounded', constraints: {} },
    };
  }
  
  // 设置消息处理
  private setupMessageHandlers(): void {
    messageBus.subscribe('task.created', (msg) => {
      console.log('✅ 任务已创建:', msg.payload);
    });
    
    messageBus.subscribe('task.assigned', (msg) => {
      console.log('👤 任务已分配:', msg.payload);
    });
    
    messageBus.subscribe('task.completed', (msg) => {
      console.log('🎉 任务已完成:', msg.payload);
    });
  }
  
  // 创建任务
  createTask(data: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: Date;
  }): Task {
    const now = Date.now();
    const task: Task = {
      // ExistenceContract
      existentialType: 'anything',
      
      // DaoModuleMeta
      id: crypto.randomUUID(),
      name: `Task:${data.title}`,
      lifecycle: 'active',
      createdAt: now,
      registeredAt: now,
      activatedAt: now,
      
      // Task specific
      title: data.title,
      description: data.description,
      status: 'pending',
      priority: data.priority,
      dueDate: data.dueDate,
    };
    
    this.tasks.set(task.id, task);
    
    // 发布消息
    messageBus.publish({
      type: 'task.created',
      payload: { taskId: task.id, title: task.title },
      source: 'task-system',
    });
    
    return task;
  }
  
  // 分配任务给 Agent
  assignTask(taskId: string, agentId: string): void {
    const task = this.tasks.get(taskId);
    const agent = this.agents.get(agentId);
    
    if (!task || !agent) {
      throw new Error('任务或 Agent 不存在');
    }
    
    // 更新任务
    const updatedTask: Task = {
      ...task,
      assignee: agentId,
      status: 'in-progress',
    };
    this.tasks.set(taskId, updatedTask);
    
    // 更新 Agent
    const updatedAgent: TaskAgent = {
      ...agent,
      assignedTasks: [...agent.assignedTasks, taskId],
    };
    this.agents.set(agentId, updatedAgent);
    
    // 发布消息
    messageBus.publish({
      type: 'task.assigned',
      payload: { taskId, agentId },
      source: 'task-system',
    });
  }
  
  // 完成任务
  completeTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error('任务不存在');
    }
    
    const updatedTask: Task = {
      ...task,
      status: 'completed',
    };
    this.tasks.set(taskId, updatedTask);
    
    // 发布消息
    messageBus.publish({
      type: 'task.completed',
      payload: { taskId, title: task.title },
      source: 'task-system',
    });
  }
  
  // 获取统计信息
  getStats(): {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  } {
    const tasks = Array.from(this.tasks.values());
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
    };
  }
}

// 使用示例
const system = new TaskManagementSystem();

// 创建任务
const task1 = system.createTask({
  title: '学习 DaoMind 哲学',
  description: '深入理解无名与有名的概念',
  priority: 'high',
  dueDate: new Date('2026-05-01'),
});

const task2 = system.createTask({
  title: '构建示例应用',
  description: '使用 DaoMind 构建一个完整应用',
  priority: 'medium',
});

// 查看统计
console.log('📊 系统统计:', system.getStats());
```

### ✏️ 最终挑战

**挑战 6.1**: 扩展任务管理系统
```typescript
// TODO: 为任务管理系统添加以下功能
// 1. 任务依赖（一个任务依赖另一个任务完成）
// 2. 任务优先级自动调整（基于截止日期）
// 3. Agent 负载平衡（自动分配任务给空闲 Agent）
// 4. 任务历史记录（使用 Chronos 记录所有变更）
// 5. 空间隔离（不同团队的任务在不同 Space 中）
```

**挑战 6.2**: 实现仪表板
```typescript
// TODO: 创建一个仪表板类，显示：
// - 实时任务状态
// - Agent 工作负载
// - 时间线可视化
// - 性能指标

class Dashboard {
  constructor(private system: TaskManagementSystem) {}
  
  // 实现各种视图方法
  getTaskOverview(): object { /* ... */ }
  getAgentStatus(): object { /* ... */ }
  getTimeline(): object { /* ... */ }
  getMetrics(): object { /* ... */ }
}
```

### ✅ 最终检查点
- [ ] 能够设计完整的应用架构
- [ ] 理解各个包如何协同工作
- [ ] 能够应用哲学原则指导设计
- [ ] 能够实现复杂的业务逻辑
- [ ] 理解最佳实践和设计模式

---

## 🎓 恭喜完成教程！

你已经掌握了 DaoMind 的核心概念和使用方法。现在你可以：

### 下一步建议

1. **深入学习哲学基础**
   - 阅读[哲学深度解析](../guides/PHILOSOPHY-DEEP-DIVE.md)
   - 研究帛书《道德经》原文

2. **探索更多示例**
   - 查看[实战案例集](../examples/README.md)
   - 研究开源项目中的应用

3. **参与社区**
   - 加入[技术讨论](https://github.com/xinetzone/DaoMind/discussions)
   - 贡献代码和文档

4. **构建自己的项目**
   - 应用所学知识到实际项目
   - 分享你的经验

### 学习资源

- 📖 [API 参考文档](../api/API-REFERENCE.md)
- 🎥 [视频教程系列](../videos/README.md)
- ❓ [FAQ 常见问题](../FAQ.md)
- 💡 [最佳实践指南](../guides/BEST-PRACTICES.md)

---

> "学而时习之，不亦说乎？"  
> 持续实践是掌握任何技能的关键。祝你在 DaoMind 的旅程中不断成长！🚀

---

**教程版本**: 1.0  
**最后更新**: 2026-04-15  
**难度**: 初级 → 中级 → 高级  
**预计完成时间**: 4-6 小时
