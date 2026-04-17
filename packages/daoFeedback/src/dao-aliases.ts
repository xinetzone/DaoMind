/**
 * dao 前缀类型别名 — 命名规范对齐
 * 帛书依据：「道可道，非常名」— 以道为名，体现自然本性
 */
import type { LifecycleStatus } from './lifecycle.js';
import type { FeedbackRegulatorConfig, RegulationResult } from './regulator.js';
import type {
  ConsensusVote,
  ConsensusResult,
  StableStateSnapshot,
  RedistributionRecord,
} from './safety.js';
import type { PerceiveConfig } from './stage1-perceive.js';
import type {
  ChongQiSignal,
  HarmonizeResult,
  NothingConstraint,
} from './stage3-harmonize.js';
import type { ReturnConfig } from './stage4-return.js';
import type {
  FeedbackSource,
  SignalLevel,
  SignalCategory,
  TrendDirection,
  CausalLink,
  GuiYuanType,
  GuiYuanOperation,
  AuditEntry,
} from './types.js';

/** 生命周期状态 dao 前缀别名 */
export type DaoLifecycleStatus = LifecycleStatus;
/** 反馈调节器配置 dao 前缀别名 */
export type DaoFeedbackRegulatorConfig = FeedbackRegulatorConfig;
/** 调节结果 dao 前缀别名 */
export type DaoRegulationResult = RegulationResult;
/** 共识投票 dao 前缀别名 */
export type DaoConsensusVote = ConsensusVote;
/** 共识结果 dao 前缀别名 */
export type DaoConsensusResult = ConsensusResult;
/** 稳态快照 dao 前缀别名 */
export type DaoStableStateSnapshot = StableStateSnapshot;
/** 再分配记录 dao 前缀别名 */
export type DaoRedistributionRecord = RedistributionRecord;
/** 感知配置 dao 前缀别名 */
export type DaoPerceiveConfig = PerceiveConfig;
/** 中和信号 dao 前缀别名（daoFeedback 内部冲气信号） */
export type DaoHarmonizeChongQiSignal = ChongQiSignal;
/** 中和结果 dao 前缀别名 */
export type DaoHarmonizeResult = HarmonizeResult;
/** 无为约束 dao 前缀别名 */
export type DaoNothingConstraint = NothingConstraint;
/** 归元配置 dao 前缀别名 */
export type DaoReturnConfig = ReturnConfig;
/** 反馈来源 dao 前缀别名 */
export type DaoFeedbackSource = FeedbackSource;
/** 信号级别 dao 前缀别名 */
export type DaoSignalLevel = SignalLevel;
/** 信号类别 dao 前缀别名 */
export type DaoSignalCategory = SignalCategory;
/** 趋势方向 dao 前缀别名 */
export type DaoTrendDirection = TrendDirection;
/** 因果链接 dao 前缀别名 */
export type DaoCausalLink = CausalLink;
/** 归元类型 dao 前缀别名 */
export type DaoGuiYuanType = GuiYuanType;
/** 归元操作 dao 前缀别名 */
export type DaoGuiYuanOperation = GuiYuanOperation;
/** 审计条目 dao 前缀别名 */
export type DaoAuditEntry = AuditEntry;
