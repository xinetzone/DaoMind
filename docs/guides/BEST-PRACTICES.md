# DaoMind & Modulux - 最佳实践指南

经过验证的设计模式、编码规范和架构建议。

> 💡 **理念**: 遵循道家哲学，追求简洁、自然、和谐的代码。

---

## 📚 目录

- [设计原则](#设计原则)
- [命名规范](#命名规范)
- [类型设计](#类型设计)
- [模块组织](#模块组织)
- [Agent 设计](#agent-设计)
- [消息通信](#消息通信)
- [错误处理](#错误处理)
- [性能优化](#性能优化)
- [测试策略](#测试策略)
- [文档规范](#文档规范)

---

## 设计原则

### 1. 无名与有名的清晰分离

**原则**: 类型（无名）和值（有名）应该有明确的界限。

✅ **好的做法**:
```typescript
// 类型层（无名） - 仅定义契约
import type { ExistenceContract } from '@daomind/nothing';

interface User extends ExistenceContract {
  readonly name: string;
  readonly age: number;
}

// 值层（有名） - 具体实现
const alice: User = {
  existentialType: 'anything',
  name: 'Alice',
  age: 30,
};
```

❌ **不好的做法**:
```typescript
// 混淆类型和值
class User {  // 类即是类型，也是值
  constructor(public name: string) {}
}
```

**为什么**:
- 清晰的层次有助于理解
- 类型层零运行时，值层才有开销
- 符合"无名"到"有名"的哲学

---

### 2. 最小化原则（Less is More）

**原则**: 接口应该包含最少但必要的属性。

✅ **好的做法**:
```typescript
// 基础契约保持最小
interface ExistenceContract {
  readonly existentialType: 'nothing' | 'anything';
}

// 具体实现添加必要属性
interface TodoItem extends DaoModuleMeta {
  readonly title: string;
  readonly completed: boolean;
}
```

❌ **不好的做法**:
```typescript
// 基础契约包含太多属性
interface ExistenceContract {
  readonly id: string;  // 不是所有实体都需要 ID
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly metadata: Record<string, unknown>;
  // ... 太多了
}
```

**为什么**:
- 符合"道生一，一生二"的渐进思想
- 更灵活，更易扩展
- 减少不必要的约束

---

### 3. 不变性（Immutability）

**原则**: 优先使用 `readonly` 和不可变数据结构。

✅ **好的做法**:
```typescript
interface TodoItem extends DaoModuleMeta {
  readonly title: string;
  readonly completed: boolean;
}

// 通过创建新对象来"修改"
function toggleTodo(todo: TodoItem): TodoItem {
  return {
    ...todo,
    completed: !todo.completed,
  };
}
```

❌ **不好的做法**:
```typescript
interface TodoItem extends DaoModuleMeta {
  title: string;  // 可变
  completed: boolean;
}

// 直接修改
function toggleTodo(todo: TodoItem): void {
  todo.completed = !todo.completed;  // 违反不变性
}
```

**为什么**:
- 符合"常德"（恒常之德）的理念
- 避免副作用
- 易于追踪和调试
- 支持时间旅行和撤销功能

---

### 4. 无为而治（Do Nothing Principle）

**原则**: 不做不必要的事情，让系统自然运行。

✅ **好的做法**:
```typescript
// 简单直接
function createTodo(title: string): TodoItem {
  const now = Date.now();
  return {
    existentialType: 'anything',
    id: crypto.randomUUID(),
    name: `Todo:${title}`,
    lifecycle: 'active',
    createdAt: now,
    registeredAt: now,
    title,
    completed: false,
  };
}
```

❌ **不好的做法**:
```typescript
// 过度设计
class TodoFactory {
  private static instance: TodoFactory;
  private todoCount = 0;
  private observers: Array<(todo: TodoItem) => void> = [];
  
  private constructor() {}
  
  static getInstance(): TodoFactory {
    if (!this.instance) {
      this.instance = new TodoFactory();
    }
    return this.instance;
  }
  
  registerObserver(callback: (todo: TodoItem) => void): void {
    this.observers.push(callback);
  }
  
  createTodo(title: string): TodoItem {
    this.todoCount++;
    const todo = { /* ... */ };
    this.observers.forEach(cb => cb(todo));
    return todo;
  }
}
```

**为什么**:
- 简单就是美
- 减少维护成本
- 降低认知负担

---

## 命名规范

### 通用规则

1. **使用清晰的英文命名**
2. **遵循 TypeScript 命名惯例**
3. **体现哲学概念时使用拼音或英文对应**

### 接口命名

✅ **好的做法**:
```typescript
// 使用 Interface 或描述性名词
interface ExistenceContract { }
interface DaoModuleMeta { }
interface UserProfile { }
```

❌ **不好的做法**:
```typescript
interface IUser { }  // 不要使用 I 前缀
interface user { }   // 不要使用小写开头
```

### 类型别名

```typescript
// 使用 Type 后缀或描述性名称
type ModuleLifecycle = 'active' | 'inactive';
type AgentState = 'dormant' | 'active';
type UserId = string;
```

### 函数命名

```typescript
// 动词 + 名词
function createTodo(title: string): TodoItem { }
function updateUser(id: string, data: Partial<User>): User { }
function deleteTodo(id: string): boolean { }

// 布尔查询使用 is/has/can
function isTodoCompleted(todo: TodoItem): boolean { }
function hasPermission(user: User, action: string): boolean { }
function canExecute(agent: Agent): boolean { }
```

### 常量命名

```typescript
// 全大写 + 下划线
const MAX_RETRY_COUNT = 3;
const DEFAULT_TIMEOUT = 5000;
const ERROR_MESSAGES = {
  NOT_FOUND: 'Resource not found',
  INVALID_INPUT: 'Invalid input provided',
};
```

### 哲学概念命名

```typescript
// 中文拼音 + 英文对应
interface WuMingContract { }  // 无名契约
interface YouMingEntity { }   // 有名实体
class QiBus { }              // 气（能量流）
interface YinYangBalance { }  // 阴阳平衡

// 或使用英文对应
interface NamelessContract { }
interface NamedEntity { }
class EnergyBus { }
```

---

## 类型设计

### 1. 优先使用 Interface

✅ **好的做法**:
```typescript
interface User extends ExistenceContract {
  readonly name: string;
  readonly email: string;
}

// Interface 可以扩展
interface AdminUser extends User {
  readonly permissions: string[];
}
```

❌ **少用 Type（除非必要）**:
```typescript
// Type 不易扩展
type User = {
  name: string;
  email: string;
};
```

**什么时候用 Type**:
- 联合类型: `type Status = 'active' | 'inactive'`
- 元组类型: `type Point = [number, number]`
- 映射类型: `type Readonly<T> = { readonly [P in keyof T]: T[P] }`

---

### 2. 使用泛型提高复用性

✅ **好的做法**:
```typescript
// 泛型工厂函数
function createModule<T extends DaoModuleMeta>(
  data: Omit<T, keyof DaoModuleMeta>
): T {
  const now = Date.now();
  return {
    existentialType: 'anything',
    id: crypto.randomUUID(),
    lifecycle: 'active',
    createdAt: now,
    registeredAt: now,
    ...data,
  } as T;
}

// 使用
interface TodoModule extends DaoModuleMeta {
  readonly title: string;
}

const todo = createModule<TodoModule>({
  name: 'Todo',
  title: 'Learn DaoMind',
});
```

---

### 3. 善用 Utility Types

```typescript
// Partial - 所有属性可选
type UpdateTodoInput = Partial<TodoItem>;

// Pick - 选择特定属性
type TodoSummary = Pick<TodoItem, 'id' | 'title' | 'completed'>;

// Omit - 排除特定属性
type CreateTodoInput = Omit<TodoItem, 'id' | 'createdAt'>;

// Required - 所有属性必需
type RequiredTodo = Required<TodoItem>;

// Readonly - 所有属性只读
type ImmutableTodo = Readonly<TodoItem>;
```

---

### 4. 类型守卫

```typescript
// 自定义类型守卫
function isTodoItem(obj: unknown): obj is TodoItem {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'title' in obj &&
    'completed' in obj
  );
}

// 使用
function processTodo(data: unknown): void {
  if (isTodoItem(data)) {
    console.log(data.title);  // TypeScript 知道这是 TodoItem
  }
}
```

---

## 模块组织

### 文件结构

```
src/
├── types/              # 类型定义（无名层）
│   ├── contracts.ts    # 契约定义
│   ├── models.ts       # 数据模型
│   └── index.ts        # 导出
├── modules/            # 模块实现（有名层）
│   ├── user.ts
│   ├── todo.ts
│   └── index.ts
├── services/           # 业务逻辑
│   ├── userService.ts
│   └── todoService.ts
├── utils/              # 工具函数
│   ├── helpers.ts
│   └── validators.ts
└── index.ts            # 主入口
```

### 导出策略

```typescript
// types/index.ts - 导出所有类型
export type { User, Todo, Comment } from './models';
export type { UserContract, TodoContract } from './contracts';

// modules/index.ts - 导出实现
export { createUser, updateUser } from './user';
export { createTodo, toggleTodo } from './todo';

// 主入口 index.ts
export * from './types';
export * from './modules';
export * from './services';
```

---

## Agent 设计

### 1. 明确 Agent 职责

每个 Agent 应该有单一、明确的职责。

✅ **好的做法**:
```typescript
// 翻译 Agent - 职责单一
class TranslatorAgent implements DaoAgent {
  readonly capabilities = [
    { name: 'translate', version: '1.0.0' },
  ];
  
  async execute<T>(action: string, payload?: unknown): Promise<T> {
    if (action === 'translate') {
      return this.translate(payload) as T;
    }
    throw new Error(`Unknown action: ${action}`);
  }
  
  private translate(payload: unknown): string {
    // 翻译逻辑
    return 'translated text';
  }
}
```

❌ **不好的做法**:
```typescript
// 万能 Agent - 职责不明确
class SuperAgent implements DaoAgent {
  async execute<T>(action: string, payload?: unknown): Promise<T> {
    if (action === 'translate') { /* ... */ }
    if (action === 'summarize') { /* ... */ }
    if (action === 'analyze') { /* ... */ }
    if (action === 'generate') { /* ... */ }
    // ... 太多了
  }
}
```

---

### 2. Agent 能力声明

```typescript
// 明确声明能力
interface TranslateCapability extends DaoAgentCapability {
  readonly name: 'translate';
  readonly version: string;
  readonly supportedLanguages: string[];
  readonly maxLength: number;
}

class TranslatorAgent implements DaoAgent {
  readonly capabilities: ReadonlyArray<TranslateCapability> = [
    {
      name: 'translate',
      version: '1.0.0',
      supportedLanguages: ['en', 'zh', 'ja'],
      maxLength: 10000,
    },
  ];
}
```

---

### 3. Agent 协作模式

```typescript
// Agent 之间通过消息总线协作
class AgentOrchestrator {
  private agents: Map<string, DaoAgent> = new Map();
  private bus: QiBus = new QiBus();
  
  registerAgent(agent: DaoAgent): void {
    this.agents.set(agent.id, agent);
  }
  
  async executeWorkflow(workflow: Workflow): Promise<void> {
    for (const step of workflow.steps) {
      const agent = this.agents.get(step.agentId);
      if (!agent) continue;
      
      const result = await agent.execute(step.action, step.payload);
      
      // 发布结果供其他 Agent 使用
      this.bus.publish({
        type: `agent.${step.action}.completed`,
        payload: result,
        source: agent.id,
      });
    }
  }
}
```

---

## 消息通信

### 1. 消息类型设计

```typescript
// 定义清晰的消息类型
interface UserCreatedMessage {
  readonly type: 'user.created';
  readonly payload: {
    userId: string;
    username: string;
    email: string;
  };
  readonly timestamp: number;
  readonly source: string;
}

interface TodoCompletedMessage {
  readonly type: 'todo.completed';
  readonly payload: {
    todoId: string;
    completedAt: number;
  };
  readonly timestamp: number;
  readonly source: string;
}

// 联合类型
type AppMessage = UserCreatedMessage | TodoCompletedMessage;
```

---

### 2. 消息命名规范

```
<domain>.<entity>.<action>

例如:
- user.created
- user.updated
- user.deleted
- todo.created
- todo.completed
- order.placed
- order.shipped
```

---

### 3. 错误消息

```typescript
interface ErrorMessage {
  readonly type: 'error';
  readonly payload: {
    code: string;
    message: string;
    details?: unknown;
  };
  readonly timestamp: number;
  readonly source: string;
}

// 发布错误
bus.publish({
  type: 'error',
  payload: {
    code: 'USER_NOT_FOUND',
    message: 'User with ID 123 not found',
  },
  timestamp: Date.now(),
  source: 'user-service',
});
```

---

## 错误处理

### 1. 自定义错误类

```typescript
// 基础错误类
class DaoMindError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'DaoMindError';
  }
}

// 特定错误类
class ModuleNotFoundError extends DaoMindError {
  constructor(id: string) {
    super(
      `Module with ID "${id}" not found`,
      'MODULE_NOT_FOUND',
      { id }
    );
    this.name = 'ModuleNotFoundError';
  }
}

class AgentExecutionError extends DaoMindError {
  constructor(agentId: string, action: string, cause: Error) {
    super(
      `Agent "${agentId}" failed to execute "${action}"`,
      'AGENT_EXECUTION_ERROR',
      { agentId, action, cause }
    );
    this.name = 'AgentExecutionError';
  }
}
```

---

### 2. 错误处理模式

```typescript
// Result 类型（Either 模式）
type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

// 使用
function createTodo(title: string): Result<TodoItem> {
  try {
    if (!title.trim()) {
      return {
        success: false,
        error: new Error('Title cannot be empty'),
      };
    }
    
    const todo = { /* ... */ };
    return { success: true, value: todo };
  } catch (error) {
    return {
      success: false,
      error: error as Error,
    };
  }
}

// 调用
const result = createTodo('Learn DaoMind');
if (result.success) {
  console.log('Created:', result.value);
} else {
  console.error('Error:', result.error);
}
```

---

## 性能优化

### 1. 使用类型导入

```typescript
// ✅ 类型导入 - 零运行时
import type { User, Todo } from './types';

// ❌ 值导入 - 有运行时开销
import { User, Todo } from './types';
```

---

### 2. 延迟加载

```typescript
// 延迟加载大型模块
class LazyModule {
  private _heavyData?: HeavyData;
  
  get heavyData(): HeavyData {
    if (!this._heavyData) {
      this._heavyData = loadHeavyData();
    }
    return this._heavyData;
  }
}
```

---

### 3. 对象池

```typescript
// 复用对象减少 GC 压力
class ObjectPool<T> {
  private available: T[] = [];
  
  constructor(private factory: () => T) {}
  
  acquire(): T {
    return this.available.pop() || this.factory();
  }
  
  release(obj: T): void {
    this.available.push(obj);
  }
}
```

---

## 测试策略

### 1. 单元测试

```typescript
import { describe, it, expect } from 'vitest';

describe('TodoModule', () => {
  describe('createTodo', () => {
    it('should create todo with correct properties', () => {
      const todo = createTodo('Test');
      
      expect(todo.existentialType).toBe('anything');
      expect(todo.title).toBe('Test');
      expect(todo.completed).toBe(false);
      expect(todo.lifecycle).toBe('active');
    });
    
    it('should generate unique IDs', () => {
      const todo1 = createTodo('Test 1');
      const todo2 = createTodo('Test 2');
      
      expect(todo1.id).not.toBe(todo2.id);
    });
  });
});
```

---

### 2. 集成测试

```typescript
describe('TodoService Integration', () => {
  let service: TodoService;
  let bus: QiBus;
  
  beforeEach(() => {
    bus = new QiBus();
    service = new TodoService(bus);
  });
  
  it('should publish event when todo is created', async () => {
    const messages: QiMessage[] = [];
    bus.subscribe('todo.created', (msg) => messages.push(msg));
    
    await service.createTodo('Test');
    
    expect(messages).toHaveLength(1);
    expect(messages[0].type).toBe('todo.created');
  });
});
```

---

### 3. 测试覆盖率目标

- **类型定义**: 100%（通过类型测试）
- **核心功能**: ≥90%
- **工具函数**: ≥85%
- **整体**: ≥80%

---

## 文档规范

### 1. TSDoc 注释

```typescript
/**
 * 创建新的 Todo 项目
 * 
 * @param title - Todo 标题，不能为空
 * @returns 新创建的 TodoItem 实例
 * @throws {Error} 当 title 为空时抛出错误
 * 
 * @example
 * ```typescript
 * const todo = createTodo('学习 DaoMind');
 * console.log(todo.title); // '学习 DaoMind'
 * ```
 * 
 * @see {@link TodoItem} 返回的类型定义
 * @see {@link toggleTodo} 切换 Todo 完成状态
 */
function createTodo(title: string): TodoItem {
  // 实现
}
```

---

### 2. README 模板

```markdown
# 包名

简短描述（一句话）

## 安装

\`\`\`bash
npm install @daomind/package-name
\`\`\`

## 快速开始

\`\`\`typescript
// 最简单的使用示例
\`\`\`

## API

### 主要接口

### 主要函数

## 示例

## 许可证

MIT
```

---

## 代码审查清单

提交代码前检查：

- [ ] 所有类型都继承自 ExistenceContract
- [ ] 使用 `readonly` 修饰不变属性
- [ ] 函数有明确的返回类型
- [ ] 复杂逻辑有注释说明
- [ ] 错误情况有适当处理
- [ ] 有对应的单元测试
- [ ] 测试覆盖率达标
- [ ] 遵循命名规范
- [ ] 没有 TypeScript 警告
- [ ] ESLint 检查通过

---

## 总结：五个核心原则

1. **清晰分离** - 无名与有名、类型与值
2. **最小化** - 只做必要的事，保持简单
3. **不变性** - 优先使用只读和不可变结构
4. **单一职责** - 每个模块、Agent 职责明确
5. **和谐统一** - 代码、测试、文档三位一体

---

> "大道至简" - 最好的代码是简单、清晰、自然的代码。

---

**文档版本**: 2.21.0  
**最后更新**: 2026-04-16  
**维护者**: DaoMind Team
