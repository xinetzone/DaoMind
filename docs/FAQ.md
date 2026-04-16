# DaoMind & Modulux - 常见问题解答 (FAQ)

本文档收录了用户经常提出的问题及详细解答。

> 💡 **提示**: 使用 Ctrl+F (Windows) 或 Cmd+F (Mac) 搜索关键词快速找到答案。

---

## 📚 目录

- [基础概念](#基础概念)
- [安装和配置](#安装和配置)
- [使用指南](#使用指南)
- [常见错误](#常见错误)
- [性能优化](#性能优化)
- [哲学相关](#哲学相关)
- [高级话题](#高级话题)

---

## 基础概念

### Q1: 什么是 DaoMind？

**A**: DaoMind 是一个基于道家哲学的模块化系统框架，特别是基于马王堆汉墓帛书版《老子》的理念。它将古代哲学智慧与现代 TypeScript 技术深度融合。

**核心特点**:
- 🎯 哲学驱动的架构设计
- ⚡ 零运行时类型系统
- 📦 20+ 个功能完整的 npm 包，含 14 个 DaoUniverse* 桥接器
- 🏗️ Monorepo 模块化架构

### Q2: "无名"和"有名"具体指什么？

**A**: 这是来自帛书《老子》的核心概念：

**无名**（Nameless）:
- 哲学：未被命名、未被定义的原初状态
- 技术：TypeScript 类型空间（Type Space）
- 特征：仅在编译时存在，运行时消失，零性能开销

**有名**（Named）:
- 哲学：已被命名、已被定义的显化状态
- 技术：TypeScript 值空间（Value Space）
- 特征：实际的类、对象、函数，运行时存在

```typescript
// 无名：仅类型定义
type Person = { name: string; age: number; };

// 有名：实际对象
const alice: Person = { name: 'Alice', age: 30 };
```

### Q3: DaoMind 与其他框架有什么区别？

**A**: 

| 特性 | DaoMind | 传统框架 |
|------|---------|----------|
| 设计哲学 | 道家思想指导 | 工程实践驱动 |
| 类型系统 | 类型/值明确分离 | 混合使用 |
| 运行时 | 零运行时开销（类型层） | 通常有运行时代码 |
| 包结构 | 20+个专注包 + DaoUniverse* 桥接体系 | 单一大包或少数包 |
| 学习曲线 | 需要理解哲学概念 | 纯技术学习 |
| 创新性 | 跨文化融合 | 技术创新 |

### Q4: 我需要了解道家哲学才能使用 DaoMind 吗？

**A**: **不一定**，但了解会更有帮助：

**最低要求**（入门使用）:
- ✅ 理解"无名"=类型，"有名"=值
- ✅ 会用 TypeScript
- ✅ 跟随教程示例

**推荐了解**（深入使用）:
- 📖 阅读帛书《老子》前几章
- 🎓 了解基本道家概念
- 💡 理解设计决策的哲学依据

**深度研究**（贡献代码）:
- 📚 深入研究道家哲学体系
- 🧠 理解哲学到技术的映射
- ✍️ 能够解释设计理念

### Q5: DaoMind 适合什么样的项目？

**A**: 

✅ **适合的场景**:
- 企业级 TypeScript 应用
- 需要清晰架构的大型项目
- 强调类型安全的系统
- 模块化、可扩展的应用
- 学术研究项目
- 创新性的技术实验

⚠️ **不太适合**:
- 快速原型（学习曲线较陡）
- 小型简单应用（可能过度设计）
- 非 TypeScript 项目
- 需要极致性能优化的场景（虽然零运行时，但概念层有抽象成本）

---

## 安装和配置

### Q6: 如何安装 DaoMind？

**A**: 

**方式 1 - 安装核心包**:
```bash
npm install @daomind/nothing @daomind/anything

# 或使用 pnpm
pnpm add @daomind/nothing @daomind/anything

# 或使用 yarn
yarn add @daomind/nothing @daomind/anything
```

**方式 2 - 安装完整套件**:
```bash
npm install @daomind/collective  # 包含所有核心包
```

**方式 3 - 按需安装**:
```bash
# 只安装需要的包
npm install @daomind/agents @daomind/chronos @modulux/qi
```

### Q7: 需要什么前置依赖？

**A**:

**必需**:
- Node.js >=18.0.0
- TypeScript >=5.0.0
- npm/pnpm/yarn（任选其一）

**推荐**:
- TypeScript >=5.7.2（项目使用的版本）
- pnpm >=8.0.0（monorepo 管理更好）
- VS Code + TypeScript 插件

**配置要求**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true
  }
}
```

### Q8: 如何在现有项目中集成 DaoMind？

**A**:

**步骤 1**: 安装包
```bash
pnpm add @daomind/nothing @daomind/anything
```

**步骤 2**: 更新 TypeScript 配置
```json
{
  "compilerOptions": {
    "paths": {
      "@daomind/*": ["node_modules/@daomind/*/src"]
    }
  }
}
```

**步骤 3**: 创建基础结构
```typescript
// src/daomind/index.ts
export type { ExistenceContract } from '@daomind/nothing';
export type { DaoModuleMeta } from '@daomind/anything';

// 导出你的自定义类型
export interface AppModule extends DaoModuleMeta {
  // 你的属性
}
```

**步骤 4**: 逐步迁移
- 不需要一次性重写
- 可以新功能用 DaoMind
- 旧代码逐步重构

### Q9: 如何配置开发环境？

**A**:

**VS Code 配置** (`.vscode/settings.json`):
```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

**ESLint 配置** (`eslint.config.js`):
```javascript
export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
];
```

**Prettier 配置** (`.prettierrc`):
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

---

## 使用指南

### Q10: 如何创建第一个模块？

**A**: 完整步骤：

```typescript
// 1. 导入基础类型
import type { DaoModuleMeta } from '@daomind/anything';

// 2. 定义你的模块接口
interface TodoModule extends DaoModuleMeta {
  readonly title: string;
  readonly completed: boolean;
}

// 3. 创建工厂函数
function createTodo(title: string): TodoModule {
  const now = Date.now();
  return {
    // ExistenceContract
    existentialType: 'anything',
    
    // DaoModuleMeta
    id: crypto.randomUUID(),
    name: `Todo:${title}`,
    lifecycle: 'active',
    createdAt: now,
    registeredAt: now,
    activatedAt: now,
    
    // TodoModule
    title,
    completed: false,
  };
}

// 4. 使用
const todo = createTodo('学习 DaoMind');
console.log(todo);
```

### Q11: ExistenceContract 必须使用吗？

**A**: **强烈推荐**使用，但不是强制的。

**使用的好处**:
- ✅ 明确标识对象的存在性状态
- ✅ 与 DaoMind 生态系统无缝集成
- ✅ 类型安全和哲学一致性
- ✅ 便于工具和框架识别

**不使用的情况**:
- 简单的数据结构
- 内部实现细节
- 与第三方库集成时

```typescript
// 推荐：使用 ExistenceContract
interface User extends ExistenceContract {
  name: string;
}

// 可以：普通接口（但失去了 DaoMind 的优势）
interface SimpleUser {
  name: string;
}
```

### Q12: 如何实现模块间通信？

**A**: 使用 `@modulux/qi` 消息总线：

```typescript
import { QiBus } from '@modulux/qi';

// 1. 创建总线
const bus = new QiBus();

// 2. 定义消息类型
interface UserMessage {
  type: 'user.created' | 'user.updated';
  payload: { userId: string; username: string };
}

// 3. 订阅消息
bus.subscribe('user.created', (msg: UserMessage) => {
  console.log('新用户:', msg.payload.username);
  // 发送欢迎邮件等
});

// 4. 发布消息
bus.publish({
  type: 'user.created',
  payload: { userId: '001', username: 'Alice' },
  source: 'user-service',
});
```

### Q13: Agent 和 Module 有什么区别？

**A**:

| 特性 | Module (模块) | Agent (代理) |
|------|---------------|--------------|
| **定义** | 数据和逻辑的容器 | 具有自主行动能力的实体 |
| **状态** | 生命周期状态 | 运行状态（active/idle/error） |
| **能力** | 无专门能力概念 | 有明确的能力列表 |
| **用途** | 组织代码和数据 | 执行任务和决策 |
| **包** | @daomind/anything | @daomind/agents |

**使用场景**:
```typescript
// Module：表示数据实体
interface Order extends DaoModuleMeta {
  items: OrderItem[];
  total: number;
}

// Agent：处理订单的执行者
interface OrderProcessor extends DaoAgent {
  capabilities: [
    { name: 'validate', /* ... */ },
    { name: 'calculate', /* ... */ },
    { name: 'submit', /* ... */ }
  ];
}
```

### Q14: 如何组织时间和空间？

**A**: 使用 Chronos 和 Spaces 包：

```typescript
import type { ChronosFlow } from '@daomind/chronos';
import type { SpaceOrganization } from '@daomind/spaces';

// 创建时间线
const projectTimeline: ChronosFlow = {
  id: 'timeline-1',
  existentialType: 'anything',
  createdAt: Date.now(),
  startTime: new Date('2026-01-01'),
  endTime: new Date('2026-12-31'),
  flowType: 'linear',
  milestones: [
    { date: new Date('2026-03-01'), name: 'Phase 1 Complete' },
    { date: new Date('2026-06-01'), name: 'Phase 2 Complete' },
  ],
};

// 创建空间层次
const company: SpaceOrganization = {
  id: 'space-1',
  existentialType: 'anything',
  createdAt: Date.now(),
  name: 'Company',
  dimension: 3,
  boundary: { type: 'unbounded' },
  subspaces: [
    {
      id: 'space-2',
      name: 'Engineering Department',
      subspaces: [
        { id: 'space-3', name: 'Frontend Team' },
        { id: 'space-4', name: 'Backend Team' },
      ],
    },
  ],
};
```

---

## 常见错误

### Q15: 错误："Cannot find module '@daomind/nothing'"

**A**: 

**原因**: 包未正确安装

**解决方案**:
```bash
# 1. 清理缓存
rm -rf node_modules package-lock.json

# 2. 重新安装
npm install

# 3. 验证安装
npm list @daomind/nothing
```

**检查**:
```typescript
// 确保导入路径正确
import type { ExistenceContract } from '@daomind/nothing';  // ✅
import type { ExistenceContract } from 'daomind/nothing';   // ❌
```

### Q16: 类型错误："Property 'existentialType' is missing"

**A**:

**原因**: 忘记添加必需的 `existentialType` 属性

**解决方案**:
```typescript
// ❌ 错误：缺少 existentialType
const user = {
  id: '001',
  name: 'Alice',
};

// ✅ 正确：包含 existentialType
const user: UserModule = {
  existentialType: 'anything',  // 必需！
  id: '001',
  name: 'Alice',
  // ... 其他必需属性
};
```

### Q17: 编译错误："TS2742: The inferred type cannot be named"

**A**:

**原因**: TypeScript 无法推断复杂类型

**解决方案**:
```typescript
// ❌ 问题代码
export const createModule = () => ({
  id: crypto.randomUUID(),
  // 复杂嵌套结构
});

// ✅ 解决方案1：显式返回类型
export const createModule = (): MyModule => ({
  id: crypto.randomUUID(),
  // ...
});

// ✅ 解决方案2：使用类型断言
export const createModule = () => ({
  id: crypto.randomUUID(),
  // ...
} as MyModule);
```

### Q18: 运行时错误："Cannot read property of undefined"

**A**:

**常见原因和解决方案**:

```typescript
// 问题1：访问不存在的模块
const module = registry.get('non-existent-id');
console.log(module.name);  // ❌ module is undefined

// 解决方案：检查存在性
const module = registry.get('some-id');
if (module) {
  console.log(module.name);  // ✅
}

// 问题2：可选属性未检查
interface Module extends DaoModuleMeta {
  description?: string;
}

const module: Module = /* ... */;
console.log(module.description.length);  // ❌

// 解决方案：使用可选链
console.log(module.description?.length);  // ✅
```

### Q19: 构建错误："Module not found: Can't resolve..."

**A**:

**检查清单**:

1. **路径别名配置** (tsconfig.json):
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@daomind/*": ["node_modules/@daomind/*/src"]
    }
  }
}
```

2. **Vite 配置** (vite.config.ts):
```typescript
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

3. **包导出检查** (package.json):
```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

---

## 性能优化

### Q20: DaoMind 会影响运行时性能吗？

**A**: **类型层零影响，值层看实现**

**类型层（@daomind/nothing）**:
- ✅ 编译后完全消失
- ✅ 零运行时开销
- ✅ 不增加包体积

```typescript
// 编译前
import type { ExistenceContract } from '@daomind/nothing';
interface User extends ExistenceContract { name: string; }

// 编译后（JavaScript）
// 类型完全消失，无任何运行时代码
```

**值层（其他包）**:
- ⚠️ 有运行时代码
- ⚠️ 性能取决于实现
- ✅ 但设计是高效的

**性能对比**:
```typescript
// DaoMind 方式
const module = {
  existentialType: 'anything',
  id: '001',
  name: 'Test',
};

// 原生 JavaScript
const obj = {
  id: '001',
  name: 'Test',
};

// 性能差异：几乎可以忽略（多一个属性）
```

### Q21: 如何优化大量模块的创建？

**A**:

**优化策略**:

1. **对象池模式**:
```typescript
class ModulePool<T extends DaoModuleMeta> {
  private pool: T[] = [];
  
  acquire(factory: () => T): T {
    return this.pool.pop() || factory();
  }
  
  release(module: T): void {
    // 重置模块状态
    this.pool.push(module);
  }
}
```

2. **延迟初始化**:
```typescript
interface LazyModule extends DaoModuleMeta {
  _data?: HeavyData;
  get data(): HeavyData {
    if (!this._data) {
      this._data = loadHeavyData();
    }
    return this._data;
  }
}
```

3. **批量创建**:
```typescript
function createModulesBatch(count: number): DaoModuleMeta[] {
  const baseTime = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    existentialType: 'anything',
    id: `${baseTime}-${i}`,
    name: `Module-${i}`,
    lifecycle: 'active',
    createdAt: baseTime,
    registeredAt: baseTime,
  }));
}
```

### Q22: 如何减少包体积？

**A**:

**策略 1：按需导入**:
```typescript
// ❌ 导入整个包
import * as DaoMind from '@daomind/collective';

