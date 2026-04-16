# v2.7.0 — daoQi × daoAgents 集成：DaoQiAgentBridge

## Context

目标：将 `@modulux/qi`（HunyuanBus 四气通道传输层）与 `@daomind/agents`（内部 daoNothingVoid 消息系统）桥接，让 Agent 可通过 QiChannel 收发消息。

**当前架构**：
- Agent 消息通过 `DaoAgentMessenger` → `daoNothingVoid`（EventEmitter，进程内，轻量）
- `HunyuanBus` 有完整传输基础设施（签名/背压/路由/序列化/四通道），但与 Agent 层无连接

**集成原则**：
- `@daomind/agents` 不引入 `@modulux/qi` 依赖（保持 agents 包独立）
- 桥接代码放入 `@daomind/collective`（本就是整合门面）
- Agent 侧 API 不变：依然通过 `onMessage(handler)` 接收，通过 `send()` 发送
- 双向桥接：HunyuanBus → AgentMessenger（入站），AgentMessenger 方法 → HunyuanBus（出站）

**已发现 Bug**（需同步修复）：
- `HunyuanBus.send()` 在 `message.header.target` 为 undefined 时抛出错误，但 `TianQiChannel.broadcast()` 故意省略 target（广播语义），`DaoRouter.route()` 也已正确处理无 target 的情况 → 删除该 throw

---

## 涉及文件

| 操作 | 文件 |
|------|------|
| fix | `packages/daoQi/src/hunyuan.ts` |
| new | `packages/daoCollective/src/qi-bridge.ts` |
| edit | `packages/daoCollective/src/index.ts` |
| edit | `packages/daoCollective/package.json` |
| edit | `packages/daoCollective/tsconfig.json` |
| new | `packages/daoCollective/src/__tests__/qi-bridge.test.ts` |

---

## M1 — 修复 HunyuanBus 广播 Bug

**文件**：`packages/daoQi/src/hunyuan.ts`

删除第 53-56 行的抛出逻辑，将其改为广播（不 throw，继续走 router.route()）：

```typescript
// 删除：
if (!message.header.target) {
  throw new Error('[HunyuanBus] Invalid message: missing target in header');
}
// 替换为：（让 router.route() 处理广播，无 target 时返回所有注册节点）
```

---

## M2 — DaoQiAgentBridge 类

**文件**：`packages/daoCollective/src/qi-bridge.ts`

```typescript
import { daoAgentMessenger } from '@daomind/agents';
import {
  HunyuanBus, DaoRouter, DaoSerializer, DaoSigner, DaoBackpressure,
  TianQiChannel, DiQiChannel, RenQiChannel,
} from '@modulux/qi';
import type { DaoMessage } from '@modulux/qi';

export class DaoQiAgentBridge {
  private readonly _bus: HunyuanBus;
  private readonly _tian: TianQiChannel;  // 天气：下行广播
  private readonly _di: DiQiChannel;      // 地气：上行指标
  private readonly _ren: RenQiChannel;    // 人气：横向点对点

  private _busHandler?: (msg: DaoMessage) => void;
  private _isMounted = false;

  constructor(secretKey = 'dao-bridge-secret') {
    const router = new DaoRouter();
    router.addRoute('daoAgents', 'daoAgents');
    router.addRoute('daoCollective', 'daoCollective');
    this._bus = new HunyuanBus(new DaoSerializer(), router, new DaoSigner(), new DaoBackpressure({}), secretKey);
    this._tian = new TianQiChannel(this._bus);
    this._di = new DiQiChannel(this._bus);
    this._ren = new RenQiChannel(this._bus);
  }

  /** 挂载：HunyuanBus 'message' → daoAgentMessenger */
  mount(): void {
    if (this._isMounted) return;
    this._busHandler = (msg: DaoMessage) => {
      const body = msg.body as Record<string, unknown>;
      const from = String(body.from ?? msg.header.source);
      const to   = String(body.to   ?? msg.header.target ?? '*');
      const action = String(body.action ?? msg.header.type);
      daoAgentMessenger.send(from, to, action, body.payload);
    };
    this._bus.on('message', this._busHandler);
    this._isMounted = true;
  }

  /** 卸载：停止转发 */
  unmount(): void {
    if (!this._isMounted || !this._busHandler) return;
    this._bus.removeListener('message', this._busHandler);
    this._busHandler = undefined;
    this._isMounted = false;
  }

  /** 天气下行：根节点广播指令给所有 Agent */
  async sendDown(messageType: string, action: string, payload?: unknown): Promise<void> {
    await this._tian.broadcast(messageType, {
      type: messageType, from: 'daoCollective', to: '*', action, payload: payload ?? null,
    });
  }

  /** 地气上行：Agent 向根节点上报指标 */
  async reportUp(agentId: string, messageType: string, metrics: Record<string, number>): Promise<void> {
    await this._di.report(agentId, messageType, metrics);
  }

  /** 直接点对点：不经 RenQi 端口限制，直接通过 HunyuanBus 发送 */
  async sendDirect(from: string, to: string, action: string, payload?: unknown): Promise<void> {
    const { randomUUID } = await import('node:crypto');
    const message: DaoMessage = {
      header: {
        id: randomUUID(), type: action, source: from, target: to,
        priority: 1, ttl: 3, timestamp: Date.now(), encoding: 'json',
      },
      body: { type: action, from, to, action, payload: payload ?? null },
    };
    await this._bus.send(message);
  }

  /** 人气横向：通过 RenQiChannel 点对点（需先 openPort） */
  openPort(nodeA: string, nodeB: string): boolean { return this._ren.open(nodeA, nodeB); }

  stats() { return this._bus.getStats(); }
  get isMounted(): boolean { return this._isMounted; }
  get bus(): HunyuanBus { return this._bus; }
  get tian(): TianQiChannel { return this._tian; }
  get di(): DiQiChannel { return this._di; }
  get ren(): RenQiChannel { return this._ren; }
}
```

