/**
 * DaoUniverseAudit 测试套件
 * "知人者智，自知者明"（乙本·三十三章）
 *
 * 验证：构建 / audit() / auditCategory() / snapshot() / 再导出 / E2E
 *
 * 注意：audit() 会实际读取项目源码文件，使用较长 timeout
 */

import path from 'node:path';
import { daoNothingVoid } from '@daomind/nothing';
import { DaoUniverse } from '../universe';
import { DaoUniverseMonitor } from '../universe-monitor';
import { DaoUniverseAudit } from '../universe-audit';

// 项目根目录（tests 运行于 /workspace/thread）
const PROJECT_ROOT = path.resolve(__dirname, '../../../../../');

jest.setTimeout(30_000);

// ── helpers ──────────────────────────────────────────────────────────────────

function makeAudit(root = PROJECT_ROOT) {
  const universe = new DaoUniverse();
  const audit    = new DaoUniverseAudit(universe, root);
  return { universe, audit };
}

// ── setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  daoNothingVoid.void();
});

// ── 1. 构建 ───────────────────────────────────────────────────────────────────

describe('构建', () => {
  test('可构建 DaoUniverseAudit', () => {
    const { audit } = makeAudit();
    expect(audit).toBeDefined();
  });

  test('reporter getter 返回 DaoVerificationReporter 实例', () => {
    const { audit } = makeAudit();
    expect(audit.reporter).toBeDefined();
    expect(typeof audit.reporter.runAllChecks).toBe('function');
  });

  test('projectRoot getter 返回传入的根目录', () => {
    const { audit } = makeAudit();
    expect(audit.projectRoot).toBe(PROJECT_ROOT);
  });

  test('universe getter 返回关联的 DaoUniverse', () => {
    const { universe, audit } = makeAudit();
    expect(audit.universe).toBe(universe);
  });

  test('默认 projectRoot = process.cwd()', () => {
    const universe = new DaoUniverse();
    const audit = new DaoUniverseAudit(universe);
    expect(audit.projectRoot).toBe(process.cwd());
  });
});

// ── 2. audit() ────────────────────────────────────────────────────────────────

describe('audit()', () => {
  test('返回 DaoVerificationReport', async () => {
    const { audit } = makeAudit();
    const report = await audit.audit();
    expect(report).toBeDefined();
  });

  test('overallScore 在 [0, 100] 范围内', async () => {
    const { audit } = makeAudit();
    const report = await audit.audit();
    expect(report.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.overallScore).toBeLessThanOrEqual(100);
  });

  test('results 数组非空', async () => {
    const { audit } = makeAudit();
    const report = await audit.audit();
    expect(report.results.length).toBeGreaterThan(0);
  });

  test('passedCount + failedCount = results.length', async () => {
    const { audit } = makeAudit();
    const report = await audit.audit();
    expect(report.passedCount + report.failedCount).toBe(report.results.length);
  });

  test('philosophyDepth 含有效字段', async () => {
    const { audit } = makeAudit();
    const report = await audit.audit();
    const d = report.philosophyDepth;
    expect(typeof d.ontologyScore).toBe('number');
    expect(typeof d.weightedTotal).toBe('number');
    expect(d.weightedTotal).toBeGreaterThanOrEqual(0);
    expect(d.weightedTotal).toBeLessThanOrEqual(100);
  });
});

// ── 3. auditCategory() ────────────────────────────────────────────────────────

describe('auditCategory()', () => {
  test('naming-convention 类别返回合法报告', async () => {
    const { audit } = makeAudit();
    const report = await audit.auditCategory('naming-convention');
    expect(report.results.length).toBeGreaterThan(0);
    expect(report.results[0]?.category).toBe('naming-convention');
  });

  test('wu-you-balance 类别可执行', async () => {
    const { audit } = makeAudit();
    const report = await audit.auditCategory('wu-you-balance');
    expect(report.overallScore).toBeGreaterThanOrEqual(0);
  });

  test('yin-yang-balance 类别可执行', async () => {
    const { audit } = makeAudit();
    const report = await audit.auditCategory('yin-yang-balance');
    expect(report.results.length).toBeGreaterThan(0);
  });

  test('未知类别不崩溃（overall 降级）', async () => {
    const { audit } = makeAudit();
    // 传入 'overall' → runAllChecks
    const report = await audit.auditCategory('overall');
    expect(report).toBeDefined();
    expect(report.results.length).toBeGreaterThan(0);
  });
});

// ── 4. snapshot() ─────────────────────────────────────────────────────────────

