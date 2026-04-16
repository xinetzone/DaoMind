/** universe-health-board.test.ts — DaoUniverseHealthBoard 健康仪表盘测试
 *
 * 分组（30 个测试）：
 *   构建     (4) — constructor / facade getter / 两实例独立 / 初始状态
 *   check    (6) — 返回 HealthEntry 形状 / timestamp / monitorScore 类型 /
 *                  qiNodes 类型 / history 增长 / 二次 check
 *   trend    (5) — unknown（<2条）/ unknown（1条）/ stable（两次相同）/
 *                  improving（持续上升）/ degrading（持续下降）
 *   snapshot (5) — 形状 / totalChecks=0 / lastCheckAt null / trend / latestScore
 *   clearHistory (3) — 清空后 history.length=0 / snapshot.totalChecks=0 / trend=unknown
 *   E2E      (7) — check×3 趋势分析 / qi节点反映 / apps running反映 /
 *                  两个board共享facade / clearHistory后继续check / snapshot完整性 / facade操作后check
 */

import * as path from 'path';
import { DaoUniverseFacade } from '../universe-facade';
import { DaoUniverseHealthBoard } from '../universe-health-board';
import type { HealthEntry, HealthBoardSnapshot } from '../universe-health-board';

jest.setTimeout(30_000);

const PROJECT_ROOT = path.resolve(__dirname, '../../../../../');

// ────────────────────────────────────────────────────────────────────────────
// 构建（4）
// ────────────────────────────────────────────────────────────────────────────

