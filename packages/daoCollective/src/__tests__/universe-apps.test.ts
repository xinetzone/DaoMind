/**
 * DaoUniverseApps 测试套件
 * "为之于未有，治之于未乱"（道经·六十四章）
 *
 * 验证：构建 / register-unregister / start-stop-restart / 查询 / lifecycle hooks / snapshot / E2E
 */

import { daoNothingVoid } from '@daomind/nothing';
import { TaskAgent } from '@daomind/agents';
import { DaoUniverse } from '../universe';
import { DaoUniverseMonitor } from '../universe-monitor';
import { DaoUniverseAgents } from '../universe-agents';
import { DaoUniverseApps } from '../universe-apps';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeStack() {
  const universe = new DaoUniverse();
  const monitor  = new DaoUniverseMonitor(universe);
  const agents   = new DaoUniverseAgents(monitor);
  const apps     = new DaoUniverseApps(agents);
  return { universe, monitor, agents, apps };
}

function sampleApp(id: string, deps?: string[]) {
  return {
    id,
    name:    `${id}-app`,
    version: '1.0.0',
    entry:   `./${id}`,
    ...(deps ? { dependencies: deps } : {}),
  };
}

// ── setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  daoNothingVoid.void();
});

// ── 1. 构建 ───────────────────────────────────────────────────────────────────

describe('构建', () => {
  test('可构建 DaoUniverseApps', () => {
    const { apps } = makeStack();
    expect(apps).toBeDefined();
  });

  test('agents getter 返回传入的 DaoUniverseAgents', () => {
    const { agents, apps } = makeStack();
    expect(apps.agents).toBe(agents);
  });

  test('container getter 已初始化（独立实例，初始为空）', () => {
    const { apps } = makeStack();
    expect(apps.container).toBeDefined();
    expect(apps.listAll()).toHaveLength(0);
  });

  test('初始 snapshot：total=0, running=0', () => {
    const { apps } = makeStack();
    const snap = apps.snapshot();
    expect(snap.total).toBe(0);
    expect(snap.running).toBe(0);
    expect(snap.registered).toBe(0);
    expect(snap.stopped).toBe(0);
  });
});

// ── 2. register / unregister ──────────────────────────────────────────────────

describe('register() / unregister()', () => {
  test('register 后 getApp 可取回，state = registered', () => {
    const { apps } = makeStack();
    apps.register(sampleApp('app1'));
    expect(apps.getApp('app1')?.state).toBe('registered');
  });

  test('register 后 listAll 长度增加', () => {
    const { apps } = makeStack();
    apps.register(sampleApp('a1'));
    apps.register(sampleApp('a2'));
    expect(apps.listAll()).toHaveLength(2);
  });

  test('重复 register 同一 id 抛出异常', () => {
    const { apps } = makeStack();
    apps.register(sampleApp('dup'));
    expect(() => apps.register(sampleApp('dup'))).toThrow();
  });

  test('unregister 已注册应用返回 true', () => {
    const { apps } = makeStack();
    apps.register(sampleApp('unreg'));
    expect(apps.unregister('unreg')).toBe(true);
    expect(apps.getApp('unreg')).toBeUndefined();
  });

  test('unregister 不存在的 id 返回 false', () => {
    const { apps } = makeStack();
    expect(apps.unregister('ghost')).toBe(false);
  });
});

// ── 3. start / stop / restart ─────────────────────────────────────────────────

