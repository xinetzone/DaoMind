/**
 * 归元安全机制 — 帛书《道德经》乙本：慎终如始，则无败事
 *
 * 归元操作必须谨慎，确保可追溯、可回滚。
 * 提供审计链追踪、共识决策、稳定态快照与天气重分发四大安全能力。
 */

import { createHash } from 'node:crypto';

/** 共识投票 */
export interface ConsensusVote {
  readonly nodeId: string;
  readonly decision: 'approve' | 'reject' | 'abstain';
  readonly timestamp: number;
  readonly reason?: string;
}

/** 共识结果 */
export interface ConsensusResult {
  readonly proposalId: string;
  readonly totalVoters: number;
  readonly approvals: number;
  readonly rejections: number;
  readonly abstentions: number;
  readonly passed: boolean;
  readonly votes: ReadonlyArray<ConsensusVote>;
}

/** 稳定态快照（用于回滚） */
export interface StableStateSnapshot {
  readonly id: string;
  readonly timestamp: number;
  readonly config: Record<string, unknown>;
  readonly moduleStates: Record<string, unknown>;
  readonly checksum: string;
}

/** 重分发记录 */
export interface RedistributionRecord {
  readonly operationId: string;
  readonly targetType: 'config' | 'strategy' | 'structure';
  readonly affectedNodes: ReadonlyArray<string>;
  readonly payload: unknown;
  readonly distributedAt: number;
  readonly acknowledgments: ReadonlyArray<{ nodeId: string; acknowledgedAt: number }>;
  readonly completed: boolean;
}

/** 安全管理器配置 */
export interface DaoSafetyManagerConfig {
  readonly consensusQuorum?: number;
  readonly maxSnapshotHistory?: number;
  readonly redistributionTimeout?: number;
}

const DEFAULT_CONFIG: Required<DaoSafetyManagerConfig> = {
  consensusQuorum: 0.67,
  maxSnapshotHistory: 10,
  redistributionTimeout: 5000
};

const CONSENSUS_TIMEOUT_MS = 5 * 60 * 1000;

interface InternalAuditEntry {
  id: string;
  stage: string;
  nodeId: string;
  action: string;
  data: unknown;
  triggerSignalId?: string;
  timestamp: number;
}

interface InternalProposal {
  id: string;
  operationType: 'medium' | 'macro' | 'root';
  changes: Record<string, unknown>;
  auditChainId: string;
  createdAt: number;
  votes: ConsensusVote[];
}

export class DaoSafetyManager {
  private config: Required<DaoSafetyManagerConfig>;

  private auditChains = new Map<string, InternalAuditEntry[]>();
  private proposals = new Map<string, InternalProposal>();
  private snapshots: StableStateSnapshot[] = [];
  private snapshotIndex = 0;
  private redistributions = new Map<string, RedistributionRecord>();