// ✅ 只导入需要的
import type { ExistenceContract } from '@daomind/nothing';
import type { DaoModuleMeta } from '@daomind/anything';
```

**策略 2：使用类型导入**:
```typescript
// 类型导入不会打包到最终产物
import type { DaoAgent } from '@daomind/agents';
import { createAgent } from '@daomind/agents';  // 只这个会打包
```

**策略 3：Tree Shaking**:
```javascript
// vite.config.ts
export default {
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        dead_code: true,
      },
    },
  },
};
```

---

## 哲学相关

### Q23: 为什么要将哲学与编程结合？

**A**:

**理论价值**:
- 🎯 提供深层的设计指导
- 🧠 增强概念的一致性
- 📚 创造跨文化的技术创新
- ✨ 赋予代码更深的意义

**实践价值**:
- 清晰的架构原则
- 一致的命名和组织
- 易于理解和记忆
- 独特的技术品牌

**案例对比**:
```typescript
// 没有哲学指导：命名和组织随意
interface Thing {
  data: any;
  doStuff(): void;
}

// 有哲学指导：清晰的层次和意图
interface Entity extends ExistenceContract {  // "有名"状态
  // 从"无名"（类型）到"有名"（实例）
}
```

### Q24: 帛书版《道德经》有什么特殊之处？

**A**:

**历史价值**:
- 📜 出土于公元前 168 年
- 🏺 比传世版本早约 400 年
- ✅ 更接近原始版本
- 🔍 纠正了后世传抄错误

**关键差异**:
```
传世版本（王弼本）:
"无，名天地之始"  ❌
↓
理解为："无"是名词，"名"是动词

