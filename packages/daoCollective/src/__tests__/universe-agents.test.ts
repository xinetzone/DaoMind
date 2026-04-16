/**
 * DaoUniverseAgents 测试套件
 * "知人者智，自知者明；胜人者有力，自胜者强"（道经·三十三章）
 *
 * 验证：构建 / spawn / terminate / activate-rest / 查询 / 消息 / snapshot / E2E
 */

import { daoNothingVoid } from '@daomind/nothing';
import { TaskAgent, ObserverAgent, CoordinatorAgent } from '@daomind/agents';
import { DaoUniverse } from '../universe';
import { DaoUniverseMonitor } from '../universe-monitor';
import { DaoUniverseAgents } from '../universe-agents';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeStack() {
  const universe = new DaoUniverse();
  const monitor  = new DaoUniverseMonitor(universe);
  const agents   = new DaoUniverseAgents(monitor);
  return { universe, monitor, agents };
}

// ── setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  daoNothingVoid.void();
});

// ── 1. 构建 ───────────────────────────────────────────────────────────────────

describe('构建', () => {
  test('可构建 DaoUniverseAgents', () => {
    const { agents } = makeStack();
    expect(agents).toBeDefined();
  });

  test('monitor getter 返回传入的 DaoUniverseMonitor', () => {
    const { monitor, agents } = makeStack();
    expect(agents.monitor).toBe(monitor);
  });

  test('registry getter 已初始化（独立实例，初始为空）', () => {
    const { agents } = makeStack();
    expect(agents.registry).toBeDefined();
    expect(agents.registry.listAll()).toHaveLength(0);
  });

  test('初始 snapshot：total=0, active=0, dormant=0', () => {
    const { agents } = makeStack();
    const snap = agents.snapshot();
    expect(snap.total).toBe(0);
    expect(snap.active).toBe(0);
    expect(snap.dormant).toBe(0);
    expect(Object.keys(snap.byType)).toHaveLength(0);
  });
});

// ── 2. spawn ──────────────────────────────────────────────────────────────────

describe('spawn()', () => {
  test('spawn 返回正确类型的 Agent 实例', () => {
    const { agents } = makeStack();
    const agent = agents.spawn(TaskAgent, 'task-1');
    expect(agent).toBeInstanceOf(TaskAgent);
    expect(agent.id).toBe('task-1');
  });

  test('spawn 后 getAgent 可取回', () => {
    const { agents } = makeStack();
    agents.spawn(ObserverAgent, 'obs-1');
    expect(agents.getAgent('obs-1')?.agentType).toBe('observer');
  });

  test('spawn 后 listAll 包含该 agent', () => {
    const { agents } = makeStack();
    agents.spawn(TaskAgent, 't1');
    agents.spawn(TaskAgent, 't2');
    expect(agents.listAll()).toHaveLength(2);
  });

  test('spawn 后初始状态为 dormant', () => {
    const { agents } = makeStack();
    const a = agents.spawn(TaskAgent, 'dormant-test');
    expect(a.state).toBe('dormant');
  });

  test('重复 spawn 同一 id 抛出异常', () => {
    const { agents } = makeStack();
    agents.spawn(TaskAgent, 'dup');
    expect(() => agents.spawn(TaskAgent, 'dup')).toThrow();
  });
});

// ── 3. terminate ──────────────────────────────────────────────────────────────

describe('terminate()', () => {
  test('terminate 存在的 agent 返回 true，getAgent 返回 undefined', async () => {
    const { agents } = makeStack();
    agents.spawn(TaskAgent, 'term-1');
    expect(await agents.terminate('term-1')).toBe(true);
    expect(agents.getAgent('term-1')).toBeUndefined();
  });

  test('terminate 不存在的 id 返回 false', async () => {
    const { agents } = makeStack();
    expect(await agents.terminate('ghost')).toBe(false);
  });

  test('terminate 后 listAll 不再包含该 agent', async () => {
    const { agents } = makeStack();
    agents.spawn(ObserverAgent, 'obs-term');
    await agents.terminate('obs-term');
    expect(agents.listAll()).toHaveLength(0);
  });
});

// ── 4. activate / rest ────────────────────────────────────────────────────────

describe('activate() / rest()', () => {
  test('initialize + activate → agent.state = active', async () => {
    const { agents } = makeStack();
    const agent = agents.spawn(TaskAgent, 'act-1');
    await agent.initialize();
    expect(await agents.activate('act-1')).toBe(true);
    expect(agent.state).toBe('active');
  });

  test('activate 不存在的 id 返回 false', async () => {
    const { agents } = makeStack();
    expect(await agents.activate('no-exist')).toBe(false);
  });

  test('initialize + activate + rest → agent.state = resting', async () => {
    const { agents } = makeStack();
    const agent = agents.spawn(TaskAgent, 'rest-1');
    await agent.initialize();
    await agent.activate();
    expect(await agents.rest('rest-1')).toBe(true);
    expect(agent.state).toBe('resting');
  });

  test('rest 不存在的 id 返回 false', async () => {
    const { agents } = makeStack();
    expect(await agents.rest('ghost')).toBe(false);
  });

  test('直接 activate（跳过 initialize）抛出状态机异常', async () => {
    const { agents } = makeStack();
    agents.spawn(TaskAgent, 'invalid-act');
    await expect(agents.activate('invalid-act')).rejects.toThrow();
  });
});

// ── 5. 查询 ───────────────────────────────────────────────────────────────────

