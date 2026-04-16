# v2.24.0 开发计划 — DaoUniverseDiagnostic

## Context（为何做这个版本）

v2.23.0 完成了所有独立 `@daomind/*` 包的 DaoUniverse* 桥接。
自然的演进方向是**跨切面组合层**：将已有的「哲学自我审查」（DaoUniverseAudit）
与「性能基准测试」（DaoUniverseBenchmark）融合为单一的「宇宙综合诊断」。

架构位置：
```
DaoUniverseAudit      ──╮
                         ├──▶ DaoUniverseDiagnostic (v2.24.0)
DaoUniverseBenchmark  ──╯
```

## 文件变更（5 个文件）

| 操作 | 路径 |
|------|------|
| NEW  | `retrospectives/2026-04-16-daomind-v2.23.0.md` |
| NEW  | `packages/daoCollective/src/universe-diagnostic.ts` |
| NEW  | `packages/daoCollective/src/__tests__/universe-diagnostic.test.ts` |
| EDIT | `packages/daoCollective/src/index.ts`（append exports） |
| EDIT | `src/App.tsx`（877→907, v2.23.0→v2.24.0） |

无需新增依赖或 tsconfig 变更（仅引用已在 daoCollective/src/ 内的类）。

---

## DaoUniverseDiagnostic 设计

### 接口

```typescript
export interface DiagnosticRecord {
  readonly timestamp:      number;
  readonly auditReport:    DaoVerificationReport;   // DaoUniverseAudit.audit()
  readonly benchRecord:    BenchmarkRunRecord;       // DaoUniverseBenchmark.runQuick()
  readonly runtimeHealth:  number;                   // = benchRecord.healthAfter
}

export interface DiagnosticSnapshot {
  readonly timestamp:        number;
  readonly totalDiagnoses:   number;
  readonly lastDiagnosisAt:  number | null;
  readonly lastAuditScore:   number | undefined;    // auditReport.overallScore
  readonly lastBenchHealth:  number | undefined;    // benchRecord.healthAfter
}
```

### 类

```typescript
export class DaoUniverseDiagnostic {
  private readonly _history: DiagnosticRecord[] = [];

  constructor(
    private readonly _audit: DaoUniverseAudit,
    private readonly _benchmark: DaoUniverseBenchmark,
  )

  // 核心 — audit + benchmark.runQuick() 并行执行（Promise.all）
  async diagnose(): Promise<DiagnosticRecord>

  // 报告：text / json / markdown
  generateReport(record: DiagnosticRecord, format?: 'text' | 'json' | 'markdown'): string

  history(): ReadonlyArray<DiagnosticRecord>
  clearHistory(): void
  snapshot(): DiagnosticSnapshot

  get audit(): DaoUniverseAudit
  get benchmark(): DaoUniverseBenchmark
}
```

### diagnose() 实现要点

```typescript
async diagnose(): Promise<DiagnosticRecord> {
  const [auditReport, benchRecord] = await Promise.all([
    this._audit.audit(),
    this._benchmark.runQuick(),
  ]);
  const record: DiagnosticRecord = {
    timestamp:     Date.now(),
    auditReport,
    benchRecord,
    runtimeHealth: benchRecord.healthAfter,
  };
  this._history.push(record);
  return record;
}
```

### generateReport() 实现要点

- `'json'`    → `JSON.stringify(record, null, 2)`
- `'markdown'` → `audit.reporter.generateMarkdown(record.auditReport)` +
                  benchmark runner 的报告（`benchmark.generateReport('markdown')`）合并
- `'text'`    → 单行摘要（auditScore + benchHealth + runtimeHealth）

---

## 测试分组（~30 个）

| 分组 | 数量 | 内容 |
|------|------|------|
| 构建 | 5 | create / audit getter / benchmark getter / snapshot defaults / history empty |
| diagnose | 6 | 返回 DiagnosticRecord / auditReport 存在 / benchRecord 存在 / runtimeHealth=benchRecord.healthAfter / history 增长 / 不抛出 |
| history | 3 | 初始空 / diagnose 后长度=1 / clearHistory 后为空 |
| generateReport | 4 | text 非空 / json 含 timestamp / markdown 含审查报告标题 / 三格式均返回字符串 |
| snapshot | 5 | totalDiagnoses=0 / lastDiagnosisAt=null / lastAuditScore=undefined / diagnose 后 totalDiagnoses=1 / historySize 一致 |
| E2E | 7 | full stack / 并行执行两报告均非空 / multiple diagnoses / clearHistory 重置 / generateReport 非空 / lastAuditScore ≥ 0 / lastBenchHealth ≥ 0 |

```
jest.setTimeout(60_000)  // audit(FS) + benchmark 并行，预留足够时间
```

helper:
```typescript
const PROJECT_ROOT = path.resolve(__dirname, '../../../../../');

function makeStack() {
  const universe = new DaoUniverse();
  const monitor  = new DaoUniverseMonitor(universe);
  const audit    = new DaoUniverseAudit(universe, PROJECT_ROOT);
  const bench    = new DaoUniverseBenchmark(monitor);
  const diag     = new DaoUniverseDiagnostic(audit, bench);
  return { universe, monitor, audit, bench, diag };
}
```

---

## 执行步骤

1. 创建 `retrospectives/2026-04-16-daomind-v2.23.0.md`（v2.23.0 复盘）
2. 创建 `packages/daoCollective/src/universe-diagnostic.ts`
3. 创建 `packages/daoCollective/src/__tests__/universe-diagnostic.test.ts`（~30 tests）
4. append exports 到 `packages/daoCollective/src/index.ts`
5. 更新 `src/App.tsx`：877→907, v2.23.0→v2.24.0
6. `npx jest --no-coverage` → 907 tests, 49 suites, all pass
7. `pnpm -r run build` → 所有包 Done
8. `git add -A && git commit -m "feat(diagnostic): v2.24.0 — ..."` + tag v2.24.0 + push origin

## 验证

- 全量测试：**907 tests**, **49 suites**, 0 failed
- `pnpm -r run build`：所有包 Done（无 error）
- `git log --oneline -3`：feat(diagnostic) commit 在顶
- `git tag | grep v2.24` → `v2.24.0`
