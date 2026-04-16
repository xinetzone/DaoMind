/**
 * DaoUniverseDiagnostic 测试套件
 * "知人者智，自知者明"（德经·三十三章）
 * "曲则全，枉则直，洼则盈，弊则新"（道经·二十二章）
 *
 * 验证：构建 / diagnose / history / generateReport / snapshot / E2E
 *
 * 注意：diagnose() 并行运行 audit()（FS 扫描）+ benchmark.runQuick()（3 套件），
 *       每次调用约 5–15 秒，使用较长全局 timeout。
 */

import path from 'node:path';
import { daoNothingVoid } from '@daomind/nothing';
import { DaoUniverse } from '../universe';
import { DaoUniverseMonitor } from '../universe-monitor';
import { DaoUniverseAudit } from '../universe-audit';
import { DaoUniverseBenchmark } from '../universe-benchmark';
import { DaoUniverseDiagnostic } from '../universe-diagnostic';

// 项目根目录（tests 运行于 /workspace/thread）
const PROJECT_ROOT = path.resolve(__dirname, '../../../../../');

jest.setTimeout(60_000);

// ── helpers ──────────────────────────────────────────────────────────────────

function makeStack() {
  const universe = new DaoUniverse();
  const monitor  = new DaoUniverseMonitor(universe);
  const audit    = new DaoUniverseAudit(universe, PROJECT_ROOT);
  const bench    = new DaoUniverseBenchmark(monitor);
  const diag     = new DaoUniverseDiagnostic(audit, bench);
  return { universe, monitor, audit, bench, diag };
}

// ── setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  daoNothingVoid.void();
});

// ── 1. 构建 ───────────────────────────────────────────────────────────────────

describe('构建', () => {
  test('可构建 DaoUniverseDiagnostic', () => {
    const { diag } = makeStack();
    expect(diag).toBeDefined();
  });

  test('audit getter 返回关联的 DaoUniverseAudit', () => {
    const { diag, audit } = makeStack();
    expect(diag.audit).toBe(audit);
  });

  test('benchmark getter 返回关联的 DaoUniverseBenchmark', () => {
    const { diag, bench } = makeStack();
    expect(diag.benchmark).toBe(bench);
  });

  test('snapshot() 初始：totalDiagnoses=0、lastDiagnosisAt=null', () => {
    const { diag } = makeStack();
    const snap = diag.snapshot();
    expect(snap.totalDiagnoses).toBe(0);
    expect(snap.lastDiagnosisAt).toBeNull();
  });

  test('snapshot() 初始：lastAuditScore=undefined、lastBenchHealth=undefined', () => {
    const { diag } = makeStack();
    const snap = diag.snapshot();
    expect(snap.lastAuditScore).toBeUndefined();
    expect(snap.lastBenchHealth).toBeUndefined();
    expect(snap.historySize).toBe(0);
  });
});

// ── 2. history（不依赖 diagnose，直接操作 history 的幂等性）──────────────────

describe('history', () => {
  test('初始 history() 为空数组', () => {
    const { diag } = makeStack();
    expect(diag.history()).toHaveLength(0);
  });

  test('clearHistory() 对空 history 幂等', () => {
    const { diag } = makeStack();
    expect(() => diag.clearHistory()).not.toThrow();
    expect(diag.history()).toHaveLength(0);
  });

  test('history() 返回只读数组（类型兼容）', () => {
    const { diag } = makeStack();
    const h = diag.history();
    expect(Array.isArray(h)).toBe(true);
  });
});

// ── 3. diagnose ───────────────────────────────────────────────────────────────

describe('diagnose', () => {
  let cachedRecord: Awaited<ReturnType<DaoUniverseDiagnostic['diagnose']>> | null = null;
  let cachedDiag: DaoUniverseDiagnostic | null = null;

  // 只调用一次 diagnose，所有 diagnose 测试共用同一结果（节省时间）
  beforeAll(async () => {
    const { diag } = makeStack();
    cachedDiag   = diag;
    cachedRecord = await diag.diagnose();
  });

  test('返回 DiagnosticRecord（非 null）', () => {
    expect(cachedRecord).not.toBeNull();
    expect(cachedRecord).toBeDefined();
  });

  test('DiagnosticRecord.auditReport 存在且有 overallScore', () => {
    expect(cachedRecord!.auditReport).toBeDefined();
    expect(typeof cachedRecord!.auditReport.overallScore).toBe('number');
  });

  test('DiagnosticRecord.benchRecord 存在且有 report', () => {
    expect(cachedRecord!.benchRecord).toBeDefined();
    expect(cachedRecord!.benchRecord.report).toBeDefined();
  });

  test('runtimeHealth = benchRecord.healthAfter', () => {
    expect(cachedRecord!.runtimeHealth).toBe(cachedRecord!.benchRecord.healthAfter);
  });

  test('diagnose() 后 history 长度增加到 1', () => {
    expect(cachedDiag!.history()).toHaveLength(1);
  });

  test('diagnose() 不抛出异常', async () => {
    const { diag } = makeStack();
    await expect(diag.diagnose()).resolves.toBeDefined();
  });
});

