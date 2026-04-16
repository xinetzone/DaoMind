# 具体 Agent 实现计划

## Context

daoAgents 已有 DaoBaseAgent 抽象类、DaoAgentRegistry、DaoAgentMessenger、DaoAgentContainerBridge。
当前缺少具体的可运行 Agent 实例，用户无法直接看到系统能力。

本次目标：在 `packages/daoAgents/src/agents/` 下实现三个具体 Agent，
覆盖"任务管理"、"系统观察"、"多 Agent 协调"三种典型场景。

---

## 实现范围

### 目录结构（新增）

```
packages/daoAgents/src/
  agents/
    task-agent.ts        # 任务队列 Agent
    observer-agent.ts    # 系统观察 Agent  
    coordinator-agent.ts # 协调调度 Agent
    index.ts             # 统一导出
  index.ts               # 更新：添加 agents 导出
  __tests__/
    task-agent.test.ts
    observer-agent.test.ts
    coordinator-agent.test.ts
```

---

## 三个 Agent 设计

### 1. TaskAgent（任务队列 Agent）

**职责**：管理带优先级的任务队列，顺序执行，广播完成通知。

```typescript
interface DaoTask {
  id: string;
  action: string;
  payload?: unknown;
  priority?: number;  // 数值越大越先执行
}

// 支持的 execute() actions:
// - 'enqueue'       payload: DaoTask      → { queued: true, position: number }
// - 'run-next'      payload: none         → { taskId, completedAt } | { executed: false }
// - 'run-all'       payload: none         → { executed: number, results: [...] }
// - 'queue-status'  payload: none         → { pending: number, completed: number }
// - 'clear-queue'   payload: none         → { cleared: number }
```

**关键行为**：
- 优先级队列（高优先级先执行）
- 每次 `run-next`/`run-all` 完成后，向 `'*'` 广播 `task:completed`
- `execute` 不关心具体业务逻辑，只管理调度

### 2. ObserverAgent（系统观察 Agent）

**职责**：监听 `daoNothingVoid` 事件，记录系统快照，提供历史查询。

```typescript
// 支持的 execute() actions:
// - 'get-snapshot'  → { totalObservations, lifecycleEvents, messageEvents, lastObservedAt }
// - 'get-history'   payload: { limit?: number }  → DaoNothingEvent[]
// - 'clear'         → { cleared: number }
```

**关键行为**：
- `initialize()` 时订阅 `daoNothingVoid.on('observed', ...)`
- `terminate()` 时移除监听
- 过滤 `type === 'agent:lifecycle'` 和 `type === 'agent:message'` 事件

### 3. CoordinatorAgent（协调 Agent）

**职责**：管理多个下属 Agent，分发任务，聚合结果。

```typescript
interface DaoCoordinatorTask {
  targetAgentId: string;
  action: string;
  payload?: unknown;
}

// 支持的 execute() actions:
// - 'assign'        payload: DaoCoordinatorTask   → { sent: true }
// - 'broadcast'     payload: { action, payload }  → { sent: number, targetIds: string[] }
// - 'get-roster'    payload: none                 → string[]  (已注册的下属 agent IDs)
// - 'add-agent'     payload: { agentId: string }  → { added: boolean }
// - 'remove-agent'  payload: { agentId: string }  → { removed: boolean }
```

**关键行为**：
- 使用 `daoAgentMessenger.send()` 分发任务
- `broadcast` 向所有已注册下属广播
- 自身也订阅 `onMessage` 接收响应

---

## 修改文件列表

| 文件 | 操作 |
|------|------|
| `packages/daoAgents/src/agents/task-agent.ts` | 新增 |
| `packages/daoAgents/src/agents/observer-agent.ts` | 新增 |
| `packages/daoAgents/src/agents/coordinator-agent.ts` | 新增 |
| `packages/daoAgents/src/agents/index.ts` | 新增 |
| `packages/daoAgents/src/index.ts` | 修改：添加 agents 导出 |
| `packages/daoAgents/src/__tests__/task-agent.test.ts` | 新增 |
| `packages/daoAgents/src/__tests__/observer-agent.test.ts` | 新增 |
| `packages/daoAgents/src/__tests__/coordinator-agent.test.ts` | 新增 |

**无需新增包依赖**：所有实现只用 `@daomind/nothing`（已有）和包内现有模块。

---

## 验证

```bash
npx jest packages/daoAgents --no-coverage
# 目标：新增约 60 个测试，全部通过
pnpm -r run build
# 目标：全部 Done，无 Error
```
