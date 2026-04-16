# v2.14.0 — DaoUniverseNexus 实现计划

## Context

v2.13.0 完成（563 tests / 38 suites）。
本轮工作流：
1. 写 v2.13.0 复盘（retrospectives/2026-04-16-daomind-v2.13.0.md）
2. 验证全量 tests（已 563）
3. git commit + tag v2.14.0 + push origin & github
4. 实现 v2.14.0：daoNexus × DaoUniverseMonitor — DaoUniverseNexus

帛书依据："万物负阴而抱阳，冲气以为和"（德经·四十二章）
集成意图：Clock 心跳驱动 Nexus 服务健康快照录制，
         Universe 健康分数与 Nexus 服务网格状态双向可观测。

---

## 关键 API 确认

### @daomind/nexus（所有类均可独立实例化）

```
DaoServiceDiscovery — register/deregister/discover/healthCheck/markHealthy
DaoNexusRouter      — addRule/removeRule/resolve
DaoLoadBalancer     — setStrategy/select（round-robin / least-connections / weighted）
DaoConnectionManager— constructor(maxConn?, idleTimeout?) — 可选用
DaoNexusRequest     — { path: string, payload: unknown }
DaoNexusMetrics     — { totalRequests, successCount, failureCount, avgLatencyMs }
```

### DaoUniverseMonitor（已有）
```
monitor.health()               → number (0-100)
monitor.capture()              → MonitorSnapshot
monitor.history(limit?)        → ReadonlyArray<MonitorSnapshot>
```

### DaoUniverseClock（已有）
```
clock.onTick(cb)               → unsubscribe fn
```

---

## DaoUniverseNexus 设计

### 构造函数
```typescript
constructor(monitor: DaoUniverseMonitor, clock: DaoUniverseClock)
```
持有独立实例（不污染全局单例）：
```typescript
private readonly _discovery    = new DaoServiceDiscovery();
private readonly _router       = new DaoNexusRouter();
private readonly _loadBalancer = new DaoLoadBalancer();
```

### 新类型

```typescript
export interface NexusHealthRecord {
  readonly timestamp:       number;
  readonly systemHealth:    number;   // from monitor.health()
  readonly totalServices:   number;
  readonly healthyServices: number;
  readonly totalRequests:   number;
  readonly successRate:     number;
}

export interface NexusDispatchResult {
  readonly status:    'dispatched' | 'no-service' | 'no-target';
  readonly target:    string | null;
  readonly latencyMs: number;
}
```

### 方法

| 方法 | 说明 |
|------|------|
| `attach()` | 订阅 `clock.onTick() → _syncHealth()`，幂等 |
| `detach()` | 取消订阅，幂等 |
| `register(svc)` | 注册服务（id/name/version/endpoint）|
| `deregister(id)` | 注销服务 |
| `discover(name)` | 发现健康服务 |
| `markHealthy(id, healthy)` | 手动设置服务健康状态 |
| `healthCheck()` | 所有服务健康状态列表 |
| `addRoute(rule)` | 添加路由规则 |
| `removeRoute(pattern)` | 删除路由规则 |
| `dispatch(request)` | 服务发现 → 路由 → 负载均衡 → NexusDispatchResult |
| `metrics()` | 请求统计（totalRequests/successCount/failureCount/successRate）|
| `healthHistory(limit?)` | 历史健康快照（MAX 100 条）|
| `get isAttached` | 是否已订阅 |
| `get monitor` | DaoUniverseMonitor |
| `get discovery` | DaoServiceDiscovery |
| `get router` | DaoNexusRouter |
| `get loadBalancer` | DaoLoadBalancer |

### _syncHealth() 逻辑（内部）
```typescript
private _syncHealth(): void {
  const systemHealth    = this._monitor.health();
  const checks          = this._discovery.healthCheck();
  const totalServices   = checks.length;
  const healthyServices = checks.filter(c => c.healthy).length;
  const m               = this.metrics();
  this._healthHistory.push({
    timestamp: Date.now(), systemHealth,
    totalServices, healthyServices,
    totalRequests: m.totalRequests, successRate: m.successRate,
  });
  if (this._healthHistory.length > MAX_HEALTH_RECORDS) this._healthHistory.shift();
}
```

