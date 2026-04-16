/**
 * DaoUniverseModules 测试套件
 * "为之于未有，治之于未乱"（道经·六十四章）
 *
 * 验证：构建 / register / initialize / activate / deactivate / terminate /
 *       查询 / resolve / snapshot / E2E
 */

import { daoNothingVoid } from '@daomind/nothing';
import { DaoUniverse } from '../universe';
import { DaoUniverseMonitor } from '../universe-monitor';
import { DaoUniverseAgents } from '../universe-agents';
import { DaoUniverseApps } from '../universe-apps';
import { DaoUniverseModules } from '../universe-modules';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeStack() {
  const universe = new DaoUniverse();
  const monitor  = new DaoUniverseMonitor(universe);
  const agents   = new DaoUniverseAgents(monitor);
  const apps     = new DaoUniverseApps(agents);
  const modules  = new DaoUniverseModules(apps);
  return { universe, monitor, agents, apps, modules };
}

function sampleMod(name: string, deps?: string[]) {
  return {
    name,
    version: '1.0.0',
    path:    `./modules/${name}`,
    ...(deps ? { dependencies: deps } : {}),
  };
}

// ── setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  daoNothingVoid.void();
});

// ── 1. 构建 ───────────────────────────────────────────────────────────────────

describe('构建', () => {
  test('可构建 DaoUniverseModules', () => {
    const { modules } = makeStack();
    expect(modules).toBeDefined();
  });

  test('apps getter 返回传入的 DaoUniverseApps', () => {
    const { apps, modules } = makeStack();
    expect(modules.apps).toBe(apps);
  });

  test('container getter 已初始化（独立实例，初始为空）', () => {
    const { modules } = makeStack();
    expect(modules.container).toBeDefined();
    expect(modules.listModules()).toHaveLength(0);
  });

  test('初始 snapshot 全零', () => {
    const { modules } = makeStack();
    const snap = modules.snapshot();
    expect(snap.total).toBe(0);
    expect(snap.active).toBe(0);
    expect(snap.registered).toBe(0);
    expect(snap.terminated).toBe(0);
  });
});

// ── 2. register ───────────────────────────────────────────────────────────────

describe('register()', () => {
  test('register 后 getModule 返回 registered 状态', () => {
    const { modules } = makeStack();
    modules.register(sampleMod('mod1'));
    expect(modules.getModule('mod1')?.lifecycle).toBe('registered');
  });

  test('register 后 listModules 长度增加', () => {
    const { modules } = makeStack();
    modules.register(sampleMod('m1'));
    modules.register(sampleMod('m2'));
    expect(modules.listModules()).toHaveLength(2);
  });

  test('重复 register 同一 name 抛出', () => {
    const { modules } = makeStack();
    modules.register(sampleMod('dup'));
    expect(() => modules.register(sampleMod('dup'))).toThrow();
  });
});

// ── 3. initialize ─────────────────────────────────────────────────────────────

describe('initialize()', () => {
  test('registered → initialized', async () => {
    const { modules } = makeStack();
    modules.register(sampleMod('init1'));
    await modules.initialize('init1');
    expect(modules.getModule('init1')?.lifecycle).toBe('initialized');
  });

  test('initialize 不存在的 name 抛出', async () => {
    const { modules } = makeStack();
    await expect(modules.initialize('ghost')).rejects.toThrow();
  });

  test('非法状态转换抛出（active → initialized 不允许）', async () => {
    const { modules } = makeStack();
    modules.register(sampleMod('inv1'));
    await modules.initialize('inv1');
    await modules.activate('inv1');
    await expect(modules.initialize('inv1')).rejects.toThrow();
  });
});

// ── 4. activate ───────────────────────────────────────────────────────────────

describe('activate()', () => {
  test('initialized → active', async () => {
    const { modules } = makeStack();
    modules.register(sampleMod('act1'));
    await modules.initialize('act1');
    await modules.activate('act1');
    expect(modules.getModule('act1')?.lifecycle).toBe('active');
  });

  test('activate 后 snapshot.active 增加', async () => {
    const { modules } = makeStack();
    modules.register(sampleMod('act2'));
    await modules.initialize('act2');
    await modules.activate('act2');
    expect(modules.snapshot().active).toBe(1);
  });

  test('activate 后 agents.history 含 module:activated 消息', async () => {
    const { agents, modules } = makeStack();
    modules.register(sampleMod('act3'));
    await modules.initialize('act3');
    await modules.activate('act3');
    const hist = agents.history({ action: 'module:activated' });
    expect(hist.length).toBeGreaterThan(0);
    expect((hist[hist.length - 1]?.payload as { name: string } | undefined)?.name).toBe('act3');
  });

  test('activate 不存在的 name 抛出', async () => {
    const { modules } = makeStack();
    await expect(modules.activate('ghost')).rejects.toThrow();
  });
});

// ── 5. deactivate ─────────────────────────────────────────────────────────────

