# DaoMind v2.22.0 开发计划 — DaoUniverseQi

## Context

v2.21.0 完成 `DaoUniverseModules`（@daomind/anything × DaoUniverseApps），DaoUniverse* 桥接树在 `DaoUniverseApps` 分支下已有 Times + Modules 两个子节点。

`@modulux/qi` 是 DaoMind 最核心的消息传输基础设施，实现了帛书道德经四十二章"天地人冲"四通道通信模型，但尚未融入 DaoUniverse* 树。
最自然的接入点是 `DaoUniverseNexus`（服务网格层），因为 Qi 的 `DaoRouter` 与 Nexus 的路由层在职责上高度对齐：
- Nexus 管理**服务级**路由（DaoServiceDiscovery + DaoNexusRouter）
- Qi 管理**消息级**路由（HunyuanBus + DaoRouter）

将两者结合，形成"消息总线 × 服务网格"的完整传输层。

---

## 目标版本

**v2.22.0**：`DaoUniverseQi` — `@modulux/qi × DaoUniverseNexus`

新增位置：
```
DaoUniverse
  └── DaoUniverseMonitor (v2.8.0)
          └── DaoUniverseNexus (v2.14.0)
                  ├── DaoUniverseSpaces (v2.16.0)
                  └── DaoUniverseQi (v2.22.0)  ← 新建
```

---

## 执行步骤（严格顺序）

### Step 0：复盘 v2.21.0
创建 `retrospectives/2026-04-16-daomind-v2.21.0.md`，覆盖：
- 目标：DaoUniverseModules IoC 容器 × Agent 广播
- 核心设计：独立 DaoAnythingContainer / activate 广播 / terminate 广播
- 关键发现：resolve() 的文件系统平台依赖 → 仅测错误路径
- 已知限制：动态 import 在非 Node.js 平台的行为差异
- 测试覆盖：29 个测试（构建/register/initialize/activate/deactivate/terminate/查询/resolve/snapshot/E2E）

---

### Step 1：实现 universe-qi.ts

**文件**：`packages/daoCollective/src/universe-qi.ts`

**依赖**：
```typescript
import {
  HunyuanBus,
  TianQiChannel, DiQiChannel, RenQiChannel,
  ChongQiRegulator, daoCreateChongQiRegulator,
  DaoSerializer, DaoRouter, DaoSigner, DaoBackpressure,
} from '@modulux/qi';
import type { DaoMessage, QiChannelType } from '@modulux/qi';
import type { DaoUniverseNexus } from './universe-nexus';
```

**快照类型**：
```typescript
export interface QiSnapshot {
  readonly timestamp:       number;
  readonly totalEmitted:    number;
  readonly totalDropped:    number;
  readonly channelsStats:   Record<string, number>;
  readonly registeredNodes: number;
}
```

**内部状态**：
```typescript
private readonly _bus:    HunyuanBus;   // HunyuanBus(serializer, router, signer, backpressure, 'dao-universe-secret')
private readonly _tian:   TianQiChannel;
private readonly _di:     DiQiChannel;
private readonly _ren:    RenQiChannel;
private readonly _chong:  ChongQiRegulator;
private readonly _router: DaoRouter;    // 独立保存（DaoRouter 实例）
private readonly _nodes:  Set<string>;  // 追踪已注册节点 id，用于 registeredNodes 快照
```

**公开 API**：
```typescript
constructor(nexus: DaoUniverseNexus)
addNode(nodeId: string, target?: string): void
  // _router.addRoute(target ?? nodeId, nodeId) + _nodes.add(nodeId)
removeNode(nodeId: string, target?: string): void
  // _router.removeRoute(target ?? nodeId, nodeId) + _nodes.delete(nodeId)
broadcast(messageType: string, body: Record<string, unknown>): Promise<void>
  // 委托 _tian.broadcast(messageType, body)
report(sourceId: string, messageType: string, metrics: Record<string, number>): Promise<void>
  // 委托 _di.report(sourceId, messageType, metrics)
subscribe(channelType: QiChannelType, handler: (msg: DaoMessage) => void): () => void
  // 委托 _bus.subscribe(channelType, handler)
probe(target: string): Promise<number>
  // 委托 _bus.probe(target)
snapshot(): QiSnapshot
  // { timestamp: Date.now(), ...bus.getStats(), registeredNodes: _nodes.size }
get nexus(): DaoUniverseNexus
get bus(): HunyuanBus
get tian(): TianQiChannel
get di(): DiQiChannel
get ren(): RenQiChannel
get chong(): ChongQiRegulator
```