### dispatch() 逻辑
```typescript
async dispatch(request: DaoNexusRequest): Promise<NexusDispatchResult> {
  const start = Date.now();
  this._totalRequests++;
  const svcName   = request.path.split('/')[0] ?? '';
  const candidates = this._discovery.discover(svcName);
  if (candidates.length === 0) {
    this._failCount++;
    return { status: 'no-service', target: null, latencyMs: Date.now() - start };
  }
  const rules = candidates.map(c => ({ pattern: request.path, target: c.endpoint, weight: 1, priority: 1 }));
  const resolved = this._router.resolve(request.path);
  const effectiveRules = resolved.length > 0 ? resolved : rules;
  const selected = this._loadBalancer.select(effectiveRules);
  if (!selected) {
    this._failCount++;
    return { status: 'no-target', target: null, latencyMs: Date.now() - start };
  }
  this._successCount++;
  return { status: 'dispatched', target: selected.target, latencyMs: Date.now() - start };
}
```

---

## 测试计划（~30 tests）

| 分组 | 数量 | 内容 |
|------|------|------|
| 构建 | 5 | construct / isAttached=false / monitor getter / discovery getter / loadBalancer getter |
| attach/detach | 4 | attach→isAttached / detach→false / 幂等 attach / 幂等 detach |
| register/deregister | 4 | register / duplicate throws / deregister / discover |
| markHealthy/healthCheck | 3 | markHealthy false / healthCheck list / discover only healthy |
| dispatch() | 6 | 基本 dispatch / no-service / no-target / 路由规则 / load balance / metrics 更新 |
| healthHistory | 3 | syncHealth 记录 / limit / systemHealth 来自 monitor |
| Clock 驱动 | 3 | attach+tick→record / health grows / detach 停止 |
| E2E | 3 | 全栈 / @daomind/collective 导入 / 与 Feedback/Skills 共存 |

---

## 架构层次（v2.14.0 后完整）

```
DaoUniverse
  ├── DaoUniverseMonitor  (v2.8.0)
  │       ├── DaoUniverseClock  (v2.9.0)
  │       │       ├── DaoUniverseFeedback   (v2.10.0)
  │       │       └── DaoUniverseScheduler  (v2.12.0)
  │       │               └── DaoUniverseSkills  (v2.13.0)
  │       └── DaoUniverseNexus  (v2.14.0) ← 服务网格 × 宇宙健康
  └── DaoUniverseAudit  (v2.11.0)
```

---

## 修改文件清单

| 文件 | 操作 |
|------|------|
| `retrospectives/2026-04-16-daomind-v2.13.0.md` | 新建（v2.13.0 复盘）|
| `packages/daoCollective/src/universe-nexus.ts` | 新建（DaoUniverseNexus 实现）|
| `packages/daoCollective/package.json` | 添加 `@daomind/nexus: workspace:^` |
| `packages/daoCollective/tsconfig.json` | 添加 `../daoNexus` 引用 |
| `packages/daoCollective/src/index.ts` | 导出 DaoUniverseNexus + NexusHealthRecord + NexusDispatchResult + @daomind/nexus 全量再导出 |
| `packages/daoCollective/src/__tests__/universe-nexus.test.ts` | 新建（~30 tests）|

---

## 基础设施变更

```
package.json:  "@daomind/nexus": "workspace:^"
tsconfig.json: { "path": "../daoNexus" }
index.ts:      // @daomind/nexus 再导出
               export type { ConnectionType, ConnectionState, ConnectionHandle, DaoConnection,
                 DaoRouteRule, LoadBalanceStrategy, DaoServiceInstance, DaoNexusRequest, DaoNexusMetrics }
               export { DaoServiceDiscovery, daoServiceDiscovery, DaoNexusRouter, daoNexusRouter,
                 DaoLoadBalancer, daoLoadBalancer }
               // DaoUniverseNexus
               export type { NexusHealthRecord, NexusDispatchResult }
               export { DaoUniverseNexus }
```

---

## 验证

```bash
pnpm install && tsc --build packages/daoCollective/tsconfig.json
npx jest packages/daoCollective/src/__tests__/universe-nexus.test.ts --no-coverage
npx jest --no-coverage   # 全量，期望 563+30 ≈ 593+ tests
pnpm -r run build
git add -A && git commit && git tag v2.14.0 && git push
```
