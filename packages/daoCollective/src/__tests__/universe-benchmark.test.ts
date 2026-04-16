/**
 * DaoUniverseBenchmark 测试套件
 * "为学日益，为道日损"（德经·四十八章）
 * "知人者智，自知者明"（德经·三十三章）
 *
 * 验证：构建 / runSuite / runQuick / history / generateReport / snapshot / E2E
 */

import { daoNothingVoid } from '@daomind/nothing';
import { DaoUniverse } from '../universe';
import { DaoUniverseMonitor } from '../universe-monitor';
import { DaoUniverseBenchmark } from '../universe-benchmark';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeStack() {
  const universe = new DaoUniverse();
  const monitor  = new DaoUniverseMonitor(universe);
  const bench    = new DaoUniverseBenchmark(monitor);
  return { universe, monitor, bench };
}

// ── setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  daoNothingVoid.void();
});

// ── 1. 构建 ───────────────────────────────────────────────────────────────────

describe('构建', () => {
  test('可构建 DaoUniverseBenchmark', () => {
    const { bench } = makeStack();
    expect(bench).toBeDefined();
  });

  test('monitor getter 返回关联的 DaoUniverseMonitor', () => {
    const { bench, monitor } = makeStack();
    expect(bench.monitor).toBe(monitor);
  });

  test('runner getter 已初始化（DaoBenchmarkRunner）', () => {
    const { bench } = makeStack();
    expect(bench.runner).toBeDefined();
    expect(typeof bench.runner.daoRunQuick).toBe('function');
  });

  test('snapshot() 初始：totalRuns=0、lastRunAt=null、lastHealth=undefined', () => {
    const { bench } = makeStack();
    const snap = bench.snapshot();
    expect(snap.totalRuns).toBe(0);
    expect(snap.lastRunAt).toBeNull();
    expect(snap.lastHealth).toBeUndefined();
    expect(snap.historySize).toBe(0);
  });

  test('history() 初始为空数组', () => {
    const { bench } = makeStack();
    expect(bench.history()).toHaveLength(0);
  });
});

// ── 2. runSuite ───────────────────────────────────────────────────────────────

describe('runSuite', () => {
  test('消息吞吐量测试 — 返回 DaoBenchmarkResult', async () => {
    const { bench } = makeStack();
    const result = await bench.runSuite('消息吞吐量测试');
    expect(result).toBeDefined();
    expect(result.suiteName).toBe('消息吞吐量测试');
  });

  test('消息吞吐量测试 — metrics 非空', async () => {
    const { bench } = makeStack();
    const result = await bench.runSuite('消息吞吐量测试');
    expect(result.metrics.length).toBeGreaterThan(0);
  });

  test('内存占用测试 — 返回有效 DaoBenchmarkResult', async () => {
    const { bench } = makeStack();
    const result = await bench.runSuite('内存占用测试');
    expect(result.suiteName).toBe('内存占用测试');
    expect(result.timestamp).toBeGreaterThan(0);
  });

  test('未知套件 — 抛出含套件名的错误', async () => {
    const { bench } = makeStack();
    await expect(bench.runSuite('不存在的套件')).rejects.toThrow(/未知测试套件/);
  });
});

// ── 3. runQuick ───────────────────────────────────────────────────────────────

describe('runQuick', () => {
  test('返回 BenchmarkRunRecord', async () => {
    const { bench } = makeStack();
    const record = await bench.runQuick();
    expect(record).toBeDefined();
    expect(record.report).toBeDefined();
    expect(record.timestamp).toBeGreaterThan(0);
  });

  test('healthBefore 是非负数', async () => {
    const { bench } = makeStack();
    const record = await bench.runQuick();
    expect(typeof record.healthBefore).toBe('number');
    expect(record.healthBefore).toBeGreaterThanOrEqual(0);
  });

  test('healthAfter 是非负数', async () => {
    const { bench } = makeStack();
    const record = await bench.runQuick();
    expect(typeof record.healthAfter).toBe('number');
    expect(record.healthAfter).toBeGreaterThanOrEqual(0);
  });

  test('report.benchmarks 非空', async () => {
    const { bench } = makeStack();
    const record = await bench.runQuick();
    expect(record.report.benchmarks.length).toBeGreaterThan(0);
  });

  test('runQuick 后 history 长度 = 1', async () => {
    const { bench } = makeStack();
    await bench.runQuick();
    expect(bench.history()).toHaveLength(1);
  }, 30000);
});

