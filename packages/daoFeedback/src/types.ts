/** 反馈信号来源 — 帛书《道德经》乙本·四十章：反也者，道之动也 */
export type FeedbackSource = 'daoApps' | 'daoPages' | 'daoDocs';

/** 信号级别 */
export type SignalLevel = 'info' | 'warning' | 'critical' | 'opportunity';

/** 信号类别 */
export type SignalCategory = 'performance' | 'error' | 'resource' | 'behavior' | 'demand';

/** 原始反馈信号 — 阶段一输出：感知（Guan Zhi） */
export interface DaoFeedbackSignal {
  readonly source: FeedbackSource;
  readonly timestamp: number;
  readonly level: SignalLevel;
  readonly category: SignalCategory;
  readonly metrics: Record<string, number>;
  readonly context?: string;
}

/** 因果链接 — 阶段二聚合时建立 */
export interface CausalLink {
  readonly cause: SignalCategory;
  readonly effect: SignalCategory;
  readonly confidence: number; // 0-1
  readonly description: string;
}

/** 趋势类型 */
export type TrendDirection = 'rising' | 'falling' | 'cyclic' | 'stable';

/** 聚合后反馈 — 阶段二输出：聚合（Ju He） */
export interface DaoAggregatedFeedback {
  readonly windowStart: number;
  readonly windowEnd: number;
  readonly signals: DaoFeedbackSignal[];
  readonly aggregateScore: number; // 0-100 综合健康度
  readonly trends: Record<string, TrendDirection>;
  readonly causalChains: CausalLink[];
  readonly recommendedAction?: string;
}

/** 归元类型 — 阶段四操作粒度 */
export type GuiYuanType = 'micro' | 'medium' | 'macro' | 'root';

/** 归元操作 — 阶段四输出：归元（Gui Yuan） */
export interface GuiYuanOperation {
  readonly type: GuiYuanType;
  readonly timestamp: number;
  readonly triggerSignalId?: string;
  readonly changes: Record<string, unknown>;
  auditTrail: AuditEntry[];
  /** 操作状态 */
  status: 'pending' | 'approved' | 'executed' | 'rejected' | 'rolled_back';
  /** 操作唯一标识 */
  readonly id: string;
}

/** 审计条目 — 贯穿四阶段的完整审计链 */
export interface AuditEntry {
  readonly stage: 'perceive' | 'aggregate' | 'harmonize' | 'return';
  readonly timestamp: number;
  readonly nodeId: string;
  readonly action: string;
  readonly data: unknown;
}
