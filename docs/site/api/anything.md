# @daomind/anything

**有名** 核心包 — 运行时模块容器，管理模块注册与生命周期；提供 `DaoModuleGraph` 依赖图引擎解析模块初始化顺序。

> "有名，万物之母也。"  
> —— 马王堆汉墓帛书《老子》甲本

## 安装

```bash
pnpm add @daomind/anything @daomind/nothing
```

---

## 核心概念

`DaoAnythingContainer` 是"有名"层的 IoC 容器，管理模块注册、生命周期和实例解析。  
`DaoModuleGraph` 是"有名"层的依赖图引擎，通过拓扑排序给出确定性的初始化顺序，并检测循环依赖。

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
import { DaoAnythingContainer } from '@daomind/anything'

const container = new DaoAnythingContainer()
```

或使用全局默认实例：

```typescript
import { daoContainer } from '@daomind/anything'
```

---

### `register(module)`

注册模块到容器（初始状态：`registered`）。

```typescript
container.register({
  name: 'user-service',
  version: '1.0.0',
  path: './services/user', // 动态 import 路径
})
```

**参数**：`DaoModuleRegistration`

| 字段           | 类型                        | 说明               |
| -------------- | --------------------------- | ------------------ |
| `name`         | `string`                    | 模块唯一名称       |
| `version`      | `string`                    | 模块版本           |
| `path`         | `string`                    | 动态 import 路径   |
| `dependencies` | `readonly string[]`（可选） | 声明依赖的模块名称 |

**异常**：若模块名已存在则抛出错误。

---

### 生命周期方法

所有方法均为 `async`，接受模块名作为参数。

```typescript
// registered → initialized
await container.initialize('user-service')

// initialized → active
await container.activate('user-service')

// active → suspending
await container.deactivate('user-service')

// suspending → active（恢复）
await container.activate('user-service')

// 任意状态 → terminated
await container.terminate('user-service')
```

**完整流程示例**：

```typescript
const container = new DaoAnythingContainer()

container.register({ name: 'auth',    version: '1.0.0', path: './auth' })
container.register({ name: 'user',    version: '1.0.0', path: './user',    dependencies: ['auth'] })
container.register({ name: 'payment', version: '1.0.0', path: './payment', dependencies: ['auth', 'user'] })

// 先用 DaoModuleGraph 计算安全的初始化顺序
import { DaoModuleGraph } from '@daomind/anything'
const graph = new DaoModuleGraph()
graph.addModule('auth',    [])
graph.addModule('user',    ['auth'])
graph.addModule('payment', ['auth', 'user'])
const order = graph.topologicalOrder() // ['auth', 'user', 'payment']

for (const name of order ?? []) {
  await container.initialize(name)
  await container.activate(name)
}

// 使用模块
const authService = await container.resolve<AuthService>('auth')
authService.login('alice', 'password')

// 终止
await container.terminate('payment')
await container.terminate('user')
await container.terminate('auth')
```

---

### `resolve<T>(name)`

获取模块实例（模块必须处于 `active` 状态）。

```typescript
const service = await container.resolve<UserService>('user')
```

底层行为：首次调用时动态 `import(registration.path)` 并缓存实例；后续调用直接返回缓存。

**异常**：

- 模块未注册 → 抛出错误
- 模块未激活 → 抛出错误（含当前状态）

---

### `getModule(name)`

获取模块元数据，不返回实例。

```typescript
const meta = container.getModule('user-service')
if (meta) {
  console.log(meta.lifecycle) // 'active'
  console.log(meta.activatedAt) // number
}
```

**返回**：`DaoModuleMeta | undefined`

---

### `listModules()`

列出容器内所有模块元数据。

```typescript
const modules = container.listModules()
modules.forEach((m) => console.log(m.name, m.lifecycle))
```

**返回**：`ReadonlyArray<DaoModuleMeta>`

---

## DaoModuleGraph

**v2.46.3** — 模块依赖图引擎，"无为而无不为"——图本身不创建模块，仅揭示天然的初始化顺序。

> 帛书依据："为学日益，为道日损"（乙本·四十八章）

### 创建

```typescript
import { DaoModuleGraph, daoModuleGraph } from '@daomind/anything'

// 独立实例（推荐用于局部场景）
const graph = new DaoModuleGraph()

// 全局单例（用于跨模块共享）
daoModuleGraph.addModule('core', [])
```

---

### `addModule(name, deps?)`

添加模块及其依赖声明。

```typescript
graph.addModule('core',    [])
graph.addModule('auth',    ['core'])
graph.addModule('api',     ['auth', 'core'])
graph.addModule('web',     ['api'])
```

若依赖模块尚未添加，会自动创建占位节点；同一模块可多次调用（幂等添加依赖）。

---

### `addFromRegistrations(registrations)`

从 `DaoModuleRegistration[]` 批量导入模块。

```typescript
import { DaoModuleGraph } from '@daomind/anything'
import type { DaoModuleRegistration } from '@daomind/nothing'

