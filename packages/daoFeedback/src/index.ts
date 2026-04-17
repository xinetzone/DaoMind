/**
 * @dao/feedback — 反馈
 * 帛书《道德经》乙本·四十章：反也者，道之动也
 * 帛书《道德经》乙本·二十五章：大曰逝，逝曰远，远曰反
 *
 * 四阶段反馈回归机制：
 * - 阶段一：感知（Guan Zhi）— 叶节点捕获运行态
 * - 阶段二：聚合（Ju He）— Nexus 级智能聚合
 * - 阶段三：中和（Zhōng Hé）— Anything 层调和处理
 * - 阶段四：归元（Gui Yuan）— Collective 层本体更新
 */

/** 类型系统 */
export type {
  FeedbackSource,
  SignalLevel,
  SignalCategory,
  DaoFeedbackSignal,
  CausalLink,
  TrendDirection,
  DaoAggregatedFeedback,
  GuiYuanType,
  GuiYuanOperation,
  AuditEntry
} from './types.js';

/** 阶段一：感知（Guan Zhi） */
export type { PerceiveConfig } from './stage1-perceive.js';
export { DaoPerceiver } from './stage1-perceive.js';

/** 阶段二：聚合（Ju He） */
export { DaoAggregator } from './stage2-aggregate.js';

/** 阶段三：中和（Zhōng Hé） */
export type { ChongQiSignal, HarmonizeResult, NothingConstraint } from './stage3-harmonize.js';
export { DaoHarmonizer } from './stage3-harmonize.js';

/** 阶段四：归元（Gui Yuan） */
export type { ReturnConfig } from './stage4-return.js';
export { DaoReturner } from './stage4-return.js';

/** 反馈生命周期编排器 */
export type { LifecycleStatus } from './lifecycle.js';
export { DaoFeedbackLifecycle } from './lifecycle.js';

/** 反馈强度调节器 — 甚爱必大费，多藏必厚亡 */
export type { FeedbackRegulatorConfig, RegulationResult } from './regulator.js';
export { DaoFeedbackRegulator } from './regulator.js';

/** 归元安全机制 — 慎终如始，则无败事 */
export type {
  ConsensusVote,
  ConsensusResult,
  StableStateSnapshot,
  RedistributionRecord,
  DaoSafetyManagerConfig
} from './safety.js';
export { DaoSafetyManager } from './safety.js';

// dao 前缀别名 — 命名规范对齐
export * from './dao-aliases.js';
