# DaoMind & Modulux - 实战案例集

通过实际项目学习 DaoMind 的最佳方式。每个案例都是完整可运行的项目。

> 💡 **学习建议**: 按难度顺序完成，每个案例都建立在前面的基础上。

---

## 📚 案例目录

### 🌟 入门级案例（Beginner）

| 案例 | 描述 | 技术点 | 时间 |
|------|------|--------|------|
| [Hello World](./01-hello-world/) | 最简单的 DaoMind 应用 | 基础类型、模块创建 | 15分钟 |
| [计数器应用](./02-counter/) | 带状态管理的计数器 | 状态、事件、更新 | 20分钟 |
| [待办清单](./03-todo-list/) | 经典 Todo 应用 | CRUD 操作、过滤 | 30分钟 |

### ⭐ 中级案例（Intermediate）

| 案例 | 描述 | 技术点 | 时间 |
|------|------|--------|------|
| [用户管理系统](./04-user-management/) | 完整的用户 CRUD | 模块、验证、持久化 | 45分钟 |
| [任务管理器](./05-task-manager/) | 带 Agent 的任务系统 | Agent、时间线、分配 | 60分钟 |
| [聊天应用](./06-chat-app/) | 实时聊天系统 | 消息总线、事件驱动 | 60分钟 |

### 🌟 高级案例（Advanced）

| 案例 | 描述 | 技术点 | 时间 |
|------|------|--------|------|
| [项目管理平台](./07-project-management/) | 完整的项目管理 | 全栈集成、复杂架构 | 120分钟 |
| [Agent 协作系统](./08-multi-agent/) | 多 Agent 协同工作 | Agent 通信、任务分配 | 90分钟 |
| [知识图谱](./09-knowledge-graph/) | 知识管理系统 | 图结构、关系管理 | 120分钟 |

---

## 🚀 快速开始

### 环境要求

```bash
Node.js >= 18.0.0
TypeScript >= 5.0.0
pnpm >= 8.0.0 (推荐)
```

### 运行案例

```bash
# 1. 克隆仓库
git clone https://github.com/xinetzone/DaoMind.git
cd DaoMind/docs/examples

# 2. 安装依赖
pnpm install

# 3. 运行特定案例
cd 01-hello-world
pnpm dev

# 4. 构建生产版本
pnpm build
```

---

## 📖 案例详情

### 1. Hello World

**难度**: ⭐ 入门  
**时间**: 15 分钟  
**学习目标**:
- 创建第一个 DaoMind 模块
- 理解 ExistenceContract
- 使用基础类型

**项目结构**:
```
01-hello-world/
├── src/
│   ├── index.ts          # 主入口
│   ├── types.ts          # 类型定义
│   └── module.ts         # 模块实现
├── package.json
└── README.md
```

**核心代码**:
```typescript
import type { ExistenceContract } from '@daomind/nothing';

interface HelloModule extends ExistenceContract {
  readonly message: string;
}

const hello: HelloModule = {
  existentialType: 'anything',
  message: 'Hello, DaoMind!'
};

console.log(hello.message);
```

**运行**:
```bash
cd 01-hello-world
pnpm dev
# 输出: Hello, DaoMind!
```

[查看完整代码](./01-hello-world/)

---

### 2. 计数器应用

**难度**: ⭐ 入门  
**时间**: 20 分钟  
**学习目标**:
- 状态管理
- 事件处理
- 模块更新

**功能特性**:
- ✅ 增加计数
- ✅ 减少计数
- ✅ 重置计数
- ✅ 事件通知

**核心代码**:
```typescript
interface CounterModule extends DaoModuleMeta {
  readonly count: number;
}

class Counter {
  private module: CounterModule;
  
  increment(): void {
    this.module = {
      ...this.module,
      count: this.module.count + 1
    };
    this.emit('change', this.module.count);
  }
  
  decrement(): void {
    this.module = {
      ...this.module,
      count: this.module.count - 1
    };
    this.emit('change', this.module.count);
  }
}
```

[查看完整代码](./02-counter/)