帛书版本（甲本）:
"无名，万物之始也"  ✅
↓
正确理解："无名"是一个词，表示未命名状态
```

**对 DaoMind 的影响**:
- 修正了整个架构的哲学基础
- 从 1.0.0 重构到 2.0.0
- 体现了对原文的严谨态度

### Q25: 如何理解"命名"的过程？

**A**:

**哲学层面**:
```
无名（Nameless）→  命名  → 有名（Named）
  潜在可能性    →  定义   →  具体实体
  未分化状态    →  区分   →  显化形态
```

**技术层面**:
```typescript
// 1. 无名阶段：定义类型（潜在可能）
type User = {
  name: string;
  age: number;
};

// 2. 命名过程：创建实例（给予身份）
const alice: User = {
  name: 'Alice',  // 赋予名字
  age: 30,
};

// 3. 有名阶段：实例存在（具体实体）
console.log(alice);  // 已经是"有名"的对象
```

**类比理解**:
```
1. 蓝图（无名）→ 2. 建造（命名）→ 3. 房子（有名）
1. 概念（无名）→ 2. 实例化（命名）→ 3. 对象（有名）
1. DNA（无名）→ 2. 发育（命名）→ 3. 生物（有名）
```

### Q26: 其他哲学概念如何体现在 DaoMind 中？

**A**:

**"气"（Qi）- 数据流**:
```typescript
// 气：连接万物的能量流动
import { QiBus } from '@modulux/qi';
const bus = new QiBus();  // 消息总线

