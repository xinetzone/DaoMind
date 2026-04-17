# @daomind/nothing

**无名** 核心包 — 零运行时类型契约系统 + 虚空事件总线 + 函数式类型工具。

> "无名，万物之始也。"  
> —— 马王堆汉墓帛书《老子》甲本

## 安装

```bash
pnpm add @daomind/nothing
```

---

## 类型契约（零运行时）

### `ExistenceContract`

所有 DaoMind 实体的存在性标记，从"无名"到"有名"的桥梁。

```typescript
interface ExistenceContract {
  readonly existentialType: 'nothing' | 'anything'
}
```

| 值           | 含义                           |
| ------------ | ------------------------------ |
| `'nothing'`  | 处于"无名"状态（类型定义层）   |
| `'anything'` | 处于"有名"状态（运行时实例层） |

**示例**：

```typescript
import type { ExistenceContract } from '@daomind/nothing'

interface UserModule extends ExistenceContract {
  readonly name: string
  readonly email: string
}

const user: UserModule = {
  existentialType: 'anything', // 从"无名"到"有名"
  name: 'Alice',
  email: 'alice@example.com',
}
```

---

### `EmptyInterface`

纯粹的"无"，所有接口的原型。

```typescript
interface EmptyInterface {
  readonly [key: string]: never
}
```

### `MutabilityContract<T>`

描述状态变化契约（`from → to + 变化方式`）。

```typescript
interface MutabilityContract<T> {
  readonly from: T
  readonly to: T
  readonly transition: 'gradual' | 'sudden' | 'cyclic'
}
```

---

## 虚空事件总线

### `daoNothingVoid`

全局事件总线单例，基于 Node.js `EventEmitter`。所有 DaoMind 包通过它静默通信。

```typescript
import { daoNothingVoid } from '@daomind/nothing'
```

#### `observe(event)`

向虚空写入一个事件，同时触发 `'observed'` 监听器。

```typescript
daoNothingVoid.observe({
  type: 'my:event',
  source: 'my-module',
  data: { key: 'value' },
})
```

#### `reflect()`

查询所有已写入的历史事件（只读快照）。

```typescript
const events = daoNothingVoid.reflect()
// => ReadonlyArray<DaoNothingEvent>
```

#### `void()`

清空所有事件历史并移除所有监听器。**仅用于测试。**

```typescript
daoNothingVoid.void()
```

#### 监听事件

```typescript
daoNothingVoid.on('observed', (event: DaoNothingEvent) => {
  console.log(event.type, event.source, event.data)
})
```

---

### `DaoNothingEvent`

事件结构：

```typescript
interface DaoNothingEvent {
  readonly type: string // 事件类型，如 'agent:lifecycle'
  readonly source: string // 来源标识
  readonly data: unknown // 事件载荷
  readonly timestamp: number // 毫秒时间戳
}
```

---

## 类型守卫

### `daoIsNothing(value)`

判断值是否为"无名"状态。

```typescript
import { daoIsNothing } from '@daomind/nothing'

if (daoIsNothing(obj)) {
  // obj 处于 nothing 状态
}
```

### `daoBirthFromNothing(value)`

从"无名"孵化，进入"有名"状态。

```typescript
import { daoBirthFromNothing } from '@daomind/nothing'

const entity = daoBirthFromNothing(rawData)
// entity.existentialType === 'anything'
```

---

## 函数式类型工具（v2.5.0）

用结构化类型替代 `null / undefined / throw`，让调用者在类型层面被迫处理所有情况。

### `DaoOption<T>` — 有值 / 无值

```typescript
type DaoOption<T> = DaoSome<T> | DaoNone
```

#### 构造

```typescript
import { daoSome, daoNone, daoFromNullable } from '@daomind/nothing'

const some = daoSome(42) // { _tag: 'some', value: 42 }
const none = daoNone() // { _tag: 'none' }
const opt = daoFromNullable(maybeNull) // null/undefined → None，否则 → Some
```

#### 判断

```typescript
import { daoIsSome, daoIsNone } from '@daomind/nothing'

if (daoIsSome(opt)) {
  console.log(opt.value) // TypeScript 知道这里有值
}
```

#### 操作

```typescript
import { daoMap, daoUnwrap, daoUnwrapOrThrow } from '@daomind/nothing'

// 映射 Some 内部值，None 透传
const doubled = daoMap(daoSome(3), (x) => x * 2) // Some(6)

// 获取值，None 则返回 fallback
const value = daoUnwrap(opt, 'default')

// 获取值，None 则抛出错误
const value2 = daoUnwrapOrThrow(opt, '找不到用户')
```

**完整示例**：

```typescript
function findUser(id: string): DaoOption<User> {
  const user = db.find(id)
  return daoFromNullable(user)
}

const userOpt = findUser('u-123')
if (daoIsSome(userOpt)) {
  console.log('找到用户:', userOpt.value.name)
} else {
  console.log('用户不存在')
}
```

---

### `DaoResult<T, E>` — 成功 / 失败

```typescript
type DaoResult<T, E = Error> = DaoOk<T> | DaoErr<E>
```

