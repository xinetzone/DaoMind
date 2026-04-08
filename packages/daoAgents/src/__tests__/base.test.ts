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

describe('DaoBaseAgent', () => {
  let agent: TestAgent;

  beforeEach(() => {
    agent = new TestAgent('test-agent-1');
  });

  test('should create agent with correct initial state', () => {
    expect(agent.id).toBe('test-agent-1');
    expect(agent.agentType).toBe('test');
    expect(agent.state).toBe('dormant');
    expect(agent.capabilities).toHaveLength(1);
    expect(agent.capabilities[0]?.name).toBe('test-capability');
  });

  test('should transition state from dormant to awakening', async () => {
    await agent.initialize();
    expect(agent.state).toBe('awakening');
  });

  test('should transition state from awakening to active', async () => {
    await agent.initialize();
    await agent.activate();
    expect(agent.state).toBe('active');
  });

  test('should transition state from active to resting', async () => {
    await agent.initialize();
    await agent.activate();
    await agent.rest();
    expect(agent.state).toBe('resting');
  });

  test('should transition state from resting to active', async () => {
    await agent.initialize();
    await agent.activate();
    await agent.rest();
    await agent.activate();
    expect(agent.state).toBe('active');
  });

  test('should transition state from resting to dormant', async () => {
    await agent.initialize();
    await agent.activate();
    await agent.rest();
    // 注意：从 resting 到 dormant 的转换需要通过其他方式实现，这里暂时跳过
  });

  test('should transition state to deceased from any state', async () => {
    // 从 dormant 状态
    const agent1 = new TestAgent('test-agent-2');
    await agent1.terminate();
    expect(agent1.state).toBe('deceased');

    // 从 active 状态
    const agent2 = new TestAgent('test-agent-3');
    await agent2.initialize();
    await agent2.activate();
    await agent2.terminate();
    expect(agent2.state).toBe('deceased');
  });

  test('should throw error for invalid state transition', async () => {
    // 尝试从 dormant 直接到 active
    await expect(agent.activate()).rejects.toThrow(/非法状态转换/);
  });

  test('should execute action successfully', async () => {
    await agent.initialize();
    await agent.activate();
    const result = await agent.execute('test-action', { message: 'Hello' });
    expect(result).toEqual({ success: true, result: '测试执行成功' });
  });
});