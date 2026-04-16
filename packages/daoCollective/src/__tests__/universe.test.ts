/** DaoUniverse 测试 —— 道宇宙根节点门面
 * 帛书依据："道生一，一生二，二生三，三生万物"（乙本·四十二章）
 * 测试原则：每个测试用新的 DaoUniverse 实例，避免状态污染 */

import { daoNothingVoid } from '@daomind/nothing';
import { DaoBaseAgent } from '@daomind/agents';
import type { DaoAgentCapability } from '@daomind/agents';
import { TaskAgent, ObserverAgent, CoordinatorAgent } from '@daomind/agents';
import { DaoUniverse } from '../universe';
import type { DaoSystemSnapshot } from '../universe';

// ── 测试用 Agent ──────────────────────────────────────────────

class CounterAgent extends DaoBaseAgent {
  readonly agentType = 'counter';
  readonly capabilities: ReadonlyArray<DaoAgentCapability> = [
    { name: 'count', version: '1.0.0' },
  ];
  private count = 0;

  async execute<T>(action: string, payload?: unknown): Promise<T> {
    if (action === 'increment') { this.count += (payload as number | undefined) ?? 1; }
    if (action === 'reset')     { this.count = 0; }
    if (action === 'get')       { return this.count as T; }
    return this.count as T;
  }
}

class EchoAgent extends DaoBaseAgent {
  readonly agentType = 'echo';
  readonly capabilities: ReadonlyArray<DaoAgentCapability> = [
    { name: 'echo', version: '1.0.0' },
  ];
  async execute<T>(_action: string, payload?: unknown): Promise<T> {
    return payload as T;
  }
}

// ── 测试套件 ─────────────────────────────────────────────────