#### 构造

```typescript
import { daoOk, daoErr, daoTry, daoTryAsync } from '@daomind/nothing'

const ok = daoOk('success') // { _tag: 'ok', value: 'success' }
const err = daoErr(new Error('失败')) // { _tag: 'err', error: Error }

// 自动捕获同步异常
const result = daoTry(() => JSON.parse(input))

// 自动捕获异步异常
const asyncResult = await daoTryAsync(() => fetch('/api/user'))
```

#### 判断

```typescript
import { daoIsOk, daoIsErr } from '@daomind/nothing'

if (daoIsOk(result)) {
  console.log('成功:', result.value)
} else {
  console.log('失败:', result.error.message)
}
```

#### 操作

```typescript
import { daoMapResult, daoMapErr, daoUnwrapResult, daoUnwrapOr } from '@daomind/nothing'

// 映射 Ok 值
const upper = daoMapResult(daoOk('hello'), (s) => s.toUpperCase()) // Ok('HELLO')

// 映射 Err 值
const mapped = daoMapErr(daoErr(404), (code) => `HTTP ${code}`)

// 获取值，Err 则抛出
const value = daoUnwrapResult(result)

// 获取值，Err 则返回 fallback
const safe = daoUnwrapOr(result, '默认值')
```

**完整示例**：

```typescript
async function fetchUserData(id: string): Promise<DaoResult<User>> {
  return daoTryAsync(async () => {
    const resp = await fetch(`/api/users/${id}`)
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    return resp.json() as Promise<User>
  })
}

const result = await fetchUserData('u-123')
if (daoIsOk(result)) {
  console.log(result.value.name)
} else {
  console.error('请求失败:', result.error.message)
}
```

---

## 模块图类型（v2.46.3）

> 帛书依据："知常曰明"——了解模块间的依赖关系是系统自明之道

### `DaoModuleGraphNode`

依赖图节点的纯类型描述（零运行时）。

```typescript
interface DaoModuleGraphNode {
  readonly name:         string
  readonly dependencies: readonly string[]   // 此节点依赖的模块列表
  readonly dependents:   readonly string[]   // 依赖此节点的模块列表
  readonly depth:        number              // 拓扑深度（从根节点出发的最长路径）
}
```

---

### `DaoModuleGraphSnapshot`

依赖图的不可变快照，由 `DaoModuleGraph.snapshot()` 生成。

```typescript
interface DaoModuleGraphSnapshot {
  readonly nodes:            ReadonlyArray<DaoModuleGraphNode>
  readonly topologicalOrder: ReadonlyArray<string>  // Kahn 算法结果；有环时为 []
  readonly hasCycle:         boolean
  readonly cycleNodes:       ReadonlyArray<string>  // 参与循环的节点；无环时为 []
  readonly totalModules:     number
  readonly maxDepth:         number
}
```

**示例**：

```typescript
import type { DaoModuleGraphSnapshot } from '@daomind/nothing'
import { DaoModuleGraph } from '@daomind/anything'

const graph = new DaoModuleGraph()
graph.addModule('core', [])
graph.addModule('auth', ['core'])
graph.addModule('api',  ['auth', 'core'])

const snap: DaoModuleGraphSnapshot = graph.snapshot()
console.log(snap.topologicalOrder) // ['core', 'auth', 'api']
console.log(snap.hasCycle)         // false
console.log(snap.maxDepth)         // 2
```

---

## TypeScript 要求

`@daomind/nothing` 需要 TypeScript **5.0+**，建议配置：

```json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true
  }
}
```

---

## 完整导出列表

```typescript
// 类型契约
import type { ExistenceContract, EmptyInterface, MutabilityContract } from '@daomind/nothing'
import type { WuWeiConstraint, ZiRanInvariant } from '@daomind/nothing'
import type { Void, Potential, Origin } from '@daomind/nothing'

// 模块相关纯类型
import type { DaoModuleRegistration, ModuleLifecycle, DaoModuleMeta } from '@daomind/nothing'

// 模块图纯类型（v2.46.3）
import type { DaoModuleGraphNode, DaoModuleGraphSnapshot } from '@daomind/nothing'

// 事件总线
import type { DaoNothingEvent } from '@daomind/nothing'
import { daoNothingVoid, DaoNothingVoid } from '@daomind/nothing'

// 类型守卫
import { daoIsNothing, daoBirthFromNothing } from '@daomind/nothing'

// DaoOption
import type { DaoSome, DaoNone, DaoOption } from '@daomind/nothing'
import {
  daoSome,
  daoNone,
  daoIsSome,
  daoIsNone,
  daoFromNullable,
  daoMap,
  daoUnwrap,
  daoUnwrapOrThrow,
} from '@daomind/nothing'

// DaoResult
import type { DaoOk, DaoErr, DaoResult } from '@daomind/nothing'
import {
  daoOk,
  daoErr,
  daoIsOk,
  daoIsErr,
  daoTry,
  daoTryAsync,
  daoMapResult,
  daoMapErr,
  daoUnwrapResult,
  daoUnwrapOr,
} from '@daomind/nothing'
```
