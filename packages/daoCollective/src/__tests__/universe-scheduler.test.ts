/**
 * DaoUniverseScheduler 测试套件
 * "待时而动"（系辞传）
 *
 * 验证：构建 / attach-detach / schedule / flush() / fake timers / executions / E2E
 */

import { daoNothingVoid } from '@daomind/nothing';
import { DaoUniverse } from '../universe';
import { DaoUniverseMonitor } from '../universe-monitor';
import { DaoUniverseClock } from '../universe-clock';
import { DaoUniverseScheduler } from '../universe-scheduler';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeStack(intervalMs = 100) {
  const universe   = new DaoUniverse();
  const monitor    = new DaoUniverseMonitor(universe);
  const clock      = new DaoUniverseClock(monitor, intervalMs);
  const scheduler  = new DaoUniverseScheduler(clock);
  return { universe, monitor, clock, scheduler };
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
  test('可构建 DaoUniverseScheduler', () => {
    const { scheduler } = makeStack();
    expect(scheduler).toBeDefined();
  });

  test('默认 isAttached = false', () => {
    const { scheduler } = makeStack();
    expect(scheduler.isAttached).toBe(false);
  });

  test('scheduler getter 返回 DaoScheduler 实例', () => {
    const { scheduler } = makeStack();
    expect(scheduler.scheduler).toBeDefined();
    expect(typeof scheduler.scheduler.schedule).toBe('function');
  });

  test('clock getter 返回关联的 DaoUniverseClock', () => {
    const { scheduler, clock } = makeStack();
    expect(scheduler.clock).toBe(clock);
  });

  test('初始 pending() = 0', () => {
    const { scheduler } = makeStack();
    expect(scheduler.pending()).toBe(0);
  });

  test('初始 executions() = []', () => {
    const { scheduler } = makeStack();
    expect(scheduler.executions()).toHaveLength(0);
  });
});

// ── 2. attach / detach ───────────────────────────────────────────────────────

describe('attach / detach', () => {
  test('attach() → isAttached = true', () => {
    const { scheduler } = makeStack();
    scheduler.attach();
    expect(scheduler.isAttached).toBe(true);
    scheduler.detach();
  });

  test('detach() after attach → isAttached = false', () => {
    const { scheduler } = makeStack();
    scheduler.attach();
    scheduler.detach();
    expect(scheduler.isAttached).toBe(false);
  });

  test('幂等 attach（多次调用不报错）', () => {
    const { scheduler } = makeStack();
    expect(() => {
      scheduler.attach();
      scheduler.attach();
    }).not.toThrow();
    scheduler.detach();
  });

  test('幂等 detach（attach 前调用不报错）', () => {
    const { scheduler } = makeStack();
    expect(() => {
      scheduler.detach();
      scheduler.detach();
    }).not.toThrow();
  });
});

// ── 3. schedule / cancel ──────────────────────────────────────────────────────