  constructor(config?: DaoSafetyManagerConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ========== 审计链 ==========

  appendAuditEntry(entry: {
    stage: string;
    nodeId: string;
    action: string;
    data: unknown;
    triggerSignalId?: string;
  }): string {
    const auditId = this.generateId('audit');
    const now = Date.now();

    let chainKey = entry.triggerSignalId || auditId;
    if (!this.auditChains.has(chainKey)) {
      this.auditChains.set(chainKey, []);
    }

    const chain = this.auditChains.get(chainKey)!;
    const auditEntry: InternalAuditEntry = {
      id: auditId,
      stage: entry.stage,
      nodeId: entry.nodeId,
      action: entry.action,
      data: entry.data,
      triggerSignalId: entry.triggerSignalId,
      timestamp: now
    };

    chain.push(auditEntry);
    return auditId;
  }

  getAuditChain(operationId: string): ReadonlyArray<{
    id: string;
    stage: string;
    nodeId: string;
    action: string;
    data: unknown;
    timestamp: number;
  }> {
    const chain = this.auditChains.get(operationId);
    if (!chain) return [];
    return chain.map(e => ({
      id: e.id,
      stage: e.stage,
      nodeId: e.nodeId,
      action: e.action,
      data: e.data,
      timestamp: e.timestamp
    }));
  }

  validateAuditChain(operationId: string): { valid: boolean; gaps: ReadonlyArray<number> } {
    const chain = this.auditChains.get(operationId);
    if (!chain || chain.length === 0) {
      return { valid: false, gaps: [] };
    }

    const gaps: number[] = [];
    const requiredStages = new Set(['perceive', 'aggregate', 'harmonize', 'return']);
    const presentStages = new Set<string>();

    for (let i = 0; i < chain.length; i++) {
      const entry = chain[i];
      if (!entry) continue;
      presentStages.add(entry.stage);

      if (i > 0) {
        const prevEntry = chain[i - 1];
        if (prevEntry && entry.timestamp < prevEntry.timestamp) {
          gaps.push(i);
        }
      }
    }

    for (const stage of requiredStages) {
      if (!presentStages.has(stage)) {
        gaps.push(-1);
      }
    }

    return { valid: gaps.length === 0, gaps };
  }

  // ========== 共识机制 ==========

  proposeConsensus(proposal: {
    operationType: 'medium' | 'macro' | 'root';
    changes: Record<string, unknown>;
    auditChainId: string;
  }): string {
    const proposalId = this.generateId('prop');
    const now = Date.now();

    const internalProposal: InternalProposal = {
      id: proposalId,
      operationType: proposal.operationType,
      changes: proposal.changes,
      auditChainId: proposal.auditChainId,
      createdAt: now,
      votes: []
    };

    this.proposals.set(proposalId, internalProposal);
    return proposalId;
  }

  vote(proposalId: string, voterNode: string, decision: ConsensusVote['decision'], reason?: string): void {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error(`提案不存在: ${proposalId}`);

    if (Date.now() - proposal.createdAt > CONSENSUS_TIMEOUT_MS) {
      throw new Error(`提案已超时: ${proposalId}`);
    }

    const existingIndex = proposal.votes.findIndex(v => v.nodeId === voterNode);
    const vote: ConsensusVote = {
      nodeId: voterNode,
      decision,
      timestamp: Date.now(),
      reason
    };

    if (existingIndex >= 0) {
      proposal.votes[existingIndex] = vote;
    } else {
      proposal.votes.push(vote);
    }
  }

  checkConsensus(proposalId: string): ConsensusResult | null {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) return null;

    const totalVoters = proposal.votes.length;
    const approvals = proposal.votes.filter(v => v.decision === 'approve').length;
    const rejections = proposal.votes.filter(v => v.decision === 'reject').length;
    const abstentions = proposal.votes.filter(v => v.decision === 'abstain').length;

    const quorumMet = totalVoters > 0 && approvals / totalVoters >= this.config.consensusQuorum;
    const passed = quorumMet && rejections === 0;

    return {
      proposalId,
      totalVoters,
      approvals,
      rejections,
      abstentions,
      passed,
      votes: [...proposal.votes]
    };
  }

  getActiveProposals(): ReadonlyArray<{ id: string; type: string; createdAt: number; votesCollected: number }> {
    const now = Date.now();
    const active: Array<{ id: string; type: string; createdAt: number; votesCollected: number }> = [];

    for (const [, proposal] of this.proposals) {
      if (now - proposal.createdAt <= CONSENSUS_TIMEOUT_MS) {
        active.push({
          id: proposal.id,
          type: proposal.operationType,
          createdAt: proposal.createdAt,
          votesCollected: proposal.votes.length
        });
      }
    }

    return active;
  }

  // ========== 稳定态快照 ==========

  createSnapshot(currentConfig: Record<string, unknown>, moduleStates: Record<string, unknown>): StableStateSnapshot {
    const snapshotId = this.generateId('snap');
    const now = Date.now();
    const rawData = JSON.stringify({ config: currentConfig, moduleStates });
    const checksum = createHash('sha256').update(rawData).digest('hex');

    const snapshot: StableStateSnapshot = {
      id: snapshotId,
      timestamp: now,
      config: JSON.parse(JSON.stringify(currentConfig)),
      moduleStates: JSON.parse(JSON.stringify(moduleStates)),
      checksum
    };

    if (this.snapshots.length < this.config.maxSnapshotHistory) {
      this.snapshots.push(snapshot);
    } else {
      this.snapshots[this.snapshotIndex] = snapshot;
      this.snapshotIndex = (this.snapshotIndex + 1) % this.config.maxSnapshotHistory;
    }

    return snapshot;
  }

