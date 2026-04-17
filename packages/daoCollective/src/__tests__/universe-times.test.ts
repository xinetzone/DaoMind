/**
 * DaoUniverseTimes 测试套件
 * "曲则全，枉则直，洼则盈，弊则新"（道经·二十二章）
 *
 * 验证：构建 / setInterval / setTimeout / clearTimer / clearAllForApp /
 *       scheduleTask-cancelTask / window 工具 / E2E
 */

import { daoNothingVoid } from '@daomind/nothing';
import { DaoUniverse } from '../universe';
import { DaoUniverseMonitor } from '../universe-monitor';
import { DaoUniverseAgents } from '../universe-agents';
import { DaoUniverseApps } from '../universe-apps';
import { DaoUniverseTimes } from '../universe-times';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeStack() {
  const universe = new DaoUniverse();
  const monitor  = new DaoUniverseMonitor(universe);
  const agents   = new DaoUniverseAgents(monitor);
  const apps     = new DaoUniverseApps(agents);
  const times    = new DaoUniverseTimes(apps);
  return { universe, monitor, agents, apps, times };
}

function sampleApp(id: string) {
  return { id, name: `${id}-app`, version: '1.0.0', entry: `./${id}` };
}

// ── setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  daoNothingVoid.void();
});

// ── 1. 构建 ───────────────────────────────────────────────────────────────────

describe('构建', () => {
  test('可构建 DaoUniverseTimes', () => {
    const { times } = makeStack();
    expect(times).toBeDefined();
  });

  test('apps getter 返回传入的 DaoUniverseApps', () => {
    const { apps, times } = makeStack();
    expect(times.apps).toBe(apps);
  });

  test('timer/scheduler getter 已初始化', () => {
    const { times } = makeStack();
    expect(times.timer).toBeDefined();
    expect(times.scheduler).toBeDefined();
  });

  test('初始 snapshot 全零', () => {
    const { times } = makeStack();
    const snap = times.snapshot();
    expect(snap.totalTimers).toBe(0);
    expect(snap.pendingTasks).toBe(0);
    expect(Object.keys(snap.byApp)).toHaveLength(0);
  });
});

// ── 2. setInterval ────────────────────────────────────────────────────────────

describe('setInterval()', () => {
  test('返回 DaoTimerHandle（Symbol）', () => {
    const { times } = makeStack();
    const h = times.setInterval('app1', () => {}, { interval: 100 });
    expect(typeof h).toBe('symbol');
    times.clearTimer(h);
  });

  test('snapshot.totalTimers 递增', () => {
    const { times } = makeStack();
    const h1 = times.setInterval('app1', () => {}, { interval: 100 });
    const h2 = times.setInterval('app1', () => {}, { interval: 200 });
    expect(times.snapshot().totalTimers).toBe(2);
    times.clearTimer(h1);
    times.clearTimer(h2);
  });

  test('byApp 记录 appId 对应 timers 数量', () => {
    const { times } = makeStack();
    const h = times.setInterval('my-app', () => {}, { interval: 100 });
    expect(times.snapshot().byApp['my-app']?.timers).toBe(1);
    times.clearTimer(h);
  });

  test('immediate=true 立即触发回调一次', async () => {
    const { times } = makeStack();
    let count = 0;
    const h = times.setInterval('app1', () => count++, { interval: 1000, immediate: true });
    // immediate 触发是同步的
    expect(count).toBe(1);
    times.clearTimer(h);
  });

  test('maxFires 限制触发次数', async () => {
    const { times } = makeStack();
    let count = 0;
    times.setInterval('app1', () => count++, { interval: 10, maxFires: 2, immediate: true });
    // immediate 已触发一次
    expect(count).toBe(1);
    // Wait for more fires
    await new Promise(r => setTimeout(r, 50));
    expect(count).toBe(2); // 最多 2 次
  });
});

// ── 3. setTimeout ─────────────────────────────────────────────────────────────

