# DaoMind & Modulux - 快速开始指南

欢迎来到 DaoMind & Modulux！这是一个基于道家哲学的模块化系统框架。

> "无名，万物之始也；有名，万物之母也。"  
> —— 马王堆汉墓帛书《老子》甲本

---

## 📚 目录

- [5 分钟快速体验](#5-分钟快速体验)
- [核心概念速览](#核心概念速览)
- [第一个示例](#第一个示例)
- [下一步](#下一步)

---

## 5 分钟快速体验

### 安装

```bash
# 安装核心包
npm install @daomind/nothing @daomind/anything

# 或使用 pnpm
pnpm add @daomind/nothing @daomind/anything
```

### 第一个示例

```typescript
// 导入类型定义（"无名"层 - 零运行时）
import type { ExistenceContract } from '@daomind/nothing';

// 导入具体实现（"有名"层 - 运行时）
import { DaoModuleRegistry } from '@daomind/anything';

// 定义你的模块
interface MyModule extends ExistenceContract {
  readonly name: string;
  readonly value: number;
}

// 创建实例（从"无名"到"有名"的过程）
const myModule: MyModule = {
  existentialType: 'anything',
  name: 'HelloWorld',
  value: 42
};

console.log('✨ 从"无名"到"有名":', myModule);
```

**运行结果**：
```
✨ 从"无名"到"有名": { existentialType: 'anything', name: 'HelloWorld', value: 42 }
```

---

## 核心概念速览

### 🌌 "无名"与"有名"

DaoMind 的核心理念来自道家哲学：

| 概念 | 哲学含义 | 技术对应 | 实现 |
|------|----------|----------|------|
| **无名** | 未被命名的潜在状态 | TypeScript 类型空间 | 仅类型定义，零运行时 |
| **有名** | 已被命名的显化状态 | TypeScript 值空间 | 具体类、实例、函数 |

### 🎯 为什么这样设计？

```typescript
// ❌ 传统方式：类型和值混在一起
class Entity {
  id: string;
  name: string;
  // 即使只需要类型，也会引入运行时代码
}

// ✅ DaoMind 方式：清晰的层次分离
// 1. "无名"层（@daomind/nothing）- 仅类型
type EntityContract = {
  readonly existentialType: 'nothing' | 'anything';
};

// 2. "有名"层（@daomind/anything）- 具体实现
interface Entity extends EntityContract {
  readonly id: string;
  readonly name: string;
}
```

**优势**：
- ✅ 零运行时开销（类型在编译后消失）
- ✅ 类型安全（TypeScript 编译时检查）
- ✅ 哲学一致性（理论指导实践）
- ✅ 最小化包体积

---

## 第一个示例

### 示例 1: 创建一个待办事项模块

```typescript
// step1-todo.ts
import type { ExistenceContract } from '@daomind/nothing';
import type { DaoModuleMeta } from '@daomind/anything';

// 1. 定义契约（"无名"层 - 潜在状态）
interface TodoContract extends ExistenceContract {
  readonly title: string;
  readonly completed: boolean;
}

// 2. 定义具体类型（"有名"层 - 显化状态）
interface TodoItem extends DaoModuleMeta {
  readonly title: string;
  readonly completed: boolean;
  readonly dueDate?: Date;
}

// 3. 创建实例（"命名"的过程）
const createTodo = (title: string): TodoItem => ({
  // 来自 ExistenceContract
  existentialType: 'anything',
  
  // 来自 DaoModuleMeta
  id: crypto.randomUUID(),
  name: `Todo:${title}`,
  lifecycle: 'active',
  createdAt: Date.now(),
  registeredAt: Date.now(),
  
  // TodoItem 特有属性
  title,
  completed: false,
});

// 4. 使用
const todo = createTodo('学习 DaoMind 哲学');
console.log('创建的待办:', todo);
```

### 示例 2: 使用 Agent 系统

```typescript
// step2-agent.ts
import type { DaoAgent, DaoAgentCapability } from '@daomind/agents';

// 1. 定义 Agent 能力
const learningCapability: DaoAgentCapability = {
  name: 'learning',
  description: '学习新知识的能力',
  parameters: {
    topic: 'string',
    depth: 'number'
  }
};

// 2. 创建 Agent
const philosophyAgent: DaoAgent = {
  // 基础属性
  id: 'agent-001',
  existentialType: 'anything',
  agentType: 'philosopher',
  createdAt: Date.now(),
  
  // Agent 特有属性
  state: 'active',
  capabilities: [learningCapability],
};

console.log('哲学 Agent:', philosophyAgent);
```

### 示例 3: 时空组织（宙宇）

```typescript
// step3-spacetime.ts
import type { ChronosFlow } from '@daomind/chronos';
import type { SpaceOrganization } from '@daomind/spaces';

// 1. 定义时间流
const projectTimeline: ChronosFlow = {
  id: 'timeline-001',
  existentialType: 'anything',
  createdAt: Date.now(),
  startTime: new Date('2026-01-01'),
  endTime: new Date('2026-12-31'),
  flowType: 'linear',
};

// 2. 定义空间
const workspace: SpaceOrganization = {
  id: 'space-001',
  existentialType: 'anything',
  createdAt: Date.now(),
  name: 'Development Workspace',
  dimension: 3,
  boundary: {
    type: 'bounded',
    constraints: {}
  }
};

console.log('时空组织:', { time: projectTimeline, space: workspace });
```

---

## 下一步

恭喜！你已经了解了 DaoMind 的基础概念。接下来可以：

### 📖 深入学习
- [交互式教程](./tutorials/INTERACTIVE-TUTORIAL.md) - 分步骤学习
- [核心概念详解](./guides/CORE-CONCEPTS.md) - 哲学与技术
- [API 参考](./api/API-REFERENCE.md) - 完整 API 文档

### 🎯 实战案例
- [构建 Todo 应用](./examples/todo-app/README.md)
- [创建 Agent 系统](./examples/agent-system/README.md)
- [时空管理系统](./examples/spacetime-manager/README.md)

### 🤔 遇到问题？
- [FAQ 常见问题](./FAQ.md) - 快速答疑
- [故障排查指南](./guides/TROUBLESHOOTING.md) - 问题解决
- [社区讨论](https://github.com/xinetzone/DaoMind/discussions) - 提问交流

### 🎥 视频教程
- [10分钟入门视频](./videos/01-getting-started.md)
- [哲学基础讲解](./videos/02-philosophy.md)
- [实战项目开发](./videos/03-practical-project.md)

---

## 💡 小贴士

### 理解"无名"和"有名"的关键

```typescript
// 想象一个盒子的例子

// "无名"阶段：你知道有"盒子"这个概念，但它还不存在
type Box = {
  content: string;
  size: number;
};

// "有名"阶段：你实际创建了一个盒子
const myBox: Box = {
  content: 'treasure',
  size: 10
};

// 这个过程就是"命名"：从概念到实体
```

### TypeScript 提示

```typescript
// 善用类型推导
const item = createTodo('test'); // TypeScript 自动知道这是 TodoItem

// 使用 as const 保持字面量类型
const config = {
  type: 'nothing'
} as const; // type: 'nothing' 而不是 string

// 利用索引签名
type DynamicModule = {
  [key: string]: unknown;
} & ExistenceContract;
```

---

## 🎓 学习路径建议

### 初学者路径（1-2 天）
1. ✅ 阅读本快速开始指南
2. → 完成[交互式教程](./tutorials/INTERACTIVE-TUTORIAL.md)
3. → 尝试[简单示例](./examples/hello-world/)
4. → 阅读[FAQ](./FAQ.md)

### 进阶路径（1 周）
1. ✅ 完成初学者路径
2. → 学习[核心概念详解](./guides/CORE-CONCEPTS.md)
3. → 构建[实战项目](./examples/todo-app/)
4. → 研究[架构设计](../.trae/specs/)

### 专家路径（1 月）
1. ✅ 完成进阶路径
2. → 深入[哲学基础](./guides/PHILOSOPHY-DEEP-DIVE.md)
3. → 参与[社区贡献](./CONTRIBUTING.md)
4. → 开发自己的扩展包

---

## 🌟 关键要点回顾

1. **"无名"** = TypeScript 类型 = 零运行时 = 潜在可能
2. **"有名"** = TypeScript 值 = 运行时实体 = 显化实现
3. **命名过程** = 从类型定义到创建实例
4. **哲学一致** = 每个设计都有哲学依据

---

**准备好开始你的 DaoMind 之旅了吗？** 🚀

选择一个教程开始：
- 🎯 [5分钟速成](./tutorials/5-MINUTE-QUICKSTART.md)
- 📚 [完整交互式教程](./tutorials/INTERACTIVE-TUTORIAL.md)
- 🎥 [视频系列](./videos/README.md)

---

> "道生一，一生二，二生三，三生万物。"  
> 从一个简单的概念，你可以构建整个应用生态。这就是 DaoMind 的力量。✨
