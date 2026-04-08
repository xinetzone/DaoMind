import { daoAgentRegistry } from '../registry';
import { DaoBaseAgent } from '../base';

class TestAgent extends DaoBaseAgent {
  agentType = 'test';
  capabilities = [
    {
      name: 'test-capability',
      version: '1.0.0',
      description: '测试能力'
    }
  ];

  async execute<T>(action: string, payload?: unknown): Promise<T> {
    return { success: true, result: '测试执行成功' } as T;
  }
}

class AnotherTestAgent extends DaoBaseAgent {
  agentType = 'another-test';
  capabilities = [
    {
      name: 'another-capability',
      version: '1.0.0',
      description: '另一个测试能力'
    }
  ];

  async execute<T>(action: string, payload?: unknown): Promise<T> {
    return { success: true, result: '另一个测试执行成功' } as T;
  }
}

describe('DaoAgentRegistry', () => {
  beforeEach(() => {
    // 清空注册表
    const agents = daoAgentRegistry.listAll();
    agents.forEach(agent => {
      daoAgentRegistry.unregister(agent.id);
    });
  });

  test('should register agent successfully', () => {
    const agent = new TestAgent('test-agent-1');
    daoAgentRegistry.register(agent);
    expect(daoAgentRegistry.get('test-agent-1')).toBe(agent);
  });

  test('should throw error when registering duplicate agent', () => {
    const agent1 = new TestAgent('test-agent-1');
    const agent2 = new TestAgent('test-agent-1');
    daoAgentRegistry.register(agent1);
    expect(() => daoAgentRegistry.register(agent2)).toThrow(/Agent 已注册/);
  });

  test('should unregister agent successfully', () => {
    const agent = new TestAgent('test-agent-1');
    daoAgentRegistry.register(agent);
    const result = daoAgentRegistry.unregister('test-agent-1');
    expect(result).toBe(true);
    expect(daoAgentRegistry.get('test-agent-1')).toBeUndefined();
  });

  test('should return false when unregistering non-existent agent', () => {
    const result = daoAgentRegistry.unregister('non-existent-agent');
    expect(result).toBe(false);
  });

  test('should get agent by id', () => {
    const agent = new TestAgent('test-agent-1');
    daoAgentRegistry.register(agent);
    const retrievedAgent = daoAgentRegistry.get('test-agent-1');
    expect(retrievedAgent).toBe(agent);
  });

  test('should find agents by capability', async () => {
    const agent1 = new TestAgent('test-agent-1');
    const agent2 = new AnotherTestAgent('test-agent-2');
    const agent3 = new TestAgent('test-agent-3');

    daoAgentRegistry.register(agent1);
    daoAgentRegistry.register(agent2);
    daoAgentRegistry.register(agent3);

    // 激活 agent1 和 agent3
    await agent1.initialize();
    await agent1.activate();
    await agent3.initialize();
    await agent3.activate();

    // 终止 agent3
    await agent3.terminate();

    const agentsWithTestCapability = daoAgentRegistry.findByCapability('test-capability');
    expect(agentsWithTestCapability).toHaveLength(1);
    expect(agentsWithTestCapability[0]?.id).toBe('test-agent-1');

    const agentsWithAnotherCapability = daoAgentRegistry.findByCapability('another-capability');
    expect(agentsWithAnotherCapability).toHaveLength(1);
    expect(agentsWithAnotherCapability[0]?.id).toBe('test-agent-2');
  });

  test('should find agents by type', () => {
    const agent1 = new TestAgent('test-agent-1');
    const agent2 = new AnotherTestAgent('test-agent-2');
    const agent3 = new TestAgent('test-agent-3');

    daoAgentRegistry.register(agent1);
    daoAgentRegistry.register(agent2);
    daoAgentRegistry.register(agent3);

    const testAgents = daoAgentRegistry.findByType('test');
    expect(testAgents).toHaveLength(2);
    expect(testAgents.map(agent => agent.id)).toContain('test-agent-1');
    expect(testAgents.map(agent => agent.id)).toContain('test-agent-3');

    const anotherTestAgents = daoAgentRegistry.findByType('another-test');
    expect(anotherTestAgents).toHaveLength(1);
    expect(anotherTestAgents[0]?.id).toBe('test-agent-2');
  });

  test('should list all agents', () => {
    const agent1 = new TestAgent('test-agent-1');
    const agent2 = new AnotherTestAgent('test-agent-2');

    daoAgentRegistry.register(agent1);
    daoAgentRegistry.register(agent2);

    const agents = daoAgentRegistry.listAll();
    expect(agents).toHaveLength(2);
    expect(agents.map(agent => agent.id)).toContain('test-agent-1');
    expect(agents.map(agent => agent.id)).toContain('test-agent-2');
  });

  test('should count agents by state', async () => {
    const agent1 = new TestAgent('test-agent-1');
    const agent2 = new TestAgent('test-agent-2');
    const agent3 = new TestAgent('test-agent-3');

    daoAgentRegistry.register(agent1);
    daoAgentRegistry.register(agent2);
    daoAgentRegistry.register(agent3);

    // 激活 agent1
    await agent1.initialize();
    await agent1.activate();

    // 让 agent2 休息
    await agent2.initialize();
    await agent2.activate();
    await agent2.rest();

    expect(daoAgentRegistry.countByState('dormant')).toBe(1);
    expect(daoAgentRegistry.countByState('active')).toBe(1);
    expect(daoAgentRegistry.countByState('resting')).toBe(1);
  });
});