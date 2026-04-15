# 示例项目

DaoMind提供了一系列渐进式的示例项目，从简单到复杂，帮助你快速掌握框架的使用。

## 入门示例

### Hello World
最简单的入门示例，理解"无名"与"有名"的核心概念。

- **难度**: ⭐ 入门
- **学习时间**: 15 分钟
- **核心概念**: ExistenceContract, 基础模块创建

[查看详情](/examples/hello-world) | [源代码](https://github.com/xinetzone/DaoMind/tree/enter-main/docs/examples/01-hello-world)

### Counter
状态管理和不可变更新示例。

- **难度**: ⭐⭐ 入门+
- **学习时间**: 30 分钟
- **核心概念**: 状态管理, 不可变更新, 事件系统

[查看详情](/examples/counter) | [源代码](https://github.com/xinetzone/DaoMind/tree/enter-main/docs/examples/02-counter)

### Todo List
完整的 CRUD 操作和数据管理。

- **难度**: ⭐⭐ 中级
- **学习时间**: 45 分钟
- **核心概念**: CRUD 操作, 服务层, 数据过滤

[查看详情](/examples/todo-list) | [源代码](https://github.com/xinetzone/DaoMind/tree/enter-main/docs/examples/03-todo-list)

## 中级示例

### 用户管理系统
完整的用户管理和权限控制系统。

- **难度**: ⭐⭐⭐ 中级+
- **学习时间**: 60 分钟
- **核心概念**: RBAC, 认证, 权限, 安全实践

[查看详情](/examples/user-management) | [源代码](https://github.com/xinetzone/DaoMind/tree/enter-main/docs/examples/04-user-management)

### 任务管理器
展示 Agent 系统的实际应用。

- **难度**: ⭐⭐⭐ 中级+
- **学习时间**: 60 分钟
- **核心概念**: Agent 系统, 任务状态机, 依赖关系

[即将推出]

### 聊天应用
实时消息系统，展示 QiBus 消息总线。

- **难度**: ⭐⭐⭐ 中级+
- **学习时间**: 60 分钟
- **核心概念**: QiBus, 实时消息, 用户在线状态

[即将推出]

## 高级示例

### 项目管理系统
完整的项目管理解决方案。

- **难度**: ⭐⭐⭐⭐ 高级
- **学习时间**: 2+ 小时
- **核心概念**: 复杂业务逻辑, 权限系统, 数据关系

[计划中]

### 多 Agent 协作系统
展示多个 Agent 协同工作。

- **难度**: ⭐⭐⭐⭐ 高级
- **学习时间**: 2+ 小时
- **核心概念**: Agent 通信, 任务分配, 状态同步

[计划中]

### 知识图谱
构建和查询知识图谱。

- **难度**: ⭐⭐⭐⭐⭐ 专家
- **学习时间**: 3+ 小时
- **核心概念**: 图数据结构, 查询优化, 关系推理

[计划中]

## 使用 CLI 快速创建

你可以使用 CLI 工具快速创建任何示例项目：

```bash
# 交互式选择模板
pnpm create daomind my-project

# 直接指定模板
pnpm create daomind my-project --template hello-world
pnpm create daomind my-project --template counter
pnpm create daomind my-project --template todo-list
pnpm create daomind my-project --template user-management
```

## 学习建议

### 新手路径
1. Hello World → 理解基础概念
2. Counter → 掌握状态管理
3. Todo List → 学习数据操作
4. User Management → 理解复杂系统

### 专题学习
- **状态管理**: Counter → Todo List
- **权限系统**: User Management → Project Management
- **Agent 系统**: Task Manager → Multi-Agent System
- **实时通信**: Chat App → Multi-Agent System

### 进阶路径
完成所有入门和中级示例后，尝试高级示例，并根据自己的需求进行定制和扩展。

## 贡献示例

欢迎贡献你自己的示例项目！请参阅[贡献指南](https://github.com/xinetzone/DaoMind/blob/enter-main/CONTRIBUTING.md)。

---

> "道生一，一生二，二生三，三生万物"  
> 从简单示例到复杂系统，逐步掌握 DaoMind！
