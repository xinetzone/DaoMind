/**
 * DaoUniverseClock 测试套件
 * 验证：构建 / start-stop / tick() / onTick / 定时 / elapsed / E2E
 */

import { daoNothingVoid } from '@daomind/nothing';
import { DaoUniverse } from '../universe';
import { DaoUniverseMonitor } from '../universe-monitor';
import { DaoUniverseClock } from '../universe-clock';
import { TaskAgent } from '@daomind/agents';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeStack(intervalMs = 100) {
  const universe = new DaoUniverse();
  const monitor  = new DaoUniverseMonitor(universe);
  const clock    = new DaoUniverseClock(monitor, intervalMs);
  return { universe, monitor, clock };
}

// ── setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  daoNothingVoid.void();
  jest.clearAllTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

// ── 1. 构建 ───────────────────────────────────────────────────────────────────

describe('构建', () => {
  test('可构建 DaoUniverseClock', () => {
    const { clock } = makeStack();
    expect(clock).toBeDefined();
  });

  test('默认 isRunning = false', () => {
    const { clock } = makeStack();
    expect(clock.isRunning).toBe(false);
  });

  test('默认 ticks = 0', () => {
    const { clock } = makeStack();
    expect(clock.ticks).toBe(0);
  });

  test('默认 lastTick = undefined', () => {
    const { clock } = makeStack();
    expect(clock.lastTick).toBeUndefined();
  });

  test('chronos getter 返回 DaoChronos 实例', () => {
    const { clock } = makeStack();
    expect(clock.chronos).toBeDefined();
    expect(typeof clock.chronos.now).toBe('function');
  });

  test('monitor getter 返回 DaoUniverseMonitor', () => {
    const { clock, monitor } = makeStack();
    expect(clock.monitor).toBe(monitor);
  });

  test('自定义 intervalMs 可构建', () => {
    const { clock } = makeStack(500);
    expect(clock).toBeDefined();
  });
});

// ── 2. start / stop ──────────────────────────────────────────────────────────

describe('start / stop', () => {
  test('start() → isRunning = true', () => {
    const { clock } = makeStack();
    clock.start();
    expect(clock.isRunning).toBe(true);
    clock.stop();
  });

  test('stop() after start → isRunning = false', () => {
    const { clock } = makeStack();
    clock.start();
    clock.stop();
    expect(clock.isRunning).toBe(false);
  });

  test('幂等 start（多次调用不报错）', () => {
    const { clock } = makeStack();
    expect(() => { clock.start(); clock.start(); clock.start(); }).not.toThrow();
    clock.stop();
  });

  test('幂等 stop（start 前调用不报错）', () => {
    const { clock } = makeStack();
    expect(() => { clock.stop(); clock.stop(); }).not.toThrow();
  });

  test('stop 后 ticks 不因定时器继续增长', () => {
    jest.useFakeTimers();
    const { clock } = makeStack(100);
    clock.start();
    jest.advanceTimersByTime(250);
    clock.stop();
    const ticksAtStop = clock.ticks;
    jest.advanceTimersByTime(500);
    expect(clock.ticks).toBe(ticksAtStop);
  });
});

// ── 3. tick() 手动 ───────────────────────────────────────────────────────────

describe('tick() — 手动触发', () => {
  test('返回 MonitorSnapshot', () => {
    const { clock } = makeStack();
    const snap = clock.tick();
    expect(snap).toBeDefined();
    expect(typeof snap.systemHealth).toBe('number');
    expect(typeof snap.timestamp).toBe('number');
  });

  test('每次 tick() 增加 ticks 计数', () => {
    const { clock } = makeStack();
    clock.tick();
    clock.tick();
    clock.tick();
    expect(clock.ticks).toBe(3);
  });

  test('tick() 更新 lastTick', () => {
    const { clock } = makeStack();
    expect(clock.lastTick).toBeUndefined();
    clock.tick();
    expect(clock.lastTick).toBeDefined();
    expect(typeof clock.lastTick!.value).toBe('number');
  });

  test('tick() 触发 onTick 回调', () => {
    const { clock } = makeStack();
    const cb = jest.fn();
    clock.onTick(cb);
    clock.tick();
    expect(cb).toHaveBeenCalledTimes(1);
  });

  test('tick() 后 elapsed() 返回非负数', () => {
    const { clock } = makeStack();
    clock.tick();
    const e = clock.elapsed();
    expect(e).toBeDefined();
    expect(e).toBeGreaterThanOrEqual(0);
  });
});