---

### 3. 待办清单（Todo List）

**难度**: ⭐ 入门  
**时间**: 30 分钟  
**学习目标**:
- CRUD 操作
- 数据过滤
- 状态管理

**功能特性**:
- ✅ 添加待办事项
- ✅ 标记完成/未完成
- ✅ 删除事项
- ✅ 过滤显示（全部/进行中/已完成）
- ✅ 统计信息

**项目结构**:
```
03-todo-list/
├── src/
│   ├── types/
│   │   ├── todo.ts       # Todo 类型定义
│   │   └── filter.ts     # 过滤器类型
│   ├── modules/
│   │   └── todoModule.ts # Todo 模块
│   ├── services/
│   │   └── todoService.ts # Todo 服务
│   └── index.ts          # 主入口
├── tests/
│   └── todo.test.ts      # 单元测试
└── README.md
```

**核心代码**:
```typescript
interface Todo extends DaoModuleMeta {
  readonly title: string;
  readonly completed: boolean;
  readonly createdAt: number;
}

class TodoService {
  private todos: Map<string, Todo> = new Map();
  
  add(title: string): Todo {
    const todo = createTodo(title);
    this.todos.set(todo.id, todo);
    return todo;
  }
  
  toggle(id: string): void {
    const todo = this.todos.get(id);
    if (todo) {
      this.todos.set(id, { ...todo, completed: !todo.completed });
    }
  }
  
  filter(type: 'all' | 'active' | 'completed'): Todo[] {
    const all = Array.from(this.todos.values());
    switch (type) {
      case 'active': return all.filter(t => !t.completed);
      case 'completed': return all.filter(t => t.completed);
      default: return all;
    }
  }
  
  getStats() {
    const all = this.filter('all');
    return {
      total: all.length,
      active: all.filter(t => !t.completed).length,
      completed: all.filter(t => t.completed).length
    };
  }
}
```

**使用示例**:
```typescript
const service = new TodoService();

// 添加待办
service.add('学习 DaoMind 基础');
service.add('完成第一个项目');
service.add('阅读哲学文档');

// 标记完成
const todos = service.filter('all');
service.toggle(todos[0].id);

// 查看统计
console.log(service.getStats());
// { total: 3, active: 2, completed: 1 }
```

[查看完整代码](./03-todo-list/)

---

### 4. 用户管理系统

**难度**: ⭐⭐ 中级  
**时间**: 45 分钟  
**学习目标**:
- 完整的 CRUD 操作
- 数据验证
- 持久化存储
- 错误处理

**功能特性**:
- ✅ 用户注册（带验证）
- ✅ 用户登录/登出
- ✅ 用户信息更新
- ✅ 用户删除
- ✅ 角色管理（admin/user/guest）
- ✅ 本地存储持久化

**技术栈**:
- @daomind/anything - 用户模块
- @daomind/verify - 数据验证
- @modulux/qi - 事件通知

**核心代码**:
```typescript
interface UserModule extends DaoModuleMeta {
  readonly username: string;
  readonly email: string;
  readonly role: 'admin' | 'user' | 'guest';
  readonly passwordHash: string;
  readonly lastLogin?: number;
}

class UserService {
  private users: Map<string, UserModule> = new Map();
  private messageBus: QiBus;
  
  async register(data: {
    username: string;
    email: string;
    password: string;
  }): Promise<UserModule> {
    // 验证
    this.validateUsername(data.username);
    this.validateEmail(data.email);
    this.validatePassword(data.password);
    
    // 检查重复
    if (this.findByUsername(data.username)) {
      throw new Error('用户名已存在');
    }
    
    // 创建用户
    const user = await this.createUser(data);
    this.users.set(user.id, user);
    
    // 发送事件
    this.messageBus.publish({
      type: 'user.registered',
      payload: { userId: user.id, username: user.username },
      source: 'user-service'
    });
    
    return user;
  }
  
  async login(username: string, password: string): Promise<UserModule> {
    const user = this.findByUsername(username);
    if (!user) {
      throw new Error('用户不存在');
    }
    
    const isValid = await this.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('密码错误');
    }
    
    // 更新最后登录时间
    const updated = { ...user, lastLogin: Date.now() };
    this.users.set(user.id, updated);
    
    this.messageBus.publish({
      type: 'user.logged-in',
      payload: { userId: user.id },
      source: 'user-service'
    });
    
    return updated;
  }
}
```

