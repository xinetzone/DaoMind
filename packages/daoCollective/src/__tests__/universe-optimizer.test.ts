/** universe-optimizer.test.ts — DaoUniverseOptimizer 优化建议引擎测试
 *
 * 分组（29 个测试 → 全套 1000 tests 里程碑）：
 *   构建     (4) — constructor / board getter / history 初始为空 / 两实例独立
 *   analyze  (6) — 返回 OptimizationReport 形状 / timestamp / sampleCount /
 *                  averageScore 计算 / 空 board 返回 info / recommendations 非空
 *   recommend(3) — 等于 analyze().recommendations / 空 board → info /
 *                  degrading → critical
 *   snapshot (4) — 形状 / totalAnalyses=0 / lastAnalysisAt null /
 *                  analyze 后更新
 *   history  (3) — analyze 后增长 / clearHistory 清空 / clearHistory 后继续
 *   E2E      (9) — full chain / degrading 触发 critical / 平均分低触发 warn /
 *                  qiNodes=0 info / diagCount=0 info / 稳定无 critical /
 *                  两 optimizer 同一 board / clearHistory 后重新分析 /
 *                  recommend() 是 analyze() 快捷方式
 */

import * as path from 'path';
import { DaoUniverseFacade }      from '../universe-facade';
import { DaoUniverseHealthBoard } from '../universe-health-board';
import type { HealthEntry }        from '../universe-health-board';
import { DaoUniverseOptimizer }   from '../universe-optimizer';
import type { OptimizationReport, OptimizerSnapshot } from '../universe-optimizer';

jest.setTimeout(30_000);

const PROJECT_ROOT = path.resolve(__dirname, '../../../../../');

/** 快速构建完整链 */
function makeChain() {
  const facade    = new DaoUniverseFacade(PROJECT_ROOT);
  const board     = new DaoUniverseHealthBoard(facade);
  const optimizer = new DaoUniverseOptimizer(board);
  return { facade, board, optimizer };
}

