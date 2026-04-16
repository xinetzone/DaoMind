import { daoNothingVoid } from '@daomind/nothing';
import { daoAgentMessenger } from '../messaging';
import { daoAgentRegistry } from '../registry';
import { CoordinatorAgent } from '../agents/coordinator-agent';
import { TaskAgent } from '../agents/task-agent';
import type { CoordinatorSnapshot, AssignmentRecord } from '../agents/coordinator-agent';

const nextTick = () => new Promise<void>((r) => setTimeout(r, 0));

describe('CoordinatorAgent', () => {
  let coordinator: CoordinatorAgent;

  beforeEach(() => {
    daoNothingVoid.void();
    // 清空注册表
    daoAgentRegistry.listAll().forEach((a) => daoAgentRegistry.unregister(a.id));
    coordinator = new CoordinatorAgent('coord-1');
  });

  afterEach(async () => {
    if (coordinator.state !== 'deceased') {
      try { await coordinator.terminate(); } catch { /* already dead */ }
    }
  });

  describe('生命周期', () => {
    test('agentType 为 coordinator', () => {
      expect(coordinator.agentType).toBe('coordinator');
      expect(coordinator.capabilities[0]?.name).toBe('coordinate-agents');
    });
  });

  describe('add-agent / remove-agent', () => {
    test('添加 Agent 到名册', async () => {
      await coordinator.initialize();
      await coordinator.activate();

      const result = await coordinator.execute<{ added: boolean; rosterSize: number }>(
        'add-agent', { agentId: 'agent-a' },
      );
      expect(result.added).toBe(true);
      expect(result.rosterSize).toBe(1);
    });

    test('重复添加返回 added: false', async () => {
      await coordinator.initialize();
      await coordinator.activate();

      await coordinator.execute('add-agent', { agentId: 'agent-a' });
      const result = await coordinator.execute<{ added: boolean }>('add-agent', { agentId: 'agent-a' });
      expect(result.added).toBe(false);
    });

    test('从名册移除 Agent', async () => {
      await coordinator.initialize();
      await coordinator.activate();

      await coordinator.execute('add-agent', { agentId: 'agent-a' });
      const result = await coordinator.execute<{ removed: boolean; rosterSize: number }>(
        'remove-agent', { agentId: 'agent-a' },
      );
      expect(result.removed).toBe(true);
      expect(result.rosterSize).toBe(0);
    });

    test('移除不存在的 Agent 返回 removed: false', async () => {
      await coordinator.initialize();
      await coordinator.activate();

      const result = await coordinator.execute<{ removed: boolean }>(
        'remove-agent', { agentId: 'ghost' },
      );
      expect(result.removed).toBe(false);
    });
  });

  describe('assign', () => {
    test('向名册中的 Agent 发送消息', async () => {
      await coordinator.initialize();
      await coordinator.activate();

      const task = new TaskAgent('worker-1');
      await task.initialize();
      await task.activate();
      const received: unknown[] = [];
      task.onMessage((msg) => { received.push(msg); });

      await coordinator.execute('add-agent', { agentId: 'worker-1' });
      const record = await coordinator.execute<AssignmentRecord>('assign', {
        agentId: 'worker-1',
        action: 'enqueue',
        payload: { id: 't1', action: 'work' },
      });

      await nextTick();
      expect(record.targetAgentId).toBe('worker-1');
      expect(record.action).toBe('enqueue');
      expect(received).toHaveLength(1);

      await task.terminate();
    });

    test('向不在名册中的 Agent 发送消息抛出错误', async () => {
      await coordinator.initialize();
      await coordinator.activate();

      await expect(
        coordinator.execute('assign', { agentId: 'unknown', action: 'work' }),
      ).rejects.toThrow('不在协调名册中');
    });
  });

  describe('broadcast', () => {
    test('向全部名册成员广播', async () => {
      await coordinator.initialize();
      await coordinator.activate();

      const receivedA: unknown[] = [];
      const receivedB: unknown[] = [];

      const agentA = new TaskAgent('worker-a');
      const agentB = new TaskAgent('worker-b');
      await agentA.initialize(); await agentA.activate();
      await agentB.initialize(); await agentB.activate();
      agentA.onMessage((m) => { receivedA.push(m); });
      agentB.onMessage((m) => { receivedB.push(m); });

      await coordinator.execute('add-agent', { agentId: 'worker-a' });
      await coordinator.execute('add-agent', { agentId: 'worker-b' });

      const result = await coordinator.execute<{ recipients: number }>('broadcast', {
        action: 'ping',
        payload: { from: 'coord' },
      });

      await nextTick();
      expect(result.recipients).toBe(2);
      expect(receivedA).toHaveLength(1);
      expect(receivedB).toHaveLength(1);

      await agentA.terminate();
      await agentB.terminate();
    });

    test('名册为空时 broadcast recipients 为 0', async () => {
      await coordinator.initialize();
      await coordinator.activate();

      const result = await coordinator.execute<{ recipients: number }>('broadcast', { action: 'ping' });
      expect(result.recipients).toBe(0);
    });
  });

  describe('get-roster', () => {
    test('返回完整的协调者快照', async () => {
      await coordinator.initialize();
      await coordinator.activate();

      await coordinator.execute('add-agent', { agentId: 'a1' });
      await coordinator.execute('add-agent', { agentId: 'a2' });

      const snapshot = await coordinator.execute<CoordinatorSnapshot>('get-roster');
      expect(snapshot.coordinatorId).toBe('coord-1');
      expect(snapshot.rosterSize).toBe(2);
      expect(snapshot.roster).toContain('a1');
      expect(snapshot.roster).toContain('a2');
    });
  });

  describe('get-assignments', () => {
    test('返回全部分配历史', async () => {
      await coordinator.initialize();
      await coordinator.activate();

      await coordinator.execute('add-agent', { agentId: 'worker-x' });
      await coordinator.execute('assign', { agentId: 'worker-x', action: 'job-1' });
      await coordinator.execute('assign', { agentId: 'worker-x', action: 'job-2' });

      const assignments = await coordinator.execute<AssignmentRecord[]>('get-assignments');
      expect(assignments).toHaveLength(2);
      expect(assignments[0]?.action).toBe('job-1');
      expect(assignments[1]?.action).toBe('job-2');
    });

    test('支持 limit 参数', async () => {
      await coordinator.initialize();
      await coordinator.activate();

      await coordinator.execute('add-agent', { agentId: 'worker-y' });
      for (let i = 0; i < 5; i++) {
        await coordinator.execute('assign', { agentId: 'worker-y', action: `job-${i}` });
      }

      const recent = await coordinator.execute<AssignmentRecord[]>('get-assignments', { limit: 2 });
      expect(recent).toHaveLength(2);
      expect(recent[1]?.action).toBe('job-4');
    });
  });

  describe('find-agent', () => {
    test('在名册中查找具备指定能力的 Agent', async () => {
      await coordinator.initialize();
      await coordinator.activate();

      const task = new TaskAgent('searchable-task');
      await task.initialize();
      await task.activate();
      daoAgentRegistry.register(task);

      await coordinator.execute('add-agent', { agentId: 'searchable-task' });

      const found = await coordinator.execute<TaskAgent[]>('find-agent', { capability: 'execute-task' });
      expect(found.length).toBeGreaterThan(0);
      expect(found[0]?.id).toBe('searchable-task');

      await task.terminate();
    });
  });

  describe('未知操作', () => {
    test('未知 action 抛出错误', async () => {
      await coordinator.initialize();
      await coordinator.activate();
      await expect(coordinator.execute('unknown')).rejects.toThrow('[CoordinatorAgent] 未知操作: unknown');
    });
  });
});