describe('snapshot()', () => {
  test('无 monitor → runtimeHealth = undefined', async () => {
    const { audit } = makeAudit();
    const snap = await audit.snapshot();
    expect(snap.runtimeHealth).toBeUndefined();
  });

  test('有 monitor → runtimeHealth 为 number', async () => {
    const universe = new DaoUniverse();
    const monitor  = new DaoUniverseMonitor(universe);
    const audit    = new DaoUniverseAudit(universe, PROJECT_ROOT);
    const snap = await audit.snapshot(monitor);
    expect(typeof snap.runtimeHealth).toBe('number');
  });

  test('runtimeHealth 在 [0, 100] 范围内', async () => {
    const universe = new DaoUniverse();
    const monitor  = new DaoUniverseMonitor(universe);
    const audit    = new DaoUniverseAudit(universe, PROJECT_ROOT);
    const snap = await audit.snapshot(monitor);
    expect(snap.runtimeHealth!).toBeGreaterThanOrEqual(0);
    expect(snap.runtimeHealth!).toBeLessThanOrEqual(100);
  });

  test('timestamp 为合理的时间戳', async () => {
    const { audit } = makeAudit();
    const before = Date.now();
    const snap = await audit.snapshot();
    const after = Date.now();
    expect(snap.timestamp).toBeGreaterThanOrEqual(before);
    expect(snap.timestamp).toBeLessThanOrEqual(after);
  });

  test('snapshot.report 结构完整', async () => {
    const { audit } = makeAudit();
    const snap = await audit.snapshot();
    expect(snap.report.results).toBeDefined();
    expect(typeof snap.report.overallScore).toBe('number');
    expect(snap.report.philosophyDepth).toBeDefined();
  });
});

// ── 5. DaoVerificationReport 结构 ─────────────────────────────────────────────

describe('DaoVerificationReport 结构', () => {
  test('每个 result 含 name / category / passed / score / details', async () => {
    const { audit } = makeAudit();
    const report = await audit.audit();
    for (const r of report.results) {
      expect(typeof r.name).toBe('string');
      expect(typeof r.category).toBe('string');
      expect(typeof r.passed).toBe('boolean');
      expect(typeof r.score).toBe('number');
      expect(typeof r.details).toBe('string');
    }
  });

  test('warnings 是数组', async () => {
    const { audit } = makeAudit();
    const report = await audit.audit();
    expect(Array.isArray(report.warnings)).toBe(true);
  });

  test('generatedAt 为正整数', async () => {
    const { audit } = makeAudit();
    const report = await audit.audit();
    expect(report.generatedAt).toBeGreaterThan(0);
  });
});

// ── 6. 再导出 ─────────────────────────────────────────────────────────────────

describe('再导出', () => {
  test('DaoUniverseAudit 可从 @daomind/collective 导入', async () => {
    const { DaoUniverseAudit: A } = await import('../index');
    expect(A).toBeDefined();
    expect(typeof A).toBe('function');
  });

  test('DaoVerificationReporter 可从 @daomind/collective 导入', async () => {
    const { DaoVerificationReporter: R } = await import('../index');
    expect(R).toBeDefined();
  });

  test('DAO_VERIFICATION_CATEGORY_LABELS 可从 @daomind/collective 导入', async () => {
    const { DAO_VERIFICATION_CATEGORY_LABELS } = await import('../index');
    expect(DAO_VERIFICATION_CATEGORY_LABELS).toBeDefined();
    expect(DAO_VERIFICATION_CATEGORY_LABELS['naming-convention']).toBe('命名规范');
  });
});

// ── 7. E2E ────────────────────────────────────────────────────────────────────

describe('E2E', () => {
  test('Universe → Audit 全栈 audit() 正常工作', async () => {
    const { audit } = makeAudit();
    const report = await audit.audit();
    expect(report.results.length).toBeGreaterThan(0);
    expect(report.overallScore).toBeGreaterThan(0);
  });

  test('Universe → Monitor → Audit snapshot 综合快照', async () => {
    const universe = new DaoUniverse();
    const monitor  = new DaoUniverseMonitor(universe);
    const audit    = new DaoUniverseAudit(universe, PROJECT_ROOT);
    const snap = await audit.snapshot(monitor);
    expect(snap.report.overallScore).toBeGreaterThan(0);
    expect(snap.runtimeHealth).toBeDefined();
    expect(snap.timestamp).toBeGreaterThan(0);
  });

  test('连续 audit() 结果稳定（overallScore 不大幅波动）', async () => {
    const { audit } = makeAudit();
    const [r1, r2] = await Promise.all([audit.audit(), audit.audit()]);
    expect(Math.abs(r1.overallScore - r2.overallScore)).toBeLessThanOrEqual(5);
  });
});