// ── 4. history ────────────────────────────────────────────────────────────────

describe('history', () => {
  test('初始 history() 为空', () => {
    const { bench } = makeStack();
    expect(bench.history()).toHaveLength(0);
  });

  test('runQuick 后 history() 长度 = 1，记录与返回值一致', async () => {
    const { bench } = makeStack();
    const record = await bench.runQuick();
    const hist = bench.history();
    expect(hist).toHaveLength(1);
    expect(hist[0]).toBe(record);
  }, 30000);

  test('clearHistory() 后 history() 为空', async () => {
    const { bench } = makeStack();
    await bench.runQuick();
    bench.clearHistory();
    expect(bench.history()).toHaveLength(0);
  }, 30000);
});

// ── 5. generateReport ─────────────────────────────────────────────────────────

describe('generateReport', () => {
  test('runSuite 后 text 格式报告为字符串', async () => {
    const { bench } = makeStack();
    await bench.runSuite('消息吞吐量测试');
    const report = bench.generateReport('text');
    expect(typeof report).toBe('string');
  });

  test('runSuite 后 json 格式报告为字符串', async () => {
    const { bench } = makeStack();
    await bench.runSuite('消息吞吐量测试');
    const report = bench.generateReport('json');
    expect(typeof report).toBe('string');
  });

  test('runSuite 后 markdown 格式报告为字符串', async () => {
    const { bench } = makeStack();
    await bench.runSuite('消息吞吐量测试');
    const report = bench.generateReport('markdown');
    expect(typeof report).toBe('string');
  });
});

// ── 6. snapshot ───────────────────────────────────────────────────────────────

describe('snapshot', () => {
  test('初始 snapshot：totalRuns=0、historySize=0', () => {
    const { bench } = makeStack();
    const snap = bench.snapshot();
    expect(snap.totalRuns).toBe(0);
    expect(snap.historySize).toBe(0);
  });

  test('初始 snapshot：lastRunAt=null', () => {
    const { bench } = makeStack();
    expect(bench.snapshot().lastRunAt).toBeNull();
  });

  test('runQuick 后 totalRuns=1', async () => {
    const { bench } = makeStack();
    await bench.runQuick();
    expect(bench.snapshot().totalRuns).toBe(1);
  }, 30000);

  test('runQuick 后 lastRunAt 为正整数时间戳', async () => {
    const { bench } = makeStack();
    const before = Date.now();
    await bench.runQuick();
    const snap = bench.snapshot();
    expect(snap.lastRunAt).toBeGreaterThanOrEqual(before);
  }, 30000);

  test('runQuick 后 lastHealth 为数字', async () => {
    const { bench } = makeStack();
    await bench.runQuick();
    const snap = bench.snapshot();
    expect(typeof snap.lastHealth).toBe('number');
  }, 30000);
});

// ── 7. E2E ────────────────────────────────────────────────────────────────────

describe('E2E', () => {
  test('完整栈构建：bench.monitor 指向正确的 DaoUniverseMonitor', () => {
    const { bench, monitor } = makeStack();
    expect(bench.monitor).toBe(monitor);
    expect(bench.snapshot().totalRuns).toBe(0);
  });

  test('runQuick — health 关联（healthBefore/After 均为数字）', async () => {
    const { bench } = makeStack();
    const record = await bench.runQuick();
    expect(typeof record.healthBefore).toBe('number');
    expect(typeof record.healthAfter).toBe('number');
  }, 30000);

  test('多次 runSuite 后 history 不增长（runSuite 不计入 history）', async () => {
    const { bench } = makeStack();
    await bench.runSuite('消息吞吐量测试');
    await bench.runSuite('内存占用测试');
    expect(bench.history()).toHaveLength(0);
  });

  test('clearHistory 后重新 runQuick 可再次累积', async () => {
    const { bench } = makeStack();
    await bench.runQuick();
    bench.clearHistory();
    await bench.runQuick();
    expect(bench.history()).toHaveLength(1);
  }, 60000);

  test('generateReport 在 runSuite 后返回非空字符串', async () => {
    const { bench } = makeStack();
    await bench.runSuite('消息吞吐量测试');
    const report = bench.generateReport();
    expect(report.length).toBeGreaterThan(0);
  });
});
