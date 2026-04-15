# Todo List - 待办事项应用

经典的 Todo List 应用，学习完整的 CRUD 操作和数据管理。

## 📚 学习目标

- CRUD 操作（创建、读取、更新、删除）
- 数据过滤和查询
- 服务层设计
- 统计和聚合

## 🚀 快速开始

### 安装依赖

```bash
cd 03-todo-list
pnpm install
```

### 运行示例

```bash
pnpm dev
```

### 运行测试

```bash
pnpm test
```

## 📖 代码讲解

### Todo 模块定义

```typescript
interface TodoItem extends DaoModuleMeta {
  readonly title: string;
  readonly description?: string;
  readonly completed: boolean;
  readonly priority: 'low' | 'medium' | 'high';
  readonly dueDate?: Date;
}
```

### 服务层设计

```typescript
class TodoService {
  private todos: Map<string, TodoItem> = new Map();
  
  create(data: CreateTodoInput): TodoItem { }
  get(id: string): TodoItem | undefined { }
  update(id: string, data: UpdateTodoInput): TodoItem { }
  delete(id: string): boolean { }
  list(filter?: TodoFilter): TodoItem[] { }
  getStats(): TodoStats { }
}
```

### 过滤和查询

```typescript
// 按完成状态过滤
const active = service.list({ completed: false });
const completed = service.list({ completed: true });

// 按优先级过滤
const urgent = service.list({ priority: 'high' });

// 组合过滤
const activeUrgent = service.list({
  completed: false,
  priority: 'high',
});
```

## 🎯 核心概念

### CRUD 操作

```
Create  →  添加新 Todo
Read    →  查询 Todo（单个或列表）
Update  →  修改 Todo 属性
Delete  →  删除 Todo
```

### 数据流

```
用户操作  →  Service  →  存储  →  更新视图
  ↓         ↓          ↓        ↓
 增删改查   业务逻辑    Map     统计信息
```

## 💡 实践任务

### 任务 1: 添加标签功能

为 Todo 添加标签：

```typescript
interface TodoItem extends DaoModuleMeta {
  // ... 其他属性
  readonly tags: string[];
}

// 按标签过滤
service.listByTag('work');
```

### 任务 2: 添加排序功能

实现多种排序方式：

```typescript
// 按创建时间排序
service.list({ sortBy: 'createdAt', order: 'desc' });

// 按优先级排序
service.list({ sortBy: 'priority', order: 'asc' });

// 按截止日期排序
service.list({ sortBy: 'dueDate', order: 'asc' });
```

### 任务 3: 添加搜索功能

实现全文搜索：

```typescript
// 搜索标题或描述
service.search('DaoMind');
```

### 任务 4: 添加持久化

使用 localStorage 持久化：

```typescript
class TodoService {
  save(): void {
    const data = Array.from(this.todos.entries());
    localStorage.setItem('todos', JSON.stringify(data));
  }
  
  load(): void {
    const data = localStorage.getItem('todos');
    if (data) {
      this.todos = new Map(JSON.parse(data));
    }
  }
}
```

## 📊 项目结构

```
03-todo-list/
├── src/
│   ├── types.ts          # 类型定义
│   ├── todo.ts           # Todo 逻辑
│   ├── service.ts        # 服务层
│   ├── filters.ts        # 过滤器
│   └── index.ts          # 主入口
├── tests/
│   └── todo.test.ts      # 单元测试
├── package.json
├── tsconfig.json
└── README.md
```

## 🧪 测试示例

```typescript
import { describe, it, expect } from 'vitest';
import { TodoService } from '../src/service';

describe('TodoService', () => {
  it('should create todo', () => {
    const service = new TodoService();
    const todo = service.create({
      title: 'Test',
      priority: 'high',
    });
    
    expect(todo.title).toBe('Test');
    expect(todo.completed).toBe(false);
  });
  
  it('should toggle todo', () => {
    const service = new TodoService();
    const todo = service.create({
      title: 'Test',
      priority: 'medium',
    });
    
    const toggled = service.toggle(todo.id);
    expect(toggled.completed).toBe(true);
  });
});
```

## 🔗 下一步

- 查看 [用户管理系统](../04-user-management/) 了解更复杂的 CRUD
- 学习 [任务管理器](../05-task-manager/) 了解 Agent 系统
- 阅读 [测试最佳实践](../../guides/BEST-PRACTICES.md#测试策略)

---

**难度**: ⭐ 入门  
**预计时间**: 30 分钟  
**前置知识**: Counter 示例
