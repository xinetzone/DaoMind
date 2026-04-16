import { daoNothingVoid } from '@daomind/nothing';
import { daoAgentMessenger } from '../messaging';
import { TaskAgent } from '../agents/task-agent';
import type { TaskResult, QueueSnapshot } from '../agents/task-agent';

describe('TaskAgent', () => {
  let agent: TaskAgent;

  beforeEach(() => {
    daoNothingVoid.void();
    agent = new TaskAgent('task-agent-1');
  });

  afterEach(async () => {
    if (agent.state !== 'deceased') {
      try { await agent.terminate(); } catch { /* already dead */ }
    }
  });

  describe('生命周期', () => {
    test('初始状态为 dormant，agentType 为 task', () => {
      expect(agent.state).toBe('dormant');
      expect(agent.agentType).toBe('task');
      expect(agent.capabilities[0]?.name).toBe('execute-task');
    });
  });

  describe('enqueue', () => {
    test('入队单个任务', async () => {
      await agent.initialize();
      await agent.activate();

      const result = await agent.execute<{ queued: boolean; total: number }>('enqueue', {
        id: 't1', action: 'do-work', priority: 0,
      });
      expect(result.queued).toBe(true);
      expect(result.total).toBe(1);
    });

    test('按优先级排序：高优先级在前', async () => {
      await agent.initialize();
      await agent.activate();

      await agent.execute('enqueue', { id: 'low',  action: 'work', priority: 1 });
      await agent.execute('enqueue', { id: 'high', action: 'work', priority: 10 });
      await agent.execute('enqueue', { id: 'mid',  action: 'work', priority: 5 });

      // run-next 应先取出高优先级
      const r1 = await agent.execute<TaskResult>('run-next');
      expect(r1.taskId).toBe('high');

      const r2 = await agent.execute<TaskResult>('run-next');
      expect(r2.taskId).toBe('mid');

      const r3 = await agent.execute<TaskResult>('run-next');
      expect(r3.taskId).toBe('low');
    });
  });

  describe('run-next', () => {
    test('队列为空时返回 executed: false', async () => {
      await agent.initialize();
      await agent.activate();

      const result = await agent.execute<{ executed: boolean; reason: string }>('run-next');
      expect(result.executed).toBe(false);
      expect(result.reason).toBe('队列为空');
    });

    test('执行后广播 task:completed', async () => {
      await agent.initialize();
      await agent.activate();

      const received: unknown[] = [];
      const listener = new TaskAgent('listener-1');
      await listener.initialize();
      await listener.activate();
      listener.onMessage((msg) => {
        if (msg.action === 'task:completed') received.push(msg.payload);
      });

      await agent.execute('enqueue', { id: 't1', action: 'process' });
      await agent.execute('run-next');

      // 广播是 async void，等一个 tick
      await new Promise((r) => setTimeout(r, 0));
      expect(received).toHaveLength(1);
      expect((received[0] as TaskResult).taskId).toBe('t1');

      await listener.terminate();
    });
  });

  describe('run-all', () => {
    test('批量执行所有任务', async () => {
      await agent.initialize();
      await agent.activate();

      await agent.execute('enqueue', { id: 't1', action: 'work' });
      await agent.execute('enqueue', { id: 't2', action: 'work' });
      await agent.execute('enqueue', { id: 't3', action: 'work' });

      const result = await agent.execute<{ executed: number }>('run-all');
      expect(result.executed).toBe(3);

      const status = await agent.execute<QueueSnapshot>('status');
      expect(status.pending).toBe(0);
      expect(status.completed).toBe(3);
    });
  });

  describe('status', () => {
    test('返回待执行与已完成数量', async () => {
      await agent.initialize();
      await agent.activate();

      await agent.execute('enqueue', { id: 't1', action: 'work' });
      await agent.execute('enqueue', { id: 't2', action: 'work' });
      await agent.execute('run-next');

      const status = await agent.execute<QueueSnapshot>('status');
      expect(status.pending).toBe(1);
      expect(status.completed).toBe(1);
      expect(status.agentId).toBe('task-agent-1');
    });
  });

  describe('clear', () => {
    test('清空队列后 pending 为 0', async () => {
      await agent.initialize();
      await agent.activate();

      await agent.execute('enqueue', { id: 't1', action: 'work' });
      await agent.execute('enqueue', { id: 't2', action: 'work' });

      const clearResult = await agent.execute<{ cleared: number }>('clear');
      expect(clearResult.cleared).toBe(2);

      const status = await agent.execute<QueueSnapshot>('status');
      expect(status.pending).toBe(0);
    });
  });

  describe('未知操作', () => {
    test('未知 action 抛出错误', async () => {
      await agent.initialize();
      await agent.activate();
      await expect(agent.execute('unknown-action')).rejects.toThrow('[TaskAgent] 未知操作: unknown-action');
    });
  });
});
