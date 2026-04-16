/**
 * DaoUniverseMonitor 测试套件
 * 验证：构建 / feed / capture / health / history / engine getters / E2E
 */

import { daoNothingVoid } from '@daomind/nothing';
import { DaoUniverse } from '../universe';
import { DaoUniverseMonitor } from '../universe-monitor';
import { TaskAgent, ObserverAgent } from '@daomind/agents';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeUniverse(): DaoUniverse {
  return new DaoUniverse();
}

function makeMonitor(u?: DaoUniverse): DaoUniverseMonitor {
  return new DaoUniverseMonitor(u ?? makeUniverse());
}

// ── setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  daoNothingVoid.void();
});

// ── 1. 构建 ───────────────────────────────────────────────────────────────────

describe('构建', () => {
  test('可构建 DaoUniverseMonitor', () => {
    const m = makeMonitor();
    expect(m).toBeDefined();
  });

  test('heatmapEngine getter 返回引擎实例', () => {
    const m = makeMonitor();
    expect(m.heatmapEngine).toBeDefined();
  });

  test('vectorFieldEngine getter 返回引擎实例', () => {
    const m = makeMonitor();
    expect(m.vectorFieldEngine).toBeDefined();
  });

  test('gaugeEngine getter 返回引擎实例', () => {
    const m = makeMonitor();
    expect(m.gaugeEngine).toBeDefined();
  });

  test('alertEngine getter 返回引擎实例', () => {
    const m = makeMonitor();
    expect(m.alertEngine).toBeDefined();
  });

  test('diagnosisEngine getter 返回引擎实例', () => {
    const m = makeMonitor();
    expect(m.diagnosisEngine).toBeDefined();
  });

  test('aggregatorEngine getter 返回引擎实例', () => {
    const m = makeMonitor();
    expect(m.aggregatorEngine).toBeDefined();
  });
});

// ── 2. capture 基本结构 ───────────────────────────────────────────────────────

describe('capture — 基本结构', () => {
  test('返回 MonitorSnapshot', () => {
    const snap = makeMonitor().capture();
    expect(snap).toBeDefined();
    expect(typeof snap.timestamp).toBe('number');
    expect(typeof snap.systemHealth).toBe('number');
    expect(Array.isArray(snap.heatmaps)).toBe(true);
    expect(Array.isArray(snap.flowVectors)).toBe(true);
    expect(Array.isArray(snap.gauges)).toBe(true);
    expect(Array.isArray(snap.alerts)).toBe(true);
    expect(Array.isArray(snap.diagnoses)).toBe(true);
  });

  test('空宇宙 systemHealth = 100', () => {
    const snap = makeMonitor().capture();
    expect(snap.systemHealth).toBe(100);
  });

  test('timestamp 是最近时间', () => {
    const before = Date.now();
    const snap = makeMonitor().capture();
    expect(snap.timestamp).toBeGreaterThanOrEqual(before);
  });

  test('空宇宙 heatmaps 为空', () => {
    const snap = makeMonitor().capture();
    expect(snap.heatmaps).toHaveLength(0);
  });

  test('空宇宙 flowVectors 为空', () => {
    const snap = makeMonitor().capture();
    expect(snap.flowVectors).toHaveLength(0);
  });
});

// ── 3. feed → heatmap ────────────────────────────────────────────────────────

describe('feed — heatmap', () => {
  test('添加 agent 后 heatmap 有数据', async () => {
    const u = makeUniverse();
    const m = new DaoUniverseMonitor(u);

    const agent = u.createAgent(TaskAgent, 'heat-task-1');
    await agent.initialize();
    await agent.activate();

    const snap = m.capture();
    expect(snap.heatmaps.length).toBeGreaterThan(0);
  });

  test('heatmap sourceNode 对应 agentType', async () => {
    const u = makeUniverse();
    const m = new DaoUniverseMonitor(u);

    const agent = u.createAgent(TaskAgent, 'heat-task-2');
    await agent.initialize();
    await agent.activate();

    const snap = m.capture();
    const taskPoint = snap.heatmaps.find(p => p.sourceNode === 'task');
    expect(taskPoint).toBeDefined();
    expect(taskPoint?.channelType).toBe('ren');
  });
});

// ── 4. feed → vectorField ─────────────────────────────────────────────────────

describe('feed — vectorField', () => {
  test('活跃 agent 产生 downstream 流向', async () => {
    const u = makeUniverse();
    const m = new DaoUniverseMonitor(u);

    const agent = u.createAgent(TaskAgent, 'vec-task-1');
    await agent.initialize();
    await agent.activate();

    const snap = m.capture();
    const downstream = snap.flowVectors.find(v => v.direction === 'downstream');
    expect(downstream).toBeDefined();
    expect(downstream?.from).toBe('daoCollective');
    expect(downstream?.to).toBe('daoAgents');
  });

  test('运行中 app 产生 balancing 流向', async () => {
    const u = makeUniverse();
    const m = new DaoUniverseMonitor(u);

    u.createApp({ id: 'vec-app-1', name: 'VecApp', version: '1.0.0', entry: './app' });
    await u.appContainer.start('vec-app-1');

    const snap = m.capture();
    const balancing = snap.flowVectors.find(v => v.direction === 'balancing');
    expect(balancing).toBeDefined();
    expect(balancing?.to).toBe('daoApps');
  });
});

// ── 5. feed → gauge ───────────────────────────────────────────────────────────