/** 向 board._history 注入 HealthEntry，用于精确控制 monitorScore 序列 */
function injectEntries(board: DaoUniverseHealthBoard, scores: number[]): void {
  const hist = (board as unknown as { _history: HealthEntry[] })._history;
  const t = Date.now();
  for (let i = 0; i < scores.length; i++) {
    hist.push({
      timestamp:    t + i,
      monitorScore: scores[i]!,
      qiNodes:      1,
      appsRunning:  0,
      benchRuns:    0,
      diagCount:    1,
    });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 构建（4）
// ────────────────────────────────────────────────────────────────────────────

describe('构建', () => {
  test('constructor() 正常创建', () => {
    const { optimizer } = makeChain();
    expect(optimizer).toBeInstanceOf(DaoUniverseOptimizer);
  });

  test('board getter 返回传入的 DaoUniverseHealthBoard', () => {
    const { board, optimizer } = makeChain();
    expect(optimizer.board).toBe(board);
  });

  test('初始状态：history 为空数组', () => {
    const { optimizer } = makeChain();
    expect(optimizer.history()).toHaveLength(0);
  });

  test('两个 optimizer 实例相互独立（history 不共享）', () => {
    const { facade, board } = makeChain();
    board.check();
    const a = new DaoUniverseOptimizer(board);
    const b = new DaoUniverseOptimizer(board);
    a.analyze();
    expect(a.history()).toHaveLength(1);
    expect(b.history()).toHaveLength(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// analyze（6）
// ────────────────────────────────────────────────────────────────────────────

describe('analyze', () => {
  test('返回含 8 个字段的 OptimizationReport', () => {
    const { board, optimizer } = makeChain();
    board.check();
    const report: OptimizationReport = optimizer.analyze();
    expect(report).toHaveProperty('timestamp');
    expect(report).toHaveProperty('trend');
    expect(report).toHaveProperty('sampleCount');
    expect(report).toHaveProperty('averageScore');
    expect(report).toHaveProperty('minScore');
    expect(report).toHaveProperty('maxScore');
    expect(report).toHaveProperty('scoreRange');
    expect(report).toHaveProperty('recommendations');
  });

  test('timestamp 合理（±5s）', () => {
    const { board, optimizer } = makeChain();
    board.check();
    const report = optimizer.analyze();
    expect(report.timestamp).toBeGreaterThan(Date.now() - 5_000);
    expect(report.timestamp).toBeLessThanOrEqual(Date.now() + 1_000);
  });

  test('sampleCount === board.history().length', () => {
    const { board, optimizer } = makeChain();
    board.check();
    board.check();
    board.check();
    const report = optimizer.analyze();
    expect(report.sampleCount).toBe(3);
  });

  test('averageScore 为 number 且与 sampleCount 一致', () => {
    const { board, optimizer } = makeChain();
    injectEntries(board, [40, 60]);
    const report = optimizer.analyze();
    expect(typeof report.averageScore).toBe('number');
    expect(report.averageScore).toBeCloseTo(50, 1);
  });

  test('空 board：sampleCount=0 / averageScore=0 / recommendations 含 info', () => {
    const { optimizer } = makeChain();
    const report = optimizer.analyze();
    expect(report.sampleCount).toBe(0);
    expect(report.averageScore).toBe(0);
    expect(report.recommendations.length).toBeGreaterThanOrEqual(1);
    expect(report.recommendations[0]!.level).toBe('info');
  });

  test('recommendations 至少含 1 条', () => {
    const { board, optimizer } = makeChain();
    board.check();
    const report = optimizer.analyze();
    expect(report.recommendations.length).toBeGreaterThanOrEqual(1);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// recommend（3）
// ────────────────────────────────────────────────────────────────────────────

describe('recommend', () => {
  test('空 board → recommend() 返回 info 建议', () => {
    const { optimizer } = makeChain();
    const recs = optimizer.recommend();
    expect(recs.length).toBeGreaterThanOrEqual(1);
    expect(recs[0]!.level).toBe('info');
  });

  test('degrading 趋势 → recommend() 含 critical 建议', () => {
    const { board, optimizer } = makeChain();
    injectEntries(board, [80, 60, 40]);   // 持续下降 > TREND_THRESHOLD
    const recs = optimizer.recommend();
    const hasCritical = recs.some(r => r.level === 'critical');
    expect(hasCritical).toBe(true);
  });

  test('recommend() 每次调用都追加 history', () => {
    const { board, optimizer } = makeChain();
    board.check();
    optimizer.recommend();
    optimizer.recommend();
    expect(optimizer.history()).toHaveLength(2);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// snapshot（4）
// ────────────────────────────────────────────────────────────────────────────

describe('snapshot', () => {
  test('返回含 5 个字段的 OptimizerSnapshot', () => {
    const { optimizer } = makeChain();
    const snap: OptimizerSnapshot = optimizer.snapshot();
    expect(snap).toHaveProperty('timestamp');
    expect(snap).toHaveProperty('totalAnalyses');
    expect(snap).toHaveProperty('lastAnalysisAt');
    expect(snap).toHaveProperty('lastTrend');
    expect(snap).toHaveProperty('historySize');
  });

  test('初始状态：totalAnalyses=0, historySize=0', () => {
    const { optimizer } = makeChain();
    const snap = optimizer.snapshot();
    expect(snap.totalAnalyses).toBe(0);
    expect(snap.historySize).toBe(0);
  });

  test('初始状态：lastAnalysisAt=null, lastTrend=undefined', () => {
    const { optimizer } = makeChain();
    const snap = optimizer.snapshot();
    expect(snap.lastAnalysisAt).toBeNull();
    expect(snap.lastTrend).toBeUndefined();
  });

  test('analyze() 后：totalAnalyses=1, lastAnalysisAt 非 null', () => {
    const { board, optimizer } = makeChain();
    board.check();
    optimizer.analyze();
    const snap = optimizer.snapshot();
    expect(snap.totalAnalyses).toBe(1);
    expect(snap.lastAnalysisAt).not.toBeNull();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// history（3）
// ────────────────────────────────────────────────────────────────────────────

describe('history', () => {
  test('每次 analyze() 使 history 增长 1', () => {
    const { board, optimizer } = makeChain();
    board.check();
    expect(optimizer.history()).toHaveLength(0);
    optimizer.analyze();
    expect(optimizer.history()).toHaveLength(1);
    optimizer.analyze();
    expect(optimizer.history()).toHaveLength(2);
  });

  test('clearHistory() 后 history().length = 0', () => {
    const { board, optimizer } = makeChain();
    board.check();
    optimizer.analyze();
    optimizer.analyze();
    optimizer.clearHistory();
    expect(optimizer.history()).toHaveLength(0);
  });

  test('clearHistory() 后继续 analyze()，history 从 0 重新增长', () => {
    const { board, optimizer } = makeChain();
    board.check();
    optimizer.analyze();
    optimizer.clearHistory();
    optimizer.analyze();
    expect(optimizer.history()).toHaveLength(1);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// E2E（9）
// ────────────────────────────────────────────────────────────────────────────

describe('E2E', () => {
  test('完整链：facade → board.check() → optimizer.analyze() 正常工作', () => {
    const { board, optimizer } = makeChain();
    board.check();
    board.check();
    const report = optimizer.analyze();
    expect(report.sampleCount).toBe(2);
    expect(report.trend).not.toBe(undefined);
  });

  test('degrading 趋势触发 critical 建议', () => {
    const { board, optimizer } = makeChain();
    injectEntries(board, [80, 60, 40]);
    const report = optimizer.analyze();
    const hasCritical = report.recommendations.some(r => r.level === 'critical');
    expect(hasCritical).toBe(true);
  });

  test('平均分 < 30 触发 warn（area=monitor）', () => {
    const { board, optimizer } = makeChain();
    injectEntries(board, [10, 15, 20]);
    const report = optimizer.analyze();
    const hasWarn = report.recommendations.some(r => r.level === 'warn' && r.area === 'monitor');
    expect(hasWarn).toBe(true);
  });

  test('qiNodes = 0 触发 info（area=qi）', () => {
    const facade = new DaoUniverseFacade(PROJECT_ROOT);
    const board  = new DaoUniverseHealthBoard(facade);
    const optimizer = new DaoUniverseOptimizer(board);
    // 注入 qiNodes=0 条目
    const hist = (board as unknown as { _history: HealthEntry[] })._history;
    hist.push({ timestamp: Date.now(), monitorScore: 50, qiNodes: 0, appsRunning: 0, benchRuns: 1, diagCount: 1 });
    const report = optimizer.analyze();
    const hasQiInfo = report.recommendations.some(r => r.area === 'qi');
    expect(hasQiInfo).toBe(true);
  });

  test('diagCount = 0 触发 info（area=diag）', () => {
    const facade = new DaoUniverseFacade(PROJECT_ROOT);
    const board  = new DaoUniverseHealthBoard(facade);
    const optimizer = new DaoUniverseOptimizer(board);
    const hist = (board as unknown as { _history: HealthEntry[] })._history;
    hist.push({ timestamp: Date.now(), monitorScore: 50, qiNodes: 1, appsRunning: 0, benchRuns: 1, diagCount: 0 });
    const report = optimizer.analyze();
    const hasDiagInfo = report.recommendations.some(r => r.area === 'diag');
    expect(hasDiagInfo).toBe(true);
  });

  test('稳定良好状态：无 critical 建议', () => {
    const { board, optimizer } = makeChain();
    // 注入良好且稳定的分数
    injectEntries(board, [60, 62, 61]);
    const report = optimizer.analyze();
    const hasCritical = report.recommendations.some(r => r.level === 'critical');
    expect(hasCritical).toBe(false);
  });

  test('两个 optimizer 在同一 board 上各自独立追加 history', () => {
    const { board } = makeChain();
    board.check();
    const a = new DaoUniverseOptimizer(board);
    const b = new DaoUniverseOptimizer(board);
    a.analyze();
    a.analyze();
    b.analyze();
    expect(a.history()).toHaveLength(2);
    expect(b.history()).toHaveLength(1);
  });

  test('clearHistory 后重新分析，snapshot.totalAnalyses 从 0 开始', () => {
    const { board, optimizer } = makeChain();
    board.check();
    optimizer.analyze();
    optimizer.analyze();
    optimizer.clearHistory();
    optimizer.analyze();
    expect(optimizer.snapshot().totalAnalyses).toBe(1);
  });

  test('recommend() 返回与 analyze().recommendations 相同内容', () => {
    const { board, optimizer } = makeChain();
    injectEntries(board, [50, 55]);
    const a = new DaoUniverseOptimizer(board);
    const b = new DaoUniverseOptimizer(board);
    const fromRecommend = a.recommend();
    const fromAnalyze   = b.analyze().recommendations;
    // 相同长度、相同 level/area/message
    expect(fromRecommend.length).toBe(fromAnalyze.length);
    for (let i = 0; i < fromRecommend.length; i++) {
      expect(fromRecommend[i]!.level).toBe(fromAnalyze[i]!.level);
      expect(fromRecommend[i]!.area).toBe(fromAnalyze[i]!.area);
    }
  });
});