// 气的流动：消息在模块间传递
bus.publish({ type: 'event', data: {} });
```

**"宙宇"（Spacetime）- 时空组织**:
```typescript
// 宙（时间）：连续的时间流
import { ChronosFlow } from '@daomind/chronos';

// 宇（空间）：层次化的空间
import { SpaceOrganization } from '@daomind/spaces';
```

**"反者道之动"（Reversal）- 反馈机制**:
```typescript
// 道的运动方式是循环往复
import { FeedbackLoop } from '@daomind/feedback';

// 四阶段反馈：输入 → 处理 → 输出 → 反馈
```

**"经络"（Meridians）- 系统监控**:
```typescript
// 中医经络：能量通道和健康监测
import { Monitor } from '@daomind/monitor';

// 监控系统健康状态
```

---

## 高级话题

### Q27: 如何扩展 DaoMind 框架？

**A**:

**方式 1：创建自定义包**:
```typescript
// packages/my-custom-package/src/index.ts
import type { ExistenceContract } from '@daomind/nothing';

export interface MyCustomModule extends ExistenceContract {
  // 你的扩展
}

export function createMyModule(): MyCustomModule {
  // 你的实现
}
```

**方式 2：扩展现有类型**:
```typescript
// 使用 TypeScript 的声明合并
declare module '@daomind/anything' {
  interface DaoModuleMeta {
    customField?: string;  // 添加自定义字段
  }
}
```

**方式 3：创建插件系统**:
```typescript
interface DaoMindPlugin {
  name: string;
  install(system: DaoMindSystem): void;
}