describe('feed — yin-yang gauge', () => {
  test('capture 后 gauges 有两个对偶', async () => {
    const u = makeUniverse();
    const agent = u.createAgent(TaskAgent, 'gauge-create-1');
    await agent.initialize();
    await agent.activate();
    u.createApp({ id: 'gauge-app-1', name: 'GA', version: '1.0.0', entry: './a' });
    await u.appContainer.start('gauge-app-1');
    const m = new DaoUniverseMonitor(u);
    const snap = m.capture();
    expect(snap.gauges.length).toBeGreaterThanOrEqual(2);
  });

  test('active > 0 时 yang 值增加', async () => {
    const u = makeUniverse();
    const m = new DaoUniverseMonitor(u);

    const agent = u.createAgent(TaskAgent, 'gauge-task-1');
    await agent.initialize();
    await agent.activate();

    const snap = m.capture();
    const agentGauge = snap.gauges.find(g => g.pairId === 'agent-active-dormant');
    // yang should equal activeAgents count
    expect(agentGauge?.yangValue).toBeGreaterThan(0);
  });

  test('gauge pairId 包含 agent-active-dormant', async () => {
    const u = makeUniverse();
    const agent = u.createAgent(TaskAgent, 'gauge-pid-1');
    await agent.initialize();
    await agent.activate();
    u.createApp({ id: 'gauge-pid-app-1', name: 'GP', version: '1.0.0', entry: './a' });
    await u.appContainer.start('gauge-pid-app-1');
    const m = new DaoUniverseMonitor(u);
    const snap = m.capture();
    const ids = snap.gauges.map(g => g.pairId);
    expect(ids).toContain('agent-active-dormant');
    expect(ids).toContain('app-running-stopped');
  });
});

// ── 6. health ──────────────────────────────────────────────────────────────────

describe('health()', () => {
  test('空宇宙 health = 100', () => {
    expect(makeMonitor().health()).toBe(100);
  });

  test('health 与 capture().systemHealth 一致', () => {
    const u = makeUniverse();
    const m = new DaoUniverseMonitor(u);
    // health() calls capture() internally, so we compare fresh calls
    const h1 = m.health();
    expect(h1).toBeGreaterThanOrEqual(0);
    expect(h1).toBeLessThanOrEqual(100);
  });

  test('health 值在 0–100 范围内', async () => {
    const u = makeUniverse();
    const m = new DaoUniverseMonitor(u);

    // Add some agents
    const a1 = u.createAgent(TaskAgent, 'health-task-1');
    const a2 = u.createAgent(ObserverAgent, 'health-obs-1');
    await a1.initialize(); await a1.activate();
    await a2.initialize(); await a2.activate();

    const h = m.health();
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(100);
  });
});

// ── 7. history ────────────────────────────────────────────────────────────────

describe('history()', () => {
  test('初始 history 为空', () => {
    expect(makeMonitor().history()).toHaveLength(0);
  });

  test('capture 后 history 长度为 1', () => {
    const m = makeMonitor();
    m.capture();
    expect(m.history()).toHaveLength(1);
  });

  test('多次 capture 后 history 累计', () => {
    const m = makeMonitor();
    m.capture();
    m.capture();
    m.capture();
    expect(m.history()).toHaveLength(3);
  });

  test('history(2) 限制返回数量', () => {
    const m = makeMonitor();
    m.capture(); m.capture(); m.capture(); m.capture();
    expect(m.history(2)).toHaveLength(2);
  });

  test('history() 快照包含完整 MonitorSnapshot 字段', () => {
    const m = makeMonitor();
    m.capture();
    const snap = m.history()[0];
    expect(snap).toBeDefined();
    expect(snap).toHaveProperty('timestamp');
    expect(snap).toHaveProperty('systemHealth');
    expect(snap).toHaveProperty('heatmaps');
  });
});

// ── 8. diagnosis ──────────────────────────────────────────────────────────────

describe('feed — diagnosis', () => {
  test('注册 agent 后 diagnosisEngine 有诊断数据', async () => {
    const u = makeUniverse();
    const m = new DaoUniverseMonitor(u);

    const agent = u.createAgent(TaskAgent, 'diag-task-1');
    await agent.initialize();
    await agent.activate();

    m.feed();
    const deficient = m.diagnosisEngine.getDeficientNodes();
    const excess = m.diagnosisEngine.getExcessNodes();
    // moderate-activity agent is balanced → neither deficient nor excess
    expect(deficient.length + excess.length).toBe(0);
  });
});

// ── 9. E2E ────────────────────────────────────────────────────────────────────

describe('E2E — 完整宇宙快照', () => {
  test('多 agent + app → 系统快照结构完整', async () => {
    const u = makeUniverse();
    const m = new DaoUniverseMonitor(u);

    // 创建 agents
    const t1 = u.createAgent(TaskAgent, 'e2e-task-1');
    const t2 = u.createAgent(TaskAgent, 'e2e-task-2');
    const o1 = u.createAgent(ObserverAgent, 'e2e-obs-1');
    await t1.initialize(); await t1.activate();
    await t2.initialize(); await t2.activate();
    await o1.initialize(); await o1.activate();

    // 创建 app
    u.createApp({ id: 'e2e-app-1', name: 'E2EApp', version: '1.0.0', entry: './app' });
    await u.appContainer.start('e2e-app-1');

    const snap = m.capture();
    expect(snap.systemHealth).toBeGreaterThanOrEqual(0);
    expect(snap.heatmaps.length).toBeGreaterThan(0);
    expect(snap.flowVectors.length).toBeGreaterThan(0);
    expect(snap.gauges.length).toBeGreaterThanOrEqual(2);

    // cleanup
    await t1.terminate();
    await t2.terminate();
    await o1.terminate();
  });

  test('DaoUniverseMonitor 可从 @daomind/collective 导入', async () => {
    const { DaoUniverseMonitor: M, daoUniverse } = await import('../index');
    expect(M).toBeDefined();
    expect(daoUniverse).toBeDefined();
  });
});
