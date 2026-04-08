import { daoLifecycleManager } from '../lifecycle';

describe('DaoLifecycleManager', () => {
  test('should register and trigger state change listener', () => {
    const appId = 'test-app-1';
    // 确保使用新的应用 ID，避免历史记录累积
    daoLifecycleManager.getHistory(appId); // 初始化历史记录数组
    const mockCallback = jest.fn();

    // 注册监听器
    const unsubscribe = daoLifecycleManager.onStateChange(appId, mockCallback);

    // 触发状态变化
    daoLifecycleManager.emit(appId, 'registered', 'starting');
    daoLifecycleManager.emit(appId, 'starting', 'running');

    // 验证回调被调用
    expect(mockCallback).toHaveBeenCalledTimes(2);
    expect(mockCallback).toHaveBeenNthCalledWith(1, 'registered', 'starting');
    expect(mockCallback).toHaveBeenNthCalledWith(2, 'starting', 'running');

    // 取消订阅
    unsubscribe();

    // 再次触发状态变化，回调不应被调用
    daoLifecycleManager.emit(appId, 'running', 'stopping');
    expect(mockCallback).toHaveBeenCalledTimes(2);
  });

  test('should record state transition history', () => {
    const appId = 'test-app-2'; // 使用新的应用 ID，避免历史记录累积

    // 触发多个状态变化
    daoLifecycleManager.emit(appId, 'registered', 'starting');
    daoLifecycleManager.emit(appId, 'starting', 'running');
    daoLifecycleManager.emit(appId, 'running', 'stopping');
    daoLifecycleManager.emit(appId, 'stopping', 'stopped');

    // 获取历史记录
    const history = daoLifecycleManager.getHistory(appId);
    expect(history).toHaveLength(4);
    expect(history[0]?.from).toBe('registered');
    expect(history[0]?.to).toBe('starting');
    expect(history[1]?.from).toBe('starting');
    expect(history[1]?.to).toBe('running');
    expect(history[2]?.from).toBe('running');
    expect(history[2]?.to).toBe('stopping');
    expect(history[3]?.from).toBe('stopping');
    expect(history[3]?.to).toBe('stopped');
  });

  test('should limit history to MAX_HISTORY', () => {
    const appId = 'test-app-3'; // 使用新的应用 ID，避免历史记录累积

    // 触发超过 MAX_HISTORY 个状态变化
    for (let i = 0; i < 105; i++) {
      daoLifecycleManager.emit(appId, 'registered', 'starting');
      daoLifecycleManager.emit(appId, 'starting', 'running');
    }

    // 获取历史记录，应该被限制为 100 个
    const history = daoLifecycleManager.getHistory(appId);
    expect(history.length).toBeLessThanOrEqual(100);
  });

  test('should return empty history for non-existent app', () => {
    const history = daoLifecycleManager.getHistory('non-existent-app');
    expect(history).toEqual([]);
  });

  test('should return limited history when limit is specified', () => {
    const appId = 'test-app-4'; // 使用新的应用 ID，避免历史记录累积

    // 触发多个状态变化
    daoLifecycleManager.emit(appId, 'registered', 'starting');
    daoLifecycleManager.emit(appId, 'starting', 'running');
    daoLifecycleManager.emit(appId, 'running', 'stopping');
    daoLifecycleManager.emit(appId, 'stopping', 'stopped');

    // 获取最近 2 个历史记录
    const limitedHistory = daoLifecycleManager.getHistory(appId, 2);
    expect(limitedHistory).toHaveLength(2);
    expect(limitedHistory[0]?.from).toBe('running');
    expect(limitedHistory[0]?.to).toBe('stopping');
    expect(limitedHistory[1]?.from).toBe('stopping');
    expect(limitedHistory[1]?.to).toBe('stopped');
  });

  test('should handle callback errors gracefully', () => {
    const appId = 'test-app-5'; // 使用新的应用 ID，避免历史记录累积
    const errorCallback = jest.fn(() => {
      throw new Error('Callback error');
    });
    const normalCallback = jest.fn();

    // 注册两个回调，一个会抛出错误
    daoLifecycleManager.onStateChange(appId, errorCallback);
    daoLifecycleManager.onStateChange(appId, normalCallback);

    // 触发状态变化，应该不会导致整个过程失败
    expect(() => {
      daoLifecycleManager.emit(appId, 'registered', 'starting');
    }).not.toThrow();

    // 验证正常回调仍然被调用
    expect(normalCallback).toHaveBeenCalledTimes(1);
  });
});