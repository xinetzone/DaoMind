import type {
  GuiYuanType,
  GuiYuanOperation,
  AuditEntry
} from './types.js';

/** 归元配置 — 帛书《道德经》乙本·二十五章：大曰逝，逝曰远，远曰反 */
export interface ReturnConfig {
  limits: {
    micro: { maxPerDay: number };
    medium: { maxPerDay: number };
    macro: { maxPerMonth: number };
    root: { requiresConsensus: boolean; requiresManualApproval: boolean };
  };
}

const DEFAULT_CONFIG: ReturnConfig = {
  limits: {
    micro: { maxPerDay: Infinity },
    medium: { maxPerDay: 3 },
    macro: { maxPerMonth: 1 },
    root: { requiresConsensus: true, requiresManualApproval: true }
  }
};

/** 操作计数器 */
interface OperationCounter {
  micro: { count: number; date: string };
  medium: { count: number; date: string };
  macro: { count: number; month: string };
}

/** 阶段四：归元（Gui Yuan）— Collective 层接收最终反馈，执行本体层面的更新 */
export class DaoReturner {
  private config: ReturnConfig;
  private operations: GuiYuanOperation[];
  private counter: OperationCounter;
  private operationIndex: number;

  constructor(config?: Partial<ReturnConfig>) {
    this.config = this.mergeConfig(DEFAULT_CONFIG, config || {});
    this.operations = [];
    this.counter = this.resetCounter();
    this.operationIndex = 0;
  }

  /** 归元操作 — 检查频率限制、构建审计链、执行或标记为待确认 */
  async returnToSource(
    harmonizedResult: { shouldAct: boolean; score: number; auditTrail: AuditEntry[] },
    operationType: GuiYuanType,
    changes: Record<string, unknown>
  ): Promise<GuiYuanOperation> {
    const operationId = `gy-${Date.now()}-${++this.operationIndex}`;
    const timestamp = Date.now();

    /** 检查是否需要行动 */
    if (!harmonizedResult.shouldAct) {
      const operation: GuiYuanOperation = {
        type: operationType,
        timestamp,
        triggerSignalId: undefined,
        changes: {},
        auditTrail: [
          ...harmonizedResult.auditTrail,
          {
            stage: 'return',
            timestamp,
            nodeId: operationId,
            action: 'skip_no_action_needed',
            data: { reason: '中和判断无需行动', score: harmonizedResult.score }
          }
        ],
        status: 'rejected',
        id: operationId
      };
      this.operations.push(operation);
      return operation;
    }

    /** 检查频率限制 */
    if (!this.checkRateLimit(operationType)) {
      const operation: GuiYuanOperation = {
        type: operationType,
        timestamp,
        triggerSignalId: undefined,
        changes: {},
        auditTrail: [
          ...harmonizedResult.auditTrail,
          {
            stage: 'return',
            timestamp,
            nodeId: operationId,
            action: 'reject_rate_limit',
            data: { reason: '归元频率超限', operationType }
          }
        ],
        status: 'rejected',
        id: operationId
      };
      this.operations.push(operation);
      return operation;
    }

    /** 构建完整审计链 */
    const fullAuditTrail: AuditEntry[] = [
      ...harmonizedResult.auditTrail,
      {
        stage: 'return',
        timestamp,
        nodeId: operationId,
        action: 'initiate_guiyuan',
        data: { operationType, changes, score: harmonizedResult.score }
      }
    ];

    /** 根据操作类型决定状态 */
    let status: GuiYuanOperation['status'];
    switch (operationType) {
      case 'micro':
        status = 'executed';
        this.updateCounter(operationType);
        break;
      case 'medium':
      case 'macro':
      case 'root':
        status = 'pending';
        break;
      default:
        status = 'pending';
    }

    const operation: GuiYuanOperation = {
      type: operationType,
      timestamp,
      changes: { ...changes },
      auditTrail: fullAuditTrail,
      status,
      id: operationId
    };

    this.operations.push(operation);
    return operation;
  }

  /** 获取待执行操作列表 */
  getPendingOperations(): ReadonlyArray<GuiYuanOperation> {
    return this.operations.filter(op => op.status === 'pending');
  }