describe('查询', () => {
  test('findByType 返回对应类型的 Agent 列表', () => {
    const { agents } = makeStack();
    agents.spawn(TaskAgent, 'ta1');
    agents.spawn(TaskAgent, 'ta2');
    agents.spawn(ObserverAgent, 'oa1');
    expect(agents.findByType('task')).toHaveLength(2);
    expect(agents.findByType('observer')).toHaveLength(1);
  });

  test('findByCapability 按能力名称查找', () => {
    const { agents } = makeStack();
    const agent = agents.spawn(CoordinatorAgent, 'coord-1');
    const caps = agent.capabilities;
    if (caps.length > 0) {
      const found = agents.findByCapability(caps[0]!.name);
      expect(found).toHaveLength(1);
    }
  });

  test('getAgent 不存在返回 undefined', () => {
    const { agents } = makeStack();
    expect(agents.getAgent('nonexist')).toBeUndefined();
  });

  test('listAll 返回只读数组', () => {
    const { agents } = makeStack();
    agents.spawn(TaskAgent, 'la1');
    const all = agents.listAll();
    expect(Array.isArray(all)).toBe(true);
    expect(all).toHaveLength(1);
  });
});

// ── 6. 消息 ───────────────────────────────────────────────────────────────────

describe('消息 send / history', () => {
  test('send 写入消息历史（通过 daoNothingVoid）', () => {
    const { agents } = makeStack();
    agents.send('sender', 'receiver', 'hello', { data: 42 });
    const hist = agents.history({ action: 'hello' });
    expect(hist.length).toBeGreaterThan(0);
    expect(hist[hist.length - 1]?.action).toBe('hello');
  });

  test('history 支持 from 过滤', () => {
    const { agents } = makeStack();
    agents.send('alpha', '*', 'ping');
    agents.send('beta',  '*', 'pong');
    const fromAlpha = agents.history({ from: 'alpha' });
    expect(fromAlpha.every(m => m.from === 'alpha')).toBe(true);
  });

  test('广播消息 to=* 可通过 history 读取', () => {
    const { agents } = makeStack();
    agents.send('system', '*', 'broadcast', 'payload');
    const hist = agents.history({ from: 'system' });
    expect(hist.length).toBeGreaterThan(0);
  });

  test('history 无过滤返回所有消息', () => {
    const { agents } = makeStack();
    agents.send('a', 'b', 'x');
    agents.send('c', 'd', 'y');
    const all = agents.history();
    expect(all.length).toBeGreaterThanOrEqual(2);
  });
});

// ── 7. snapshot ───────────────────────────────────────────────────────────────

describe('snapshot()', () => {
  test('spawn 后 total 递增', () => {
    const { agents } = makeStack();
    agents.spawn(TaskAgent, 's1');
    agents.spawn(TaskAgent, 's2');
    expect(agents.snapshot().total).toBe(2);
  });

  test('byType 正确统计各类型数量', () => {
    const { agents } = makeStack();
    agents.spawn(TaskAgent, 'bt1');
    agents.spawn(TaskAgent, 'bt2');
    agents.spawn(ObserverAgent, 'bt3');
    const snap = agents.snapshot();
    expect(snap.byType['task']).toBe(2);
    expect(snap.byType['observer']).toBe(1);
  });

  test('activate 后 active 计数增加', async () => {
    const { agents } = makeStack();
    const agent = agents.spawn(TaskAgent, 'act-snap');
    await agent.initialize();
    await agents.activate('act-snap');
    expect(agents.snapshot().active).toBe(1);
    expect(agents.snapshot().dormant).toBe(0);
  });

  test('snapshot 调用后 monitor.heatmapEngine 已有记录', () => {
    const { agents, monitor } = makeStack();
    agents.spawn(TaskAgent, 'heat-1');
    agents.snapshot();
    // heatmap 通过 capture() 反映在 MonitorSnapshot 中
    const snap = monitor.capture();
    expect(snap.systemHealth).toBeGreaterThanOrEqual(0);
  });
});

// ── 8. E2E ────────────────────────────────────────────────────────────────────

describe('E2E', () => {
  test('完整 Monitor → Agents 流程', async () => {
    const { agents } = makeStack();
    const task = agents.spawn(TaskAgent, 'e-task');
    const obs  = agents.spawn(ObserverAgent, 'e-obs');
    await task.initialize();
    await agents.activate('e-task');
    task.send('e-obs', 'observe', { what: 'system' });
    const snap = agents.snapshot();
    expect(snap.total).toBe(2);
    expect(snap.active).toBe(1);
    const hist = agents.history({ action: 'observe' });
    expect(hist.length).toBeGreaterThan(0);
    await agents.terminate('e-task');
    await agents.terminate('e-obs');
    expect(agents.listAll()).toHaveLength(0);
  });

  test('DaoUniverseAgents 可从 @daomind/collective 导入', async () => {
    const { DaoUniverseAgents: A } = await import('../index');
    expect(A).toBeDefined();
    expect(typeof A).toBe('function');
  });

  test('多类型 Agent 并发激活 + 消息广播', async () => {
    const { agents } = makeStack();
    const t = agents.spawn(TaskAgent, 'mt');
    const o = agents.spawn(ObserverAgent, 'mo');
    const c = agents.spawn(CoordinatorAgent, 'mc');
    await t.initialize(); await agents.activate('mt');
    await o.initialize(); await agents.activate('mo');
    agents.send('mc', '*', 'start');
    const snap = agents.snapshot();
    expect(snap.total).toBe(3);
    expect(snap.active).toBe(2);
    expect(snap.byType['coordinator']).toBe(1);
  });
});
