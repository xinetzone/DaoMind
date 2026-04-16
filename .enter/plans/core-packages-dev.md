# v2.23.0 — DaoUniverseBenchmark 开发计划

## Context

当前状态：v2.22.0，847 测试，47 套件。

DaoUniverse* 桥接体系仍有两个未桥接包：
- `@daomind/benchmark` — 性能基准测试工具
- `@daomind/verify` — 已通过 DaoUniverseAudit 桥接（v2.11.0）

v2.22.0 的关键发现：TianQiChannel 签名时使用两次独立的 `Date.now()`，
导致 `JSON.stringify(message.header)` 与签名 payload 永远不匹配，消息必被 drop。
DaoUniverseQi.broadcast() 已绕过此问题。

---

## v2.23.0：DaoUniverseBenchmark（@daomind/benchmark × DaoUniverseMonitor）

### 架构位置

```
DaoUniverse
  └── DaoUniverseMonitor (v2.8.0)
          ├── DaoUniverseClock → ...
          ├── DaoUniverseNexus → ...
          ├── DaoUniverseAgents → ...
          └── DaoUniverseBenchmark (v2.23.0) ← 性能基准 × 宇宙健康感知
```

### 哲学依据

帛书《道德经》：
- "为学日益，为道日损"（德经·四十八章）— 测量即学习，损益见道
- "知人者智，自知者明"（德经·三十三章）— 自知性能，知常曰明

### 类接口设计

```typescript
/** 单次基准测试运行记录（含 Universe 健康感知） */
export interface BenchmarkRunRecord {
  readonly timestamp:    number;
  readonly healthBefore: number;  // _monitor.health() before run
  readonly healthAfter:  number;  // _monitor.health() after run
  readonly report:       DaoPerformanceReport;
}

/** 基准测试系统快照 */
export interface BenchmarkSnapshot {
  readonly timestamp:   number;
  readonly totalRuns:   number;
  readonly lastRunAt:   number | null;
  readonly lastHealth:  number | undefined;
  readonly historySize: number;
}

export class DaoUniverseBenchmark {
  private readonly _runner: DaoBenchmarkRunner;
  private readonly _history: BenchmarkRunRecord[] = [];

  constructor(private readonly _monitor: DaoUniverseMonitor) {
    this._runner = new DaoBenchmarkRunner();
  }

  // 执行基准测试
  async runQuick(): Promise<BenchmarkRunRecord>           // 3 个快速套件 + 健康感知
  async runAll():  Promise<BenchmarkRunRecord>            // 全部 6 个套件 + 健康感知
  async runSuite(name: string): Promise<DaoBenchmarkResult>  // 单套件（不计入 history）

  // 报告
  generateReport(format?: 'text' | 'json' | 'markdown'): string  // 委托 runner.daoGenerateReport()

  // 历史管理
  history(): ReadonlyArray<BenchmarkRunRecord>
  clearHistory(): void

  // 快照
  snapshot(): BenchmarkSnapshot

  // Getters
  get monitor(): DaoUniverseMonitor
  get runner(): DaoBenchmarkRunner
}
```

---

## 执行步骤

### Step 1：复盘 v2.22.0

创建 `retrospectives/2026-04-16-daomind-v2.22.0.md`，记录：
- DaoUniverseQi 设计亮点（四气通道暴露、_nodes Set、无签名广播）
- TianQiChannel 签名 Bug 发现与 DaoUniverseQi.broadcast() 绕过方案
- subscribe/unsubscribe 设计（委托 HunyuanBus.subscribe()）
- DiQiChannel 聚合缓冲机制（window-based buffering）

### Step 2：添加 @daomind/benchmark 依赖

在 `packages/daoCollective/package.json` 的 `dependencies` 中添加：
```json
"@daomind/benchmark": "workspace:^"
```

### Step 3：实现 universe-benchmark.ts

