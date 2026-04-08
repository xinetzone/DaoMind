import { daoAppContainer } from '../container';

describe('DaoAppContainer', () => {
  beforeEach(() => {
    // 清空容器
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

  test('should register app successfully', () => {
    const appDefinition = {
      id: 'test-app-1',
      name: 'Test App 1',
      version: '1.0.0',
      entry: './test-app.js'
    };

    daoAppContainer.register(appDefinition);
    const instance = daoAppContainer.get('test-app-1');
    expect(instance).toBeDefined();
    expect(instance?.state).toBe('registered');
    expect(instance?.definition.id).toBe('test-app-1');
  });

  test('should throw error when registering duplicate app', () => {
    const appDefinition = {
      id: 'test-app-1',
      name: 'Test App 1',
      version: '1.0.0',
      entry: './test-app.js'
    };

    daoAppContainer.register(appDefinition);
    expect(() => daoAppContainer.register(appDefinition)).toThrow(/应用已注册/);
  });

  test('should unregister app successfully', () => {
    const appDefinition = {
      id: 'test-app-1',
      name: 'Test App 1',
      version: '1.0.0',
      entry: './test-app.js'
    };

    daoAppContainer.register(appDefinition);
    const result = daoAppContainer.unregister('test-app-1');
    expect(result).toBe(true);
    expect(daoAppContainer.get('test-app-1')).toBeUndefined();
  });

  test('should return false when unregistering non-existent app', () => {
    const result = daoAppContainer.unregister('non-existent-app');
    expect(result).toBe(false);
  });

  test('should throw error when unregistering running app', async () => {
    const appDefinition = {
      id: 'test-app-1',
      name: 'Test App 1',
      version: '1.0.0',
      entry: './test-app.js'
    };

    daoAppContainer.register(appDefinition);
    await daoAppContainer.start('test-app-1');
    expect(() => daoAppContainer.unregister('test-app-1')).toThrow(/无法卸载运行中的应用/);
  });

  test('should start app successfully', async () => {
    const appDefinition = {
      id: 'test-app-1',
      name: 'Test App 1',
      version: '1.0.0',
      entry: './test-app.js'
    };

    daoAppContainer.register(appDefinition);
    await daoAppContainer.start('test-app-1');
    const instance = daoAppContainer.get('test-app-1');
    expect(instance?.state).toBe('running');
    expect(instance?.startedAt).toBeDefined();
  });

  test('should throw error when starting non-existent app', async () => {
    await expect(daoAppContainer.start('non-existent-app')).rejects.toThrow(/应用未注册/);
  });

  test('should throw error when starting app with unmet dependencies', async () => {
    const appDefinition = {
      id: 'test-app-1',
      name: 'Test App 1',
      version: '1.0.0',
      entry: './test-app.js',
      dependencies: ['dependency-app']
    };

    daoAppContainer.register(appDefinition);
    await expect(daoAppContainer.start('test-app-1')).rejects.toThrow(/依赖未就绪/);
  });

  test('should start app with met dependencies', async () => {
    const dependencyApp = {
      id: 'dependency-app',
      name: 'Dependency App',
      version: '1.0.0',
      entry: './dependency-app.js'
    };

    const appDefinition = {
      id: 'test-app-1',
      name: 'Test App 1',
      version: '1.0.0',
      entry: './test-app.js',
      dependencies: ['dependency-app']
    };

    daoAppContainer.register(dependencyApp);
    daoAppContainer.register(appDefinition);
    await daoAppContainer.start('dependency-app');
    await daoAppContainer.start('test-app-1');
    const instance = daoAppContainer.get('test-app-1');
    expect(instance?.state).toBe('running');
  });

  test('should stop app successfully', async () => {
    const appDefinition = {
      id: 'test-app-1',
      name: 'Test App 1',
      version: '1.0.0',
      entry: './test-app.js'
    };

    daoAppContainer.register(appDefinition);
    await daoAppContainer.start('test-app-1');
    await daoAppContainer.stop('test-app-1');
    const instance = daoAppContainer.get('test-app-1');
    expect(instance?.state).toBe('stopped');
    expect(instance?.stoppedAt).toBeDefined();
  });

  test('should throw error when stopping non-existent app', async () => {
    await expect(daoAppContainer.stop('non-existent-app')).rejects.toThrow(/应用未注册/);
  });

  test('should throw error when stopping non-running app', async () => {
    const appDefinition = {
      id: 'test-app-1',
      name: 'Test App 1',
      version: '1.0.0',
      entry: './test-app.js'
    };

    daoAppContainer.register(appDefinition);
    await expect(daoAppContainer.stop('test-app-1')).rejects.toThrow(/应用未运行，无法停止/);
  });

  test('should restart app successfully', async () => {
    const appDefinition = {
      id: 'test-app-1',
      name: 'Test App 1',
      version: '1.0.0',
      entry: './test-app.js'
    };

    daoAppContainer.register(appDefinition);
    await daoAppContainer.start('test-app-1');
    const firstStartedAt = daoAppContainer.get('test-app-1')?.startedAt;
    await daoAppContainer.restart('test-app-1');
    const instance = daoAppContainer.get('test-app-1');
    expect(instance?.state).toBe('running');
    expect(instance?.startedAt).toBeGreaterThan(firstStartedAt!);
  });

  test('should list all apps', () => {
    const appDefinition1 = {
      id: 'test-app-1',
      name: 'Test App 1',
      version: '1.0.0',
      entry: './test-app.js'
    };

    const appDefinition2 = {
      id: 'test-app-2',
      name: 'Test App 2',
      version: '1.0.0',
      entry: './test-app2.js'
    };

    daoAppContainer.register(appDefinition1);
    daoAppContainer.register(appDefinition2);
    const instances = daoAppContainer.listAll();
    expect(instances).toHaveLength(2);
    expect(instances.map(instance => instance.definition.id)).toContain('test-app-1');
    expect(instances.map(instance => instance.definition.id)).toContain('test-app-2');
  });

  test('should list apps by state', async () => {
    const appDefinition1 = {
      id: 'test-app-1',
      name: 'Test App 1',
      version: '1.0.0',
      entry: './test-app.js'
    };

    const appDefinition2 = {
      id: 'test-app-2',
      name: 'Test App 2',
      version: '1.0.0',
      entry: './test-app2.js'
    };

    daoAppContainer.register(appDefinition1);
    daoAppContainer.register(appDefinition2);
    await daoAppContainer.start('test-app-1');

    const registeredApps = daoAppContainer.listByState('registered');
    expect(registeredApps).toHaveLength(1);
    expect(registeredApps[0]?.definition.id).toBe('test-app-2');

    const runningApps = daoAppContainer.listByState('running');
    expect(runningApps).toHaveLength(1);
    expect(runningApps[0]?.definition.id).toBe('test-app-1');
  });
});