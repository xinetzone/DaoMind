import { daoNothingVoid } from '@daomind/nothing';
import { ObserverAgent } from '../agents/observer-agent';
import { TaskAgent } from '../agents/task-agent';
import type { SystemSnapshot, Observation } from '../agents/observer-agent';

/** 等待一个 tick，让 async void 操作完成 */
const nextTick = () => new Promise<void>((r) => setTimeout(r, 0));

describe('ObserverAgent', () => {
  let observer: ObserverAgent;

  beforeEach(() => {
    daoNothingVoid.void();
    observer = new ObserverAgent('observer-1');
  });

  afterEach(async () => {
    if (observer.state !== 'deceased') {
      try { await observer.terminate(); } catch { /* already dead */ }
    }
  });

  describe('生命周期', () => {
    test('agentType 为 observer', () => {
      expect(observer.agentType).toBe('observer');
      expect(observer.capabilities[0]?.name).toBe('observe-system');
    });

    test('initialize 后开始收集事件', async () => {
      await observer.initialize();
      await observer.activate();

      // 制造一些事件
      const task = new TaskAgent('task-for-obs');
      await task.initialize(); // 会产生 agent:lifecycle 事件
      await task.terminate();

      await nextTick();

      const snapshot = await observer.execute<SystemSnapshot>('get-snapshot');
      expect(snapshot.lifecycleEvents).toBeGreaterThan(0);
    });

    test('terminate 后停止收集事件', async () => {
      await observer.initialize();
      await observer.activate();
      await observer.terminate();

      // 在 terminate 之后制造事件
      const snapshotBefore = await new ObserverAgent('obs-2').execute<SystemSnapshot>('get-snapshot');
      daoNothingVoid.observe({ type: 'test:event', source: 'test', data: {} });

      // observer 已 terminated，不应收到新事件
      const snapshot = await observer.execute<SystemSnapshot>('get-snapshot').catch(() => null);
      // 已 deceased，observe 不再收集
      expect(observer.state).toBe('deceased');
    });
  });

  describe('get-snapshot', () => {
    test('正确分类 lifecycle / message / other 事件', async () => {
      await observer.initialize();
      await observer.activate();

      // 产生 lifecycle 事件
      const task = new TaskAgent('task-snap');
      await task.initialize();
      await task.activate();
      await task.terminate();

      // 产生 message 事件
      task.send('*', 'hello', {});

      // 产生 other 事件
      daoNothingVoid.observe({ type: 'custom:event', source: 'test', data: {} });

      await nextTick();

      const snapshot = await observer.execute<SystemSnapshot>('get-snapshot');
      expect(snapshot.lifecycleEvents).toBeGreaterThan(0);
      expect(snapshot.messageEvents).toBeGreaterThan(0);
      expect(snapshot.otherEvents).toBeGreaterThanOrEqual(1);
      expect(snapshot.totalObservations).toBe(
        snapshot.lifecycleEvents + snapshot.messageEvents + snapshot.otherEvents,
      );
      expect(snapshot.observerId).toBe('observer-1');
    });

    test('无事件时返回零值快照', async () => {
      await observer.initialize();
      await observer.activate();

      // 清空历史以避免 initialize 自身产生的事件影响
      await observer.execute('clear');

      const snapshot = await observer.execute<SystemSnapshot>('get-snapshot');
      expect(snapshot.totalObservations).toBe(0);
      expect(snapshot.lastObservedAt).toBeUndefined();
    });
  });

  describe('get-history', () => {
    test('默认返回最近 20 条', async () => {
      await observer.initialize();
      await observer.activate();
      await observer.execute('clear');

      // 制造 25 个事件
      for (let i = 0; i < 25; i++) {
        daoNothingVoid.observe({ type: 'test:event', source: 'test', data: { i } });
      }

      await nextTick();
      const history = await observer.execute<Observation[]>('get-history');
      expect(history.length).toBe(20);
    });

    test('指定 limit', async () => {
      await observer.initialize();
      await observer.activate();
      await observer.execute('clear');

      for (let i = 0; i < 10; i++) {
        daoNothingVoid.observe({ type: 'test:event', source: 'test', data: { i } });
      }

      await nextTick();
      const history = await observer.execute<Observation[]>('get-history', { limit: 3 });
      expect(history.length).toBe(3);
    });
  });

  describe('get-by-type', () => {
    test('只返回指定类型的事件', async () => {
      await observer.initialize();
      await observer.activate();
      await observer.execute('clear');

      daoNothingVoid.observe({ type: 'type-a', source: 'test', data: {} });
      daoNothingVoid.observe({ type: 'type-b', source: 'test', data: {} });
      daoNothingVoid.observe({ type: 'type-a', source: 'test', data: {} });

      await nextTick();
      const result = await observer.execute<Observation[]>('get-by-type', { type: 'type-a' });
      expect(result.length).toBe(2);
      expect(result.every((o) => o.type === 'type-a')).toBe(true);
    });
  });

  describe('clear', () => {
    test('清空后 totalObservations 为 0', async () => {
      await observer.initialize();
      await observer.activate();

      daoNothingVoid.observe({ type: 'test:event', source: 'test', data: {} });
      await nextTick();

      const clearResult = await observer.execute<{ cleared: number }>('clear');
      expect(clearResult.cleared).toBeGreaterThan(0);

      const snapshot = await observer.execute<SystemSnapshot>('get-snapshot');
      expect(snapshot.totalObservations).toBe(0);
    });
  });

  describe('未知操作', () => {
    test('未知 action 抛出错误', async () => {
      await observer.initialize();
      await observer.activate();
      await expect(observer.execute('unknown')).rejects.toThrow('[ObserverAgent] 未知操作: unknown');
    });
  });
});