describe('setTimeout()', () => {
  test('返回 DaoTimerHandle（Symbol）', () => {
    const { times } = makeStack();
    const h = times.setTimeout('app2', () => {}, 10000);
    expect(typeof h).toBe('symbol');
    times.clearTimer(h);
  });

  test('snapshot.totalTimers 包含 timeout 句柄', () => {
    const { times } = makeStack();
    const h = times.setTimeout('app2', () => {}, 10000);
    expect(times.snapshot().totalTimers).toBe(1);
    times.clearTimer(h);
  });

  test('delay=0 后回调执行', async () => {
    const { times } = makeStack();
    let fired = false;
    times.setTimeout('app2', () => { fired = true; }, 0);
    await new Promise(r => setTimeout(r, 20));
    expect(fired).toBe(true);
    // timer auto-removed from internal map after firing
  });

  test('byApp 记录 timeout 对应 timers 数量', () => {
    const { times } = makeStack();
    const h = times.setTimeout('t-app', () => {}, 10000);
    expect(times.snapshot().byApp['t-app']?.timers).toBe(1);
    times.clearTimer(h);
  });
});

// ── 4. clearTimer ─────────────────────────────────────────────────────────────

describe('clearTimer()', () => {
  test('清除 interval 后 totalTimers 减少', () => {
    const { times } = makeStack();
    const h = times.setInterval('app3', () => {}, { interval: 100 });
    expect(times.snapshot().totalTimers).toBe(1);
    times.clearTimer(h);
    expect(times.snapshot().totalTimers).toBe(0);
  });

  test('清除 timeout 后 totalTimers 减少', () => {
    const { times } = makeStack();
    const h = times.setTimeout('app3', () => {}, 10000);
    expect(times.snapshot().totalTimers).toBe(1);
    times.clearTimer(h);
    expect(times.snapshot().totalTimers).toBe(0);
  });

  test('重复 clearTimer 不抛出（幂等）', () => {
    const { times } = makeStack();
    const h = times.setInterval('app3', () => {}, { interval: 100 });
    times.clearTimer(h);
    expect(() => times.clearTimer(h)).not.toThrow();
    expect(times.snapshot().totalTimers).toBe(0);
  });
});

// ── 5. clearAllForApp ─────────────────────────────────────────────────────────

describe('clearAllForApp()', () => {
  test('清除该 app 全部 timers，返回正确数量', () => {
    const { times } = makeStack();
    times.setInterval('a1', () => {}, { interval: 100 });
    times.setTimeout('a1', () => {}, 10000);
    expect(times.clearAllForApp('a1')).toBe(2);
    expect(times.snapshot().totalTimers).toBe(0);
  });

  test('不影响其他 app 的 timers', () => {
    const { times } = makeStack();
    const h1 = times.setInterval('a1', () => {}, { interval: 100 });
    times.setInterval('a2', () => {}, { interval: 100 });
    times.clearAllForApp('a1');
    expect(times.snapshot().totalTimers).toBe(1);
    expect(times.snapshot().byApp['a2']?.timers).toBe(1);
    times.clearTimer(h1); // won't throw even if already cleared
    times.clearAllForApp('a2'); // cleanup: prevent open handle leak
  });

  test('同时清除 tasks', () => {
    const { times } = makeStack();
    times.scheduleTask('a1', { executeAt: Date.now() + 10000, handler: () => 1, priority: 1 });
    times.scheduleTask('a1', { executeAt: Date.now() + 20000, handler: () => 2, priority: 1 });
    expect(times.clearAllForApp('a1')).toBe(2);
    expect(times.snapshot().byApp['a1']?.tasks).toBeUndefined();
  });

  test('appId 不存在时返回 0', () => {
    const { times } = makeStack();
    expect(times.clearAllForApp('ghost-app')).toBe(0);
  });
});

// ── 6. scheduleTask / cancelTask ──────────────────────────────────────────────