[查看完整代码](./04-user-management/)

---

### 5. 任务管理器

**难度**: ⭐⭐ 中级  
**时间**: 60 分钟  
**学习目标**:
- Agent 系统使用
- 任务分配和调度
- 时间线管理
- 优先级队列

**功能特性**:
- ✅ 任务创建和管理
- ✅ Agent 创建和分配
- ✅ 自动任务分配（负载均衡）
- ✅ 优先级队列
- ✅ 时间线和截止日期
- ✅ 任务依赖关系
- ✅ 进度追踪

**架构设计**:
```
TaskManager
├── TaskModule (任务模型)
├── TaskAgent (任务处理者)
├── TaskQueue (任务队列)
├── TaskScheduler (任务调度器)
└── TaskTimeline (时间线)
```

**核心代码**:
```typescript
interface TaskModule extends DaoModuleMeta {
  readonly title: string;
  readonly description: string;
  readonly status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  readonly priority: 'low' | 'medium' | 'high' | 'urgent';
  readonly assignee?: string;  // agent ID
  readonly dueDate?: Date;
  readonly dependencies: string[];  // task IDs
}

interface TaskAgent extends DaoAgent {
  readonly assignedTasks: string[];
  readonly maxConcurrent: number;
  readonly capabilities: ReadonlyArray<DaoAgentCapability>;
}

class TaskManager {
  private tasks: Map<string, TaskModule> = new Map();
  private agents: Map<string, TaskAgent> = new Map();
  private queue: PriorityQueue<TaskModule>;
  private timeline: ChronosFlow;
  
  createTask(data: CreateTaskInput): TaskModule {
    const task = this.buildTask(data);
    this.tasks.set(task.id, task);
    this.queue.enqueue(task, this.calculatePriority(task));
    
    // 尝试自动分配
    this.autoAssign(task);
    
    return task;
  }
  
  autoAssign(task: TaskModule): boolean {
    // 找到最空闲的 Agent
    const agent = this.findIdleAgent();
    if (!agent) return false;
    
    // 检查依赖是否完成
    if (!this.dependenciesMet(task)) return false;
    
    // 分配任务
    this.assignTask(task.id, agent.id);
    return true;
  }
  
  private findIdleAgent(): TaskAgent | null {
    const agents = Array.from(this.agents.values());
    const idle = agents.filter(a => 
      a.state === 'active' && 
      a.assignedTasks.length < a.maxConcurrent
    );
    
    if (idle.length === 0) return null;
    
    // 返回负载最小的
    return idle.reduce((min, a) => 
      a.assignedTasks.length < min.assignedTasks.length ? a : min
    );
  }
}
```

[查看完整代码](./05-task-manager/)

---

### 6. 聊天应用

**难度**: ⭐⭐ 中级  
**时间**: 60 分钟  
**学习目标**:
- 实时消息系统
- 事件驱动架构
- 房间和频道管理
- 在线状态

**功能特性**:
- ✅ 实时消息发送/接收
- ✅ 多个聊天室
- ✅ 私聊和群聊
- ✅ 在线状态显示
- ✅ 消息历史
- ✅ 输入状态提示（正在输入...）

**技术栈**:
- @modulux/qi - 消息总线
- @daomind/spaces - 房间组织
- @daomind/chronos - 消息时间线