class DaoMindSystem {
  use(plugin: DaoMindPlugin): void {
    plugin.install(this);
  }
}
```

### Q28: 如何实现持久化？

**A**:

**数据库集成示例**:
```typescript
import type { DaoModuleMeta } from '@daomind/anything';

// 1. 定义序列化接口
interface Serializable {
  toJSON(): object;
  fromJSON(data: object): this;
}

// 2. 实现持久化层
class ModuleRepository<T extends DaoModuleMeta> {
  async save(module: T): Promise<void> {
    await db.insert('modules', {
      id: module.id,
      data: JSON.stringify(module),
      created_at: module.createdAt,
    });
  }
  
  async load(id: string): Promise<T | null> {
    const row = await db.select('modules', { id });
    return row ? JSON.parse(row.data) : null;
  }
}

// 3. 使用
const repo = new ModuleRepository();
await repo.save(myModule);
const loaded = await repo.load('module-id');
```

### Q29: 如何集成到 React/Vue/Angular？

**A**:

**React 集成**:
```typescript
// hooks/useDaoModule.ts
import { useState, useEffect } from 'react';
import type { DaoModuleMeta } from '@daomind/anything';

export function useDaoModule<T extends DaoModuleMeta>(
  id: string
): T | null {
  const [module, setModule] = useState<T | null>(null);
  
  useEffect(() => {
    // 加载模块
    loadModule(id).then(setModule);
  }, [id]);
  
  return module;
}

