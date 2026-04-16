/**
 * DaoUniverseFeedback 测试套件
 * 验证：构建 / attach-detach / regulate() / tick() / history / regulator 集成 / E2E
 */

import { daoNothingVoid } from '@daomind/nothing';
import { DaoUniverse } from '../universe';
import { DaoUniverseMonitor } from '../universe-monitor';
import { DaoUniverseClock } from '../universe-clock';
import { DaoUniverseFeedback } from '../universe-feedback';
import { TaskAgent } from '@daomind/agents';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeStack(intervalMs = 100) {
  const universe  = new DaoUniverse();
  const monitor   = new DaoUniverseMonitor(universe);
  const clock     = new DaoUniverseClock(monitor, intervalMs);
  const feedback  = new DaoUniverseFeedback(clock);
  return { universe, monitor, clock, feedback };
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
  test('可构建 DaoUniverseFeedback', () => {
    const { feedback } = makeStack();
    expect(feedback).toBeDefined();
  });

  test('默认 isAttached = false', () => {
    const { feedback } = makeStack();
    expect(feedback.isAttached).toBe(false);
  });

  test('默认 lastResult = undefined', () => {
    const { feedback } = makeStack();
    expect(feedback.lastResult).toBeUndefined();
  });

  test('regulator getter 返回 DaoFeedbackRegulator 实例', () => {
    const { feedback } = makeStack();
    expect(feedback.regulator).toBeDefined();
    expect(typeof feedback.regulator.regulate).toBe('function');
  });

  test('clock getter 返回关联的 DaoUniverseClock', () => {
    const { feedback, clock } = makeStack();
    expect(feedback.clock).toBe(clock);
  });

  test('自定义 regulator config 可构建', () => {
    const { clock } = makeStack();
    const fb = new DaoUniverseFeedback(clock, { baseSensitivity: 0.8, saturationThreshold: 50 });
    expect(fb).toBeDefined();
  });
});

// ── 2. attach / detach ───────────────────────────────────────────────────────

describe('attach / detach', () => {
  test('attach() → isAttached = true', () => {
    const { feedback } = makeStack();
    feedback.attach();
    expect(feedback.isAttached).toBe(true);
    feedback.detach();
  });

  test('detach() after attach → isAttached = false', () => {
    const { feedback } = makeStack();
    feedback.attach();
    feedback.detach();
    expect(feedback.isAttached).toBe(false);
  });

  test('幂等 attach（多次调用不报错）', () => {
    const { feedback } = makeStack();
    expect(() => {
      feedback.attach();
      feedback.attach();
      feedback.attach();
    }).not.toThrow();
    feedback.detach();
  });

  test('幂等 detach（attach 前调用不报错）', () => {
    const { feedback } = makeStack();
    expect(() => {
      feedback.detach();
      feedback.detach();
    }).not.toThrow();
  });
});

// ── 3. regulate() ─────────────────────────────────────────────────────────────

describe('regulate()', () => {
  test('返回 RegulationResult 结构正确', () => {
    const { feedback } = makeStack();
    const result = feedback.regulate(80);
    expect(result).toBeDefined();
    expect(typeof result.outputIntensity).toBe('number');
    expect(typeof result.effectiveSignals).toBe('number');
    expect(typeof result.droppedSignals).toBe('number');
    expect(typeof result.isSaturated).toBe('boolean');
  });

  test('health=100 → 信号强度=0 → outputIntensity 极低', () => {
    const { feedback } = makeStack();
    const result = feedback.regulate(100);
    expect(result.outputIntensity).toBe(0);
    expect(result.inputCount).toBe(0);
  });

  test('health=0 → 信号强度=100 → outputIntensity 较高', () => {
    const { feedback } = makeStack();
    const result = feedback.regulate(0);
    expect(result.outputIntensity).toBeGreaterThan(0);
    expect(result.inputCount).toBe(100);
  });

  test('outputIntensity 始终在 [0, 1] 范围内', () => {
    const { feedback } = makeStack();
    for (const h of [0, 25, 50, 75, 100]) {
      const r = feedback.regulate(h);
      expect(r.outputIntensity).toBeGreaterThanOrEqual(0);
      expect(r.outputIntensity).toBeLessThanOrEqual(1);
    }
  });

  test('effectiveSignals ≥ 0', () => {
    const { feedback } = makeStack();
    const result = feedback.regulate(50);
    expect(result.effectiveSignals).toBeGreaterThanOrEqual(0);
  });

  test('regulate() 更新 lastResult', () => {
    const { feedback } = makeStack();
    expect(feedback.lastResult).toBeUndefined();
    feedback.regulate(70);
    expect(feedback.lastResult).toBeDefined();
  });
});

// ── 4. attach → 自动调节（fake timers）───────────────────────────────────────

