/** @daomind/collective —— 道宇宙根节点
 * 帛书依据："道生一，一生二，二生三，三生万物"（乙本·四十二章）
 * 设计原则：本包作为整个 DaoMind 系统的统一门面，
 *           再导出所有核心包，并提供 DaoUniverse 统一入口。
 *           用户只需 import from '@daomind/collective' 即可使用全系统。 */

// ============================================================
// @daomind/nothing — 无名层：类型契约 + 虚空事件总线 + 函数式工具
// ============================================================
export type { Void, Potential, Origin } from '@daomind/nothing';
export type { EmptyInterface, ExistenceContract, MutabilityContract } from '@daomind/nothing';
export type { WuWeiConstraint, ZiRanInvariant } from '@daomind/nothing';
export type { DaoNothingEvent } from '@daomind/nothing';
export { daoIsNothing, daoBirthFromNothing } from '@daomind/nothing';
export { daoNothingVoid, DaoNothingVoid } from '@daomind/nothing';

// DaoOption<T>
export type { DaoSome, DaoNone, DaoOption } from '@daomind/nothing';
export {
  daoSome, daoNone, daoIsSome, daoIsNone,
  daoFromNullable, daoMap, daoUnwrap, daoUnwrapOrThrow,
} from '@daomind/nothing';

// DaoResult<T, E>
export type { DaoOk, DaoErr, DaoResult } from '@daomind/nothing';
export {
  daoOk, daoErr, daoIsOk, daoIsErr,
  daoTry, daoTryAsync, daoMapResult, daoMapErr,
  daoUnwrapResult, daoUnwrapOr,
} from '@daomind/nothing';

// ============================================================
// @daomind/anything — 有名层：模块容器
// ============================================================
export type { DaoModuleRegistration, ModuleLifecycle, DaoModuleMeta } from '@daomind/anything';
export { DaoAnythingContainer, daoContainer } from '@daomind/anything';

// ============================================================
// @daomind/agents — 行动层：Agent 系统
// ============================================================
export type { DaoAgent, DaoAgentCapability, AgentState } from '@daomind/agents';
export type { AgentMessage, MessageHandler, MessageFilter } from '@daomind/agents';
export type {
  AgentTask, TaskResult, QueueSnapshot,
  Observation, SystemSnapshot,
  AssignmentRecord, CoordinatorSnapshot,
} from '@daomind/agents';
export {
  DaoBaseAgent, AGENT_LIFECYCLE_EVENT,
  daoAgentMessenger, DaoAgentMessenger,
  daoAgentRegistry, DaoAgentRegistry,
  daoAgentContainerBridge, DaoAgentContainerBridge,
  TaskAgent, ObserverAgent, CoordinatorAgent,
} from '@daomind/agents';

// ============================================================
// @daomind/apps — 应用层：可执行程序容器
// ============================================================
export type { AppState, DaoAppDefinition, DaoAppInstance } from '@daomind/apps';
export { DaoAppContainer, daoAppContainer, DaoLifecycleManager, daoLifecycleManager } from '@daomind/apps';

// ============================================================
// @daomind/collective 自身 —— DaoUniverse 统一门面
// ============================================================
export type { DaoSystemSnapshot } from './universe';
export { DaoUniverse, daoUniverse } from './universe';

// ============================================================
// @modulux/qi — 气通道层（四气传输基础设施）
// ============================================================
export type { DaoMessage, QiChannelType, DaoMessagePriority } from '@modulux/qi';
export {
  HunyuanBus, DaoRouter, DaoSerializer, DaoSigner, DaoBackpressure,
  TianQiChannel, DiQiChannel, RenQiChannel, ChongQiRegulator,
} from '@modulux/qi';

// DaoQiAgentBridge — 气 × Agent 桥接器
export { DaoQiAgentBridge } from './qi-bridge';

// ============================================================
// @daomind/monitor — 监控层（五感引擎 + 快照聚合）
// ============================================================
export type {
  HeatmapPoint, FlowVector, YinYangGauge,
  MeridianAlert, QiDiagnosis, MonitorSnapshot,
} from '@daomind/monitor';
export {
  DaoHeatmapEngine, DaoVectorField, DaoYinYangGaugeEngine,
  DaoAlertEngine, DaoDiagnosisEngine, DaoSnapshotAggregator,
} from '@daomind/monitor';

// DaoUniverseMonitor — DaoUniverse × daoMonitor 集成桥接器
export { DaoUniverseMonitor } from './universe-monitor';

// ============================================================
// @daomind/chronos — 宙时层（时序驱动基础设施）
// ============================================================
export type { DaoChronosPoint, DaoChronosConfig, TimeSource } from '@daomind/chronos';
export { DaoChronos, daoGetChronos } from '@daomind/chronos';

// DaoUniverseClock — 时序心跳（daoChronos × daoCollective）
export type { ClockTickCallback } from './universe-clock';
export { DaoUniverseClock } from './universe-clock';

// ============================================================
// @daomind/feedback — 反馈层（闭环自调节）
// ============================================================
export type { FeedbackRegulatorConfig, RegulationResult } from '@daomind/feedback';
export type { LifecycleStatus } from '@daomind/feedback';
export { DaoFeedbackRegulator, DaoFeedbackLifecycle } from '@daomind/feedback';

// DaoUniverseFeedback — 闭环反馈（daoFeedback × DaoUniverseClock）
export type { FeedbackEntry } from './universe-feedback';
export { DaoUniverseFeedback } from './universe-feedback';

// ============================================================
// @daomind/verify — 哲学核查层
// ============================================================
export type {
  DaoVerificationResult, DaoVerificationCategory,
  DaoVerificationReport, DaoPhilosophyAssessment,
} from '@daomind/verify';
export { DaoVerificationReporter, DAO_VERIFICATION_CATEGORY_LABELS } from '@daomind/verify';

// DaoUniverseAudit — 哲学自我审查（daoVerify × DaoUniverse）
export type { AuditSnapshot } from './universe-audit';
export { DaoUniverseAudit } from './universe-audit';

// ============================================================
// @daomind/times — 时调度层
// ============================================================
export type { DaoTimerHandle, DaoTimerOptions, DaoScheduledTask, DaoTimeWindow } from '@daomind/times';
export { DaoTimer, DaoScheduler, daoTimer, daoScheduler, daoTimeWindow } from '@daomind/times';

// DaoUniverseScheduler — 时序驱动任务调度（daotimes × DaoUniverseClock）
export type { ExecutionRecord } from './universe-scheduler';
export { DaoUniverseScheduler } from './universe-scheduler';