**帛书依据**（顶部注释）：
- "万物负阴而抱阳，冲气以为和"（德经·四十二章）
- "为学日益，为道日损"（德经·四十八章）

---

### Step 2：测试 universe-qi.test.ts

**文件**：`packages/daoCollective/src/__tests__/universe-qi.test.ts`

**makeStack helper**：
```typescript
function makeStack(intervalMs = 100) {
  const universe = new DaoUniverse();
  const monitor  = new DaoUniverseMonitor(universe);
  const clock    = new DaoUniverseClock(monitor, intervalMs);
  const nexus    = new DaoUniverseNexus(monitor, clock);
  const qi       = new DaoUniverseQi(nexus);
  return { universe, monitor, clock, nexus, qi };
}
```

**30 个测试分组**：

| 分组 | 数量 | 测试点 |
|------|------|--------|
| 构建 | 5 | 可构建 / nexus getter / bus/tian/di/ren/chong getter 均已初始化 / snapshot 初始值（0 emitted/dropped/nodes）|
| addNode / removeNode | 4 | addNode 后 _nodes.size=1 / removeNode 后 size=0 / 重复 addNode 幂等（Set 去重）/ 不存在的 remove 不抛出 |
| broadcast | 5 | 无节点 → totalDropped+1 / addNode 后 → totalEmitted+1 / broadcast 返回 Promise<void> / 正确传入 messageType / getStats 增长 |
| report | 3 | 调用 di.report 不抛出 / report 后 totalDropped 不增长（backpressure 未触发）/ 返回 Promise<void> |
| subscribe | 4 | 返回 unsubscribe 函数 / unsubscribe 后不再接收 / 订阅后 bus 有 listener / channelType 参数传递 |
| probe | 2 | 返回 number / 返回非负值 |
| snapshot | 4 | 初始 totalEmitted=0 / broadcast(有节点)后 totalEmitted>0 / dropped 计数反映无路由消息 / registeredNodes 随 addNode 增长 |
| E2E | 3 | 完整栈构建并取 snapshot / addNode→broadcast→getStats 验证消息流 / removeNode 后 registeredNodes=0 |

总计 = **30 个测试** → 测试总数：817 + 30 = **847**

**关键 mock 策略**：
- 在需要路由 `broadcast` 的测试中，先 `addNode` 注册节点，确保 `DaoRouter.route()` 返回非空数组
- `DaoBackpressure` 默认 `allow()` 返回 true（maxRatePerNode=100，不超出）
- 不用 jest.spyOn，依赖真实实现以验证集成正确性（与 DaoUniverseModules 策略一致）

---

### Step 3：注册到 index.ts

在 `packages/daoCollective/src/index.ts` 末尾追加：
```typescript
// DaoUniverseQi — 混元气总线 × 宇宙服务网格（@modulux/qi × DaoUniverseNexus）
export type { QiSnapshot } from './universe-qi';
export { DaoUniverseQi } from './universe-qi';
```

---

### Step 4：更新 App.tsx

- 版本：`v2.21.0` → `v2.22.0`
- 测试数：`817` → `847`

---

### Step 5：验证 + commit + push

```bash
# 全量测试（预期：847 tests passed, 47 suites）
npx jest --no-coverage 2>&1 | tail -5

# 全量构建
pnpm -r run build 2>&1 | grep -E "Done|error"

# 单步 commit（v2.22.0）
git add -A && git commit -m "feat(qi): v2.22.0 — ..."
git tag v2.22.0
git push origin main --tags
git push github main --tags
```

---

## 关键文件

| 文件 | 操作 |
|------|------|
| `packages/daoCollective/src/universe-qi.ts` | 新建 |
| `packages/daoCollective/src/__tests__/universe-qi.test.ts` | 新建 |
| `packages/daoCollective/src/index.ts` | 追加 2 行导出 |
| `retrospectives/2026-04-16-daomind-v2.21.0.md` | 新建 |
| `src/App.tsx` | 817→847, v2.21.0→v2.22.0 |

---

## 验证

- `pnpm test` 全部通过，预期 **847 个测试，47 个套件**
- `pnpm -r run build` 所有包输出 Done，无 error
- `packages/daoCollective` 构建无 TypeScript 报错（@modulux/qi 类型已在 daoCollective 的 peerDeps 中）
- `git log --oneline -1` 显示 v2.22.0 commit
- `git tag | grep v2.22.0` 确认 tag 存在
