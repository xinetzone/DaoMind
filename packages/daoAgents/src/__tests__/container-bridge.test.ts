import { DaoAgentContainerBridge } from '../container-bridge';
import { DaoBaseAgent } from '../base';
import { DaoAnythingContainer } from '@daomind/anything';
import { daoNothingVoid } from '@daomind/nothing';

// ── 测试用 Agent ──────────────────────────────────────────────────────────────

class SimpleAgent extends DaoBaseAgent {
  agentType = 'simple';
  capabilities = [{ name: 'simple-cap', version: '1.0.0' }];

  async execute<T>(_action: string, _payload?: unknown): Promise<T> {
    return {} as T;
  }
}

// ── 辅助：等待一个 microtask 周期（事件异步分发）────────────────────────────────

const nextTick = () => new Promise<void>((resolve) => setImmediate(resolve));

// ── 测试套件 ──────────────────────────────────────────────────────────────────

describe('DaoAgentContainerBridge', () => {
  let bridge: DaoAgentContainerBridge;
  let container: DaoAnythingContainer;

  beforeEach(() => {
    // 先清空虚空（移除旧监听器），再创建 bridge（注册新监听器），避免 void() 误删 bridge 的监听
    daoNothingVoid.void();
    bridge = new DaoAgentContainerBridge();
    container = new DaoAnythingContainer();
  });

  afterEach(() => {
    bridge.dispose();
  });

  // ── mount ─────────────────────────────────────────────────────────────────

  describe('mount', () => {
    test('mount 后容器中出现对应模块（lifecycle: registered）', () => {
      const agent = new SimpleAgent('agent-x');
      bridge.mount(agent, container);

      const mod = container.getModule('agent-x');
      expect(mod).toBeDefined();
      expect(mod?.lifecycle).toBe('registered');
      expect(mod?.existentialType).toBe('anything');
    });

    test('重复 mount 同一 Agent 应抛错', () => {
      const agent = new SimpleAgent('agent-x');
      bridge.mount(agent, container);
      expect(() => bridge.mount(agent, container)).toThrow(/已挂载到容器/);
    });

    test('mount 后 isMounted 返回 true', () => {
      const agent = new SimpleAgent('agent-x');
      bridge.mount(agent, container);
      expect(bridge.isMounted('agent-x')).toBe(true);
    });
  });

  // ── 生命周期同步 ──────────────────────────────────────────────────────────

  describe('生命周期同步', () => {
    test('agent.initialize() → 容器模块 lifecycle = initialized', async () => {
      const agent = new SimpleAgent('agent-a');
      bridge.mount(agent, container);

      await agent.initialize();
      await nextTick();

      expect(container.getModule('agent-a')?.lifecycle).toBe('initialized');
    });

    test('agent.activate() → 容器模块 lifecycle = active', async () => {
      const agent = new SimpleAgent('agent-a');
      bridge.mount(agent, container);

      await agent.initialize();
      await nextTick();
      await agent.activate();
      await nextTick();

      expect(container.getModule('agent-a')?.lifecycle).toBe('active');
    });

    test('agent.rest() → 容器模块 lifecycle = suspending', async () => {
      const agent = new SimpleAgent('agent-a');
      bridge.mount(agent, container);

      await agent.initialize();
      await nextTick();
      await agent.activate();
      await nextTick();
      await agent.rest();
      await nextTick();

      expect(container.getModule('agent-a')?.lifecycle).toBe('suspending');
    });

    test('agent.terminate() → 容器模块 lifecycle = terminated', async () => {
      const agent = new SimpleAgent('agent-a');
      bridge.mount(agent, container);

      await agent.initialize();
      await nextTick();
      await agent.activate();
      await nextTick();
      await agent.terminate();
      await nextTick();

      expect(container.getModule('agent-a')?.lifecycle).toBe('terminated');
    });

    test('完整流程：dormant → awakening → active → resting → deceased', async () => {
      const agent = new SimpleAgent('agent-flow');
      bridge.mount(agent, container);

      await agent.initialize(); await nextTick();
      expect(container.getModule('agent-flow')?.lifecycle).toBe('initialized');

      await agent.activate(); await nextTick();
      expect(container.getModule('agent-flow')?.lifecycle).toBe('active');

      await agent.rest(); await nextTick();
      expect(container.getModule('agent-flow')?.lifecycle).toBe('suspending');

      await agent.activate(); await nextTick();
      expect(container.getModule('agent-flow')?.lifecycle).toBe('active');

      await agent.terminate(); await nextTick();
      expect(container.getModule('agent-flow')?.lifecycle).toBe('terminated');
    });
  });

  // ── unmount ───────────────────────────────────────────────────────────────

  describe('unmount', () => {
    test('unmount 后状态变更不再同步', async () => {
      const agent = new SimpleAgent('agent-u');
      bridge.mount(agent, container);
      bridge.unmount('agent-u');

      await agent.initialize();
      await nextTick();

      // 容器中模块仍存在，但 lifecycle 未被同步（仍为 registered）
      expect(container.getModule('agent-u')?.lifecycle).toBe('registered');
    });

    test('unmount 不存在的 id 返回 false', () => {
      expect(bridge.unmount('ghost')).toBe(false);
    });

    test('unmount 后 isMounted 返回 false', () => {
      const agent = new SimpleAgent('agent-u');
      bridge.mount(agent, container);
      bridge.unmount('agent-u');
      expect(bridge.isMounted('agent-u')).toBe(false);
    });
  });

  // ── mountedAgentIds ───────────────────────────────────────────────────────

  test('mountedAgentIds 返回已挂载列表', () => {
    bridge.mount(new SimpleAgent('a1'), container);
    bridge.mount(new SimpleAgent('a2'), container);
    expect([...bridge.mountedAgentIds()].sort()).toEqual(['a1', 'a2']);
  });

  // ── 多 Agent、多容器 ──────────────────────────────────────────────────────

  test('多个 Agent 挂载到不同容器，互不干扰', async () => {
    const containerB = new DaoAnythingContainer();
    const agentA = new SimpleAgent('multi-a');
    const agentB = new SimpleAgent('multi-b');

    bridge.mount(agentA, container);
    bridge.mount(agentB, containerB);

    await agentA.initialize(); await nextTick();
    await agentB.initialize(); await nextTick();

    expect(container.getModule('multi-a')?.lifecycle).toBe('initialized');
    expect(containerB.getModule('multi-b')?.lifecycle).toBe('initialized');
    expect(container.getModule('multi-b')).toBeUndefined();
  });
});