describe('scheduleTask() / cancelTask()', () => {
  test('scheduleTask 返回 taskId（字符串）', () => {
    const { times } = makeStack();
    const id = times.scheduleTask('app4', { executeAt: Date.now() + 1000, handler: () => 42, priority: 1 });
    expect(typeof id).toBe('string');
    times.cancelTask(id);
  });

  test('to-期任务使 pendingTasks 递增', () => {
    const { times } = makeStack();
    const now = Date.now();
    times.scheduleTask('app4', { executeAt: now - 100, handler: () => 1, priority: 1 });
    expect(times.snapshot().pendingTasks).toBe(1);
  });

  test('cancelTask 返回 true，任务从 byApp 消失', () => {
    const { times } = makeStack();
    const id = times.scheduleTask('app4', { executeAt: Date.now() + 10000, handler: () => 1, priority: 1 });
    expect(times.cancelTask(id)).toBe(true);
    expect(times.snapshot().byApp['app4']?.tasks).toBeUndefined();
  });

  test('cancelTask 不存在 id 返回 false', () => {
    const { times } = makeStack();
    expect(times.cancelTask('no-such-task')).toBe(false);
  });

  test('byApp 记录 appId 对应 tasks 数量', () => {
    const { times } = makeStack();
    const id1 = times.scheduleTask('app4', { executeAt: Date.now() + 10000, handler: () => 1, priority: 1 });
    const id2 = times.scheduleTask('app4', { executeAt: Date.now() + 20000, handler: () => 2, priority: 1 });
    expect(times.snapshot().byApp['app4']?.tasks).toBe(2);
    times.cancelTask(id1);
    times.cancelTask(id2);
  });
});

// ── 7. window 工具 ────────────────────────────────────────────────────────────

describe('window 工具', () => {
  test('window(duration) 返回有效 DaoTimeWindow', () => {
    const { times } = makeStack();
    const before = Date.now();
    const win = times.window(5000);
    expect(win.duration).toBe(5000);
    expect(win.start).toBeGreaterThanOrEqual(before);
    expect(win.end).toBe(win.start + win.duration);
  });

  test('windowContains：ts 在窗口内返回 true', () => {
    const { times } = makeStack();
    const win = times.window(10000);
    expect(times.windowContains(win, Date.now())).toBe(true);
  });

  test('windowContains：ts 在窗口外返回 false', () => {
    const { times } = makeStack();
    const win = times.window(10000);
    expect(times.windowContains(win, win.end + 1)).toBe(false);
  });

  test('windowOverlaps：重叠返回 true，不重叠返回 false', () => {
    const { times } = makeStack();
    const now = Date.now();
    const a = { start: now,        end: now + 1000, duration: 1000 };
    const b = { start: now + 500,  end: now + 1500, duration: 1000 };
    const c = { start: now + 2000, end: now + 3000, duration: 1000 };
    expect(times.windowOverlaps(a, b)).toBe(true);
    expect(times.windowOverlaps(a, c)).toBe(false);
  });
});

// ── 8. E2E ────────────────────────────────────────────────────────────────────

describe('E2E', () => {
  test('多应用 timer 互不干扰', () => {
    const { times } = makeStack();
    times.setInterval('app-a', () => {}, { interval: 100 });
    times.setInterval('app-a', () => {}, { interval: 200 });
    times.setTimeout('app-b', () => {}, 10000);
    const snap = times.snapshot();
    expect(snap.totalTimers).toBe(3);
    expect(snap.byApp['app-a']?.timers).toBe(2);
    expect(snap.byApp['app-b']?.timers).toBe(1);
    times.clearAllForApp('app-a');
    times.clearAllForApp('app-b');
  });

  test('DaoUniverseTimes 可从 @daomind/collective 导入', async () => {
    const { DaoUniverseTimes: T } = await import('../index');
    expect(T).toBeDefined();
    expect(typeof T).toBe('function');
  });

  test('clearAllForApp 结合 app start/stop 完整清理', async () => {
    const { apps, times } = makeStack();
    apps.register(sampleApp('my-app'));
    await apps.start('my-app');

    times.setInterval('my-app', () => {}, { interval: 100 });
    times.scheduleTask('my-app', { executeAt: Date.now() + 5000, handler: () => 42, priority: 1 });
    expect(times.snapshot().totalTimers).toBe(1);
    expect(times.snapshot().byApp['my-app']?.tasks).toBe(1);

    // 应用停止时手动清理
    await apps.stop('my-app');
    const cleared = times.clearAllForApp('my-app');
    expect(cleared).toBe(2);
    expect(times.snapshot().totalTimers).toBe(0);
  });
});