describe('attach 自动调节 — fake timers', () => {
  test('Clock tick → feedback history 增长', () => {
    jest.useFakeTimers();
    const universe  = new DaoUniverse();
    const monitor   = new DaoUniverseMonitor(universe);
    const clock     = new DaoUniverseClock(monitor, 100);
    const feedback  = new DaoUniverseFeedback(clock);

    feedback.attach();
    clock.start();
    jest.advanceTimersByTime(350);
    clock.stop();
    feedback.detach();

    expect(feedback.history().length).toBeGreaterThanOrEqual(3);
  });

  test('attach 后 Clock tick → lastResult 被设置', () => {
    jest.useFakeTimers();
    const universe  = new DaoUniverse();
    const monitor   = new DaoUniverseMonitor(universe);
    const clock     = new DaoUniverseClock(monitor, 100);
    const feedback  = new DaoUniverseFeedback(clock);

    feedback.attach();
    clock.start();
    jest.advanceTimersByTime(150);
    clock.stop();
    feedback.detach();

    expect(feedback.lastResult).toBeDefined();
  });

  test('detach 后 Clock tick → feedback history 不再增长', () => {
    jest.useFakeTimers();
    const universe  = new DaoUniverse();
    const monitor   = new DaoUniverseMonitor(universe);
    const clock     = new DaoUniverseClock(monitor, 100);
    const feedback  = new DaoUniverseFeedback(clock);

    feedback.attach();
    clock.start();
    jest.advanceTimersByTime(200);
    feedback.detach();
    const frozenLen = feedback.history().length;
    jest.advanceTimersByTime(300);
    clock.stop();

    expect(feedback.history().length).toBe(frozenLen);
  });

  test('多次 tick 后 outputIntensity 在合法范围内', () => {
    jest.useFakeTimers();
    const universe  = new DaoUniverse();
    const monitor   = new DaoUniverseMonitor(universe);
    const clock     = new DaoUniverseClock(monitor, 100);
    const feedback  = new DaoUniverseFeedback(clock);

    feedback.attach();
    clock.start();
    jest.advanceTimersByTime(500);
    clock.stop();
    feedback.detach();

    for (const entry of feedback.history()) {
      expect(entry.result.outputIntensity).toBeGreaterThanOrEqual(0);
      expect(entry.result.outputIntensity).toBeLessThanOrEqual(1);
    }
  });
});

// ── 5. history ────────────────────────────────────────────────────────────────

describe('history()', () => {
  test('初始 history 为空', () => {
    const { feedback } = makeStack();
    expect(feedback.history()).toHaveLength(0);
  });

  test('regulate() 后 history 增长', () => {
    const { feedback } = makeStack();
    feedback.regulate(80);
    feedback.regulate(70);
    expect(feedback.history()).toHaveLength(2);
  });

  test('history(2) 限制返回数量', () => {
    const { feedback } = makeStack();
    feedback.regulate(90);
    feedback.regulate(80);
    feedback.regulate(70);
    feedback.regulate(60);
    expect(feedback.history(2)).toHaveLength(2);
  });

  test('history entry 含 {timestamp, health, result}', () => {
    const { feedback } = makeStack();
    feedback.regulate(75);
    const entry = feedback.history()[0];
    expect(entry).toBeDefined();
    expect(typeof entry!.timestamp).toBe('number');
    expect(entry!.health).toBe(75);
    expect(entry!.result).toBeDefined();
  });

  test('lastResult = history 最后一条的 result', () => {
    const { feedback } = makeStack();
    feedback.regulate(90);
    feedback.regulate(60);
    const last = feedback.history().at(-1);
    expect(feedback.lastResult).toBe(last?.result);
  });
});

// ── 6. tick() ─────────────────────────────────────────────────────────────────

describe('tick()', () => {
  test('无 monitor history 时返回 null', () => {
    const { feedback } = makeStack();
    expect(feedback.tick()).toBeNull();
  });

  test('有 monitor history 时返回 RegulationResult', () => {
    const { feedback, clock } = makeStack();
    clock.tick();  // 触发 monitor.capture()
    const result = feedback.tick();
    expect(result).toBeDefined();
    expect(typeof result?.outputIntensity).toBe('number');
  });

  test('tick() 写入 history', () => {
    const { feedback, clock } = makeStack();
    clock.tick();
    feedback.tick();
    expect(feedback.history()).toHaveLength(1);
  });
});

// ── 7. regulator 集成 ────────────────────────────────────────────────────────

describe('regulator 集成', () => {
  test('regulate() 后 regulator.getState().currentIntensity 在 [0, 1]', () => {
    const { feedback } = makeStack();
    feedback.regulate(50);
    const state = feedback.regulator.getState();
    expect(state.currentIntensity).toBeGreaterThanOrEqual(0);
    expect(state.currentIntensity).toBeLessThanOrEqual(1);
  });

  test('setSensitivity 影响输出强度', () => {
    const { clock } = makeStack();
    const fb1 = new DaoUniverseFeedback(clock, { baseSensitivity: 0.1 });
    const fb2 = new DaoUniverseFeedback(clock, { baseSensitivity: 0.9 });
    const r1 = fb1.regulate(50);
    const r2 = fb2.regulate(50);
    // 高灵敏度 → 更高输出强度
    expect(r2.outputIntensity).toBeGreaterThan(r1.outputIntensity);
  });
});

// ── 8. E2E ────────────────────────────────────────────────────────────────────

describe('E2E', () => {
  test('全栈 Universe→Monitor→Clock→Feedback 闭环工作', async () => {
    const universe = new DaoUniverse();
    const agent    = universe.createAgent(TaskAgent, 'fb-e2e-task-1');
    await agent.initialize();
    await agent.activate();

    const monitor  = new DaoUniverseMonitor(universe);
    const clock    = new DaoUniverseClock(monitor, 100);
    const feedback = new DaoUniverseFeedback(clock);

    // 手动触发链：clock.tick() → monitor.capture() → health score
    clock.tick();
    const result = feedback.tick();
    expect(result).toBeDefined();
    expect(result?.outputIntensity).toBeGreaterThanOrEqual(0);
    expect(feedback.history()).toHaveLength(1);

    await agent.terminate();
  });

  test('DaoUniverseFeedback 可从 @daomind/collective 导入', async () => {
    const { DaoUniverseFeedback: F } = await import('../index');
    expect(F).toBeDefined();
  });
});
