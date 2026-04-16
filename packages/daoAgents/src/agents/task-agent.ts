/** TaskAgent —— 任务队列执行者
 * 帛书依据："为而不争，功成而弗居"（乙本·七十七章）
 * 设计原则：接受任务、按优先级排序、逐一执行，完成后广播结果 */

import { DaoBaseAgent } from '../base';
import type { DaoAgentCapability } from '../types';

/** 任务定义 */
export interface AgentTask {
  readonly id: string;
  readonly action: string;
  readonly payload?: unknown;
  readonly priority?: number; // 越大越优先，默认 0
  readonly enqueuedAt?: number;
}

/** 任务执行结果 */
export interface TaskResult {
  readonly taskId: string;
  readonly action: string;
  readonly completedAt: number;
  readonly duration: number;
  readonly output?: unknown;
}

/** 队列状态快照 */
export interface QueueSnapshot {
  readonly pending: number;
  readonly completed: number;
  readonly agentId: string;
}

/**
 * TaskAgent —— 带优先级队列的任务执行 Agent
 *
 * 支持的 actions:
 *   enqueue   { task: AgentTask }  → 入队并返回当前队列信息
 *   run-next  {}                   → 执行队列头部任务并广播 task:completed
 *   run-all   {}                   → 批量执行全部队列任务
 *   status    {}                   → 返回 QueueSnapshot
 *   clear     {}                   → 清空队列
 */
export class TaskAgent extends DaoBaseAgent {
  readonly agentType = 'task';
  readonly capabilities: ReadonlyArray<DaoAgentCapability> = [
    { name: 'execute-task', version: '1.0.0', description: '带优先级队列的任务执行' },
  ];

  private readonly queue: AgentTask[] = [];
  private readonly results: TaskResult[] = [];

  async execute<T>(action: string, payload?: unknown): Promise<T> {
    switch (action) {
      case 'enqueue': {
        const task = payload as AgentTask;
        const taskWithMeta: AgentTask = {
          ...task,
          enqueuedAt: task.enqueuedAt ?? Date.now(),
          priority: task.priority ?? 0,
        };
        // 按优先级降序插入（优先级高的排前面）
        let idx = this.queue.length;
        for (let i = 0; i < this.queue.length; i++) {
          if ((this.queue[i]?.priority ?? 0) < (taskWithMeta.priority ?? 0)) {
            idx = i;
            break;
          }
        }
        this.queue.splice(idx, 0, taskWithMeta);
        return { queued: true, position: idx + 1, total: this.queue.length } as T;
      }

      case 'run-next': {
        const task = this.queue.shift();
        if (!task) return { executed: false, reason: '队列为空' } as T;
        const startedAt = Date.now();
        const result: TaskResult = {
          taskId: task.id,
          action: task.action,
          completedAt: Date.now(),
          duration: Date.now() - startedAt,
          output: task.payload,
        };
        this.results.push(result);
        this.send('*', 'task:completed', result);
        return result as T;
      }

      case 'run-all': {
        const executed: TaskResult[] = [];
        while (this.queue.length > 0) {
          const result = await this.execute<TaskResult>('run-next');
          if ((result as { executed?: boolean }).executed === false) break;
          executed.push(result);
        }
        return { executed: executed.length, results: executed } as T;
      }

      case 'status': {
        const snapshot: QueueSnapshot = {
          pending: this.queue.length,
          completed: this.results.length,
          agentId: this.id,
        };
        return snapshot as T;
      }

      case 'clear': {
        const cleared = this.queue.length;
        this.queue.length = 0;
        return { cleared, agentId: this.id } as T;
      }

      default:
        throw new Error(`[TaskAgent] 未知操作: ${action}`);
    }
  }
}
