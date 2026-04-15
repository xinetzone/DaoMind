# 核心概念

理解 DaoMind 的两个核心哲学概念。

## 无名 (Wúmíng) — 类型空间

> 无名，万物之始

**无名**代表**类型空间**：在 TypeScript 编译时存在，运行时完全消失，实现零运行时开销。

```typescript
// 无名：纯类型定义，编译后不存在
type UserContract = {
  id: string;
  name: string;
  email: string;
};

interface ModuleContract {
  readonly id: string;
  initialize(): Promise<void>;
  destroy(): Promise<void>;
}
```

### 无名的特性

- **编译时存在** — TypeScript 类型检查阶段完全可见
- **运行时消失** — 编译产物中不包含任何类型信息
- **零开销** — 对运行时性能没有任何影响
- **万物之始** — 所有实现都从契约（类型）开始

## 有名 (Yǒumíng) — 值空间

> 有名，万物之母

**有名**代表**值空间**：运行时真实存在的对象、函数、类实例。

```typescript
// 有名：运行时实例，真实存在
const userModule = {
  id: 'user-module',
  async initialize() {
    console.log('用户模块已初始化');
  },
  async destroy() {
    console.log('用户模块已销毁');
  }
} satisfies ModuleContract; // 与无名契约连接
```

### 有名的特性

- **运行时存在** — 在程序执行时真实占用内存
- **可观测** — 可以被调试、监控和测量
- **万物之母** — 所有功能的实际载体

## 两者的关系

```
无名（类型）                有名（值）
─────────────────────────────────────
interface UserContract  →  const user: UserContract
type Config             →  const config: Config
abstract class Base     →  class Impl extends Base
```

**核心原则**：先定义契约（无名），再创建实现（有名）。

## 道 (Dào) — 模块系统

在 DaoMind 中，**道**代表**模块系统**——连接无名与有名的桥梁：

```typescript
import { createModule } from '@daomind/core';

// 道：连接类型与实现的桥梁
const userModule = createModule<UserContract>({
  id: 'user',
  // 实现...
});
```

## 下一步

- [快速开始](/guide/getting-started) — 立即动手实践
- [第一个示例](/guide/first-example) — 具体代码示例
- [理解无名与有名](/guide/nameless-named) — 深入理解