  /** 批准待执行操作 — 帛书原文：人法地，地法天，天法道，道法自然 */
  async approve(operationId: string): Promise<boolean> {
    const operation = this.operations.find(op => op.id === operationId);
    if (!operation || operation.status !== 'pending') {
      return false;
    }

    operation.status = 'approved';
    this.updateCounter(operation.type);

    /** 自动执行已批准的操作 */
    operation.status = 'executed';
    operation.auditTrail = [
      ...operation.auditTrail,
      {
        stage: 'return',
        timestamp: Date.now(),
        nodeId: operation.id,
        action: 'approved_and_executed',
        data: { approvedBy: 'manual' }
      }
    ];

    return true;
  }

  /** 拒绝待执行操作 */
  reject(operationId: string, reason: string): void {
    const operation = this.operations.find(op => op.id === operationId);
    if (!operation || operation.status !== 'pending') {
      return;
    }

    operation.status = 'rejected';
    operation.auditTrail = [
      ...operation.auditTrail,
      {
        stage: 'return',
        timestamp: Date.now(),
        nodeId: operation.id,
        action: 'rejected',
        data: { reason }
      }
    ];
  }

  /** 获取操作历史 */
  getHistory(limit?: number): ReadonlyArray<GuiYuanOperation> {
    const sorted = [...this.operations].sort((a, b) => b.timestamp - a.timestamp);
    return limit ? sorted.slice(0, limit) : sorted;
  }

  /** 回滚到前一稳定态 — 帛书原文：反也者，道之动也 */
  async rollback(operationId: string): Promise<boolean> {
    const operation = this.operations.find(op => op.id === operationId);
    if (!operation || (operation.status !== 'executed' && operation.status !== 'approved')) {
      return false;
    }

    operation.status = 'rolled_back';
    operation.auditTrail = [
      ...operation.auditTrail,
      {
        stage: 'return',
        timestamp: Date.now(),
        nodeId: operation.id,
        action: 'rolled_back',
        data: { originalStatus: operation.status }
      }
    ];

    return true;
  }

  /** 更新配置 */
  setConfig(config: Partial<ReturnConfig>): void {
    this.config = this.mergeConfig(this.config, config);
  }

  /** 获取当前配置 */
  getConfig(): Readonly<ReturnConfig> {
    return this.config;
  }

  /** 重置所有状态 */
  reset(): void {
    this.operations = [];
    this.counter = this.resetCounter();
    this.operationIndex = 0;
  }

  private checkRateLimit(operationType: GuiYuanType): boolean {
    const now = new Date();
    const today = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const thisMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;

    switch (operationType) {
      case 'micro':
        if (this.counter.micro.date !== today) {
          this.counter.micro = { count: 0, date: today };
        }
        return this.counter.micro.count < this.config.limits.micro.maxPerDay;

      case 'medium':
        if (this.counter.medium.date !== today) {
          this.counter.medium = { count: 0, date: today };
        }
        return this.counter.medium.count < this.config.limits.medium.maxPerDay;

      case 'macro':
        if (this.counter.macro.month !== thisMonth) {
          this.counter.macro = { count: 0, month: thisMonth };
        }
        return this.counter.macro.count < this.config.limits.macro.maxPerMonth;

      case 'root':
        return true; // root 操作不限制频率，但需要共识和人工批准

      default:
        return true;
    }
  }

  private updateCounter(operationType: GuiYuanType): void {
    const now = new Date();
    const today = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const thisMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;

    switch (operationType) {
      case 'micro':
        if (this.counter.micro.date !== today) {
          this.counter.micro = { count: 1, date: today };
        } else {
          this.counter.micro.count++;
        }
        break;

      case 'medium':
        if (this.counter.medium.date !== today) {
          this.counter.medium = { count: 1, date: today };
        } else {
          this.counter.medium.count++;
        }
        break;

      case 'macro':
        if (this.counter.macro.month !== thisMonth) {
          this.counter.macro = { count: 1, month: thisMonth };
        } else {
          this.counter.macro.count++;
        }
        break;
    }
  }

  private resetCounter(): OperationCounter {
    const now = new Date();
    const today = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const thisMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;

    return {
      micro: { count: 0, date: today },
      medium: { count: 0, date: today },
      macro: { count: 0, month: thisMonth }
    };
  }

  private mergeConfig(base: ReturnConfig, partial: Partial<ReturnConfig>): ReturnConfig {
    return {
      limits: {
        ...base.limits,
        ...(partial.limits || {})
      } as ReturnConfig['limits']
    };
  }
}
