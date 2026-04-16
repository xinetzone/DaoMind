# @daomind/anything

**有名** 核心包 — 运行时模块容器，管理模块注册与生命周期。

> "有名，万物之母也。"  
> —— 马王堆汉墓帛书《老子》甲本

## 安装

```bash
pnpm add @daomind/anything @daomind/nothing
```

---

## 核心概念

`DaoAnythingContainer` 是"有名"层的核心类，实现模块的注册、生命周期管理和实例解析。

模块生命周期：

```
registered → initialized → active → suspending → terminated
   注册         初始化       活跃      暂停中        终止
                              ↑__________↓  (可来回)
```

---

## DaoAnythingContainer

### 创建容器

```typescript
import { DaoAnythingContainer } from '@daomind/anything';

const container = new DaoAnythingContainer();
```

或使用全局默认实例：

```typescript
import { daoContainer } from '@daomind/anything';
```

---

### `register(module)`

注册模块到容器（初始状态：`registered`）。

```typescript
container.register({
  name: 'user-service',
  path: './services/user',   // 动态 import 路径
});
```

**参数**：`DaoModuleRegistration`

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | `string` | 模块唯一名称 |
| `path` | `string` | 动态 import 路径 |

**异常**：若模块名已存在则抛出错误。

---

### 生命周期方法

所有方法均为 `async`，接受模块名作为参数。

```typescript
// registered → initialized
await container.initialize('user-service');

// initialized → active
await container.activate('user-service');

// active → suspending
await container.deactivate('user-service');

// suspending → active（恢复）
await container.activate('user-service');

// 任意状态 → terminated
await container.terminate('user-service');
```

**完整流程示例**：

```typescript
const container = new DaoAnythingContainer();

container.register({ name: 'auth', path: './auth' });
container.register({ name: 'user', path: './user' });

await container.initialize('auth');
await container.activate('auth');

await container.initialize('user');
await container.activate('user');

// 使用模块
const authService = await container.resolve<AuthService>('auth');
authService.login('alice', 'password');

// 暂停
await container.deactivate('user');

// 终止
await container.terminate('auth');
await container.terminate('user');
```

---

### `resolve<T>(name)`

获取模块实例（模块必须处于 `active` 状态）。

```typescript
const service = await container.resolve<UserService>('user');
```

底层行为：首次调用时动态 `import(registration.path)` 并缓存实例；后续调用直接返回缓存。

**异常**：
- 模块未注册 → 抛出错误
- 模块未激活 → 抛出错误（含当前状态）

---

### `getModule(name)`

获取模块元数据，不返回实例。

```typescript
const meta = container.getModule('user-service');
if (meta) {
  console.log(meta.lifecycle);  // 'active'
  console.log(meta.activatedAt); // number
}
```

**返回**：`DaoModuleMeta | undefined`

---

### `listModules()`

列出容器内所有模块元数据。

```typescript
const modules = container.listModules();
modules.forEach(m => console.log(m.name, m.lifecycle));
```

**返回**：`ReadonlyArray<DaoModuleMeta>`

---

## 类型参考

### `DaoModuleMeta`

模块元数据，实现了 `ExistenceContract`。

```typescript
interface DaoModuleMeta extends ExistenceContract {
  readonly id: string;
  readonly name: string;
  readonly lifecycle: ModuleLifecycle;
  readonly createdAt: number;
  readonly registeredAt: number;
  readonly activatedAt?: number;   // active 后才有值
}
```

### `ModuleLifecycle`

```typescript
type ModuleLifecycle =
  | 'registered'   // 已注册，未初始化
  | 'initialized'  // 已初始化，未激活
  | 'active'       // 运行中
  | 'suspending'   // 暂停中
  | 'terminated';  // 已销毁（终态）
```

### `DaoModuleRegistration`

注册时传入的配置：

```typescript
interface DaoModuleRegistration {
  readonly name: string;
  readonly path: string;
}
```

---

## 与 DaoAgentContainerBridge 集成

`DaoAgentContainerBridge` 可将 Agent 的生命周期事件自动同步到容器模块状态：

```typescript
import { DaoAnythingContainer } from '@daomind/anything';
import { daoAgentContainerBridge, TaskAgent } from '@daomind/agents';

const container = new DaoAnythingContainer();
const agent = new TaskAgent('worker-1');

// 绑定：Agent 状态改变时，容器内对应模块自动跟进
daoAgentContainerBridge.mount(agent, container);

await agent.initialize(); // 容器内模块同步到 initialized
await agent.activate();   // 容器内模块同步到 active
await agent.terminate();  // 容器内模块同步到 terminated

daoAgentContainerBridge.unmount('worker-1');
```

---

## 完整导出列表

```typescript
import type { DaoModuleRegistration, ModuleLifecycle, DaoModuleMeta } from '@daomind/anything';

import { DaoAnythingContainer, daoContainer } from '@daomind/anything';
```
