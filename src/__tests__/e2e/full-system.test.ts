import { daoAgentRegistry, DaoBaseAgent } from '@daomind/agents';
import { daoAppContainer } from '@daomind/apps';
import { DaoVerificationReporter } from '@daomind/verify';

describe('Full System End-to-End Test', () => {
  beforeEach(() => {
    // 清空代理注册表
    const agents = daoAgentRegistry.listAll();
    agents.forEach(agent => {
      daoAgentRegistry.unregister(agent.id);
    });

    // 清空应用容器
    const instances = daoAppContainer.listAll();
    instances.forEach(instance => {
      try {
        if (instance.state === 'running') {
          daoAppContainer.stop(instance.definition.id);
        }
        daoAppContainer.unregister(instance.definition.id);
      } catch {
        // 忽略错误
      }
    });
  });

  test('should complete full system flow successfully', async () => {
    // 1. 创建并注册代理
    class TestAgent extends DaoBaseAgent {
      agentType = 'test';
      capabilities = [
        {
          name: 'test-capability',
          version: '1.0.0',
          description: '测试能力'
        }
      ];

      async execute<T>(_action: string, _payload?: unknown): Promise<T> {
        return { success: true, result: '测试执行成功' } as T;
      }
    }

    const agent = new TestAgent('test-agent-1');
    daoAgentRegistry.register(agent);
    await agent.initialize();
    await agent.activate();

    // 验证代理状态
    expect(agent.state).toBe('active');

    // 2. 注册并启动应用
    const appDefinition = {
      id: 'test-app-1',
      name: 'Test App 1',
      version: '1.0.0',
      entry: './test-app.js'
    };

    daoAppContainer.register(appDefinition);
    await daoAppContainer.start('test-app-1');

    // 验证应用状态
    const appInstance = daoAppContainer.get('test-app-1');
    expect(appInstance?.state).toBe('running');

    // 3. 运行验证检查
    const reporter = new DaoVerificationReporter();
    const report = await reporter.runAllChecks(process.cwd());

    // 验证报告
    expect(report).toBeDefined();
    expect(report.results).toBeDefined();
    expect(report.results.length).toBeGreaterThan(0);

    // 4. 执行代理动作
    const result = await agent.execute('test-action', { message: 'Hello System' });
    expect(result).toEqual({ success: true, result: '测试执行成功' });

    // 5. 停止应用
    await daoAppContainer.stop('test-app-1');
    const stoppedApp = daoAppContainer.get('test-app-1');
    expect(stoppedApp?.state).toBe('stopped');

    // 6. 终止代理
    await agent.terminate();
    expect(agent.state).toBe('deceased');
  });

  test('should handle system errors gracefully', async () => {
    // 1. 尝试启动不存在的应用
    await expect(daoAppContainer.start('non-existent-app')).rejects.toThrow(/应用未注册/);

    // 2. 尝试注册重复的代理
    class TestAgent extends DaoBaseAgent {
      agentType = 'test';
      capabilities = [
        {
          name: 'test-capability',
          version: '1.0.0',
          description: '测试能力'
        }
      ];

      async execute<T>(_action: string, _payload?: unknown): Promise<T> {
        return { success: true, result: '测试执行成功' } as T;
      }
    }

    const agent1 = new TestAgent('test-agent-1');
    const agent2 = new TestAgent('test-agent-1');
    daoAgentRegistry.register(agent1);
    expect(() => daoAgentRegistry.register(agent2)).toThrow(/Agent 已注册/);

    // 3. 运行一个存在的验证类别
    const reporter = new DaoVerificationReporter();
    const report = await reporter.runCategory('naming-convention', process.cwd());
    expect(report.failedCount).toBe(1); // 实际运行时可能会有违规
  });
});