新建 `packages/daoCollective/src/universe-benchmark.ts`：
- constructor(monitor): 独立 new DaoBenchmarkRunner()，不污染全局
- runQuick(): 捕获 healthBefore → runner.daoRunQuick() → 捕获 healthAfter → push BenchmarkRunRecord
- runAll(): 同上，但调用 runner.daoRunAll()
- runSuite(name): 委托 runner.daoRunSuite(name)（单次运行，不追加 history）
- generateReport(format?): 委托 runner.daoGenerateReport(format)
- history(): 返回 _history（readonly copy）
- clearHistory(): _history.length = 0
- snapshot(): 从 _history 推断 totalRuns / lastRunAt / lastHealth

### Step 4：测试 universe-benchmark.test.ts

新建 `packages/daoCollective/src/__tests__/universe-benchmark.test.ts`，目标 30 个测试：

```
makeStack() helper：
  const universe = new DaoUniverse();
  const monitor  = new DaoUniverseMonitor(universe);
  const bench    = new DaoUniverseBenchmark(monitor);
```

| 分组 | 数量 | 关键覆盖 |
|------|------|---------|
| 构建 | 5 | create / monitor getter / runner getter / snapshot 初始 / history 初始为空 |
| runSuite | 4 | 消息吞吐量测试 / 内存占用测试 / 未知套件抛出 / 返回 DaoBenchmarkResult |
| runQuick | 5 | 返回 BenchmarkRunRecord / healthBefore≥0 / healthAfter≥0 / report.benchmarks 非空 / history 增长 |
| history | 3 | 初始为空 / runQuick 后 length=1 / clearHistory 后为空 |
| generateReport | 3 | text 格式字符串 / json 格式字符串 / markdown 格式字符串 |
| snapshot | 5 | totalRuns=0 / lastRunAt=null / 运行后 totalRuns=1 / historySize 同步 / lastHealth 有值 |
| E2E | 5 | 完整栈 / health 关联 / 多次运行 history 累积 / clearHistory 后重新累积 / generateReport 非空 |

**注意**：`generateReport` 在 runner 无 results 时返回空字符串；须先 `runSuite` 或 `runQuick` 才能产生报告。

### Step 5：更新 index.ts

在 `packages/daoCollective/src/index.ts` 末尾追加：
```typescript
// DaoUniverseBenchmark — 性能基准 × 宇宙健康感知（@daomind/benchmark × DaoUniverseMonitor）
export type { BenchmarkRunRecord, BenchmarkSnapshot } from './universe-benchmark';
export { DaoUniverseBenchmark } from './universe-benchmark';
```

### Step 6：更新 App.tsx

- 测试数：847 → 877（+30）
- 版本：v2.22.0 → v2.23.0

### Step 7：验证

```bash
npx jest packages/daoCollective/src/__tests__/universe-benchmark.test.ts --no-coverage
npx jest --no-coverage   # 全量验证：847+30=877 tests, 48 suites
pnpm -r run build        # 全量构建
```

### Step 8：提交 & 推送

```bash
git add -A
git commit -m "feat(benchmark): v2.23.0 — DaoUniverseBenchmark（@daomind/benchmark × DaoUniverseMonitor 性能基准 × 宇宙健康感知）"
git tag v2.23.0
git push origin main --tags
```

---

## 关键文件路径

| 文件 | 操作 |
|------|------|
| `packages/daoCollective/src/universe-benchmark.ts` | NEW |
| `packages/daoCollective/src/__tests__/universe-benchmark.test.ts` | NEW |
| `packages/daoCollective/src/index.ts` | APPEND |
| `packages/daoCollective/package.json` | ADD dep |
| `retrospectives/2026-04-16-daomind-v2.22.0.md` | NEW |
| `src/App.tsx` | 847→877, v2.22.0→v2.23.0 |

## 复用的现有工具

- `DaoBenchmarkRunner` from `@daomind/benchmark`（runner.daoRunAll/Quick/Suite/GenerateReport）
- `DaoUniverseMonitor.health()` — 运行时健康分数（0-100）
- 既有 makeStack 测试模式（DaoUniverse + DaoUniverseMonitor）
