# DaoMind & Modulux - 快速开始指南

欢迎来到 DaoMind & Modulux！这是一个基于道家哲学的模块化系统框架。

> "无名，万物之始也；有名，万物之母也。"  
> —— 马王堆汉墓帛书《老子》甲本

---

## 目录

- [5 分钟快速体验](#5-分钟快速体验)
- [核心概念速览](#核心概念速览)
- [基础示例](#基础示例)
- [DaoUniverse* 桥接体系](#daouniverse-桥接体系)
- [下一步](#下一步)

---

## 5 分钟快速体验

### 安装

```bash
# 推荐：安装根节点包（包含所有子包的再导出）
pnpm add @daomind/collective

# 或按需安装独立包
pnpm add @daomind/nothing @daomind/anything
pnpm add @daomind/agents
pnpm add @daomind/apps
pnpm add @daomind/times
```

### 第一个示例（推荐入口）

```typescript
import {
  DaoUniverse,
  DaoUniverseMonitor,
  DaoUniverseAgents,
  DaoUniverseApps,
} from '@daomind/collective';

// 构建 DaoUniverse* 层次：宇宙 → 监控 → Agent → 应用
const universe = new DaoUniverse();
const monitor  = new DaoUniverseMonitor(universe);
const agents   = new DaoUniverseAgents(monitor);
const apps     = new DaoUniverseApps(agents);

// 注册并启动应用
apps.register({ id: 'demo', name: '演示应用', version: '1.0.0', entry: './demo' });
await apps.start('demo');

// 系统快照
const snap = apps.snapshot();
console.log(snap);
// { timestamp: ..., total: 1, running: 1, registered: 0, stopped: 0, byState: { running: 1 } }
```

---

## 核心概念速览

### "无名"与"有名"

DaoMind 的核心理念来自道家哲学：

| 概念 | 哲学含义 | 技术对应 | 实现 |
|------|----------|----------|------|
| **无名** | 未被命名的潜在状态 | TypeScript 类型空间 | 仅类型定义，零运行时 |
| **有名** | 已被命名的显化状态 | TypeScript 值空间 | 具体类、实例、函数 |

```typescript
// "无名"层（@daomind/nothing）——仅类型，编译后消失
import type { ExistenceContract, DaoOption, DaoResult } from '@daomind/nothing';

// "有名"层（@daomind/anything）——运行时实体
import { DaoAnythingContainer } from '@daomind/anything';

// 从无到有：定义契约，然后实例化
interface UserModule extends ExistenceContract {
  readonly name: string;
  readonly email: string;
}

const user: UserModule = {
  existentialType: 'anything',
  name: 'Alice',
  email: 'alice@example.com',
};
```

### 为什么这样设计？

```typescript
// ❌ 传统方式：类型和值混在一起
class Entity {
  id: string;
  name: string;
  // 即使只需要类型，也会引入运行时代码
}

// ✅ DaoMind 方式：清晰的层次分离
// 1. "无名"层（@daomind/nothing）- 仅类型
import type { ExistenceContract } from '@daomind/nothing';

// 2. "有名"层（@daomind/anything）- 具体实现
import { DaoAnythingContainer } from '@daomind/anything';
const container = new DaoAnythingContainer();
```

**优势**：
- 零运行时开销（类型在编译后消失）
- 类型安全（TypeScript 编译时检查）
- 哲学一致性（理论指导实践）
- 最小化包体积

---

## 基础示例

### 示例 1：函数式错误处理（DaoResult / DaoOption）

```typescript
import {
  daoTryAsync,
  daoIsOk,
  daoIsErr,
  daoUnwrapOr,
  daoFromNullable,
} from '@daomind/nothing';

// 异步操作包裹（永不抛出异常）
const result = await daoTryAsync(() => fetch('/api/users').then(r => r.json()));

if (daoIsOk(result)) {
  console.log('用户列表:', result.value);
} else {
  console.error('请求失败:', result.error.message);
}

// 可空值安全处理
const username = daoFromNullable(user?.profile?.displayName);
const name = daoUnwrapOr(username, '匿名用户');
```

### 示例 2：Agent 系统

```typescript
import { TaskAgent, ObserverAgent, daoAgentMessenger } from '@daomind/agents';
import { daoNothingVoid } from '@daomind/nothing';

// 测试隔离：清空事件总线
daoNothingVoid.void();

// TaskAgent —— 优先级任务队列
const worker = new TaskAgent('worker-1');
await worker.initialize();
await worker.activate();

await worker.execute('enqueue', { id: 'job-1', action: 'process-data', priority: 10 });
await worker.execute('enqueue', { id: 'job-2', action: 'send-report',  priority: 5  });
await worker.execute('run-next'); // 执行优先级最高的任务

// ObserverAgent —— 监听事件总线历史
const observer = new ObserverAgent('observer-1');
await observer.initialize();
const history = await observer.execute('get-history', { limit: 10 });
console.log('消息历史:', history);
```

### 示例 3：应用生命周期管理

```typescript
import {
  DaoUniverse,
  DaoUniverseMonitor,
  DaoUniverseAgents,
  DaoUniverseApps,
} from '@daomind/collective';

const universe = new DaoUniverse();
const apps = new DaoUniverseApps(
  new DaoUniverseAgents(new DaoUniverseMonitor(universe))
);

// 注册应用（带依赖声明）
apps.register({ id: 'db',      name: '数据库服务',   version: '1.0.0', entry: './db' });
apps.register({ id: 'api',     name: 'API 服务',     version: '1.0.0', entry: './api',     dependencies: ['db'] });
apps.register({ id: 'web',     name: 'Web 前端',     version: '1.0.0', entry: './web',     dependencies: ['api'] });

// 按依赖顺序启动
await apps.start('db');
await apps.start('api');  // 依赖 db 已运行
await apps.start('web');  // 依赖 api 已运行

// 监听状态变更
const dispose = apps.onStateChange('web', (from, to) => {
  console.log(`web: ${from} → ${to}`);
});

// 查询状态
console.log(apps.listByState('running')); // [db, api, web]

// 停止
await apps.stop('web');
dispose(); // 取消监听器
```

### 示例 4：定时器管理（DaoUniverseTimes）

```typescript
import {
  DaoUniverse,
  DaoUniverseMonitor,
  DaoUniverseAgents,
  DaoUniverseApps,
  DaoUniverseTimes,
} from '@daomind/collective';

const apps  = new DaoUniverseApps(
  new DaoUniverseAgents(new DaoUniverseMonitor(new DaoUniverse()))
);
const times = new DaoUniverseTimes(apps);

apps.register({ id: 'poller', name: '轮询服务', version: '1.0.0', entry: './poller' });
await apps.start('poller');

// 绑定到应用的 interval
const h1 = times.setInterval('poller', () => pollAPI(), { interval: 5000 });

// 单次延迟任务
const h2 = times.setTimeout('poller', () => warmup(), 1000);

// 调度未来任务
const taskId = times.scheduleTask('poller', {
  executeAt: Date.now() + 60_000,
  handler:   () => dailyReport(),
  priority:  1,
});

// 快照
console.log(times.snapshot());
// { totalTimers: 2, pendingTasks: 1, byApp: { poller: { timers: 2, tasks: 1 } } }

// 时间窗口工具
const win = times.window(10_000); // 未来 10 秒的窗口
console.log(times.windowContains(win, Date.now() + 5000)); // true

// 停止应用，清理所有时序资源
await apps.stop('poller');
const freed = times.clearAllForApp('poller'); // 返回已清除数量
console.log(`已清理 ${freed} 个时序资源`);
```

### 示例 5：模块 IoC 管理（DaoUniverseModules）

```typescript
import {
  DaoUniverse,
  DaoUniverseMonitor,
  DaoUniverseAgents,
  DaoUniverseApps,
  DaoUniverseModules,
} from '@daomind/collective';

const apps    = new DaoUniverseApps(
  new DaoUniverseAgents(new DaoUniverseMonitor(new DaoUniverse()))
);
const modules = new DaoUniverseModules(apps);

// 注册模块（声明路径，但不立即加载）
modules.register({ name: 'auth',     version: '1.0.0', path: './modules/auth' });
modules.register({ name: 'payments', version: '1.0.0', path: './modules/payments', dependencies: ['auth'] });

// 生命周期：registered → initialized → active
await modules.initialize('auth');
await modules.activate('auth');
// → agents 收到 'module:activated' 广播消息

await modules.initialize('payments');
await modules.activate('payments');

// 查询
console.log(modules.listByLifecycle('active')); // [auth, payments]
console.log(modules.snapshot());
// { total: 2, active: 2, registered: 0, terminated: 0, ... }

// 下线模块
await modules.deactivate('payments');
await modules.terminate('payments');
// → agents 收到 'module:terminated' 广播消息
```

---

## DaoUniverse* 桥接体系

DaoMind v2.21.0 的核心是 **14 个分层桥接器**，将所有功能包统一融入宇宙层次。每个桥接器：

- 创建独立的子系统实例（不污染全局单例）
- 通过构造参数接收上层桥接器引用
- 暴露统一的 `snapshot()` 方法
- 与上层进行自动联动（事件广播、监控记录等）

```
DaoUniverse（全局宇宙）
  ├── DaoUniverseMonitor     — 监控仪表盘 × 健康快照
  │       ├── DaoUniverseAgents    — Agent 注册表 × heatmap 集成
  │       │       └── DaoUniverseApps      — 应用状态机 × Agent 广播
  │       │               ├── DaoUniverseTimes    — per-app 定时器 × 调度
  │       │               └── DaoUniverseModules  — IoC 容器 × Agent 广播
  │       ├── DaoUniverseClock     — 时序心跳
  │       │       ├── DaoUniverseFeedback  — 闭环调节
  │       │       └── DaoUniverseScheduler — 时序调度
  │       │               ├── DaoUniverseSkills — 技能生命周期
  │       │               └── DaoUniversePages  — 组件树 × 刷新
  │       └── DaoUniverseNexus     — 服务网格
  │               └── DaoUniverseSpaces    — 命名空间
  └── DaoUniverseAudit       — 哲学契约审查
          └── DaoUniverseDocs      — 知识图谱
```

### 构建完整宇宙

```typescript
import {
  DaoUniverse,
  DaoUniverseMonitor,
  DaoUniverseClock,
  DaoUniverseFeedback,
  DaoUniverseAudit,
  DaoUniverseScheduler,
  DaoUniverseNexus,
  DaoUniverseDocs,
  DaoUniverseSpaces,
  DaoUniverseSkills,
  DaoUniversePages,
  DaoUniverseAgents,
  DaoUniverseApps,
  DaoUniverseTimes,
  DaoUniverseModules,
} from '@daomind/collective';

// 从根节点开始，逐层构建
const universe  = new DaoUniverse();
const monitor   = new DaoUniverseMonitor(universe);
const clock     = new DaoUniverseClock(monitor);
const feedback  = new DaoUniverseFeedback(clock);
const audit     = new DaoUniverseAudit(universe);
const scheduler = new DaoUniverseScheduler(clock);
const nexus     = new DaoUniverseNexus(monitor);
const docs      = new DaoUniverseDocs(audit);
const spaces    = new DaoUniverseSpaces(nexus);
const skills    = new DaoUniverseSkills(scheduler);
const pages     = new DaoUniversePages(scheduler);
const agents    = new DaoUniverseAgents(monitor);
const apps      = new DaoUniverseApps(agents);
const times     = new DaoUniverseTimes(apps);
const modules   = new DaoUniverseModules(apps);
```

---

## 下一步

### 深入学习
- [交互式教程](./tutorials/INTERACTIVE-TUTORIAL.md) — 分步骤学习
- [API 参考](./api/API-REFERENCE.md) — 完整 API 文档（含所有 DaoUniverse* 桥接器）
- [最佳实践](./guides/BEST-PRACTICES.md) — 设计模式与架构建议

### 实战案例
- [构建 Todo 应用](./examples/todo-app/)
- [创建 Agent 系统](./examples/agent-system/)
- [定时任务管理系统](./examples/times-manager/)

### 遇到问题？
- [FAQ 常见问题](./FAQ.md) — 快速答疑
- [GitHub Discussions](https://github.com/xinetzone/DaoMind/discussions) — 提问交流
- [GitHub Issues](https://github.com/xinetzone/DaoMind/issues) — 报告问题

---

## 关键要点回顾

1. **"无名"** = TypeScript 类型 = 零运行时 = 潜在可能
2. **"有名"** = TypeScript 值 = 运行时实体 = 显化实现
3. **DaoUniverse*** = 14 个分层桥接器，统一管理所有子系统
4. **per-app 资源追踪** = DaoUniverseTimes 将定时器绑定到应用 ID
5. **Agent 广播** = DaoUniverseApps/Modules 的状态变化自动通知 Agent 系统
6. **哲学一致** = 每个设计都有帛书《道德经》依据

---

> "道生一，一生二，二生三，三生万物。"  
> 从一个简单的宇宙根节点，你可以构建整个应用生态。这就是 DaoMind 的力量。