describe('schedule() / cancel()', () => {
  test('schedule() 返回非空字符串 taskId', () => {
    const { scheduler } = makeStack();
    const id = scheduler.schedule(() => 42);
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  test('delayMs=0 任务立即 pending', () => {
    const { scheduler } = makeStack();
    scheduler.schedule(() => 1, 0);
    expect(scheduler.pending()).toBe(1);
  });

  test('多个任务 pending 计数正确', () => {
    const { scheduler } = makeStack();
    scheduler.schedule(() => 1, 0);
    scheduler.schedule(() => 2, 0);
    scheduler.schedule(() => 3, 0);
    expect(scheduler.pending()).toBe(3);
  });

  test('cancel() 减少 pending 计数', () => {
    const { scheduler } = makeStack();
    const id = scheduler.schedule(() => 1, 0);
    expect(scheduler.pending()).toBe(1);
    const removed = scheduler.cancel(id);
    expect(removed).toBe(true);
    expect(scheduler.pending()).toBe(0);
  });

  test('cancel() 不存在的 id 返回 false', () => {
    const { scheduler } = makeStack();
    expect(scheduler.cancel('nonexistent-task')).toBe(false);
  });
});

// ── 4. flush() ────────────────────────────────────────────────────────────────

describe('flush()', () => {
  test('无待执行任务时 flush() 返回 0', async () => {
    const { scheduler } = makeStack();
    const count = await scheduler.flush();
    expect(count).toBe(0);
  });

  test('flush() 执行到期任务并返回执行数量', async () => {
    const { scheduler } = makeStack();
    scheduler.schedule(() => 1, 0);
    scheduler.schedule(() => 2, 0);
    const count = await scheduler.flush();
    expect(count).toBe(2);
  });

  test('flush() 后 pending() = 0', async () => {
    const { scheduler } = makeStack();
    scheduler.schedule(() => 'a', 0);
    scheduler.schedule(() => 'b', 0);
    await scheduler.flush();
    expect(scheduler.pending()).toBe(0);
  });

  test('flush() 后 executions() 包含执行记录', async () => {
    const { scheduler } = makeStack();
    scheduler.schedule(() => 42, 0);
    await scheduler.flush();
    expect(scheduler.executions()).toHaveLength(1);
    expect(scheduler.executions()[0]?.status).toBe('success');
  });

  test('任务抛错时 status = error 且不崩溃', async () => {
    const { scheduler } = makeStack();
    scheduler.schedule(() => { throw new Error('test error'); }, 0);
    const count = await scheduler.flush();
    expect(count).toBe(1);
    expect(scheduler.executions()[0]?.status).toBe('error');
  });
});

// ── 5. attach + fake timers ───────────────────────────────────────────────────

describe('attach 自动调度 — fake timers', () => {
  test('Clock tick → 到期任务被执行', async () => {
    jest.useFakeTimers();
    const universe  = new DaoUniverse();
    const monitor   = new DaoUniverseMonitor(universe);
    const clock     = new DaoUniverseClock(monitor, 100);
    const scheduler = new DaoUniverseScheduler(clock);

    scheduler.attach();
    scheduler.schedule(() => 'hello', 0);
    clock.start();
    jest.advanceTimersByTime(150);
    clock.stop();
    scheduler.detach();

    // 等待 Promise 微任务队列清空
    await Promise.resolve();
    expect(scheduler.executions().length).toBeGreaterThanOrEqual(1);
  });

  test('多次 tick → 多批任务执行', async () => {
    jest.useFakeTimers();
    const universe  = new DaoUniverse();
    const monitor   = new DaoUniverseMonitor(universe);
    const clock     = new DaoUniverseClock(monitor, 100);
    const scheduler = new DaoUniverseScheduler(clock);

    scheduler.attach();
    clock.start();

    // 注册 3 个立即到期的任务，推进 3 个心跳
    scheduler.schedule(() => 1, 0);
    scheduler.schedule(() => 2, 0);
    scheduler.schedule(() => 3, 0);
    jest.advanceTimersByTime(350);

    clock.stop();
    scheduler.detach();
    await Promise.resolve();
    expect(scheduler.executions().length).toBeGreaterThanOrEqual(3);
  });

  test('detach 后 Clock tick 不再触发 flush', async () => {
    jest.useFakeTimers();
    const universe  = new DaoUniverse();
    const monitor   = new DaoUniverseMonitor(universe);
    const clock     = new DaoUniverseClock(monitor, 100);
    const scheduler = new DaoUniverseScheduler(clock);

    scheduler.attach();
    clock.start();
    jest.advanceTimersByTime(200);
    scheduler.detach();
    await Promise.resolve();
    const execBefore = scheduler.executions().length;

    // 注册新任务后 detach，任务不应被自动执行
    scheduler.schedule(() => 'should not run automatically', 0);
    jest.advanceTimersByTime(300);
    await Promise.resolve();
    // 由于 detach，此任务不会被自动 flush（仍在队列中）
    const execAfter = scheduler.executions().length;
    expect(execAfter).toBe(execBefore);
    clock.stop();
  });
});

// ── 6. executions() ───────────────────────────────────────────────────────────

describe('executions()', () => {
  test('executions(1) 返回最近 1 条', async () => {
    const { scheduler } = makeStack();
    scheduler.schedule(() => 'a', 0);
    scheduler.schedule(() => 'b', 0);
    await scheduler.flush();
    expect(scheduler.executions(1)).toHaveLength(1);
  });

  test('execution record 含 taskId / executedAt / status', async () => {
    const { scheduler } = makeStack();
    const id = scheduler.schedule(() => 'ok', 0);
    await scheduler.flush();
    const record = scheduler.executions()[0];
    expect(record?.taskId).toBe(id);
    expect(typeof record?.executedAt).toBe('number');
    expect(record?.status).toBe('success');
  });

  test('success / error 状态正确区分', async () => {
    const { scheduler } = makeStack();
    scheduler.schedule(() => 'ok', 0);
    scheduler.schedule(() => { throw new Error('fail'); }, 0);
    await scheduler.flush();
    const statuses = scheduler.executions().map((r) => r.status);
    expect(statuses).toContain('success');
    expect(statuses).toContain('error');
  });
});

// ── 7. E2E ────────────────────────────────────────────────────────────────────

describe('E2E', () => {
  test('全栈 Universe→Clock→Scheduler 手动 flush 工作', async () => {
    const { scheduler } = makeStack();
    let called = false;
    scheduler.schedule(() => { called = true; }, 0);
    await scheduler.flush();
    expect(called).toBe(true);
    expect(scheduler.executions()[0]?.status).toBe('success');
  });

  test('DaoUniverseScheduler 可从 @daomind/collective 导入', async () => {
    const { DaoUniverseScheduler: S } = await import('../index');
    expect(S).toBeDefined();
    expect(typeof S).toBe('function');
  });

  test('与 DaoUniverseFeedback 共存于同一 Clock', async () => {
    const { DaoUniverseFeedback } = await import('../universe-feedback');
    const { scheduler, clock } = makeStack();
    const feedback = new DaoUniverseFeedback(clock);

    feedback.attach();
    scheduler.attach();

    // 手动触发 tick，两者都应工作
    scheduler.schedule(() => 'coexist', 0);
    clock.tick();
    await scheduler.flush();

    expect(feedback.history().length).toBeGreaterThan(0);
    expect(scheduler.executions().length).toBeGreaterThan(0);

    feedback.detach();
    scheduler.detach();
  });
});
