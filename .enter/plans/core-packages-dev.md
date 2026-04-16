# v2.25.0 开发计划 — DaoUniverseFacade

## Context

v2.24.0 完成了 **DaoUniverseDiagnostic**（第一个跨切面组合类，Audit × Benchmark）。
至此 17 个 DaoUniverse* 桥接器全部落地，但用户每次使用都需手动按依赖顺序调用 18 个构造函数。

**核心问题**：目前没有"一键构建完整宇宙"的入口。  
**解决方案**：`DaoUniverseFacade` — 自动装配全部 17 桥接器的工厂门面类。

---

## v2.25.0：DaoUniverseFacade — 宇宙全栈自动装配门面

### 定位
```
DaoUniverseFacade（v2.25.0）
  └── 工厂：constructor(projectRoot?) → 自动按依赖顺序构建全部 17 桥接器
  └── getters：universe / monitor / clock / ... / diagnostic（各返回对应桥接器）
  └── snapshot()：DaoFacadeSnapshot（聚合 system+monitor+bench+qi+diag 五维快照）
  └── diagnose()：shortcut → this.diagnostic.diagnose()
  └── static create(projectRoot?)：工厂方法
```

### 接口设计

```typescript
// packages/daoCollective/src/universe-facade.ts

export interface DaoFacadeSnapshot {
  readonly timestamp:  number;
  readonly system:     DaoSystemSnapshot;      // universe.snapshot()
  readonly monitor:    MonitorSnapshot;         // monitor.capture()
  readonly bench:      BenchmarkSnapshot;       // benchmark.snapshot()
  readonly qi:         QiSnapshot;              // qi.snapshot()
  readonly diagnostic: DiagnosticSnapshot;      // diagnostic.snapshot()
}

export class DaoUniverseFacade {
  constructor(projectRoot?: string)           // 默认 process.cwd()
  static create(projectRoot?: string): DaoUniverseFacade

  // 17 个 getters — 每个返回对应桥接器
  get universe(): DaoUniverse
  get monitor(): DaoUniverseMonitor
  get clock(): DaoUniverseClock
  get feedback(): DaoUniverseFeedback
  get audit(): DaoUniverseAudit
  get scheduler(): DaoUniverseScheduler
  get nexus(): DaoUniverseNexus
  get docs(): DaoUniverseDocs
  get spaces(): DaoUniverseSpaces
  get qi(): DaoUniverseQi
  get skills(): DaoUniverseSkills
  get pages(): DaoUniversePages
  get agents(): DaoUniverseAgents
  get apps(): DaoUniverseApps
  get times(): DaoUniverseTimes
  get modules(): DaoUniverseModules
  get benchmark(): DaoUniverseBenchmark
  get diagnostic(): DaoUniverseDiagnostic

  snapshot(): DaoFacadeSnapshot
  diagnose(): Promise<DiagnosticRecord>        // → this.diagnostic.diagnose()
}
```

### 内部构建顺序（在 constructor 中）
```typescript
const universe   = new DaoUniverse();
const monitor    = new DaoUniverseMonitor(universe);
const clock      = new DaoUniverseClock(monitor);
const feedback   = new DaoUniverseFeedback(clock);
const audit      = new DaoUniverseAudit(universe, projectRoot);
const scheduler  = new DaoUniverseScheduler(clock);
const nexus      = new DaoUniverseNexus(monitor);
const docs       = new DaoUniverseDocs(audit);
const spaces     = new DaoUniverseSpaces(nexus);
const qi         = new DaoUniverseQi(nexus);
const skills     = new DaoUniverseSkills(scheduler);
const pages      = new DaoUniversePages(scheduler);
const agents     = new DaoUniverseAgents(monitor);
const apps       = new DaoUniverseApps(agents);
const times      = new DaoUniverseTimes(apps);
const modules    = new DaoUniverseModules(apps);
const benchmark  = new DaoUniverseBenchmark(monitor);
const diagnostic = new DaoUniverseDiagnostic(audit, benchmark);
// → 全部存入 private readonly _stack: DaoUniverseStack
```

