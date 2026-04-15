# Hello World - DaoMind 第一个示例

最简单的 DaoMind 应用，帮助你理解核心概念。

## 📚 学习目标

- 理解 ExistenceContract
- 创建第一个模块
- 理解"无名"到"有名"的过程

## 🚀 快速开始

### 安装依赖

```bash
cd 01-hello-world
pnpm install
```

### 运行示例

```bash
pnpm dev
```

### 构建

```bash
pnpm build
```

## 📖 代码讲解

### 类型定义（"无名"层）

```typescript
// src/types.ts
import type { ExistenceContract } from '@daomind/nothing';

export interface HelloModule extends ExistenceContract {
  readonly message: string;
  readonly language: string;
}
```

**解释**:
- `HelloModule` 是类型定义，处于"无名"状态
- 继承 `ExistenceContract` 标记存在性
- 使用 `readonly` 确保不可变性

### 模块创建（"命名"过程）

```typescript
// src/module.ts
export function createHello(message: string, language = 'en'): HelloModule {
  return {
    existentialType: 'anything',  // 从"无名"到"有名"
    message,
    language,
  };
}
```

**解释**:
- `createHello` 是工厂函数
- 返回实例时标记 `existentialType: 'anything'`
- 这是"命名"的过程，使类型成为实体

### 使用（"有名"层）

```typescript
// src/index.ts
const hello = createHello('Hello, DaoMind!', 'en');
console.log('✨', hello.message);
```

## 🎯 核心概念

### "无名"与"有名"

```
类型定义（HelloModule）  →  命名过程（createHello）  →  实例（hello）
    ↓                         ↓                           ↓
  "无名"状态                  转化                      "有名"状态
编译后消失                  创建过程                   运行时存在
零开销                      赋予身份                   实际对象
```

### 存在性标记

```typescript
existentialType: 'nothing' | 'anything'
                  ↓              ↓
              "无名"状态      "有名"状态
              类型定义        实际实例
```

## 💡 实践任务

### 任务 1: 添加时间戳

修改 `HelloModule`，添加创建时间：

```typescript
export interface HelloModule extends ExistenceContract {
  readonly message: string;
  readonly language: string;
  readonly createdAt: number;  // 新增
}
```

### 任务 2: 多语言支持

创建支持多语言的 Hello：

```typescript
const greetings = {
  en: 'Hello',
  zh: '你好',
  ja: 'こんにちは',
};

function createMultilingualHello(language: string): HelloModule {
  const greeting = greetings[language] || greetings.en;
  return createHello(`${greeting}, DaoMind!`, language);
}
```

### 任务 3: 添加验证

添加消息验证：

```typescript
function createHello(message: string, language = 'en'): HelloModule {
  if (!message.trim()) {
    throw new Error('Message cannot be empty');
  }
  return {
    existentialType: 'anything',
    message,
    language,
  };
}
```

## 📊 项目结构

```
01-hello-world/
├── src/
│   ├── types.ts       # 类型定义（无名层）
│   ├── module.ts      # 模块实现
│   └── index.ts       # 主入口
├── package.json
├── tsconfig.json
└── README.md
```

## 🔗 下一步

完成这个示例后，你可以：
- 进入 [02-counter](../02-counter/) 学习状态管理
- 阅读 [API 参考](../../api/API-REFERENCE.md)
- 查看 [最佳实践](../../guides/BEST-PRACTICES.md)

---

**难度**: ⭐ 入门  
**预计时间**: 15 分钟  
**前置知识**: TypeScript 基础