describe('start() / stop() / restart()', () => {
  test('start 后 state = running', async () => {
    const { apps } = makeStack();
    apps.register(sampleApp('s1'));
    await apps.start('s1');
    expect(apps.getApp('s1')?.state).toBe('running');
  });

  test('start 未注册的 app 抛出异常', async () => {
    const { apps } = makeStack();
    await expect(apps.start('noexist')).rejects.toThrow();
  });

  test('stop 后 state = stopped', async () => {
    const { apps } = makeStack();
    apps.register(sampleApp('s2'));
    await apps.start('s2');
    await apps.stop('s2');
    expect(apps.getApp('s2')?.state).toBe('stopped');
  });

  test('stop 未运行的 app 抛出异常', async () => {
    const { apps } = makeStack();
    apps.register(sampleApp('s3'));  // registered, not running
    await expect(apps.stop('s3')).rejects.toThrow();
  });

  test('restart 后 state = running', async () => {
    const { apps } = makeStack();
    apps.register(sampleApp('r1'));
    await apps.start('r1');
    await apps.restart('r1');
    expect(apps.getApp('r1')?.state).toBe('running');
  });

  test('start 依赖未就绪时抛出异常', async () => {
    const { apps } = makeStack();
    apps.register(sampleApp('dep-main', ['dep-required']));
    apps.register(sampleApp('dep-required')); // registered, not running
    await expect(apps.start('dep-main')).rejects.toThrow();
  });
});

// ── 4. 查询 ───────────────────────────────────────────────────────────────────

describe('查询', () => {
  test('listByState 返回对应状态的应用', async () => {
    const { apps } = makeStack();
    apps.register(sampleApp('q1'));
    apps.register(sampleApp('q2'));
    await apps.start('q1');
    expect(apps.listByState('running')).toHaveLength(1);
    expect(apps.listByState('registered')).toHaveLength(1);
  });

  test('getApp 不存在返回 undefined', () => {
    const { apps } = makeStack();
    expect(apps.getApp('nonexist')).toBeUndefined();
  });

  test('listAll 在 stop 后仍包含该应用（状态为 stopped）', async () => {
    const { apps } = makeStack();
    apps.register(sampleApp('q3'));
    await apps.start('q3');
    await apps.stop('q3');
    expect(apps.listAll()).toHaveLength(1);
    expect(apps.listAll()[0]?.state).toBe('stopped');
  });

  test('unregister 后 listAll 不再包含', () => {
    const { apps } = makeStack();
    apps.register(sampleApp('q4'));
    apps.unregister('q4');
    expect(apps.listAll()).toHaveLength(0);
  });
});

// ── 5. lifecycle hooks ────────────────────────────────────────────────────────

describe('onStateChange() / getHistory()', () => {
  test('start 触发 onStateChange 回调', async () => {
    const { apps } = makeStack();
    apps.register(sampleApp('lc1'));
    const transitions: Array<{ from: string; to: string }> = [];
    apps.onStateChange('lc1', (from, to) => transitions.push({ from, to }));
    await apps.start('lc1');
    expect(transitions).toHaveLength(1);
    expect(transitions[0]).toEqual({ from: 'registered', to: 'running' });
  });

  test('stop 触发 onStateChange 回调', async () => {
    const { apps } = makeStack();
    apps.register(sampleApp('lc2'));
    const transitions: string[] = [];
    apps.onStateChange('lc2', (_, to) => transitions.push(to));
    await apps.start('lc2');
    await apps.stop('lc2');
    expect(transitions).toContain('running');
    expect(transitions).toContain('stopped');
  });

  test('onStateChange 返回的 dispose 函数可取消订阅', async () => {
    const { apps } = makeStack();
    apps.register(sampleApp('lc3'));
    let count = 0;
    const dispose = apps.onStateChange('lc3', () => count++);
    await apps.start('lc3');
    dispose();
    await apps.stop('lc3');
    expect(count).toBe(1); // 只有 start 时触发，stop 已取消
  });

  test('getHistory 返回状态转换历史', async () => {
    const { apps } = makeStack();
    apps.register(sampleApp('lc4'));
    await apps.start('lc4');
    await apps.stop('lc4');
    const hist = apps.getHistory('lc4');
    expect(hist.length).toBe(2);
    expect(hist[0]).toMatchObject({ from: 'registered', to: 'running' });
    expect(hist[1]).toMatchObject({ from: 'running', to: 'stopped' });
  });

  test('getHistory limit 参数生效', async () => {
    const { apps } = makeStack();
    apps.register(sampleApp('lc5'));
    await apps.start('lc5');
    await apps.stop('lc5');
    expect(apps.getHistory('lc5', 1)).toHaveLength(1);
  });
});

