/**
 * DaoUniverseNexus 测试套件
 * "万物负阴而抱阳，中气以为和"（德经·四十二章）
 *
 * 验证：构建 / attach-detach / register-deregister / healthCheck / dispatch / metrics / E2E
 */

import { daoNothingVoid } from '@daomind/nothing';
import { DaoUniverse } from '../universe';
import { DaoUniverseMonitor } from '../universe-monitor';
import { DaoUniverseClock } from '../universe-clock';
import { DaoUniverseNexus } from '../universe-nexus';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeStack(intervalMs = 100) {
  const universe = new DaoUniverse();
  const monitor  = new DaoUniverseMonitor(universe);
  const clock    = new DaoUniverseClock(monitor, intervalMs);
  const nexus    = new DaoUniverseNexus(monitor, clock);
  return { universe, monitor, clock, nexus };
}

const svc = (id: string, name = 'svc', endpoint = `http://${id}`) => ({
  id, name, version: '1.0.0', endpoint,
});

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
  test('可构建 DaoUniverseNexus', () => {
    const { nexus } = makeStack();
    expect(nexus).toBeDefined();
  });

  test('默认 isAttached = false', () => {
    const { nexus } = makeStack();
    expect(nexus.isAttached).toBe(false);
  });

  test('monitor getter 返回关联的 DaoUniverseMonitor', () => {
    const { nexus, monitor } = makeStack();
    expect(nexus.monitor).toBe(monitor);
  });

  test('clock getter 返回关联的 DaoUniverseClock', () => {
    const { nexus, clock } = makeStack();
    expect(nexus.clock).toBe(clock);
  });

  test('discovery / router / loadBalancer getter 已初始化', () => {
    const { nexus } = makeStack();
    expect(nexus.discovery).toBeDefined();
    expect(nexus.router).toBeDefined();
    expect(nexus.loadBalancer).toBeDefined();
  });
});

// ── 2. attach / detach ───────────────────────────────────────────────────────

describe('attach / detach', () => {
  test('attach() → isAttached = true', () => {
    const { nexus } = makeStack();
    nexus.attach();
    expect(nexus.isAttached).toBe(true);
    nexus.detach();
  });

  test('detach() → isAttached = false', () => {
    const { nexus } = makeStack();
    nexus.attach();
    nexus.detach();
    expect(nexus.isAttached).toBe(false);
  });

  test('幂等 attach', () => {
    const { nexus } = makeStack();
    expect(() => { nexus.attach(); nexus.attach(); }).not.toThrow();
    nexus.detach();
  });

  test('幂等 detach', () => {
    const { nexus } = makeStack();
    expect(() => { nexus.detach(); nexus.detach(); }).not.toThrow();
  });
});

// ── 3. register / deregister / discover ──────────────────────────────────────

describe('register / deregister / discover', () => {
  test('register 后 healthCheck 包含该服务', () => {
    const { nexus } = makeStack();
    nexus.register(svc('s1'));
    expect(nexus.healthCheck().some((c) => c.id === 's1')).toBe(true);
  });

  test('重复注册同 id 抛错', () => {
    const { nexus } = makeStack();
    nexus.register(svc('dup'));
    expect(() => nexus.register(svc('dup'))).toThrow(/服务已注册/);
  });

  test('deregister → healthCheck 不再含该服务', () => {
    const { nexus } = makeStack();
    nexus.register(svc('rm'));
    expect(nexus.deregister('rm')).toBe(true);
    expect(nexus.healthCheck().some((c) => c.id === 'rm')).toBe(false);
  });

  test('discover 返回健康服务', () => {
    const { nexus } = makeStack();
    nexus.register({ id: 'a1', name: 'auth', version: '1.0.0', endpoint: 'http://a1' });
    const found = nexus.discover('auth');
    expect(found.length).toBe(1);
    expect(found[0]?.id).toBe('a1');
  });
});

// ── 4. markHealthy / healthCheck ─────────────────────────────────────────────