  rollback(snapshotId: string): { success: boolean; restoredConfig: Record<string, unknown> } {
    const snapshot = this.snapshots.find(s => s.id === snapshotId);
    if (!snapshot) return { success: false, restoredConfig: {} };

    if (!this.verifySnapshot(snapshotId)) {
      return { success: false, restoredConfig: {} };
    }

    return {
      success: true,
      restoredConfig: JSON.parse(JSON.stringify(snapshot.config))
    };
  }

  listSnapshots(): ReadonlyArray<StableStateSnapshot> {
    return [...this.snapshots];
  }

  verifySnapshot(snapshotId: string): boolean {
    const snapshot = this.snapshots.find(s => s.id === snapshotId);
    if (!snapshot) return false;

    const rawData = JSON.stringify({ config: snapshot.config, moduleStates: snapshot.moduleStates });
    const computedChecksum = createHash('sha256').update(rawData).digest('hex');

    return computedChecksum === snapshot.checksum;
  }

  // ========== 天气重分发 ==========

  async redistribute(operation: {
    operationId: string;
    payload: unknown;
    targetNodes: ReadonlyArray<string>;
  }): Promise<RedistributionRecord> {
    const now = Date.now();
    const record: RedistributionRecord = {
      operationId: operation.operationId,
      targetType: 'config',
      affectedNodes: [...operation.targetNodes],
      payload: operation.payload,
      distributedAt: now,
      acknowledgments: [],
      completed: false
    };

    this.redistributions.set(operation.operationId, record);

    const ackPromises = operation.targetNodes.map(async (nodeId) => {
      try {
        await this.simulateNodeAck(nodeId, operation.payload);
        return { nodeId, acknowledgedAt: Date.now() };
      } catch {
        return null;
      }
    });

    const results = await Promise.allSettled(ackPromises);
    const acks: Array<{ nodeId: string; acknowledgedAt: number }> = [];

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value !== null) {
        acks.push(result.value);
      }
    }

    const updatedRecord: RedistributionRecord = {
      ...record,
      acknowledgments: acks,
      completed: acks.length === operation.targetNodes.length
    };

    this.redistributions.set(operation.operationId, updatedRecord);
    return updatedRecord;
  }

  checkRedistributionStatus(operationId: string): RedistributionRecord | null {
    return this.redistributions.get(operationId) || null;
  }

  async retryRedistribution(operationId: string): Promise<RedistributionRecord | null> {
    const existing = this.redistributions.get(operationId);
    if (!existing) return null;

    const unackedNodes = existing.affectedNodes.filter(
      node => !existing.acknowledgments.some(ack => ack.nodeId === node)
    );

    if (unackedNodes.length === 0) return existing;

    return this.redistribute({
      operationId,
      payload: existing.payload,
      targetNodes: unackedNodes
    });
  }

  // ========== 综合查询 ==========

  getSafetyOverview(): {
    activeProposals: number;
    pendingRedistributions: number;
    snapshotCount: number;
    lastAuditEntryAge: number;
    systemIntegrity: 'healthy' | 'degraded' | 'compromised';
  } {
    const activeProposals = this.getActiveProposals().length;
    let pendingRedistributions = 0;

    for (const [, record] of this.redistributions) {
      if (!record.completed) pendingRedistributions++;
    }

    const snapshotCount = this.snapshots.length;
    let lastAuditEntryAge = Infinity;

    for (const [, chain] of this.auditChains) {
      if (chain.length > 0) {
        const latestTimestamp = Math.max(...chain.map(e => e.timestamp));
        const age = Date.now() - latestTimestamp;
        lastAuditEntryAge = Math.min(lastAuditEntryAge, age);
      }
    }

    if (lastAuditEntryAge === Infinity) lastAuditEntryAge = 0;

    let systemIntegrity: 'healthy' | 'degraded' | 'compromised' = 'healthy';

    if (pendingRedistributions > 3 || activeProposals > 10) {
      systemIntegrity = 'degraded';
    }

    if (snapshotCount === 0 && pendingRedistributions > 5) {
      systemIntegrity = 'compromised';
    }

    return {
      activeProposals,
      pendingRedistributions,
      snapshotCount,
      lastAuditEntryAge,
      systemIntegrity
    };
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private async simulateNodeAck(nodeId: string, _payload: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) resolve();
        else reject(new Error(`节点 ${nodeId} 确认失败`));
      }, this.config.redistributionTimeout * Math.random() * 0.5);
    });
  }
}