describe('DaoUniverse', () => {
  let universe: DaoUniverse;

  beforeEach(() => {
    daoNothingVoid.void();          // 先清空事件总线
    universe = new DaoUniverse();   // 再创建新实例（bridge 注册新监听器）
  });

  afterEach(() => {
    universe.bridge.dispose();      // 清理 bridge 监听器
  });

  // ── 1. 基础创建 ────────────────────────────────────────────

  test('1. 创建 DaoUniverse 实例', () => {
    expect(universe).toBeDefined();
    expect(universe.container).toBeDefined();
    expect(universe.agentRegistry).toBeDefined();
    expect(universe.appContainer).toBeDefined();
    expect(universe.bridge).toBeDefined();
  });

  test('2. .void getter 返回 daoNothingVoid 单例', () => {
    expect(universe.void).toBe(daoNothingVoid);
  });

  // ── 2. createAgent ─────────────────────────────────────────

  test('3. createAgent 返回正确类型', () => {
    const agent = universe.createAgent(CounterAgent, 'counter-1');
    expect(agent).toBeInstanceOf(CounterAgent);
    expect(agent.id).toBe('counter-1');
    expect(agent.agentType).toBe('counter');
  });

  test('4. createAgent 自动注册到 agentRegistry', () => {
    const agent = universe.createAgent(CounterAgent, 'counter-1');
    expect(universe.agentRegistry.get('counter-1')).toBe(agent);
    expect(universe.agentRegistry.listAll()).toHaveLength(1);
  });

  test('5. createAgent 初始状态为 dormant', () => {
    const agent = universe.createAgent(CounterAgent, 'counter-1');
    expect(agent.state).toBe('dormant');
  });

  test('6. createAgent 重复 id 抛出错误', () => {
    universe.createAgent(CounterAgent, 'counter-1');
    expect(() => universe.createAgent(CounterAgent, 'counter-1'))
      .toThrow('[daoAgents] Agent 已注册: counter-1');
  });

  // ── 3. createApp ────────────────────────────────────────────

  test('7. createApp 注册应用，初始状态为 registered', () => {
    const instance = universe.createApp({
      id: 'test-app', name: '测试应用', version: '1.0.0', entry: './app',
    });
    expect(instance.state).toBe('registered');
    expect(instance.definition.id).toBe('test-app');
  });

  test('8. createApp 可通过 appContainer 查询', () => {
    universe.createApp({ id: 'app-1', name: '应用', version: '1.0.0', entry: './app' });
    expect(universe.appContainer.get('app-1')).toBeDefined();
  });

  test('9. createApp 重复 id 抛出错误', () => {
    universe.createApp({ id: 'app-1', name: '应用', version: '1.0.0', entry: './app' });
    expect(() => universe.createApp({ id: 'app-1', name: '重复', version: '1.0.0', entry: './app' }))
      .toThrow('[daoApps] 应用已注册: app-1');
  });

  test('10. createApp 后可 start', async () => {
    universe.createApp({ id: 'app-1', name: '应用', version: '1.0.0', entry: './app' });
    await universe.appContainer.start('app-1');
    expect(universe.appContainer.get('app-1')?.state).toBe('running');
  });

  // ── 4. snapshot() —— 空系统 ────────────────────────────────

  test('11. 空系统快照各项为 0', () => {
    const snap = universe.snapshot();
    expect(snap.modules.total).toBe(0);
    expect(snap.agents.total).toBe(0);
    expect(snap.apps.total).toBe(0);
    expect(snap.events.total).toBe(0);
    expect(snap.timestamp).toBeGreaterThan(0);
  });

  test('12. 快照类型符合 DaoSystemSnapshot 结构', () => {
    const snap: DaoSystemSnapshot = universe.snapshot();
    expect(snap).toHaveProperty('timestamp');
    expect(snap.modules).toHaveProperty('total');
    expect(snap.modules).toHaveProperty('byLifecycle');
    expect(snap.agents).toHaveProperty('byState');
    expect(snap.agents).toHaveProperty('byType');
    expect(snap.apps).toHaveProperty('byState');
    expect(snap.events).toHaveProperty('byType');
  });

  // ── 5. snapshot() —— agents 统计 ────────────────────────────

  test('13. 快照 agents.total 反映注册数量', () => {
    universe.createAgent(CounterAgent, 'c-1');
    universe.createAgent(CounterAgent, 'c-2');
    universe.createAgent(EchoAgent, 'e-1');
    const snap = universe.snapshot();
    expect(snap.agents.total).toBe(3);
  });

  test('14. 快照 agents.byState 在 initialize 后更新', async () => {
    const agent = universe.createAgent(CounterAgent, 'c-1');
    await agent.initialize();
    const snap = universe.snapshot();
    expect(snap.agents.byState['awakening']).toBe(1);
  });

  test('15. 快照 agents.byState 在 activate 后更新', async () => {
    const agent = universe.createAgent(CounterAgent, 'c-1');
    await agent.initialize();
    await agent.activate();
    const snap = universe.snapshot();
    expect(snap.agents.byState['active']).toBe(1);
    expect(snap.agents.byState['awakening']).toBeUndefined();
  });

  test('16. 快照 agents.byType 按 agentType 分类', () => {
    universe.createAgent(CounterAgent, 'c-1');
    universe.createAgent(CounterAgent, 'c-2');
    universe.createAgent(EchoAgent, 'e-1');
    const snap = universe.snapshot();
    expect(snap.agents.byType['counter']).toBe(2);
    expect(snap.agents.byType['echo']).toBe(1);
  });

  // ── 6. snapshot() —— apps 统计 ─────────────────────────────

  test('17. 快照 apps.total 反映注册数量', () => {
    universe.createApp({ id: 'a1', name: 'A1', version: '1.0.0', entry: './a1' });
    universe.createApp({ id: 'a2', name: 'A2', version: '1.0.0', entry: './a2' });
    const snap = universe.snapshot();
    expect(snap.apps.total).toBe(2);
  });

  test('18. 快照 apps.byState 在 start 后更新', async () => {
    universe.createApp({ id: 'app-1', name: '应用', version: '1.0.0', entry: './app' });
    await universe.appContainer.start('app-1');
    const snap = universe.snapshot();
    expect(snap.apps.byState['running']).toBe(1);
  });

  // ── 7. snapshot() —— events 统计 ───────────────────────────

  test('19. 快照 events.total 在 Agent 动作后增加', async () => {
    const agent = universe.createAgent(CounterAgent, 'c-1');
    await agent.initialize(); // 触发 agent:lifecycle 事件
    const snap = universe.snapshot();
    expect(snap.events.total).toBeGreaterThan(0);
  });

  test('20. 快照 events.byType 包含 agent:lifecycle', async () => {
    const agent = universe.createAgent(CounterAgent, 'c-1');
    await agent.initialize();
    await agent.activate();
    const snap = universe.snapshot();
    expect(snap.events.byType['agent:lifecycle']).toBeGreaterThanOrEqual(2);
  });

  // ── 8. 内置 Agent 集成 ─────────────────────────────────────

  test('21. TaskAgent 通过 createAgent 创建后可正常 execute', async () => {
    const task = universe.createAgent(TaskAgent, 'task-1');
    await task.initialize();
    await task.activate();
    await task.execute('enqueue', { id: 't1', action: 'test', priority: 5 });
    const status = await task.execute<{ pending: number }>('status');
    expect(status.pending).toBe(1);
  });

  test('22. ObserverAgent 通过 createAgent 创建后 initialize 开始监听', async () => {
    const observer = universe.createAgent(ObserverAgent, 'obs-1');
    await observer.initialize(); // 开始监听 daoNothingVoid

    // 再发一个事件
    daoNothingVoid.observe({ type: 'custom:event', source: 'test', data: {} });

    const history = await observer.execute<unknown[]>('get-history', { limit: 10 });
    expect(history.length).toBeGreaterThan(0);

    await observer.terminate(); // 清理监听器
  });

  test('23. CoordinatorAgent 通过 createAgent 创建后可管理名册', async () => {
    const coord   = universe.createAgent(CoordinatorAgent, 'coord-1');
    const worker1 = universe.createAgent(TaskAgent, 'worker-1');
    const worker2 = universe.createAgent(TaskAgent, 'worker-2');

    await coord.initialize(); await coord.activate();
    await worker1.initialize(); await worker1.activate();
    await worker2.initialize(); await worker2.activate();

    await coord.execute('add-agent', { agentId: 'worker-1' });
    await coord.execute('add-agent', { agentId: 'worker-2' });

    const roster = await coord.execute<{ rosterSize: number }>('get-roster');
    expect(roster.rosterSize).toBe(2);
  });

  // ── 9. 多 Agent 协同 + 快照 ────────────────────────────────

  test('24. 多 Agent 注册后快照统计正确', async () => {
    const a1 = universe.createAgent(CounterAgent, 'a1');
    const a2 = universe.createAgent(CounterAgent, 'a2');
    const a3 = universe.createAgent(EchoAgent, 'a3');

    await a1.initialize(); await a1.activate();
    await a2.initialize(); // 只到 awakening
    // a3 保持 dormant

    const snap = universe.snapshot();
    expect(snap.agents.total).toBe(3);
    expect(snap.agents.byState['active']).toBe(1);
    expect(snap.agents.byState['awakening']).toBe(1);
    expect(snap.agents.byState['dormant']).toBe(1);
  });

  test('25. 消息传递后 events.byType 包含 agent:message', async () => {
    const a1 = universe.createAgent(CounterAgent, 'sender');
    const a2 = universe.createAgent(CounterAgent, 'receiver');
    await a1.initialize(); await a1.activate();
    await a2.initialize(); await a2.activate();

    a1.send('receiver', 'increment', 5);

    const snap = universe.snapshot();
    expect(snap.events.byType['agent:message']).toBeGreaterThanOrEqual(1);
  });
});
