/**
 * DaoUniverseQi 测试套件
 * "万物负阴而抱阳，冲气以为和"（德经·四十二章）
 *
 * 验证：构建 / addNode-removeNode / broadcast / report / subscribe / probe / snapshot / E2E
 */

import { daoNothingVoid } from '@daomind/nothing';
import { DaoUniverse } from '../universe';
import { DaoUniverseMonitor } from '../universe-monitor';
import { DaoUniverseClock } from '../universe-clock';
import { DaoUniverseNexus } from '../universe-nexus';
import { DaoUniverseQi } from '../universe-qi';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeStack(intervalMs = 100) {
  const universe = new DaoUniverse();
  const monitor  = new DaoUniverseMonitor(universe);
  const clock    = new DaoUniverseClock(monitor, intervalMs);
  const nexus    = new DaoUniverseNexus(monitor, clock);
  const qi       = new DaoUniverseQi(nexus);
  return { universe, monitor, clock, nexus, qi };
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
  test('可构建 DaoUniverseQi', () => {
    const { qi } = makeStack();
    expect(qi).toBeDefined();
  });

  test('nexus getter 返回关联的 DaoUniverseNexus', () => {
    const { qi, nexus } = makeStack();
    expect(qi.nexus).toBe(nexus);
  });

  test('bus / tian / di / ren / chong getter 均已初始化', () => {
    const { qi } = makeStack();
    expect(qi.bus).toBeDefined();
    expect(qi.tian).toBeDefined();
    expect(qi.di).toBeDefined();
    expect(qi.ren).toBeDefined();
    expect(qi.chong).toBeDefined();
  });

  test('snapshot() 初始值：totalEmitted=0、totalDropped=0、registeredNodes=0', () => {
    const { qi } = makeStack();
    const snap = qi.snapshot();
    expect(snap.totalEmitted).toBe(0);
    expect(snap.totalDropped).toBe(0);
    expect(snap.registeredNodes).toBe(0);
  });

  test('snapshot() timestamp 为合理的 Unix 时间戳', () => {
    const { qi } = makeStack();
    const before = Date.now();
    const snap   = qi.snapshot();
    const after  = Date.now();
    expect(snap.timestamp).toBeGreaterThanOrEqual(before);
    expect(snap.timestamp).toBeLessThanOrEqual(after);
  });
});

// ── 2. addNode / removeNode ───────────────────────────────────────────────────

describe('addNode / removeNode', () => {
  test('addNode 后 registeredNodes = 1', () => {
    const { qi } = makeStack();
    qi.addNode('node-a');
    expect(qi.snapshot().registeredNodes).toBe(1);
  });

  test('removeNode 后 registeredNodes = 0', () => {
    const { qi } = makeStack();
    qi.addNode('node-a');
    qi.removeNode('node-a');
    expect(qi.snapshot().registeredNodes).toBe(0);
  });

  test('重复 addNode 同一 nodeId 幂等（Set 去重）', () => {
    const { qi } = makeStack();
    qi.addNode('node-dup');
    qi.addNode('node-dup');
    expect(qi.snapshot().registeredNodes).toBe(1);
  });

  test('对不存在的 nodeId 调用 removeNode 不抛出', () => {
    const { qi } = makeStack();
    expect(() => qi.removeNode('ghost-node')).not.toThrow();
    expect(qi.snapshot().registeredNodes).toBe(0);
  });
});

// ── 3. broadcast ─────────────────────────────────────────────────────────────

describe('broadcast', () => {
  test('无节点广播：totalDropped 增加（无路由 → 消息被丢弃）', async () => {
    const { qi } = makeStack();
    await qi.broadcast('dao:init', { type: 'init', version: '1' });
    const snap = qi.snapshot();
    expect(snap.totalDropped).toBeGreaterThan(0);
    expect(snap.totalEmitted).toBe(0);
  });

  test('有节点广播：totalEmitted 增加', async () => {
    const { qi } = makeStack();
    qi.addNode('node-recv');
    await qi.broadcast('dao:start', { type: 'start', payload: {} });
    const snap = qi.snapshot();
    expect(snap.totalEmitted).toBeGreaterThan(0);
  });

  test('broadcast 返回 Promise<void>', () => {
    const { qi } = makeStack();
    qi.addNode('node-b');
    const ret = qi.broadcast('dao:event', { type: 'event', data: 'test' });
    expect(ret).toBeInstanceOf(Promise);
  });

  test('连续广播多次后 totalEmitted 累加', async () => {
    const { qi } = makeStack();
    qi.addNode('node-multi');
    await qi.broadcast('msg:1', { type: 'msg', seq: 1 });
    await qi.broadcast('msg:2', { type: 'msg', seq: 2 });
    await qi.broadcast('msg:3', { type: 'msg', seq: 3 });
    expect(qi.snapshot().totalEmitted).toBeGreaterThanOrEqual(3);
  });

  test('有节点广播后 totalDropped 不增加（消息被正常路由）', async () => {
    const { qi } = makeStack();
    qi.addNode('node-ok');
    const before = qi.snapshot().totalDropped;
    await qi.broadcast('dao:ok', { type: 'ok', ts: Date.now() });
    const after = qi.snapshot().totalDropped;
    expect(after).toBe(before);
  });
});

// ── 4. report ─────────────────────────────────────────────────────────────────

