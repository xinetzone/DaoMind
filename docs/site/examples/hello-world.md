# Hello World

最简单的 DaoMind 示例，了解基本用法。

## 完整代码

```typescript
// hello-world.ts
import { defineModule, createContainer } from '@daomind/anything'

// 1. 定义契约（无名）
interface Greeter {
  greet(name: string): string
}

// 2. 创建模块（有名）
const greeterModule = defineModule<Greeter>({
  id: 'greeter',
  setup() {
    return {
      greet(name: string) {
        return `你好，${name}！欢迎来到 DaoMind 的世界。`
      },
    }
  },
})

// 3. 使用模块
const container = createContainer()
container.register(greeterModule)
await container.initialize()

const greeter = container.get<Greeter>('greeter')
console.log(greeter.greet('道友'))
// 输出: 你好，道友！欢迎来到 DaoMind 的世界。
```

## 运行方式

```bash
# 1. 创建项目
mkdir hello-daomind && cd hello-daomind
pnpm init

# 2. 安装依赖
pnpm add @daomind/anything
pnpm add -D typescript tsx

# 3. 运行
pnpx tsx hello-world.ts
```

## 关键点

- **第 1 步**（无名）：定义了 `Greeter` 接口——这在运行时不存在
- **第 2 步**（有名）：创建了真正运行的实现
- **第 3 步**：通过容器管理模块生命周期

## 下一步

- [Counter 示例](/examples/counter) — 带状态的模块
- [Todo List](/examples/todo-list) — 完整 CRUD 示例
