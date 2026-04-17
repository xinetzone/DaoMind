# 常见问题 (FAQ)

## 基础问题

### Q：DaoMind 和其他框架有什么区别？

DaoMind 的独特之处在于**哲学驱动的设计**：

- **无名/有名** 的概念帮助你明确区分类型与值
- 强调**零运行时开销**的纯类型系统
- 模块化架构从**道家整体观**出发设计

### Q：我需要了解道家哲学才能使用吗？

不需要！道家概念只是帮助理解设计思路的**隐喻**，实际使用就是标准的 TypeScript 开发。

### Q：DaoMind 与 TypeScript 的关系？

DaoMind **不是** TypeScript 的替代品，而是**建立在 TypeScript 之上**的框架：

```
你的应用代码
    ↓
DaoMind & Modulux
    ↓
TypeScript
    ↓
JavaScript (运行时)
```

---

## 安装与配置

### Q：需要哪些前置条件？

- Node.js ≥ 18
- pnpm ≥ 8（推荐）或 npm/yarn
- TypeScript ≥ 5.0

### Q：可以在现有项目中使用吗？

可以！逐步迁移策略：

```bash
# 1. 安装核心包
pnpm add @daomind/core

# 2. 在新功能中使用 DaoMind 模式
# 3. 逐步重构旧代码
```

### Q：支持 CommonJS 项目吗？

DaoMind 主要面向 **ES Modules**。CommonJS 支持通过构建配置处理：

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "module": "ESNext",  // 推荐
    // 或
    "module": "CommonJS" // 传统项目
  }
}
```

---

## 技术问题

### Q：无名类型真的零开销吗？

是的！TypeScript 的类型信息在编译阶段完全擦除：

```typescript
// TypeScript 源码
interface UserContract {
  id: string
  name: string
}
const user: UserContract = { id: '1', name: 'DaoMind' }

// 编译后 JavaScript（interface 完全消失）
const user = { id: '1', name: 'DaoMind' }
```

### Q：如何处理循环依赖？

使用**延迟注入**模式：

```typescript
const moduleA = defineModule({
  id: 'a',
  deps: () => ({ b: moduleB }), // 函数形式，延迟求值
  setup({ b }) {
    /* ... */
  },
})
```

### Q：Agent 系统的性能如何？

消息传递基于**同步队列**，通常比事件监听器快：

- 消息分发：O(1)
- 状态更新：不可变更新，支持 memoization
- 订阅者通知：O(n)，n 为订阅者数量

---

## 常见错误

### 错误：`Type 'X' does not satisfy 'Y'`

```typescript
// ❌ 错误：实现不完整
const myModule = {
  id: 'test',
  // 缺少 initialize 方法
} satisfies ModuleContract

// ✅ 修复：补全所有必需属性
const myModule = {
  id: 'test',
  async initialize() {
    /* ... */
  },
  async destroy() {
    /* ... */
  },
} satisfies ModuleContract
```

### 错误：模块未初始化就使用

```typescript
// ❌ 错误
const container = createContainer()
container.register(myModule)
const instance = container.get('my-module') // 还未初始化！

// ✅ 正确
await container.initialize() // 先初始化
const instance = container.get('my-module')
```

---

## 获取帮助

- [GitHub Issues](https://github.com/xinetzone/DaoMind/issues) — 报告 Bug
- [GitHub Discussions](https://github.com/xinetzone/DaoMind/discussions) — 问题讨论
- [文档](/guide/) — 完整文档