describe('deactivate()', () => {
  test('active → suspending', async () => {
    const { modules } = makeStack();
    modules.register(sampleMod('deact1'));
    await modules.initialize('deact1');
    await modules.activate('deact1');
    await modules.deactivate('deact1');
    expect(modules.getModule('deact1')?.lifecycle).toBe('suspending');
  });

  test('deactivate 不存在的 name 抛出', async () => {
    const { modules } = makeStack();
    await expect(modules.deactivate('ghost')).rejects.toThrow();
  });
});

// ── 6. terminate ──────────────────────────────────────────────────────────────

describe('terminate()', () => {
  test('registered → terminated', async () => {
    const { modules } = makeStack();
    modules.register(sampleMod('term1'));
    await modules.terminate('term1');
    expect(modules.getModule('term1')?.lifecycle).toBe('terminated');
  });

  test('terminate 后 snapshot.terminated 增加', async () => {
    const { modules } = makeStack();
    modules.register(sampleMod('term2'));
    await modules.terminate('term2');
    expect(modules.snapshot().terminated).toBe(1);
  });

  test('terminate 后 agents.history 含 module:terminated 消息', async () => {
    const { agents, modules } = makeStack();
    modules.register(sampleMod('term3'));
    await modules.terminate('term3');
    const hist = agents.history({ action: 'module:terminated' });
    expect(hist.length).toBeGreaterThan(0);
    expect((hist[hist.length - 1]?.payload as { name: string } | undefined)?.name).toBe('term3');
  });
});

// ── 7. 查询 ───────────────────────────────────────────────────────────────────

describe('查询', () => {
  test('listByLifecycle 按状态过滤', async () => {
    const { modules } = makeStack();
    modules.register(sampleMod('q1'));
    modules.register(sampleMod('q2'));
    await modules.initialize('q1');
    await modules.activate('q1');
    expect(modules.listByLifecycle('active')).toHaveLength(1);
    expect(modules.listByLifecycle('registered')).toHaveLength(1);
  });

  test('getModule 不存在返回 undefined', () => {
    const { modules } = makeStack();
    expect(modules.getModule('noexist')).toBeUndefined();
  });

  test('listModules 返回所有模块', async () => {
    const { modules } = makeStack();
    modules.register(sampleMod('la1'));
    modules.register(sampleMod('la2'));
    await modules.terminate('la1');
    expect(modules.listModules()).toHaveLength(2);
  });
});

// ── 8. resolve ────────────────────────────────────────────────────────────────

describe('resolve()', () => {
  test('resolve 未激活的模块抛出"模块未激活"', async () => {
    const { modules } = makeStack();
    modules.register(sampleMod('res1'));
    await expect(modules.resolve('res1')).rejects.toThrow(/未激活/);
  });

  test('resolve 未注册的模块抛出"模块未注册"', async () => {
    const { modules } = makeStack();
    await expect(modules.resolve('not-registered')).rejects.toThrow(/未注册/);
  });
});

// ── 9. snapshot ───────────────────────────────────────────────────────────────

describe('snapshot()', () => {
  test('byLifecycle 正确统计各状态数量', async () => {
    const { modules } = makeStack();
    modules.register(sampleMod('sn1'));
    modules.register(sampleMod('sn2'));
    await modules.initialize('sn1');
    await modules.activate('sn1');
    const snap = modules.snapshot();
    expect(snap.byLifecycle['active']).toBe(1);
    expect(snap.byLifecycle['registered']).toBe(1);
  });

  test('total = 已注册模块总数', () => {
    const { modules } = makeStack();
    modules.register(sampleMod('t1'));
    modules.register(sampleMod('t2'));
    modules.register(sampleMod('t3'));
    expect(modules.snapshot().total).toBe(3);
  });

  test('active / registered / terminated 字段正确', async () => {
    const { modules } = makeStack();
    modules.register(sampleMod('f1'));
    modules.register(sampleMod('f2'));
    await modules.initialize('f1'); await modules.activate('f1');
    await modules.terminate('f2');
    const snap = modules.snapshot();
    expect(snap.active).toBe(1);
    expect(snap.terminated).toBe(1);
    expect(snap.registered).toBe(0);
  });
});

// ── 10. E2E ───────────────────────────────────────────────────────────────────

describe('E2E', () => {
  test('DaoUniverseModules 可从 @daomind/collective 导入', async () => {
    const { DaoUniverseModules: M } = await import('../index');
    expect(M).toBeDefined();
    expect(typeof M).toBe('function');
  });

  test('完整 register → initialize → activate → deactivate → terminate 流程', async () => {
    const { agents, modules } = makeStack();
    modules.register(sampleMod('e2e'));
    expect(modules.snapshot().registered).toBe(1);

    await modules.initialize('e2e');
    expect(modules.getModule('e2e')?.lifecycle).toBe('initialized');

    await modules.activate('e2e');
    expect(modules.snapshot().active).toBe(1);

    // 广播验证
    let hist = agents.history({ action: 'module:activated' });
    expect(hist.length).toBeGreaterThan(0);

    await modules.deactivate('e2e');
    expect(modules.getModule('e2e')?.lifecycle).toBe('suspending');

    await modules.terminate('e2e');
    expect(modules.snapshot().terminated).toBe(1);

    hist = agents.history({ action: 'module:terminated' });
    expect(hist.length).toBeGreaterThan(0);
  });
});
