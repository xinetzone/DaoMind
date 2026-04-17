import type {
  DaoFeedbackSignal,
  GuiYuanOperation,
  AuditEntry,
  GuiYuanType
} from './types.js';
import { DaoPerceiver } from './stage1-perceive.js';
import { DaoAggregator } from './stage2-aggregate.js';
import { DaoHarmonizer, type NothingConstraint } from './stage3-harmonize.js';
import { DaoReturner } from './stage4-return.js';

/** 生命周期状态 */
export interface LifecycleStatus {
  totalSubmitted: number;
  totalReturned: number;
  averageCycleTime: number;
  lastOperation: GuiYuanOperation | null;
}

/** 阶段四：归元（Gui Yuan）— Collective 层接收最终反馈，执行本体层面的更新 */
export class DaoFeedbackLifecycle {
  private perceiver: DaoPerceiver;
  private aggregator: DaoAggregator;
  private harmonizer: DaoHarmonizer;
  private returner: DaoReturner;
  private status: LifecycleStatus;

  constructor(
    perceiver?: DaoPerceiver,
    aggregator?: DaoAggregator,
    harmonizer?: DaoHarmonizer,
    returner?: DaoReturner
  ) {
    this.perceiver = perceiver ?? new DaoPerceiver();
    this.aggregator = aggregator ?? new DaoAggregator();
    this.harmonizer = harmonizer ?? new DaoHarmonizer();
    this.returner = returner ?? new DaoReturner();
    this.status = {
      totalSubmitted: 0,
      totalReturned: 0,
      averageCycleTime: 0,
      lastOperation: null
    };
  }

  /** 完整的四阶段流程入口 — 帛书《道德经》乙本·四十章：反也者，道之动也 */
  async submit(
    signal: DaoFeedbackSignal,
    options?: {
      operationType?: GuiYuanType;
      changes?: Record<string, unknown>;
      nothingConstraints?: Record<string, NothingConstraint>;
    }
  ): Promise<GuiYuanOperation | null> {
    const startTime = Date.now();
    const auditTrail: AuditEntry[] = [];
    const nodeId = `lifecycle-${Date.now()}`;

    /** Stage 1: 感知（Guan Zhi）— 观其妙 */
    auditTrail.push({
      stage: 'perceive',
      timestamp: Date.now(),
      nodeId,
      action: 'signal_received',
      data: { source: signal.source, category: signal.category, level: signal.level }
    });

    /** Stage 2: 聚合（Ju He）— 大曰逝，逝曰远 */
    const aggregated = this.aggregator.aggregate([signal]);

    auditTrail.push({
      stage: 'aggregate',
      timestamp: Date.now(),
      nodeId,
      action: 'aggregation_complete',
      data: {
        score: aggregated.aggregateScore,
        signalCount: aggregated.signals.length,
        causalChains: aggregated.causalChains.length
      }
    });

    /** Stage 3: 中和（Zhōng Hé）— 万物负阴而抱阳，中气以为和 */
    const harmonized = this.harmonizer.harmonize(aggregated, options?.nothingConstraints);

    auditTrail.push({
      stage: 'harmonize',
      timestamp: Date.now(),
      nodeId,
      action: 'harmonization_complete',
      data: {
        shouldAct: harmonized.shouldAct,
        chongQiSignals: harmonized.chongQiSignals.length,
        filteredScore: harmonized.filteredScore
      }
    });

    this.status.totalSubmitted++;

    /** 如果不需要行动，返回 null */
    if (!harmonized.shouldAct) {
      await this.returner.returnToSource(
        { shouldAct: false, score: harmonized.filteredScore, auditTrail },
        options?.operationType ?? 'micro',
        options?.changes ?? {}
      );
      return null;
    }

    /** Stage 4: 归元（Gui Yuan）— 远曰反 */
    const operation = await this.returner.returnToSource(
      { shouldAct: true, score: harmonized.filteredScore, auditTrail },
      options?.operationType ?? 'medium',
      options?.changes ?? {}
    );

    /** 更新统计信息 */
    const cycleTime = Date.now() - startTime;
    this.status.totalReturned++;
    this.status.averageCycleTime =
      (this.status.averageCycleTime * (this.status.totalReturned - 1) + cycleTime) /
      this.status.totalReturned;
    this.status.lastOperation = operation;

    return operation;
  }

  /** 批量提交信号 */
  async batchSubmit(
    signals: ReadonlyArray<DaoFeedbackSignal>,
    options?: {
      operationType?: GuiYuanType;
      changes?: Record<string, unknown>;
      nothingConstraints?: Record<string, NothingConstraint>;
    }
  ): Promise<ReadonlyArray<GuiYuanOperation>> {
    const operations: GuiYuanOperation[] = [];

    for (const signal of signals) {
      const operation = await this.submit(signal, options);
      if (operation) {
        operations.push(operation);
      }
    }

    return operations;
  }

  /** 获取生命周期状态 */
  getStatus(): LifecycleStatus {
    return { ...this.status };
  }

  /** 重置所有状态 */
  reset(): void {
    this.perceiver = new DaoPerceiver();
    this.aggregator = new DaoAggregator();
    this.harmonizer = new DaoHarmonizer();
    this.returner = new DaoReturner();
    this.status = {
      totalSubmitted: 0,
      totalReturned: 0,
      averageCycleTime: 0,
      lastOperation: null
    };
  }

  /** 获取各阶段实例（用于独立使用或高级配置） */
  getPerceiver(): DaoPerceiver {
    return this.perceiver;
  }

  getAggregator(): DaoAggregator {
    return this.aggregator;
  }

  getHarmonizer(): DaoHarmonizer {
    return this.harmonizer;
  }

  getReturner(): DaoReturner {
    return this.returner;
  }
}
