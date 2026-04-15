# 第一个示例

用 5 分钟构建你的第一个 DaoMind 模块。

## 目标

创建一个简单的**用户问候模块**，演示无名与有名的完整工作流程。

## 第一步：定义契约（无名）

```typescript
// src/contracts/greeter.ts

// 无名：类型契约，编译后消失
export interface GreeterContract {
  readonly name: string;
  greet(user: string): string;
  greetAsync(user: string): Promise<string>;
}
```

## 第二步：创建实现（有名）

```typescript
// src/modules/greeter.ts
import type { GreeterContract } from '../contracts/greeter';

// 有名：运行时实现
export const chineseGreeter = {
  name: 'chinese-greeter',
  
  greet(user: string): string {
    return `你好，${user}！欢迎使用 DaoMind。`;
  },
  
  async greetAsync(user: string): Promise<string> {
    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 100));
    return `异步问候：你好，${user}！`;
  }
} satisfies GreeterContract; // TypeScript 验证实现符合契约
```

## 第三步：使用模块

```typescript
// src/main.ts
import { chineseGreeter } from './modules/greeter';

// 同步使用
const greeting = chineseGreeter.greet('道友');
console.log(greeting); // 你好，道友！欢迎使用 DaoMind。

// 异步使用
const asyncGreeting = await chineseGreeter.greetAsync('道友');
console.log(asyncGreeting); // 异步问候：你好，道友！
```

## 运行结果

```
你好，道友！欢迎使用 DaoMind。
异步问候：你好，道友！
```

## 关键点

1. **契约先行** — 先写接口，再写实现
2. **`satisfies` 关键字** — TypeScript 验证实现完整性
3. **类型消失** — 编译后 `GreeterContract` 完全不存在
4. **运行时干净** — 只有真正需要的代码

## 下一步

- [理解无名与有名](/guide/nameless-named) — 深入理解这对概念
- [创建模块](/guide/creating-modules) — 更复杂的模块创建
- [示例库](/examples/) — 查看更多完整示例
