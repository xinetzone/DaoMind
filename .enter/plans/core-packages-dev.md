# Plan: 关闭 push npm 发布 + 更新文档

## Context

当前问题：
1. **CI 自动发布**：`publish-npm.yml` 会在每次推送 `v*` 标签时自动触发 npm 发布，但 npm 2FA 问题未解决，需关闭自动触发，保留手动触发（`workflow_dispatch`）。
2. **文档严重过期**：API 参考文档描述的是从未实现的虚构 API（`defineAgent`, `createContainer`, `Contract<T>` 等），与实际代码完全不符，误导性极强，必须全面更新。

---

## 任务一：关闭 push npm 发布

**文件**：`.github/workflows/publish-npm.yml`

**修改**：删除 `push: tags: - 'v*'` 触发条件，只保留 `workflow_dispatch`。

```yaml
# 修改后
on:
  workflow_dispatch:
```

---

## 任务二：更新文档

### 2A — `docs/site/api/nothing.md`（完整重写）

实际 API（全部来自 `packages/daoNothing/src/index.ts`）：

**类型契约**（零运行时）：
- `ExistenceContract` — `{ existentialType: 'nothing' | 'anything' }`
- `EmptyInterface`, `MutabilityContract`
- `WuWeiConstraint`, `ZiRanInvariant`
- `Void`, `Potential`, `Origin`

**事件总线**（运行时）：
- `DaoNothingVoid extends EventEmitter`
- `daoNothingVoid` — 全局单例
- `daoNothingVoid.observe(event)` — 写入事件
- `daoNothingVoid.reflect()` — 查询历史
- `daoNothingVoid.void()` — 清空（测试用）
- `DaoNothingEvent` — `{ type, source, data, timestamp }`

**类型守卫**：
- `daoIsNothing(v)` — 判断是否为 nothing
- `daoBirthFromNothing(v)` — 从 nothing 孵化

**函数式类型工具（v2.5.0 新增）**：
- `DaoOption<T>` = `DaoSome<T> | DaoNone` — 有值/无值
  - `daoSome(v)`, `daoNone()`, `daoIsSome()`, `daoIsNone()`
  - `daoFromNullable()`, `daoMap()`, `daoUnwrap()`, `daoUnwrapOrThrow()`
- `DaoResult<T,E>` = `DaoOk<T> | DaoErr<E>` — 成功/失败
  - `daoOk(v)`, `daoErr(e)`, `daoIsOk()`, `daoIsErr()`
  - `daoTry()`, `daoTryAsync()`, `daoMapResult()`, `daoMapErr()`
  - `daoUnwrapResult()`, `daoUnwrapOr()`

---

### 2B — `docs/site/api/agents.md`（完整重写）

实际 API（全部来自 `packages/daoAgents/src/index.ts`）：

**核心抽象**：
- `DaoBaseAgent` — 抽象基类，继承实现自定义 Agent
  - `send(to, action, payload?)` — 发送消息
  - `onMessage(handler)` — 接收消息
  - `execute<T>(action, payload?)` — 抽象方法（子类实现）
  - 生命周期：`initialize()` / `activate()` / `rest()` / `terminate()`

**消息通信**：
- `DaoAgentMessenger` / `daoAgentMessenger`
  - `send(from, to, action, payload?)`
  - `subscribe(agentId, handler)`
  - `unsubscribe(agentId)`
  - `history(filter?)` — 从 daoNothingVoid 读取消息历史
- `AgentMessage` — `{ id, from, to, action, payload, timestamp }`

**注册中心**：
- `DaoAgentRegistry` / `daoAgentRegistry`
  - `register(agent)` / `unregister(id)` / `get(id)` / `findByCapability(name)`

**容器桥接**：
- `DaoAgentContainerBridge` / `daoAgentContainerBridge`
  - `mount(agent, container)` / `unmount(agentId)` / `dispose()`

**具体 Agent（v2.4.0 新增）**：
- `TaskAgent` — 优先级任务队列
  - actions: `enqueue` / `run-next` / `run-all` / `status` / `clear`
  - 完成后广播 `task:completed`
- `ObserverAgent` — 系统事件观察者
  - actions: `get-snapshot` / `get-history` / `get-by-type` / `clear`
- `CoordinatorAgent` — 多 Agent 调度（Roster 模式）
  - actions: `add-agent` / `remove-agent` / `assign` / `broadcast` / `get-roster` / `get-assignments` / `find-agent`

---

### 2C — `docs/site/api/anything.md`（修正容器 API）

`docs/site/api/anything.md` 中 `createContainer()` → `new DaoAnythingContainer()`，并补全实际方法：
- `register(module)` — 注册
- `initialize(name)` / `activate(name)` / `deactivate(name)` / `terminate(name)` — 生命周期
- `getModule(name)` / `resolve(name)` / `listModules()` — 查询
- `setInstance(name, instance)` / `getInstance(name)` — 实例管理

---

### 2D — `docs/site/api/index.md`（更新版本号和摘要）
- 版本改为 `2.5.0`，日期改为 `2026-04-16`
- `@daomind/nothing` 部分补充 DaoOption/DaoResult 说明
- `@daomind/agents` 部分补充 DaoBaseAgent / 三具体 Agent 说明
- `@daomind/anything` 部分修正 DaoContainer → DaoAnythingContainer

---

### 2E — `docs/site/index.md`（更新统计数字）
- 包数：17 → 19
- 测试：`100% 代码质量` → `320 tests`
- 版本徽标更新为 v2.5.0

---

### 2F — `docs/site/guide/agents.md`（修正 defineAgent → DaoBaseAgent）

当前内容完全使用虚构的 `defineAgent()` API，更新为实际的 `DaoBaseAgent` 继承模式，并展示 `TaskAgent` / `ObserverAgent` / `CoordinatorAgent` 用法。

---

## 执行顺序

1. 修改 `.github/workflows/publish-npm.yml`
2. 重写 `docs/site/api/nothing.md`
3. 重写 `docs/site/api/agents.md`
4. 更新 `docs/site/api/anything.md`
5. 更新 `docs/site/api/index.md`
6. 更新 `docs/site/index.md`
7. 重写 `docs/site/guide/agents.md`
8. 验证：`pnpm -r run build` 通过
9. git commit + tag + push

## 验证

```bash
cd /workspace/thread
pnpm -r run build        # 确认所有包正常构建
npx jest --no-coverage   # 确认 320 tests 全绿
git add -A && git commit -m "..."
git tag -a v2.5.1 -m "..."
git push github main:main && git push github v2.5.1
```
