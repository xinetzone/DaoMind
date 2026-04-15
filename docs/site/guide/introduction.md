# 介绍

## 什么是 DaoMind & Modulux？

DaoMind & Modulux 是一个融合道家哲学与现代 TypeScript 的模块化框架。基于帛书《道德经》的核心理念：**"无名，万物之始也；有名，万物之母也"**。

## 核心理念

### 无名（Wúmíng）- 类型空间

"无名"代表TypeScript的**类型空间**（Type Space）：
- 编译时存在，运行时不存在
- 零运行时开销
- 纯粹的抽象和契约

```typescript
// 类型定义 - 无名层
interface ExistenceContract {
  readonly existentialType: 'nothing' | 'anything';
}
```

### 有名（Yǒumíng）- 值空间

"有名"代表TypeScript的**值空间**（Value Space）：
- 运行时存在
- 实际的数据和行为
- 具体的实现

```typescript
// 实现 - 有名层
const user: User = {
  existentialType: 'anything',
  id: '123',
  name: 'Alice',
  createdAt: Date.now(),
};
```

## 设计原则

### 1. 清晰分离（Clear Separation）
类型定义（无名）与实现逻辑（有名）严格分离。

### 2. 最小化（Minimalism）
契约接口保持最小化，仅定义必要的约束。

### 3. 不变性（Immutability）
数据结构设计为不可变，通过创建新对象来"更新"。

### 4. 无为而治（Wu Wei）
框架提供约束而非强制，让代码自然演化。

### 5. 单一职责（Single Responsibility）
每个模块、每个类型都有明确的单一职责。

## 架构概览

```
DaoMind 生态系统
├── @daomind/nothing      - 零运行时核心（类型定义）
├── @daomind/anything     - 模块容器系统
├── @daomind/agents       - Agent 智能体系统
├── @daomind/space        - 时空管理
├── @daomind/messages     - 消息系统
├── @daomind/qi           - 气流（数据流）
├── @daomind/verify       - 验证工具
└── @daomind/benchmark    - 性能基准测试
```

## 为什么选择 DaoMind？

### 🧠 哲学驱动
不仅是技术框架，更是一种编程思想。将道家智慧融入现代开发。

### ⚡ 零运行时
核心类型定义在运行时完全消失，没有任何性能开销。

### 🏗️ 模块化架构
清晰的模块边界，易于理解、维护和扩展。

### 🔒 类型安全
利用 TypeScript 的类型系统提供编译时保证。

### 📦 开箱即用
提供 CLI 工具，一行命令创建项目。

### 📚 完整文档
50+ 份文档，4 个完整示例，详细的视频教程。

## 快速体验

```bash
# 使用 CLI 创建项目
pnpm create daomind my-project

# 进入项目
cd my-project

# 安装依赖
pnpm install

# 运行示例
pnpm dev
```

## 学习路径

1. **入门**: 阅读[快速开始](/guide/getting-started)
2. **理解**: 学习[核心概念](/guide/concepts)
3. **实践**: 尝试[示例项目](/examples/)
4. **深入**: 查看[API 参考](/api/)
5. **精通**: 阅读[最佳实践](/guide/best-practices)

## 社区与支持

- **GitHub**: [github.com/xinetzone/DaoMind](https://github.com/xinetzone/DaoMind)
- **问题追踪**: [GitHub Issues](https://github.com/xinetzone/DaoMind/issues)
- **讨论区**: [GitHub Discussions](https://github.com/xinetzone/DaoMind/discussions)

## 许可证

MIT License - 自由使用，欢迎贡献！

---

> "道生一，一生二，二生三，三生万物"  
> 从核心概念到完整生态，DaoMind 正在蓬勃发展！
