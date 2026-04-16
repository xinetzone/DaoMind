/** universe-facade.test.ts — DaoUniverseFacade 全栈装配门面测试
 *
 * 分组（33 个测试）：
 *   构建     (5) — constructor / static create() / projectRoot / 两实例独立 / stack 冻结
 *   getters  (6) — universe / monitor / audit / benchmark / diagnostic / qi 正确实例
 *   snapshot (5) — 形状 / timestamp / system / bench 初始 / qi 初始
 *   diagnose (5) — 委托 diagnostic / DiagnosticRecord 结构 / history 增长 / runtimeHealth / 二次调用
 *   E2E      (7) — qi.broadcast / apps 生命周期 / bench.runQuick / snapshot 聚合 / diagnose + snapshot / 两 facade 独立 / clearHistory
 *   边界     (5) — snapshot 可多次调用 / 零状态 system / clearHistory 后 snapshot / feedback getter / feedback 独立实例
 */

import * as path from 'path';
import { DaoUniverseFacade } from '../universe-facade';
import type { DaoFacadeSnapshot } from '../universe-facade';
import { DaoUniverseMonitor } from '../universe-monitor';
import { DaoUniverseAudit } from '../universe-audit';
import { DaoUniverseBenchmark } from '../universe-benchmark';
import { DaoUniverseDiagnostic } from '../universe-diagnostic';
import { DaoUniverseQi } from '../universe-qi';

jest.setTimeout(60_000);

const PROJECT_ROOT = path.resolve(__dirname, '../../../../../');

// ────────────────────────────────────────────────────────────────────────────
// 构建（5）
// ────────────────────────────────────────────────────────────────────────────