---

## M3 — package.json + tsconfig.json

**`packages/daoCollective/package.json`** — 新增依赖：
```json
"@modulux/qi": "workspace:^"
```

**`packages/daoCollective/tsconfig.json`** — 新增引用：
```json
{ "path": "../daoQi" }
```

---

## M4 — 更新 index.ts

`packages/daoCollective/src/index.ts` 新增：
```typescript
export { DaoQiAgentBridge } from './qi-bridge.js';
// 同时从 @modulux/qi 再导出关键类型
export type { DaoMessage, QiChannelType } from '@modulux/qi';
export { HunyuanBus, TianQiChannel, DiQiChannel, RenQiChannel } from '@modulux/qi';
```

---

## M5 — 测试（~27 个）

**文件**：`packages/daoCollective/src/__tests__/qi-bridge.test.ts`

测试分组：

| 分组 | 测试 |
|------|------|
| 构建 | 无参数构建 / 自定义 secretKey |
| mount/unmount | 初始未挂载 / mount → isMounted=true / unmount → isMounted=false / 重复 mount 幂等 |
| sendDown | 发送后 bus.stats.totalEmitted += 1 / 未挂载时不触发 agent |
| sendDown + mount | 挂载后广播被 daoAgentMessenger 转发 / Agent 通过 onMessage 收到 |
| sendDirect | 发送到指定 target / 收到正确 action + payload |
| sendDirect + mount | Agent 通过 onMessage 收到点对点消息 |
| reportUp | 不抛错 / stats.totalEmitted 正确 |
| openPort | 有效 pair 返回 true / 无效 pair 返回 false |
| stats | 空时返回 0 / 多次发送后统计正确 |
| HunyuanBus fix | broadcast（无 target）不再抛错 |
| 集成 | TaskAgent 通过 QiBridge 接收 sendDown 命令后执行任务 |
| 导出 | DaoQiAgentBridge 可从 @daomind/collective 导入 |

---

## 验证步骤

```bash
# 1. 安装新依赖
pnpm install

# 2. 全量构建
pnpm -r run build

# 3. 专项测试
npx jest packages/daoCollective packages/daoQi --no-coverage

# 4. 全量测试
npx jest --no-coverage
# 期望：>= 370 tests（+27 新增）

# 5. commit + tag v2.7.0 + push
git commit -m "feat(qi-bridge): v2.7.0 — DaoQiAgentBridge + HunyuanBus 广播修复"
git tag -a v2.7.0 ...
```