const registrations: DaoModuleRegistration[] = [
  { name: 'core',    version: '1.0.0', path: './core' },
  { name: 'auth',    version: '1.0.0', path: './auth',    dependencies: ['core'] },
  { name: 'api',     version: '1.0.0', path: './api',     dependencies: ['auth', 'core'] },
]

const graph = new DaoModuleGraph()
graph.addFromRegistrations(registrations)
```

---

### `topologicalOrder()`

使用 Kahn 算法生成确定性的拓扑排序（依赖方在后）。若图中存在循环依赖则返回 `null`。

```typescript
const order = graph.topologicalOrder()
if (order) {
  console.log('初始化顺序:', order) // ['core', 'auth', 'api', 'web']
} else {
  console.error('检测到循环依赖！')
}
```

**返回**：`ReadonlyArray<string> | null`

---

### `hasCycle()`

快速检测图中是否存在循环依赖。

```typescript
if (graph.hasCycle()) {
  const cycles = graph.findCycleNodes()
  console.error('循环节点:', cycles)
}
```

---

### `findCycleNodes()`

使用 DFS 颜色标记法，找出所有参与循环依赖的节点（排序后返回）。

```typescript
const cycleNodes = graph.findCycleNodes()
// 若无循环 → []
// 若有循环 → ['moduleA', 'moduleB', ...]
```

**返回**：`ReadonlyArray<string>`

---

### `getTransitiveDependencies(name)`

获取某模块的**所有传递性依赖**（BFS 递归）。

```typescript
const allDeps = graph.getTransitiveDependencies('web')
// Set { 'api', 'auth', 'core' }
```

**返回**：`ReadonlySet<string>`

---

### `getDependencies(name)` / `getDependents(name)`

获取直接依赖列表 / 直接被依赖者列表。

```typescript
graph.getDependencies('api')  // ['auth', 'core']
graph.getDependents('core')   // ['auth', 'api']
```

---

### `removeModule(name)`

移除模块并同步清理所有引用关系（幂等）。

```typescript
const removed = graph.removeModule('deprecated-module') // true | false
```

---

### `snapshot()`

生成完整的不可变快照（`DaoModuleGraphSnapshot`）。

```typescript
const snap = graph.snapshot()
console.log(snap.topologicalOrder) // ['core', 'auth', 'api', 'web']
console.log(snap.hasCycle)         // false
console.log(snap.maxDepth)         // 3
console.log(snap.totalModules)     // 4
```

**返回**：`DaoModuleGraphSnapshot`（类型来自 `@daomind/nothing`）

---

### 其他方法

| 方法               | 说明                                              |
| ------------------ | ------------------------------------------------- |
| `has(name)`        | 判断模块是否在图中                                |
| `moduleNames()`    | 返回所有模块名称（排序）                          |
| `size`             | 当前节点数（getter）                              |
| `clear()`          | 清空图（所有节点）                                |

---

### 完整示例：依赖顺序启动

```typescript
import { DaoAnythingContainer, DaoModuleGraph } from '@daomind/anything'

const container = new DaoAnythingContainer()
const graph = new DaoModuleGraph()

const registrations = [
  { name: 'db',      version: '1.0.0', path: './db' },
  { name: 'cache',   version: '1.0.0', path: './cache',   dependencies: ['db'] },
  { name: 'auth',    version: '1.0.0', path: './auth',    dependencies: ['db', 'cache'] },
  { name: 'api',     version: '1.0.0', path: './api',     dependencies: ['auth'] },
]

// 注册到容器
for (const reg of registrations) {
  container.register(reg)
}

// 计算安全启动顺序
graph.addFromRegistrations(registrations)

if (graph.hasCycle()) {
  throw new Error(`循环依赖: ${graph.findCycleNodes().join(', ')}`)
}

const order = graph.topologicalOrder()! // ['db', 'cache', 'auth', 'api']
for (const name of order) {
  await container.initialize(name)
  await container.activate(name)
  console.log(`✓ ${name} 已激活`)
}
```

---

## 类型参考

### `DaoModuleMeta`

模块元数据，实现了 `ExistenceContract`。

```typescript
interface DaoModuleMeta extends ExistenceContract {
  readonly id: string
  readonly name: string
  readonly lifecycle: ModuleLifecycle
  readonly createdAt: number
  readonly registeredAt: number
  readonly activatedAt?: number // active 后才有值
}
```

### `ModuleLifecycle`

```typescript
type ModuleLifecycle =
  | 'registered'   // 已注册，未初始化
  | 'initialized'  // 已初始化，未激活
  | 'active'       // 运行中
  | 'suspending'   // 暂停中
  | 'terminated'   // 已销毁（终态）
```

### `DaoModuleRegistration`

注册时传入的配置（纯类型，来自 `@daomind/nothing`）：

```typescript
interface DaoModuleRegistration {
  readonly name:          string
  readonly version:       string
  readonly path:          string
  readonly dependencies?: readonly string[]
}
```

---

## 与 DaoAgentContainerBridge 集成

`DaoAgentContainerBridge` 可将 Agent 的生命周期事件自动同步到容器模块状态：

```typescript
import { DaoAnythingContainer } from '@daomind/anything'
import { daoAgentContainerBridge, TaskAgent } from '@daomind/agents'