// 组件中使用
function UserProfile({ userId }: { userId: string }) {
  const user = useDaoModule<UserModule>(userId);
  
  if (!user) return <div>Loading...</div>;
  
  return <div>{user.name}</div>;
}
```

**Vue 集成**:
```typescript
// composables/useDaoModule.ts
import { ref, watch } from 'vue';
import type { DaoModuleMeta } from '@daomind/anything';

export function useDaoModule<T extends DaoModuleMeta>(id: string) {
  const module = ref<T | null>(null);
  const loading = ref(true);
  
  watch(() => id, async (newId) => {
    loading.value = true;
    module.value = await loadModule(newId);
    loading.value = false;
  }, { immediate: true });
  
  return { module, loading };
}
```

### Q30: 如何测试 DaoMind 应用？

**A**:

**单元测试**:
```typescript
import { describe, it, expect } from 'vitest';
import { createUserModule } from './user';

describe('UserModule', () => {
  it('should create user with correct properties', () => {
    const user = createUserModule('alice', 'alice@example.com');
    
    expect(user.existentialType).toBe('anything');
    expect(user.username).toBe('alice');
    expect(user.email).toBe('alice@example.com');
    expect(user.lifecycle).toBe('active');
  });
  
  it('should have unique IDs', () => {
    const user1 = createUserModule('alice', 'alice@example.com');
    const user2 = createUserModule('bob', 'bob@example.com');
    
    expect(user1.id).not.toBe(user2.id);
  });
});
```

**集成测试**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { TaskManagementSystem } from './task-system';

describe('TaskManagementSystem', () => {
  let system: TaskManagementSystem;
  
  beforeEach(() => {
    system = new TaskManagementSystem();
  });
  
  it('should create and assign tasks', () => {
    const task = system.createTask({
      title: 'Test Task',
      priority: 'high',
    });
    
    const agent = system.createAgent();
    system.assignTask(task.id, agent.id);
    
    const stats = system.getStats();
    expect(stats.inProgress).toBe(1);
  });
});
```

---

## 🤔 还有问题？

如果你的问题没有在这里找到答案：

1. **搜索文档**: 使用仓库搜索功能
2. **查看示例**: [examples/](../examples/) 目录
3. **提问讨论**: [GitHub Discussions](https://github.com/xinetzone/DaoMind/discussions)
4. **报告问题**: [GitHub Issues](https://github.com/xinetzone/DaoMind/issues)

---

**最后更新**: 2026-04-16  
**版本**: 2.21.0  
**贡献**: 欢迎提交新的 FAQ 问题