---

## 任务列表

### 1. 复盘文件（先写，随 commit 打包）
- **文件**：`retrospectives/2026-04-16-daomind-v2.24.0.md`（当前为空占位符，需填写内容）
- **内容**：DaoUniverseDiagnostic 设计复盘（并行双轴、runtimeHealth 推导、beforeAll 测试策略、文档更新经验）

### 2. 实现 DaoUniverseFacade
- **文件**：`packages/daoCollective/src/universe-facade.ts`（新建）
- **哲学引用**："道生一，一生二，二生三，三生万物"（乙本·四十二章）
- **关键设计**：
  - 私有 `_stack` 存储全部 18 实例（universe + 17 桥接器）
  - getter 全部直接返回 `_stack.xxx`（只读）
  - `snapshot()` 调用各层 snapshot 方法并聚合
  - `diagnose()` 是 `this._stack.diagnostic.diagnose()` 的快捷方式
  - `static create()` 仅是 `new DaoUniverseFacade(...)` 的语法糖

### 3. 测试文件
- **文件**：`packages/daoCollective/src/__tests__/universe-facade.test.ts`（新建）
- **目标**：~33 个测试，预计总测试数 908 + 33 = **941**（50 套件）
- **分组**：
  | 组 | 测试数 | 覆盖内容 |
  |----|--------|----------|
  | 构建 | 5 | constructor、static create()、projectRoot 参数、stack 不可变、两实例独立 |
  | getters | 6 | universe/monitor/audit/benchmark/diagnostic/qi 各返回正确实例 |
  | snapshot | 5 | 形状检查、timestamp 合理、system/monitor/bench/qi/diag 字段 |
  | diagnose 快捷 | 4 | 委托 diagnostic.diagnose()、返回 DiagnosticRecord、history 增长、runtimeHealth |
  | E2E | 8 | 完整工作流：构建→qi.broadcast→apps.register→apps.start→benchmark.runQuick→diagnose→snapshot→多次 |
  | 边界 | 5 | 二次 snapshot、clearHistory 后 snapshot 字段归零、diagnose 两次 history=2 等 |
- **注意**：
  - `jest.setTimeout(60_000)` 置于文件顶部
  - `beforeAll` 共享一次 `diagnose()` 结果（减少 FS+bench 重复调用）

### 4. 更新 index.ts
- `packages/daoCollective/src/index.ts`：追加 DaoUniverseFacade 导出段

### 5. 更新 App.tsx
- `src/App.tsx`：908 → 941，v2.24.0 → v2.25.0

### 6. 验证
```bash
npx jest --no-coverage        # 预期：941 tests, 50 suites, all passed
pnpm -r run build             # 预期：all packages Done
```

### 7. Commit + Tag + Push
```bash
git add -A
git commit -m "feat(facade): v2.25.0 — DaoUniverseFacade（17 桥接器全栈自动装配门面）"
git tag v2.25.0
git push origin main --tags
```

---

## 关键文件

| 文件 | 操作 |
|------|------|
| `packages/daoCollective/src/universe-facade.ts` | 新建 |
| `packages/daoCollective/src/__tests__/universe-facade.test.ts` | 新建 |
| `packages/daoCollective/src/index.ts` | 追加导出段 |
| `src/App.tsx` | 版本号 + 测试数更新 |
| `retrospectives/2026-04-16-daomind-v2.24.0.md` | 填写实际内容 |

---

## 架构演进（v2.25.0 后）

```
DaoUniverseFacade（v2.25.0）← 全栈工厂门面
  └── 自动装配以下 17 个桥接器：
      DaoUniverse
        ├── DaoUniverseMonitor
        │       ├── DaoUniverseClock → Feedback / Scheduler → Skills / Pages
        │       ├── DaoUniverseNexus → Spaces / Qi
        │       ├── DaoUniverseAgents → Apps → Times / Modules
        │       └── DaoUniverseBenchmark ─╮
        │                                  ├──▶ DaoUniverseDiagnostic
        └── DaoUniverseAudit ─────────────╯
                └── DaoUniverseDocs
```