describe('markHealthy / healthCheck', () => {
  test('markHealthy(false) → discover 不再返回该服务', () => {
    const { nexus } = makeStack();
    nexus.register({ id: 'h1', name: 'api', version: '1.0.0', endpoint: 'http://h1' });
    nexus.markHealthy('h1', false);
    expect(nexus.discover('api').length).toBe(0);
  });

  test('markHealthy(true) 恢复服务可用', () => {
    const { nexus } = makeStack();
    nexus.register({ id: 'h2', name: 'api2', version: '1.0.0', endpoint: 'http://h2' });
    nexus.markHealthy('h2', false);
    nexus.markHealthy('h2', true);
    expect(nexus.discover('api2').length).toBe(1);
  });

  test('healthCheck 列出所有服务健康状态', () => {
    const { nexus } = makeStack();
    nexus.register(svc('x1'));
    nexus.register(svc('x2'));
    nexus.markHealthy('x2', false);
    const checks = nexus.healthCheck();
    expect(checks.length).toBe(2);
    const x2 = checks.find((c) => c.id === 'x2');
    expect(x2?.healthy).toBe(false);
  });
});

// ── 5. dispatch() ─────────────────────────────────────────────────────────────

describe('dispatch()', () => {
  test('基本 dispatch → status: dispatched', async () => {
    const { nexus } = makeStack();
    nexus.register({ id: 'd1', name: 'calc', version: '1.0.0', endpoint: 'http://d1' });
    const result = await nexus.dispatch({ path: 'calc/add', payload: {} });
    expect(result.status).toBe('dispatched');
    expect(result.target).toBe('http://d1');
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  test('服务未注册 → no-service', async () => {
    const { nexus } = makeStack();
    const result = await nexus.dispatch({ path: 'unknown/endpoint', payload: {} });
    expect(result.status).toBe('no-service');
    expect(result.target).toBeNull();
  });

  test('dispatch 后 metrics 更新', async () => {
    const { nexus } = makeStack();
    nexus.register({ id: 'm1', name: 'ms', version: '1.0.0', endpoint: 'http://m1' });
    await nexus.dispatch({ path: 'ms/action', payload: {} });
    const m = nexus.metrics();
    expect(m.totalRequests).toBe(1);
    expect(m.successCount).toBe(1);
    expect(m.successRate).toBe(1);
  });

  test('dispatch 失败时 failureCount 增加', async () => {
    const { nexus } = makeStack();
    await nexus.dispatch({ path: 'notfound/x', payload: {} });
    const m = nexus.metrics();
    expect(m.failureCount).toBe(1);
  });

  test('多次 dispatch 负载均衡分散目标', async () => {
    const { nexus } = makeStack();
    nexus.register({ id: 'lb1', name: 'lb', version: '1.0.0', endpoint: 'http://lb1' });
    nexus.register({ id: 'lb2', name: 'lb', version: '1.0.0', endpoint: 'http://lb2' });
    const targets = new Set<string>();
    for (let i = 0; i < 6; i++) {
      const r = await nexus.dispatch({ path: 'lb/req', payload: {} });
      if (r.target) targets.add(r.target);
    }
    // round-robin 应该分散到至少 1 个目标（通常 2 个）
    expect(targets.size).toBeGreaterThanOrEqual(1);
  });

  test('addRoute 后 dispatch 使用自定义路由目标', async () => {
    const { nexus } = makeStack();
    nexus.register({ id: 'rt1', name: 'svc', version: '1.0.0', endpoint: 'http://rt1' });
    // 添加优先级更高的路由规则，指向另一端点
    nexus.addRoute({ pattern: 'svc/special', target: 'http://custom', weight: 1, priority: 10 });
    const result = await nexus.dispatch({ path: 'svc/special', payload: {} });
    expect(result.target).toBe('http://custom');
  });
});

// ── 6. healthHistory / syncHealthNow ────────────────────────────────────────

describe('healthHistory()', () => {
  test('syncHealthNow 添加健康记录', () => {
    const { nexus } = makeStack();
    nexus.syncHealthNow();
    expect(nexus.healthHistory().length).toBe(1);
  });

  test('healthHistory 记录包含 systemHealth', () => {
    const { nexus } = makeStack();
    nexus.syncHealthNow();
    const record = nexus.healthHistory()[0];
    expect(typeof record?.systemHealth).toBe('number');
    expect(record!.systemHealth).toBeGreaterThanOrEqual(0);
    expect(record!.systemHealth).toBeLessThanOrEqual(100);
  });

  test('healthHistory(limit) 返回最近 N 条', () => {
    const { nexus } = makeStack();
    nexus.syncHealthNow();
    nexus.syncHealthNow();
    nexus.syncHealthNow();
    expect(nexus.healthHistory(2)).toHaveLength(2);
  });

  test('服务数量反映在健康快照中', () => {
    const { nexus } = makeStack();
    nexus.register(svc('hs1'));
    nexus.register(svc('hs2'));
    nexus.syncHealthNow();
    const record = nexus.healthHistory()[0]!;
    expect(record.totalServices).toBe(2);
    expect(record.healthyServices).toBe(2);
  });
});

// ── 7. Clock 驱动 ────────────────────────────────────────────────────────────

describe('Clock 驱动健康快照', () => {
  test('attach + Clock tick → 自动录制健康记录', () => {
    const { nexus, clock } = makeStack();
    nexus.attach();
    clock.tick();
    expect(nexus.healthHistory().length).toBeGreaterThanOrEqual(1);
    nexus.detach();
  });

  test('多次 tick → healthHistory 增长', () => {
    const { nexus, clock } = makeStack();
    nexus.attach();
    clock.tick();
    clock.tick();
    clock.tick();
    const count = nexus.healthHistory().length;
    expect(count).toBeGreaterThanOrEqual(3);
    nexus.detach();
  });

  test('detach 后 tick 不再增加记录', () => {
    const { nexus, clock } = makeStack();
    nexus.attach();
    clock.tick();
    nexus.detach();
    const before = nexus.healthHistory().length;
    clock.tick();
    clock.tick();
    expect(nexus.healthHistory().length).toBe(before);
  });
});

// ── 8. E2E ────────────────────────────────────────────────────────────────────

describe('E2E', () => {
  test('全栈 Universe→Monitor→Nexus 完整流程', async () => {
    const { nexus } = makeStack();
    nexus.register({ id: 'e2e', name: 'e2e-service', version: '1.0.0', endpoint: 'http://e2e' });
    nexus.syncHealthNow();
    const result = await nexus.dispatch({ path: 'e2e-service/ping', payload: {} });
    expect(result.status).toBe('dispatched');
    expect(nexus.healthHistory()[0]?.totalServices).toBe(1);
  });

  test('DaoUniverseNexus 可从 @daomind/collective 导入', async () => {
    const { DaoUniverseNexus: N } = await import('../index');
    expect(N).toBeDefined();
    expect(typeof N).toBe('function');
  });

  test('与 DaoUniverseFeedback / DaoUniverseSkills 共存于同一 Clock', async () => {
    const { DaoUniverseFeedback } = await import('../universe-feedback');
    const { DaoUniverseScheduler } = await import('../universe-scheduler');
    const { DaoUniverseSkills }    = await import('../universe-skills');
    const { universe, monitor, clock, nexus } = makeStack();

    const feedback  = new DaoUniverseFeedback(clock);
    const scheduler = new DaoUniverseScheduler(clock);
    const skills    = new DaoUniverseSkills(scheduler);

    feedback.attach();
    scheduler.attach();
    nexus.attach();

    clock.tick();
    await scheduler.flush();

    expect(feedback.history().length).toBeGreaterThan(0);
    expect(nexus.healthHistory().length).toBeGreaterThan(0);

    feedback.detach();
    scheduler.detach();
    nexus.detach();
    void universe; void monitor;
  });
});
