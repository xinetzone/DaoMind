import { daoAgentRegistry, DaoBaseAgent } from '@daomind/agents';
import { daoAppContainer } from '@daomind/apps';

describe('DaoAgents and DaoApps Integration', () => {
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

  test('should integrate agents and apps successfully', async () => {
    // 创建并注册一个测试代理
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

    const agent = new TestAgent('test-agent-1');
    daoAgentRegistry.register(agent);
    await agent.initialize();
    await agent.activate();

    // 注册一个应用
    const appDefinition = {
      id: 'test-app-1',
      name: 'Test App 1',
      version: '1.0.0',
      entry: './test-app.js'
    };

    daoAppContainer.register(appDefinition);
    await daoAppContainer.start('test-app-1');

    // 验证代理和应用都已成功注册和启动
    const registeredAgent = daoAgentRegistry.get('test-agent-1');
    const runningApp = daoAppContainer.get('test-app-1');

    expect(registeredAgent).toBeDefined();
    expect(registeredAgent?.state).toBe('active');
    expect(runningApp).toBeDefined();
    expect(runningApp?.state).toBe('running');

    // 测试代理执行
    const result = await agent.execute('test-action', { message: 'Hello' });
    expect(result).toEqual({ success: true, result: '测试执行成功' });

    // 停止应用
    await daoAppContainer.stop('test-app-1');
    const stoppedApp = daoAppContainer.get('test-app-1');
    expect(stoppedApp?.state).toBe('stopped');

    // 终止代理
    await agent.terminate();
    expect(agent.state).toBe('deceased');
  });

  test('should handle app dependencies correctly', async () => {
    // 注册两个应用，其中一个依赖另一个
    const dependencyApp = {
      id: 'dependency-app',
      name: 'Dependency App',
      version: '1.0.0',
      entry: './dependency-app.js'
    };

    const mainApp = {
      id: 'main-app',
      name: 'Main App',
      version: '1.0.0',
      entry: './main-app.js',
      dependencies: ['dependency-app']
    };

    daoAppContainer.register(dependencyApp);
    daoAppContainer.register(mainApp);

    // 尝试启动主应用，应该失败，因为依赖应用未启动
    await expect(daoAppContainer.start('main-app')).rejects.toThrow(/依赖未就绪/);

    // 启动依赖应用
    await daoAppContainer.start('dependency-app');

    // 再次尝试启动主应用，应该成功
    await daoAppContainer.start('main-app');
    const mainAppInstance = daoAppContainer.get('main-app');
    expect(mainAppInstance?.state).toBe('running');
  });
});