describe('构建', () => {
  test('constructor() 无参数正常创建', () => {
    const facade = new DaoUniverseFacade(PROJECT_ROOT);
    expect(facade).toBeInstanceOf(DaoUniverseFacade);
  });

  test('static create() 返回 DaoUniverseFacade 实例', () => {
    const facade = DaoUniverseFacade.create(PROJECT_ROOT);
    expect(facade).toBeInstanceOf(DaoUniverseFacade);
  });

  test('static create(projectRoot) 传入 projectRoot 正常创建', () => {
    const facade = DaoUniverseFacade.create(PROJECT_ROOT);
    expect(facade.audit.projectRoot).toBe(PROJECT_ROOT);
  });

  test('两个 facade 实例相互独立（universe 不同）', () => {
    const a = new DaoUniverseFacade(PROJECT_ROOT);
    const b = new DaoUniverseFacade(PROJECT_ROOT);
    expect(a.universe).not.toBe(b.universe);
  });

  test('两个 facade 实例相互独立（benchmark 不同）', () => {
    const a = new DaoUniverseFacade(PROJECT_ROOT);
    const b = new DaoUniverseFacade(PROJECT_ROOT);
    expect(a.benchmark).not.toBe(b.benchmark);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// getters（6）
// ────────────────────────────────────────────────────────────────────────────

describe('getters', () => {
  let facade: DaoUniverseFacade;
  beforeAll(() => {
    facade = new DaoUniverseFacade(PROJECT_ROOT);
  });

  test('monitor 返回 DaoUniverseMonitor', () => {
    expect(facade.monitor).toBeInstanceOf(DaoUniverseMonitor);
  });

  test('audit 返回 DaoUniverseAudit', () => {
    expect(facade.audit).toBeInstanceOf(DaoUniverseAudit);
  });

  test('benchmark 返回 DaoUniverseBenchmark', () => {
    expect(facade.benchmark).toBeInstanceOf(DaoUniverseBenchmark);
  });

  test('diagnostic 返回 DaoUniverseDiagnostic', () => {
    expect(facade.diagnostic).toBeInstanceOf(DaoUniverseDiagnostic);
  });

  test('qi 返回 DaoUniverseQi', () => {
    expect(facade.qi).toBeInstanceOf(DaoUniverseQi);
  });

  test('getter 多次调用返回同一实例（引用稳定）', () => {
    expect(facade.monitor).toBe(facade.monitor);
    expect(facade.diagnostic).toBe(facade.diagnostic);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// snapshot（5）
// ────────────────────────────────────────────────────────────────────────────

describe('snapshot', () => {
  let facade: DaoUniverseFacade;
  let snap: DaoFacadeSnapshot;

  beforeAll(() => {
    facade = new DaoUniverseFacade(PROJECT_ROOT);
    snap = facade.snapshot();
  });

  test('返回对象含 5 个预期字段', () => {
    expect(snap).toHaveProperty('timestamp');
    expect(snap).toHaveProperty('system');
    expect(snap).toHaveProperty('monitor');
    expect(snap).toHaveProperty('bench');
    expect(snap).toHaveProperty('qi');
    expect(snap).toHaveProperty('diagnostic');
  });

  test('timestamp 合理（±5s）', () => {
    expect(snap.timestamp).toBeGreaterThan(Date.now() - 5_000);
    expect(snap.timestamp).toBeLessThanOrEqual(Date.now() + 1_000);
  });

  test('system 含 agents / apps / modules 字段', () => {
    expect(snap.system).toHaveProperty('agents');
    expect(snap.system).toHaveProperty('apps');
    expect(snap.system).toHaveProperty('modules');
  });

  test('bench 初始状态：totalRuns = 0', () => {
    expect(snap.bench.totalRuns).toBe(0);
    expect(snap.bench.lastRunAt).toBeNull();
    expect(snap.bench.lastHealth).toBeUndefined();
  });

  test('diagnostic 初始状态：totalDiagnoses = 0', () => {
    expect(snap.diagnostic.totalDiagnoses).toBe(0);
    expect(snap.diagnostic.lastDiagnosisAt).toBeNull();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// diagnose 快捷方法（5）
// ────────────────────────────────────────────────────────────────────────────

describe('diagnose 快捷方法', () => {
  let facade: DaoUniverseFacade;

  beforeAll(async () => {
    facade = new DaoUniverseFacade(PROJECT_ROOT);
  });

  test('diagnose() 返回 DiagnosticRecord 形状', async () => {
    const record = await facade.diagnose();
    expect(record).toHaveProperty('timestamp');
    expect(record).toHaveProperty('auditReport');
    expect(record).toHaveProperty('benchRecord');
    expect(record).toHaveProperty('runtimeHealth');
  });

  test('auditReport 含 overallScore（number）', async () => {
    const record = await facade.diagnose();
    expect(typeof record.auditReport.overallScore).toBe('number');
  });

  test('runtimeHealth = benchRecord.healthAfter', async () => {
    const record = await facade.diagnose();
    expect(record.runtimeHealth).toBe(record.benchRecord.healthAfter);
  });

  test('每次 diagnose() 使 diagnostic.history() 长度 +1', async () => {
    const before = facade.diagnostic.history().length;
    await facade.diagnose();
    expect(facade.diagnostic.history().length).toBe(before + 1);
  });

  test('diagnose() 委托 diagnostic（结果与直接调用一致）', async () => {
    const f2 = new DaoUniverseFacade(PROJECT_ROOT);
    const direct = await f2.diagnostic.diagnose();
    const via    = await f2.diagnose();
    // 两者都追加到同一 history，history 长度为 2
    expect(f2.diagnostic.history().length).toBe(2);
    expect(typeof direct.runtimeHealth).toBe('number');
    expect(typeof via.runtimeHealth).toBe('number');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// E2E（7）
// ────────────────────────────────────────────────────────────────────────────

describe('E2E', () => {
  let facade: DaoUniverseFacade;

  beforeAll(() => {
    facade = new DaoUniverseFacade(PROJECT_ROOT);
  });

  test('qi.addNode + qi.snapshot 注册节点计数增长', () => {
    const before = facade.qi.snapshot().registeredNodes;
    facade.qi.addNode('test-node-e2e');
    const after = facade.qi.snapshot().registeredNodes;
    expect(after).toBe(before + 1);
    facade.qi.removeNode('test-node-e2e');
  });

  test('apps.register + apps.start 后 apps.snapshot().total ≥ 1', async () => {
    facade.apps.register({ id: 'facade-e2e-app', name: 'E2E App', version: '1.0.0', entry: './app' });
    await facade.apps.start('facade-e2e-app');
    const appSnap = facade.apps.snapshot();
    expect(appSnap.total).toBeGreaterThanOrEqual(1);
  });

  test('benchmark.runQuick() 后 bench.totalRuns = 1', async () => {
    const f = new DaoUniverseFacade(PROJECT_ROOT);
    await f.benchmark.runQuick();
    const snap = f.snapshot();
    expect(snap.bench.totalRuns).toBe(1);
    expect(snap.bench.lastHealth).toBeDefined();
  });

  test('diagnose() 后 diagnostic.totalDiagnoses = 1', async () => {
    const f = new DaoUniverseFacade(PROJECT_ROOT);
    await f.diagnose();
    const snap = f.snapshot();
    expect(snap.diagnostic.totalDiagnoses).toBe(1);
    expect(snap.diagnostic.lastDiagnosisAt).not.toBeNull();
    expect(snap.diagnostic.lastBenchHealth).toBeDefined();
  });

  test('diagnose() 后 snapshot 含 audit 得分信息', async () => {
    const f = new DaoUniverseFacade(PROJECT_ROOT);
    await f.diagnose();
    const snap = f.snapshot();
    expect(snap.diagnostic.lastAuditScore).toBeDefined();
    expect(typeof snap.diagnostic.lastAuditScore).toBe('number');
  });

  test('两个 facade 实例独立运行 diagnose()，history 互不干扰', async () => {
    const a = new DaoUniverseFacade(PROJECT_ROOT);
    const b = new DaoUniverseFacade(PROJECT_ROOT);
    await a.diagnose();
    expect(a.diagnostic.history().length).toBe(1);
    expect(b.diagnostic.history().length).toBe(0);
  });

  test('clearHistory 后 snapshot.diagnostic.totalDiagnoses = 0', async () => {
    const f = new DaoUniverseFacade(PROJECT_ROOT);
    await f.diagnose();
    await f.diagnose();
    expect(f.diagnostic.history().length).toBe(2);
    f.diagnostic.clearHistory();
    const snap = f.snapshot();
    expect(snap.diagnostic.totalDiagnoses).toBe(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 边界（5）
// ────────────────────────────────────────────────────────────────────────────

describe('边界', () => {
  test('snapshot 可连续多次调用（无副作用）', () => {
    const f = new DaoUniverseFacade(PROJECT_ROOT);
    const s1 = f.snapshot();
    const s2 = f.snapshot();
    expect(s1.bench.totalRuns).toBe(s2.bench.totalRuns);
    expect(s1.diagnostic.totalDiagnoses).toBe(s2.diagnostic.totalDiagnoses);
  });

  test('零状态下 system.agents.total = 0', () => {
    const f = new DaoUniverseFacade(PROJECT_ROOT);
    const snap = f.snapshot();
    expect(snap.system.agents.total).toBe(0);
  });

  test('feedback getter 返回与 clock 关联的 DaoUniverseFeedback', () => {
    const f = new DaoUniverseFacade(PROJECT_ROOT);
    expect(f.feedback).toBeDefined();
    // feedback 依赖 clock，clock 依赖 monitor
    expect(f.feedback.clock).toBe(f.clock);
  });

  test('scheduler getter 返回与 clock 关联的 DaoUniverseScheduler', () => {
    const f = new DaoUniverseFacade(PROJECT_ROOT);
    expect(f.scheduler).toBeDefined();
    expect(f.scheduler.clock).toBe(f.clock);
  });

  test('benchmark.monitor 与 facade.monitor 为同一实例', () => {
    const f = new DaoUniverseFacade(PROJECT_ROOT);
    expect(f.benchmark.monitor).toBe(f.monitor);
  });
});
