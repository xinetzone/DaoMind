# daoCollective 根节点实现计划

## Context

`@daomind/collective` 当前仅有 4 行存根代码。它应作为整个 DaoMind 系统的门面入口（Facade）：
- 统一再导出所有核心包（nothing / anything / agents / apps）
- 提供 `DaoUniverse` 类：一站式初始化、工厂方法、系统快照
- 提供全局单例 `daoUniverse`，让用户只需一个包即可使用全系统

## 架构设计

```
@daomind/collective
    ├── DaoUniverse (universe.ts)         ← 核心门面类
    │   ├── .container: DaoAnythingContainer
    │   ├── .agentRegistry: DaoAgentRegistry
    │   ├── .appContainer: DaoAppContainer
    │   ├── .bridge: DaoAgentContainerBridge
    │   ├── .void: daoNothingVoid (只读引用)
    │   ├── createAgent<T>(Class, id) → T    工厂：创建+注册+可选mount
    │   ├── createApp(def) → DaoAppInstance  工厂：注册应用
    │   ├── snapshot() → DaoSystemSnapshot   系统全局快照
    │   └── reset()                          测试用：重置全部状态
    └── index.ts                            ← 再导出所有核心包 + DaoUniverse

export const daoUniverse = new DaoUniverse();
```

## 文件变更清单

### 新增文件

| 文件 | 说明 |
|------|------|
| `packages/daoCollective/src/universe.ts` | DaoUniverse 类 + daoUniverse 单例 |
| `packages/daoCollective/src/__tests__/universe.test.ts` | 20+ 测试 |

### 修改文件

| 文件 | 变更 |
|------|------|
| `packages/daoCollective/src/index.ts` | 再导出所有核心包 + DaoUniverse |
| `packages/daoCollective/package.json` | 添加 workspace deps + 改 tsc→tsc --build |
| `packages/daoCollective/tsconfig.json` | 添加 references |

---

## universe.ts 实现细节

```typescript
interface DaoSystemSnapshot {
  timestamp: number;
  modules: { total: number; byLifecycle: Record<string, number> };
  agents:  { total: number; byState: Record<string, number>; byType: Record<string, number> };
  apps:    { total: number; byState: Record<string, number> };
  events:  { total: number; byType: Record<string, number> };
}

class DaoUniverse {
  readonly container   = new DaoAnythingContainer();
  readonly agentRegistry = new DaoAgentRegistry();
  readonly appContainer  = new DaoAppContainer();
  readonly bridge        = new DaoAgentContainerBridge();
  get void() { return daoNothingVoid; }

  // 创建 Agent + 自动注册到 registry
  createAgent<T extends DaoBaseAgent>(
    AgentClass: new (id: string) => T,
    id: string,
  ): T {
    const agent = new AgentClass(id);
    this.agentRegistry.register(agent);
    return agent;
  }

  // 注册应用（不自动 start）
  createApp(definition: DaoAppDefinition): DaoAppInstance {
    this.appContainer.register(definition);
    return this.appContainer.getInstance(definition.id)!;
  }

  // 系统全局快照
  snapshot(): DaoSystemSnapshot {
    const modules  = this.container.listModules();
    const agents   = this.agentRegistry.listAll();
    const apps     = this.appContainer.listAll();
    const events   = this.void.reflect();

    // 计算各维度分布
    ...
    return { timestamp: Date.now(), modules: {...}, agents: {...}, apps: {...}, events: {...} };
  }

  // 仅测试用：重置全部状态（调用 daoNothingVoid.void()）
  reset(): void {
    this.bridge.dispose();
    daoNothingVoid.void();
  }
}
```

## index.ts 再导出清单

```typescript
// 从 daoNothing 再导出
export type { ExistenceContract, ... } from '@daomind/nothing';
export { daoNothingVoid, daoSome, daoNone, daoOk, daoErr, ... } from '@daomind/nothing';

// 从 daoAnything 再导出
export type { DaoModuleMeta, ... } from '@daomind/anything';
export { DaoAnythingContainer, daoContainer } from '@daomind/anything';

// 从 daoAgents 再导出
export type { DaoAgent, ... } from '@daomind/agents';
export { DaoBaseAgent, TaskAgent, ObserverAgent, CoordinatorAgent, ... } from '@daomind/agents';

// 从 daoApps 再导出
export type { DaoAppDefinition, ... } from '@daomind/apps';
export { daoAppContainer, DaoAppContainer } from '@daomind/apps';

// daoCollective 自身
export type { DaoSystemSnapshot } from './universe';
export { DaoUniverse, daoUniverse } from './universe';
```

## package.json 变更

```json
{
  "scripts": { "build": "tsc --build" },
  "dependencies": {
    "@daomind/nothing":  "workspace:^",
    "@daomind/anything": "workspace:^",
    "@daomind/agents":   "workspace:^",
    "@daomind/apps":     "workspace:^"
  }
}
```

## tsconfig.json 变更

添加四个 references：daoNothing / daoAnything / daoAgents / daoApps

## 测试覆盖（universe.test.ts，目标 20+ 测试）

1. `DaoUniverse` 实例创建
2. `createAgent` → 返回正确类型、自动注册到 agentRegistry
3. `createAgent` → 重复 id 抛出错误（来自 registry）
4. `createApp` → 注册应用，state 为 registered
5. `createApp` → 重复 id 抛出错误
6. `appContainer.start()` → state 变为 running
7. `snapshot()` → agents/modules/apps 数量正确
8. `snapshot()` → byState 分类正确
9. `snapshot()` → events.total 反映 daoNothingVoid 事件数
10. Agent lifecycle → daoNothingVoid 接收 agent:lifecycle 事件
11. createAgent + initialize + activate → snapshot 中 active 数 +1
12. `reset()` → agentRegistry.listAll() 不保证清空（registry 独立），但 daoNothingVoid 清空
13. TaskAgent 通过 createAgent 创建后可正常 execute
14. ObserverAgent 通过 createAgent 创建后 initialize 正常订阅事件
15. CoordinatorAgent 通过 createAgent 创建后 add-agent/broadcast 正常
16. 多个 Agent 协同：snapshot 事件计数反映消息传递
17. 再导出验证：从 @daomind/collective 导入的 daoNothingVoid 是同一个单例
18. 再导出验证：从 @daomind/collective 导入的 DaoBaseAgent 是同一个类
19. 系统快照 byType 事件分类（agent:lifecycle vs agent:message）
20. createApp + start + stop 全流程

## 验证步骤

```bash
# 1. 安装新 workspace deps
pnpm install

# 2. 全量构建（包含 daoCollective）
pnpm -r run build

# 3. 全量测试
npx jest --no-coverage

# 4. daoCollective 专项
npx jest packages/daoCollective --no-coverage

# 5. 通过后：git commit + tag v2.6.0 + push
```