// ── 6. snapshot ───────────────────────────────────────────────────────────────

describe('snapshot()', () => {
  test('register 后 registered 计数增加', () => {
    const { apps } = makeStack();
    apps.register(sampleApp('sn1'));
    apps.register(sampleApp('sn2'));
    const snap = apps.snapshot();
    expect(snap.registered).toBe(2);
    expect(snap.total).toBe(2);
  });

  test('start 后 running 计数增加', async () => {
    const { apps } = makeStack();
    apps.register(sampleApp('sn3'));
    await apps.start('sn3');
    expect(apps.snapshot().running).toBe(1);
    expect(apps.snapshot().registered).toBe(0);
  });

  test('stop 后 stopped 计数增加', async () => {
    const { apps } = makeStack();
    apps.register(sampleApp('sn4'));
    await apps.start('sn4');
    await apps.stop('sn4');
    expect(apps.snapshot().stopped).toBe(1);
    expect(apps.snapshot().running).toBe(0);
  });

  test('byState 全分布正确', async () => {
    const { apps } = makeStack();
    apps.register(sampleApp('sn5'));   // registered
    apps.register(sampleApp('sn6'));   // registered
    await apps.start('sn5');           // running
    const snap = apps.snapshot();
    expect(snap.byState['running']).toBe(1);
    expect(snap.byState['registered']).toBe(1);
    expect(snap.total).toBe(2);
  });
});

// ── 7. Agent 广播集成 ─────────────────────────────────────────────────────────

describe('Agent 广播集成', () => {
  test('start 后 agents.history 含 app:started 消息', async () => {
    const { apps, agents } = makeStack();
    apps.register(sampleApp('bc1'));
    await apps.start('bc1');
    const hist = agents.history({ action: 'app:started' });
    expect(hist.length).toBeGreaterThan(0);
    expect((hist[hist.length - 1]?.payload as { id: string } | undefined)?.id).toBe('bc1');
  });

  test('stop 后 agents.history 含 app:stopped 消息', async () => {
    const { apps, agents } = makeStack();
    apps.register(sampleApp('bc2'));
    await apps.start('bc2');
    await apps.stop('bc2');
    const hist = agents.history({ action: 'app:stopped' });
    expect(hist.length).toBeGreaterThan(0);
  });
});

// ── 8. E2E ────────────────────────────────────────────────────────────────────

describe('E2E', () => {
  test('完整 Agents → Apps 流程：Agent 感知应用起停', async () => {
    const { agents, apps } = makeStack();
    // 创建一个 Observer Agent 来监听应用消息
    const obs = agents.spawn(TaskAgent, 'watcher');
    await obs.initialize();
    await agents.activate('watcher');

    // 注册并启动应用
    apps.register(sampleApp('main'));
    await apps.start('main');

    // 应用历史确认
    const hist = agents.history({ action: 'app:started' });
    expect(hist.length).toBeGreaterThan(0);

    // 停止并验证
    await apps.stop('main');
    const snap = apps.snapshot();
    expect(snap.stopped).toBe(1);
    expect(snap.running).toBe(0);
  });

  test('DaoUniverseApps 可从 @daomind/collective 导入', async () => {
    const { DaoUniverseApps: A } = await import('../index');
    expect(A).toBeDefined();
    expect(typeof A).toBe('function');
  });

  test('多应用依赖链 start 顺序验证', async () => {
    const { apps } = makeStack();
    apps.register(sampleApp('base'));
    apps.register(sampleApp('mid',  ['base']));
    apps.register(sampleApp('top',  ['mid']));

    await apps.start('base');
    await apps.start('mid');
    await apps.start('top');

    expect(apps.snapshot().running).toBe(3);

    await apps.stop('top');
    await apps.stop('mid');
    await apps.stop('base');

    expect(apps.snapshot().stopped).toBe(3);
  });
});