// ── 4. onTick callbacks ───────────────────────────────────────────────────────

describe('onTick callbacks', () => {
  test('订阅后 tick() 触发 callback', () => {
    const { clock } = makeStack();
    const received: unknown[] = [];
    clock.onTick((snap) => received.push(snap));
    clock.tick();
    expect(received).toHaveLength(1);
  });

  test('unsubscribe 后不再触发', () => {
    const { clock } = makeStack();
    const cb = jest.fn();
    const unsub = clock.onTick(cb);
    clock.tick();
    unsub();
    clock.tick();
    expect(cb).toHaveBeenCalledTimes(1);
  });

  test('多个 listeners 都触发', () => {
    const { clock } = makeStack();
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    const cb3 = jest.fn();
    clock.onTick(cb1);
    clock.onTick(cb2);
    clock.onTick(cb3);
    clock.tick();
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
    expect(cb3).toHaveBeenCalledTimes(1);
  });

  test('回调参数 (MonitorSnapshot, DaoChronosPoint) 结构正确', () => {
    const { clock } = makeStack();
    let capturedSnap: unknown;
    let capturedPoint: unknown;
    clock.onTick((snap, point) => {
      capturedSnap  = snap;
      capturedPoint = point;
    });
    clock.tick();
    expect((capturedSnap as { systemHealth: number }).systemHealth).toBeDefined();
    expect((capturedPoint as { value: number }).value).toBeDefined();
    expect((capturedPoint as { source: string }).source).toBe('system');
  });
});

// ── 5. 定时 tick（fake timers）────────────────────────────────────────────────

describe('定时 tick — fake timers', () => {
  test('start() + advanceTimersByTime → ticks 增加', () => {
    jest.useFakeTimers();
    const { clock } = makeStack(100);
    clock.start();
    jest.advanceTimersByTime(350);
    expect(clock.ticks).toBeGreaterThanOrEqual(3);
    clock.stop();
  });

  test('stop 后 advanceTimersByTime → ticks 不变', () => {
    jest.useFakeTimers();
    const { clock } = makeStack(100);
    clock.start();
    jest.advanceTimersByTime(200);
    clock.stop();
    const frozen = clock.ticks;
    jest.advanceTimersByTime(500);
    expect(clock.ticks).toBe(frozen);
  });

  test('每次定时 tick 推入 monitor.history', () => {
    jest.useFakeTimers();
    const { clock, monitor } = makeStack(100);
    clock.start();
    jest.advanceTimersByTime(300);
    clock.stop();
    expect(monitor.history().length).toBeGreaterThanOrEqual(3);
  });

  test('stop → start → ticks 继续累计（不重置）', () => {
    jest.useFakeTimers();
    const { clock } = makeStack(100);
    clock.start();
    jest.advanceTimersByTime(200);
    clock.stop();
    const mid = clock.ticks;
    clock.start();
    jest.advanceTimersByTime(200);
    clock.stop();
    expect(clock.ticks).toBeGreaterThan(mid);
  });
});

// ── 6. elapsed ────────────────────────────────────────────────────────────────

describe('elapsed()', () => {
  test('tick 前 elapsed() = undefined', () => {
    const { clock } = makeStack();
    expect(clock.elapsed()).toBeUndefined();
  });

  test('tick 后 elapsed() ≥ 0', () => {
    const { clock } = makeStack();
    clock.tick();
    const e = clock.elapsed();
    expect(e).toBeGreaterThanOrEqual(0);
  });
});

// ── 7. E2E ────────────────────────────────────────────────────────────────────

describe('E2E', () => {
  test('DaoUniverse → Monitor → Clock 整栈工作', async () => {
    const universe = new DaoUniverse();
    const agent = universe.createAgent(TaskAgent, 'clock-e2e-task-1');
    await agent.initialize();
    await agent.activate();

    const monitor = new DaoUniverseMonitor(universe);
    const clock   = new DaoUniverseClock(monitor, 100);

    const snaps: unknown[] = [];
    clock.onTick((s) => snaps.push(s));
    clock.tick();
    clock.tick();

    expect(snaps).toHaveLength(2);
    expect(clock.ticks).toBe(2);
    expect(monitor.history()).toHaveLength(2);
    expect(clock.monitor).toBe(monitor);

    await agent.terminate();
  });

  test('DaoUniverseClock 可从 @daomind/collective 导入', async () => {
    const { DaoUniverseClock: C } = await import('../index');
    expect(C).toBeDefined();
  });
});