// ── 4. generateReport ─────────────────────────────────────────────────────────

describe('generateReport', () => {
  let record: Awaited<ReturnType<DaoUniverseDiagnostic['diagnose']>>;
  let diag: DaoUniverseDiagnostic;

  beforeAll(async () => {
    const stack = makeStack();
    diag   = stack.diag;
    record = await diag.diagnose();
  });

  test('text 格式返回非空字符串', () => {
    const r = diag.generateReport(record, 'text');
    expect(typeof r).toBe('string');
    expect(r.length).toBeGreaterThan(0);
  });

  test('text 格式包含 "哲学得分"', () => {
    const r = diag.generateReport(record, 'text');
    expect(r).toContain('哲学得分');
  });

  test('json 格式包含 timestamp 字段', () => {
    const r = diag.generateReport(record, 'json');
    const parsed = JSON.parse(r);
    expect(parsed.timestamp).toBeDefined();
  });

  test('markdown 格式包含 "道宇宙综合诊断报告"', () => {
    const r = diag.generateReport(record, 'markdown');
    expect(r).toContain('道宇宙综合诊断报告');
  });

  test('默认 format=text 时不抛出', () => {
    expect(() => diag.generateReport(record)).not.toThrow();
  });
});

// ── 5. snapshot ───────────────────────────────────────────────────────────────

describe('snapshot', () => {
  test('初始 snapshot：totalDiagnoses=0', () => {
    const { diag } = makeStack();
    expect(diag.snapshot().totalDiagnoses).toBe(0);
  });

  test('初始 snapshot：historySize=0', () => {
    const { diag } = makeStack();
    expect(diag.snapshot().historySize).toBe(0);
  });

  test('diagnose 后 snapshot.totalDiagnoses=1', async () => {
    const { diag } = makeStack();
    await diag.diagnose();
    expect(diag.snapshot().totalDiagnoses).toBe(1);
  });

  test('diagnose 后 snapshot.lastAuditScore 为数字', async () => {
    const { diag } = makeStack();
    await diag.diagnose();
    const snap = diag.snapshot();
    expect(typeof snap.lastAuditScore).toBe('number');
    expect(snap.lastAuditScore).toBeGreaterThanOrEqual(0);
    expect(snap.lastAuditScore).toBeLessThanOrEqual(100);
  });

  test('diagnose 后 snapshot.lastBenchHealth 为数字', async () => {
    const { diag } = makeStack();
    await diag.diagnose();
    expect(typeof diag.snapshot().lastBenchHealth).toBe('number');
  });
});

// ── 6. E2E ────────────────────────────────────────────────────────────────────

describe('E2E', () => {
  test('完整栈：diag.audit 关联的 DaoUniverseAudit.universe 为 DaoUniverse 实例', () => {
    const { diag, universe } = makeStack();
    expect(diag.audit.universe).toBe(universe);
  });

  test('两轴并行：auditReport 与 benchRecord 均非 null', async () => {
    const { diag } = makeStack();
    const rec = await diag.diagnose();
    expect(rec.auditReport).not.toBeNull();
    expect(rec.benchRecord).not.toBeNull();
  });

  test('auditReport.results 数组非空（至少 1 项检验）', async () => {
    const { diag } = makeStack();
    const rec = await diag.diagnose();
    expect(rec.auditReport.results.length).toBeGreaterThan(0);
  });

  test('clearHistory 后 history 为空，再次 diagnose 可重新累积', async () => {
    const { diag } = makeStack();
    await diag.diagnose();
    expect(diag.history()).toHaveLength(1);
    diag.clearHistory();
    expect(diag.history()).toHaveLength(0);
    await diag.diagnose();
    expect(diag.history()).toHaveLength(1);
  });

  test('generateReport markdown 包含哲学审查的 philosophyDepth 维度', async () => {
    const { diag } = makeStack();
    const rec = await diag.diagnose();
    const md = diag.generateReport(rec, 'markdown');
    expect(md).toContain('本体论一致性');
    expect(md).toContain('性能基准结果');
  });

  test('benchRecord.report.benchmarks 数组长度 ≥ 3（runQuick 跑 3 套件）', async () => {
    const { diag } = makeStack();
    const rec = await diag.diagnose();
    expect(rec.benchRecord.report.benchmarks.length).toBeGreaterThanOrEqual(3);
  });

  test('snapshot.lastAuditScore = history[0].auditReport.overallScore', async () => {
    const { diag } = makeStack();
    await diag.diagnose();
    const snap = diag.snapshot();
    const rec  = diag.history()[0]!;
    expect(snap.lastAuditScore).toBe(rec.auditReport.overallScore);
  });
});