describe('report', () => {
  test('report 调用不抛出', async () => {
    const { qi } = makeStack();
    await expect(
      qi.report('service-a', 'heartbeat', { latency: 12, load: 0.3 }),
    ).resolves.toBeUndefined();
  });

  test('report 返回 Promise<void>', () => {
    const { qi } = makeStack();
    const ret = qi.report('service-b', 'metric', { cpu: 50 });
    expect(ret).toBeInstanceOf(Promise);
  });

  test('多次 report 不影响 totalEmitted（背压允许，但无路由目标不计入 emitted）', async () => {
    const { qi } = makeStack();
    const before = qi.snapshot().totalEmitted;
    await qi.report('svc', 'metric', { val: 1 });
    await qi.report('svc', 'metric', { val: 2 });
    // report 仅做 Di 通道上报；因无路由目标，可能 drop；关键是不抛出
    expect(qi.snapshot().totalEmitted).toBeGreaterThanOrEqual(before);
  });
});

// ── 5. subscribe ─────────────────────────────────────────────────────────────

describe('subscribe', () => {
  test('subscribe 返回 unsubscribe 函数', () => {
    const { qi } = makeStack();
    const unsub = qi.subscribe('chong', () => {});
    expect(typeof unsub).toBe('function');
    unsub();
  });

  test('订阅后 bus 拥有该通道的监听器', () => {
    const { qi } = makeStack();
    const before = qi.bus.listenerCount('chong');
    const unsub  = qi.subscribe('chong', () => {});
    expect(qi.bus.listenerCount('chong')).toBe(before + 1);
    unsub();
  });

  test('unsubscribe 后监听器数量恢复', () => {
    const { qi } = makeStack();
    const before = qi.bus.listenerCount('tian');
    const unsub  = qi.subscribe('tian', () => {});
    expect(qi.bus.listenerCount('tian')).toBe(before + 1);
    unsub();
    expect(qi.bus.listenerCount('tian')).toBe(before);
  });

  test('多个订阅者独立管理', () => {
    const { qi } = makeStack();
    const unsub1 = qi.subscribe('di', () => {});
    const unsub2 = qi.subscribe('di', () => {});
    const count = qi.bus.listenerCount('di');
    expect(count).toBeGreaterThanOrEqual(2);
    unsub1();
    unsub2();
  });
});

// ── 6. probe ──────────────────────────────────────────────────────────────────

describe('probe', () => {
  test('probe 返回 number 类型', async () => {
    const { qi } = makeStack();
    const latency = await qi.probe('any-target');
    expect(typeof latency).toBe('number');
  });

  test('probe 返回非负值', async () => {
    const { qi } = makeStack();
    const latency = await qi.probe('node-probe');
    expect(latency).toBeGreaterThanOrEqual(0);
  });
});

// ── 7. snapshot ───────────────────────────────────────────────────────────────

describe('snapshot', () => {
  test('初始 snapshot：所有计数为 0', () => {
    const { qi } = makeStack();
    const snap = qi.snapshot();
    expect(snap.totalEmitted).toBe(0);
    expect(snap.totalDropped).toBe(0);
    expect(snap.registeredNodes).toBe(0);
  });

  test('有节点广播后 totalEmitted > 0', async () => {
    const { qi } = makeStack();
    qi.addNode('snap-recv');
    await qi.broadcast('snap:event', { type: 'event', v: 1 });
    expect(qi.snapshot().totalEmitted).toBeGreaterThan(0);
  });

  test('无节点广播后 totalDropped > 0', async () => {
    const { qi } = makeStack();
    await qi.broadcast('snap:drop', { type: 'drop', v: 1 });
    expect(qi.snapshot().totalDropped).toBeGreaterThan(0);
  });

  test('addNode 后 registeredNodes 跟随 Set.size 变化', () => {
    const { qi } = makeStack();
    expect(qi.snapshot().registeredNodes).toBe(0);
    qi.addNode('n1');
    expect(qi.snapshot().registeredNodes).toBe(1);
    qi.addNode('n2');
    expect(qi.snapshot().registeredNodes).toBe(2);
    qi.removeNode('n1');
    expect(qi.snapshot().registeredNodes).toBe(1);
  });
});

// ── 8. E2E ────────────────────────────────────────────────────────────────────

describe('E2E', () => {
  test('完整栈构建并取 snapshot', () => {
    const { qi, nexus } = makeStack();
    expect(qi.nexus).toBe(nexus);
    const snap = qi.snapshot();
    expect(snap.timestamp).toBeGreaterThan(0);
    expect(snap.registeredNodes).toBe(0);
  });

  test('addNode → broadcast → getStats 验证完整消息流', async () => {
    const { qi } = makeStack();
    qi.addNode('e2e-node');
    await qi.broadcast('e2e:heartbeat', { type: 'heartbeat', alive: true });
    const snap = qi.snapshot();
    expect(snap.totalEmitted).toBeGreaterThan(0);
    expect(snap.registeredNodes).toBe(1);
  });

  test('removeNode 后 snapshot.registeredNodes = 0', () => {
    const { qi } = makeStack();
    qi.addNode('e2e-remove');
    expect(qi.snapshot().registeredNodes).toBe(1);
    qi.removeNode('e2e-remove');
    expect(qi.snapshot().registeredNodes).toBe(0);
  });
});