describe('构建', () => {
  test('constructor() 正常创建', () => {
    const facade = new DaoUniverseFacade(PROJECT_ROOT);
    const board  = new DaoUniverseHealthBoard(facade);
    expect(board).toBeInstanceOf(DaoUniverseHealthBoard);
  });

  test('facade getter 返回传入的 DaoUniverseFacade', () => {
    const facade = new DaoUniverseFacade(PROJECT_ROOT);
    const board  = new DaoUniverseHealthBoard(facade);
    expect(board.facade).toBe(facade);
  });

  test('两个 board 实例相互独立（history 不共享）', () => {
    const facade = new DaoUniverseFacade(PROJECT_ROOT);
    const a = new DaoUniverseHealthBoard(facade);
    const b = new DaoUniverseHealthBoard(facade);
    a.check();
    expect(a.history().length).toBe(1);
    expect(b.history().length).toBe(0);
  });

  test('初始状态：history 为空数组', () => {
    const board = new DaoUniverseHealthBoard(new DaoUniverseFacade(PROJECT_ROOT));
    expect(board.history()).toHaveLength(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// check（6）
// ────────────────────────────────────────────────────────────────────────────

describe('check', () => {
  let facade: DaoUniverseFacade;
  let board:  DaoUniverseHealthBoard;

  beforeEach(() => {
    facade = new DaoUniverseFacade(PROJECT_ROOT);
    board  = new DaoUniverseHealthBoard(facade);
  });

  test('返回含 5 个字段的 HealthEntry', () => {
    const entry = board.check();
    expect(entry).toHaveProperty('timestamp');
    expect(entry).toHaveProperty('monitorScore');
    expect(entry).toHaveProperty('qiNodes');
    expect(entry).toHaveProperty('appsRunning');
    expect(entry).toHaveProperty('benchRuns');
    expect(entry).toHaveProperty('diagCount');
  });

  test('timestamp 合理（±5s）', () => {
    const entry = board.check();
    expect(entry.timestamp).toBeGreaterThan(Date.now() - 5_000);
    expect(entry.timestamp).toBeLessThanOrEqual(Date.now() + 1_000);
  });

  test('monitorScore 为 number 类型', () => {
    const entry = board.check();
    expect(typeof entry.monitorScore).toBe('number');
  });

  test('qiNodes 为非负整数', () => {
    const entry = board.check();
    expect(typeof entry.qiNodes).toBe('number');
    expect(entry.qiNodes).toBeGreaterThanOrEqual(0);
  });

  test('check() 使 history().length += 1', () => {
    expect(board.history()).toHaveLength(0);
    board.check();
    expect(board.history()).toHaveLength(1);
    board.check();
    expect(board.history()).toHaveLength(2);
  });

  test('二次 check() 返回新的独立 HealthEntry', () => {
    const e1 = board.check();
    const e2 = board.check();
    expect(e1).not.toBe(e2);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// trend（5）
// ────────────────────────────────────────────────────────────────────────────

describe('trend', () => {
  test('零历史记录 → unknown', () => {
    const board = new DaoUniverseHealthBoard(new DaoUniverseFacade(PROJECT_ROOT));
    expect(board.trend()).toBe('unknown');
  });

  test('仅 1 条记录 → unknown', () => {
    const board = new DaoUniverseHealthBoard(new DaoUniverseFacade(PROJECT_ROOT));
    board.check();
    expect(board.trend()).toBe('unknown');
  });

  test('两次相同 monitorScore → stable', () => {
    const facade = new DaoUniverseFacade(PROJECT_ROOT);
    const board  = new DaoUniverseHealthBoard(facade);
    // 手动注入相同分数的历史条目（绕过 facade.snapshot()）
    const t = Date.now();
    (board as unknown as { _history: HealthEntry[] })._history.push(
      { timestamp: t,     monitorScore: 50, qiNodes: 0, appsRunning: 0, benchRuns: 0, diagCount: 0 },
      { timestamp: t + 1, monitorScore: 50, qiNodes: 0, appsRunning: 0, benchRuns: 0, diagCount: 0 },
    );
    expect(board.trend()).toBe('stable');
  });

  test('持续上升（每步 > TREND_THRESHOLD）→ improving', () => {
    const board = new DaoUniverseHealthBoard(new DaoUniverseFacade(PROJECT_ROOT));
    const t = Date.now();
    (board as unknown as { _history: HealthEntry[] })._history.push(
      { timestamp: t,     monitorScore: 10, qiNodes: 0, appsRunning: 0, benchRuns: 0, diagCount: 0 },
      { timestamp: t + 1, monitorScore: 20, qiNodes: 0, appsRunning: 0, benchRuns: 0, diagCount: 0 },
      { timestamp: t + 2, monitorScore: 30, qiNodes: 0, appsRunning: 0, benchRuns: 0, diagCount: 0 },
    );
    expect(board.trend()).toBe('improving');
  });

  test('持续下降（每步 < -TREND_THRESHOLD）→ degrading', () => {
    const board = new DaoUniverseHealthBoard(new DaoUniverseFacade(PROJECT_ROOT));
    const t = Date.now();
    (board as unknown as { _history: HealthEntry[] })._history.push(
      { timestamp: t,     monitorScore: 80, qiNodes: 0, appsRunning: 0, benchRuns: 0, diagCount: 0 },
      { timestamp: t + 1, monitorScore: 60, qiNodes: 0, appsRunning: 0, benchRuns: 0, diagCount: 0 },
      { timestamp: t + 2, monitorScore: 40, qiNodes: 0, appsRunning: 0, benchRuns: 0, diagCount: 0 },
    );
    expect(board.trend()).toBe('degrading');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// snapshot（5）
// ────────────────────────────────────────────────────────────────────────────

describe('snapshot', () => {
  test('返回含 6 个字段的 HealthBoardSnapshot', () => {
    const board = new DaoUniverseHealthBoard(new DaoUniverseFacade(PROJECT_ROOT));
    const snap: HealthBoardSnapshot = board.snapshot();
    expect(snap).toHaveProperty('timestamp');
    expect(snap).toHaveProperty('totalChecks');
    expect(snap).toHaveProperty('lastCheckAt');
    expect(snap).toHaveProperty('trend');
    expect(snap).toHaveProperty('latestScore');
    expect(snap).toHaveProperty('historySize');
  });

  test('零状态：totalChecks = 0, historySize = 0', () => {
    const board = new DaoUniverseHealthBoard(new DaoUniverseFacade(PROJECT_ROOT));
    const snap  = board.snapshot();
    expect(snap.totalChecks).toBe(0);
    expect(snap.historySize).toBe(0);
  });

  test('零状态：lastCheckAt = null, latestScore = undefined', () => {
    const board = new DaoUniverseHealthBoard(new DaoUniverseFacade(PROJECT_ROOT));
    const snap  = board.snapshot();
    expect(snap.lastCheckAt).toBeNull();
    expect(snap.latestScore).toBeUndefined();
  });

  test('零状态：trend = unknown', () => {
    const board = new DaoUniverseHealthBoard(new DaoUniverseFacade(PROJECT_ROOT));
    expect(board.snapshot().trend).toBe('unknown');
  });

  test('check() 后：totalChecks = 1, lastCheckAt 非 null, latestScore 有值', () => {
    const board = new DaoUniverseHealthBoard(new DaoUniverseFacade(PROJECT_ROOT));
    board.check();
    const snap = board.snapshot();
    expect(snap.totalChecks).toBe(1);
    expect(snap.lastCheckAt).not.toBeNull();
    expect(snap.latestScore).toBeDefined();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// clearHistory（3）
// ────────────────────────────────────────────────────────────────────────────

describe('clearHistory', () => {
  test('clearHistory() 后 history().length = 0', () => {
    const board = new DaoUniverseHealthBoard(new DaoUniverseFacade(PROJECT_ROOT));
    board.check();
    board.check();
    board.clearHistory();
    expect(board.history()).toHaveLength(0);
  });

  test('clearHistory() 后 snapshot.totalChecks = 0', () => {
    const board = new DaoUniverseHealthBoard(new DaoUniverseFacade(PROJECT_ROOT));
    board.check();
    board.clearHistory();
    expect(board.snapshot().totalChecks).toBe(0);
  });

  test('clearHistory() 后 trend() = unknown', () => {
    const board = new DaoUniverseHealthBoard(new DaoUniverseFacade(PROJECT_ROOT));
    board.check();
    board.check();
    board.clearHistory();
    expect(board.trend()).toBe('unknown');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// E2E（7）
// ────────────────────────────────────────────────────────────────────────────

describe('E2E', () => {
  test('check×3 后 history 包含 3 条 HealthEntry', () => {
    const board = new DaoUniverseHealthBoard(new DaoUniverseFacade(PROJECT_ROOT));
    board.check();
    board.check();
    board.check();
    expect(board.history()).toHaveLength(3);
  });

  test('qi.addNode 后 check() 的 qiNodes 增加', () => {
    const facade = new DaoUniverseFacade(PROJECT_ROOT);
    const board  = new DaoUniverseHealthBoard(facade);
    const before = board.check().qiNodes;
    facade.qi.addNode('e2e-health-node');
    const after = board.check().qiNodes;
    expect(after).toBe(before + 1);
    facade.qi.removeNode('e2e-health-node');
  });

  test('两个 board 共享同一 facade，check() 各自独立追加 history', () => {
    const facade = new DaoUniverseFacade(PROJECT_ROOT);
    const a = new DaoUniverseHealthBoard(facade);
    const b = new DaoUniverseHealthBoard(facade);
    a.check();
    a.check();
    b.check();
    expect(a.history()).toHaveLength(2);
    expect(b.history()).toHaveLength(1);
  });

  test('clearHistory 后继续 check()，history 从 0 重新增长', () => {
    const board = new DaoUniverseHealthBoard(new DaoUniverseFacade(PROJECT_ROOT));
    board.check();
    board.check();
    board.clearHistory();
    board.check();
    expect(board.history()).toHaveLength(1);
  });

  test('snapshot.totalChecks 与 history().length 一致', () => {
    const board = new DaoUniverseHealthBoard(new DaoUniverseFacade(PROJECT_ROOT));
    for (let i = 0; i < 4; i++) board.check();
    const snap = board.snapshot();
    expect(snap.totalChecks).toBe(board.history().length);
    expect(snap.historySize).toBe(board.history().length);
  });

  test('snapshot.latestScore 等于最后一次 check() 的 monitorScore', () => {
    const board = new DaoUniverseHealthBoard(new DaoUniverseFacade(PROJECT_ROOT));
    board.check();
    const last = board.check();
    expect(board.snapshot().latestScore).toBe(last.monitorScore);
  });

  test('benchmark.runQuick() 后 check() 的 benchRuns 增加', async () => {
    const facade = new DaoUniverseFacade(PROJECT_ROOT);
    const board  = new DaoUniverseHealthBoard(facade);
    const before = board.check().benchRuns;
    await facade.benchmark.runQuick();
    const after = board.check().benchRuns;
    expect(after).toBeGreaterThan(before);
  }, 30_000);
});