const container = new DaoAnythingContainer()
const agent = new TaskAgent('worker-1')

// 绑定：Agent 状态改变时，容器内对应模块自动跟进
daoAgentContainerBridge.mount(agent, container)

await agent.initialize() // 容器内模块同步到 initialized
await agent.activate()   // 容器内模块同步到 active
await agent.terminate()  // 容器内模块同步到 terminated

daoAgentContainerBridge.unmount('worker-1')
```

---

## 完整导出列表

```typescript
// 类型（来自 @daomind/nothing 的透传导出）
import type { DaoModuleRegistration, ModuleLifecycle, DaoModuleMeta } from '@daomind/anything'

// IoC 容器
import { DaoAnythingContainer, daoContainer } from '@daomind/anything'

// 依赖图引擎（v2.46.3）
import { DaoModuleGraph, daoModuleGraph } from '@daomind/anything'
```


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
import { DaoAnythingContainer } from '@daomind/anything'

const container = new DaoAnythingContainer()
```

或使用全局默认实例：

```typescript
import { daoContainer } from '@daomind/anything'
```

---

### `register(module)`

注册模块到容器（初始状态：`registered`）。

```typescript
container.register({
  name: 'user-service',
  path: './services/user', // 动态 import 路径
})
```

**参数**：`DaoModuleRegistration`

| 字段   | 类型     | 说明             |
| ------ | -------- | ---------------- |
| `name` | `string` | 模块唯一名称     |
| `path` | `string` | 动态 import 路径 |

**异常**：若模块名已存在则抛出错误。

---

### 生命周期方法

所有方法均为 `async`，接受模块名作为参数。

```typescript
// registered → initialized
await container.initialize('user-service')

// initialized → active
await container.activate('user-service')

// active → suspending
await container.deactivate('user-service')

// suspending → active（恢复）
await container.activate('user-service')

// 任意状态 → terminated
await container.terminate('user-service')
```

**完整流程示例**：

```typescript
const container = new DaoAnythingContainer()

container.register({ name: 'auth', path: './auth' })
container.register({ name: 'user', path: './user' })

await container.initialize('auth')
await container.activate('auth')

await container.initialize('user')
await container.activate('user')

// 使用模块
const authService = await container.resolve<AuthService>('auth')
authService.login('alice', 'password')

// 暂停
await container.deactivate('user')

// 终止
await container.terminate('auth')
await container.terminate('user')
```

---

### `resolve<T>(name)`

获取模块实例（模块必须处于 `active` 状态）。

```typescript
const service = await container.resolve<UserService>('user')
```

底层行为：首次调用时动态 `import(registration.path)` 并缓存实例；后续调用直接返回缓存。

**异常**：

- 模块未注册 → 抛出错误
- 模块未激活 → 抛出错误（含当前状态）

---

### `getModule(name)`

获取模块元数据，不返回实例。

```typescript
const meta = container.getModule('user-service')
if (meta) {
  console.log(meta.lifecycle) // 'active'
  console.log(meta.activatedAt) // number
}
```

**返回**：`DaoModuleMeta | undefined`

---

### `listModules()`

列出容器内所有模块元数据。

```typescript
const modules = container.listModules()
modules.forEach((m) => console.log(m.name, m.lifecycle))
```

**返回**：`ReadonlyArray<DaoModuleMeta>`

---

## 类型参考

### `DaoModuleMeta`

模块元数据，实现了 `ExistenceContract`。

```typescript
interface DaoModuleMeta extends ExistenceContract {
  readonly id: string
  readonly name: string
  readonly lifecycle: ModuleLifecycle
  readonly createdAt: number
  readonly registeredAt: number
  readonly activatedAt?: number // active 后才有值
}
```

### `ModuleLifecycle`

```typescript
type ModuleLifecycle =
  | 'registered' // 已注册，未初始化
  | 'initialized' // 已初始化，未激活
  | 'active' // 运行中
  | 'suspending' // 暂停中
  | 'terminated' // 已销毁（终态）
```

### `DaoModuleRegistration`

注册时传入的配置：

```typescript
interface DaoModuleRegistration {
  readonly name: string
  readonly path: string
}
```

---

## 与 DaoAgentContainerBridge 集成

`DaoAgentContainerBridge` 可将 Agent 的生命周期事件自动同步到容器模块状态：

```typescript
import { DaoAnythingContainer } from '@daomind/anything'
import { daoAgentContainerBridge, TaskAgent } from '@daomind/agents'

const container = new DaoAnythingContainer()
const agent = new TaskAgent('worker-1')

// 绑定：Agent 状态改变时，容器内对应模块自动跟进
daoAgentContainerBridge.mount(agent, container)

await agent.initialize() // 容器内模块同步到 initialized
await agent.activate() // 容器内模块同步到 active
await agent.terminate() // 容器内模块同步到 terminated

daoAgentContainerBridge.unmount('worker-1')
```

---

## 完整导出列表

```typescript
import type { DaoModuleRegistration, ModuleLifecycle, DaoModuleMeta } from '@daomind/anything'

import { DaoAnythingContainer, daoContainer } from '@daomind/anything'
```
