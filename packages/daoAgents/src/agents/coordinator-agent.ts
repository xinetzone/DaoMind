/** CoordinatorAgent —— 协调者 Agent
 * 帛书依据："圣人不积，既以为人己愈有"（乙本·八十一章）
 * 设计原则：自身不执行任务，负责调度与协调旗下 Agent，转发命令、聚合结果 */

import { DaoBaseAgent } from '../base';
import { daoAgentMessenger } from '../messaging';
import { daoAgentRegistry } from '../registry';
import type { DaoAgentCapability } from '../types';

/** 分配记录 */
export interface AssignmentRecord {
  readonly assignmentId: string;
  readonly targetAgentId: string;
  readonly action: string;
  readonly payload?: unknown;
  readonly assignedAt: number;
}

/** 协调者快照 */
export interface CoordinatorSnapshot {
  readonly coordinatorId: string;
  readonly rosterSize: number;
  readonly roster: ReadonlyArray<string>;
  readonly totalAssignments: number;
}

/**
 * CoordinatorAgent —— 调度协调 Agent
 *
 * 支持的 actions:
 *   add-agent       { agentId: string }                        → 注册到协调名册
 *   remove-agent    { agentId: string }                        → 从名册移除
 *   assign          { agentId, action, payload? }              → 向指定 Agent 发消息
 *   broadcast       { action, payload? }                       → 向全部名册 Agent 广播
 *   get-roster      {}                                         → 返回名册快照
 *   get-assignments { limit?: number }                         → 返回分配历史
 *   find-agent      { capability: string }                     → 在名册中查找具备该能力的 Agent
 */
export class CoordinatorAgent extends DaoBaseAgent {
  readonly agentType = 'coordinator';
  readonly capabilities: ReadonlyArray<DaoAgentCapability> = [
    { name: 'coordinate-agents', version: '1.0.0', description: 'Agent 调度与任务分配' },
  ];

  private readonly roster = new Set<string>();
  private readonly assignments: AssignmentRecord[] = [];

  async execute<T>(action: string, payload?: unknown): Promise<T> {
    switch (action) {
      case 'add-agent': {
        const { agentId } = payload as { agentId: string };
        if (this.roster.has(agentId)) {
          return { added: false, reason: `${agentId} 已在名册中` } as T;
        }
        this.roster.add(agentId);
        return { added: true, agentId, rosterSize: this.roster.size } as T;
      }

      case 'remove-agent': {
        const { agentId } = payload as { agentId: string };
        const removed = this.roster.delete(agentId);
        return { removed, agentId, rosterSize: this.roster.size } as T;
      }

      case 'assign': {
        const { agentId, action: targetAction, payload: targetPayload } = payload as {
          agentId: string;
          action: string;
          payload?: unknown;
        };
        if (!this.roster.has(agentId)) {
          throw new Error(`[CoordinatorAgent] Agent "${agentId}" 不在协调名册中`);
        }
        const record: AssignmentRecord = {
          assignmentId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          targetAgentId: agentId,
          action: targetAction,
          payload: targetPayload,
          assignedAt: Date.now(),
        };
        this.assignments.push(record);
        daoAgentMessenger.send(this.id, agentId, targetAction, targetPayload);
        return record as T;
      }

      case 'broadcast': {
        const { action: bcastAction, payload: bcastPayload } = payload as {
          action: string;
          payload?: unknown;
        };
        const sent: AssignmentRecord[] = [];
        for (const agentId of this.roster) {
          const record: AssignmentRecord = {
            assignmentId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            targetAgentId: agentId,
            action: bcastAction,
            payload: bcastPayload,
            assignedAt: Date.now(),
          };
          this.assignments.push(record);
          daoAgentMessenger.send(this.id, agentId, bcastAction, bcastPayload);
          sent.push(record);
        }
        return { broadcast: true, recipients: sent.length, records: sent } as T;
      }

      case 'get-roster': {
        const snapshot: CoordinatorSnapshot = {
          coordinatorId: this.id,
          rosterSize: this.roster.size,
          roster: [...this.roster],
          totalAssignments: this.assignments.length,
        };
        return snapshot as T;
      }

      case 'get-assignments': {
        const limit = (payload as { limit?: number } | undefined)?.limit;
        const result = limit !== undefined ? this.assignments.slice(-limit) : [...this.assignments];
        return result as T;
      }

      case 'find-agent': {
        const { capability } = payload as { capability: string };
        const agents = daoAgentRegistry.findByCapability(capability);
        const rosterAgents = agents.filter((a) => this.roster.has(a.id));
        return rosterAgents as T;
      }

      default:
        throw new Error(`[CoordinatorAgent] 未知操作: ${action}`);
    }
  }
}
