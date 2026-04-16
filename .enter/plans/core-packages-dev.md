# DaoMind v2.4.0 复盘 + v2.5.0 开发计划

## Context

v2.4.0（刚刚完成）新增了三大具体 Agent：TaskAgent / ObserverAgent / CoordinatorAgent。
全部 281 个测试通过，19 个包构建成功，已推送 GitHub + 打标签 v2.4.0。

本次任务分两步：
1. **复盘**：生成 `retrospectives/2026-04-16-daomind-v2.4.0.md` 报告
2. **继续开发（v2.5.0）**：三个里程碑，补全架构短板

---

## 步骤一：复盘报告

### 文件路径
`retrospectives/2026-04-16-daomind-v2.4.0.md`

### 内容覆盖
- 执行概览（275→281 tests，3 个 Agent，v2.3.0→v2.4.0）
- 三大里程碑详细记录：TaskAgent / ObserverAgent / CoordinatorAgent
- 关键设计决策（优先级队列实现、boundHandler 引用保存、Roster 模式）
- 遇到的问题（MessageHandler void 类型冲突）
- 方法论沉淀
- 下一版本行动项

---

## 步骤二：继续开发（v2.5.0）

### 里程碑一：接口完整性（DaoAgent 补全 send/onMessage）

**背景**：`DaoBaseAgent` 已实现 `send()` 和 `onMessage()`，但 `DaoAgent` 接口未声明，外部代码无法按接口类型使用这两个方法。

**修改文件**：`packages/daoAgents/src/types.ts`

**变更**：向 `DaoAgent` 接口添加：
```typescript
send(to: string | '*', action: string, payload?: unknown): void;
onMessage(handler: MessageHandler): void;
```

需要在 `types.ts` 中引入 `MessageHandler` 类型（来自 `./messaging`）——注意避免循环依赖，用 `type` import。

**新增测试**：在 `base.test.ts` 中验证 `DaoAgent` 接口类型约束（编译期）。

---

### 里程碑二：daoNothing 高级类型工具（DaoOption + DaoResult）

**背景**：现有 daoNothing 只有 Void/Potential/Origin 三类基础类型，缺少函数式编程核心的 Option/Result 模式，daoAgents execute() 返回 `unknown` 无类型安全。

**新增文件**：`packages/daoNothing/src/result.ts`

```typescript
// DaoOption<T>
type DaoOption<T> = DaoSome<T> | DaoNone;
interface DaoSome<T> { readonly _tag: 'some'; readonly value: T }
interface DaoNone   { readonly _tag: 'none' }
function daoSome<T>(value: T): DaoSome<T>
function daoNone(): DaoNone
function daoIsSome<T>(opt: DaoOption<T>): opt is DaoSome<T>
function daoIsNone<T>(opt: DaoOption<T>): opt is DaoNone

// DaoResult<T, E>
type DaoResult<T, E = Error> = DaoOk<T> | DaoErr<E>;
interface DaoOk<T>  { readonly _tag: 'ok';  readonly value: T }
interface DaoErr<E> { readonly _tag: 'err'; readonly error: E }
function daoOk<T>(value: T): DaoOk<T>
function daoErr<E>(error: E): DaoErr<E>
function daoIsOk<T, E>(res: DaoResult<T, E>): res is DaoOk<T>
function daoIsErr<T, E>(res: DaoResult<T, E>): res is DaoErr<E>

// 工具函数
function daoMap<T, U>(opt: DaoOption<T>, fn: (v: T) => U): DaoOption<U>
function daoMapResult<T, U, E>(res: DaoResult<T,E>, fn: (v: T) => U): DaoResult<U,E>
function daoUnwrap<T>(opt: DaoOption<T>, fallback: T): T
function daoUnwrapResult<T, E>(res: DaoResult<T,E>): T  // throws if Err
```

**新增测试**：`packages/daoNothing/src/__tests__/result.test.ts`（约 25 个测试）

**更新导出**：`packages/daoNothing/src/index.ts` 导出新类型和函数

---

### 里程碑三：CI 测试步骤

**背景**：当前 publish-npm.yml 没有在发布前跑测试，可能把带 bug 的包发布出去。

**修改文件**：`.github/workflows/publish-npm.yml`

**变更**：在 `Build all packages` 步骤之后、第一个 publish 步骤之前插入：
```yaml
- name: Test all packages
  run: pnpm test -- --no-coverage
```

---

## 关键文件

| 文件 | 操作 |
|------|------|
| `retrospectives/2026-04-16-daomind-v2.4.0.md` | 新建（复盘报告） |
| `packages/daoAgents/src/types.ts` | 修改（补全 send/onMessage） |
| `packages/daoNothing/src/result.ts` | 新建（DaoOption + DaoResult） |
| `packages/daoNothing/src/__tests__/result.test.ts` | 新建（25+ 测试） |
| `packages/daoNothing/src/index.ts` | 修改（导出新类型） |
| `.github/workflows/publish-npm.yml` | 修改（添加 test 步骤） |

---

## 验证

```bash
# 里程碑一验证
npx jest packages/daoAgents --no-coverage

# 里程碑二验证
npx jest packages/daoNothing --no-coverage

# 全量验证
npx jest --no-coverage
pnpm -r run build
```

**预期**：测试总数 281 → 约 306（+25 result tests），全绿，构建 Done。

---

## 收尾

```bash
git add -A
git commit -m "feat(core): v2.5.0 — DaoAgent 接口完整性 + daoNothing 类型工具 + CI 测试步骤"
git tag -a v2.5.0 -m "release: v2.5.0"
# 标准 GitHub 推送模式
```