**核心代码**:
```typescript
interface ChatMessage {
  readonly id: string;
  readonly roomId: string;
  readonly userId: string;
  readonly content: string;
  readonly timestamp: number;
  readonly type: 'text' | 'image' | 'file';
}

interface ChatRoom extends SpaceOrganization {
  readonly participants: string[];  // user IDs
  readonly messages: ChatMessage[];
  readonly type: 'private' | 'group';
}

class ChatSystem {
  private rooms: Map<string, ChatRoom> = new Map();
  private messageBus: QiBus;
  private onlineUsers: Set<string> = new Set();
  
  constructor() {
    this.messageBus = new QiBus();
    this.setupMessageHandlers();
  }
  
  sendMessage(roomId: string, userId: string, content: string): void {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('房间不存在');
    
    if (!room.participants.includes(userId)) {
      throw new Error('不是房间成员');
    }
    
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      roomId,
      userId,
      content,
      timestamp: Date.now(),
      type: 'text'
    };
    
    // 保存消息
    this.saveMessage(message);
    
    // 广播给房间内所有在线用户
    this.messageBus.publish({
      type: 'chat.message',
      payload: message,
      source: `user:${userId}`,
      target: `room:${roomId}`
    });
  }
  
  subscribe(roomId: string, userId: string, callback: (msg: ChatMessage) => void): void {
    this.messageBus.subscribe('chat.message', (event) => {
      const msg = event.payload as ChatMessage;
      if (msg.roomId === roomId) {
        callback(msg);
      }
    });
    
    this.setOnlineStatus(userId, true);
  }
}
```

[查看完整代码](./06-chat-app/)

---

### 7-9. 高级案例

详细内容请查看各自的目录：
- [07-project-management/](./07-project-management/) - 项目管理平台
- [08-multi-agent/](./08-multi-agent/) - Agent 协作系统
- [09-knowledge-graph/](./09-knowledge-graph/) - 知识图谱

---

## 🎯 学习路径建议

### 路径 1：从零开始
```
Hello World → Counter → Todo List → User Management
```
适合：完全新手

### 路径 2：快速实战
```
Hello World → Todo List → Task Manager → Project Management
```
适合：有 TypeScript 基础

### 路径 3：深入 Agent
```
Hello World → Task Manager → Multi-Agent System
```
适合：对 Agent 系统感兴趣

### 路径 4：消息系统
```
Counter → Chat App → Multi-Agent System
```
适合：学习事件驱动架构

---

## 💡 学习建议

### 学习方法
1. **先看 README**: 理解案例目标和架构
2. **运行代码**: 先运行起来，看效果
3. **阅读源码**: 逐行理解实现
4. **动手修改**: 尝试添加新功能
5. **独立实现**: 不看代码重新实现

### 常见问题

**Q: 代码运行报错怎么办？**
A: 检查：
1. Node.js 版本是否 >= 18
2. 依赖是否正确安装
3. 查看案例的 troubleshooting 部分

**Q: 看不懂某个概念？**
A: 参考：
1. [核心概念文档](../guides/CORE-CONCEPTS.md)
2. [FAQ](../FAQ.md)
3. [视频教程](../videos/README.md)

**Q: 想添加新功能？**
A: 欢迎：
1. Fork 仓库
2. 创建新分支
3. 提交 Pull Request

---

## 🤝 贡献案例

想贡献新的案例？

### 案例要求
- ✅ 完整可运行
- ✅ 有详细注释
- ✅ 包含 README
- ✅ 有测试用例
- ✅ 遵循项目规范

### 提交步骤
1. Fork 仓库
2. 创建案例目录
3. 编写代码和文档
4. 提交 PR

### 模板结构
```
example-name/
├── src/               # 源代码
├── tests/             # 测试
├── README.md          # 说明文档
├── package.json       # 依赖配置
└── tsconfig.json      # TS 配置
```

---

## 📞 获取帮助

- 💬 [GitHub Discussions](https://github.com/xinetzone/DaoMind/discussions)
- 🐛 [报告问题](https://github.com/xinetzone/DaoMind/issues)
- 📧 [发送邮件](mailto:help@daomind.dev)

---

**案例总数**: 9 个  
**难度分布**: 入门 3个 | 中级 3个 | 高级 3个  
**预计学习时间**: 10-15 小时  
**最后更新**: 2026-04-15
