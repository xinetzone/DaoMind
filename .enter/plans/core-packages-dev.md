# 核心包开发计划：daoAnything + daoAgents 完善

## Context

三个核心包已有基础骨架，但存在明显缺口：
- `daoAnything`：容器逻辑完整但**零测试**，与 `daoNothingVoid` 事件总线未集成
- `daoAgents`：Agent 生命周期完整但 **Agent 之间无通信机制**，也未与 daoAnything 容器打通

目标：按顺序完成三个里程碑，使三包形成完整的"无名→有名→行动"闭环。

---

## 里程碑一：daoAnything 测试

### 新增文件
`packages/daoAnything/src/__tests__/container.test.ts`

### 测试覆盖范围
1. `register` — 正常注册、重复注册抛错
2. `initialize` → `activate` → `deactivate` → `terminate` 正常流转
3. 非法状态转换（如 registered → active）应抛错
4. `getModule` / `listModules` 返回正确数据
5. `resolve` — 未激活时抛错

---

## 里程碑二：Agent 间消息通信

### 设计原则
复用 `daoNothingVoid`（`DaoNothingVoid` 事件总线）作为底层传输，Agent 通过它发布/订阅消息，体现"虚空观照"哲学。

### 新增文件
`packages/daoAgents/src/messaging.ts`

```ts
// 核心接口
interface AgentMessage {
  id: string;           // 消息唯一 ID
  from: string;         // 发送者 agentId
  to: string | '*';     // 接收者 agentId 或广播
  action: string;       // 消息类型
  payload?: unknown;
  timestamp: number;
}

// DaoAgentMessenger
// - send(msg): 通过 daoNothingVoid 发布，同时写入 daoNothingVoid.observe()
// - subscribe(agentId, handler): 订阅发给自己（或广播）的消息
// - unsubscribe(agentId)
// - history(filter?): 从 daoNothingVoid.reflect() 中筛选消息历史
```

### 修改文件
`packages/daoAgents/src/base.ts`
- `DaoBaseAgent` 增加 `send(to, action, payload)` 方法
- `DaoBaseAgent` 增加 `onMessage(handler)` 注册监听

`packages/daoAgents/src/index.ts`
- 导出 `AgentMessage`、`DaoAgentMessenger`、`daoAgentMessenger` 单例

### 新增测试
`packages/daoAgents/src/__tests__/messaging.test.ts`
- Agent 点对点发送、接收
- 广播消息（to: '*'）所有活跃 Agent 都能收到
- 消息历史可从 daoNothingVoid 查询

---

## 里程碑三：Agent-Container 集成

### 设计原则
`DaoBaseAgent` 生命周期（dormant→awakening→active→resting→deceased）
映射到 `DaoAnythingContainer` 模块生命周期（registered→initialized→active→suspending→terminated）

### 新增文件
`packages/daoAgents/src/container-bridge.ts`

```ts
// DaoAgentContainerBridge
// - mount(agent, container): 将 agent 注册进容器，并双向同步生命周期
//   • agent.initialize() → container.initialize(agentId)
//   • agent.activate()   → container.activate(agentId)
//   • agent.rest()       → container.deactivate(agentId)
//   • agent.terminate()  → container.terminate(agentId)
// - unmount(agentId, container): 解除绑定
```

### 修改文件
`packages/daoAgents/src/index.ts`
- 导出 `DaoAgentContainerBridge`、`daoAgentContainerBridge` 单例

### 依赖关系
`daoAgents` 已有 `@daomind/nothing` 依赖。
需要在 `packages/daoAgents/package.json` 添加 `"@daomind/anything": "workspace:^"`，
并在 `packages/daoAgents/tsconfig.json` 的 `references` 中添加 `{"path": "../daoAnything"}`。

### 新增测试
`packages/daoAgents/src/__tests__/container-bridge.test.ts`
- mount 后 agent 状态变更自动同步到容器
- unmount 后独立运行
- 容器中可通过 getModule 查到 agent 的元数据

---

## 文件变更清单

| 文件 | 操作 |
|------|------|
| `packages/daoAnything/src/__tests__/container.test.ts` | 新增 |
| `packages/daoAgents/src/messaging.ts` | 新增 |
| `packages/daoAgents/src/__tests__/messaging.test.ts` | 新增 |
| `packages/daoAgents/src/container-bridge.ts` | 新增 |
| `packages/daoAgents/src/__tests__/container-bridge.test.ts` | 新增 |
| `packages/daoAgents/src/base.ts` | 修改（增加 send/onMessage） |
| `packages/daoAgents/src/index.ts` | 修改（导出新模块） |
| `packages/daoAgents/package.json` | 修改（添加 @daomind/anything 依赖） |
| `packages/daoAgents/tsconfig.json` | 修改（添加 references） |

---

## 验证

```bash
pnpm --filter @daomind/anything test      # 里程碑一
pnpm --filter @daomind/agents test        # 里程碑二 + 三
pnpm -r run build                         # 全局构建无报错
```
