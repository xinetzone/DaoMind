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

// ============================================================
// @daomind/skills — 技能层
// ============================================================
export type { SkillId, SkillState, DaoSkillDefinition, DaoSkillInstance, DaoSkillScore } from '@daomind/skills';
export { DaoSkillRegistry, daoSkillRegistry, DaoSkillActivator, daoSkillActivator, DaoSkillScorer, daoSkillScorer, DaoSkillCombiner, daoSkillCombiner } from '@daomind/skills';

// DaoUniverseSkills — 时序驱动技能生命周期（daoSkilLs × DaoUniverseScheduler）
export type { SkillEventRecord } from './universe-skills';
export { DaoUniverseSkills } from './universe-skills';

// ============================================================
// @daomind/nexus — 枢纽层（服务网格 + 路由 + 负载均衡）
// ============================================================
export type { ConnectionType, ConnectionState, ConnectionHandle, DaoConnection, DaoRouteRule, LoadBalanceStrategy, DaoServiceInstance, DaoNexusRequest, DaoNexusMetrics } from '@daomind/nexus';
export { DaoServiceDiscovery, daoServiceDiscovery, DaoNexusRouter, daoNexusRouter, DaoLoadBalancer, daoLoadBalancer } from '@daomind/nexus';

// DaoUniverseNexus — 服务网格 × 宇宙健康（daoNexus × DaoUniverseMonitor）
export type { NexusHealthRecord, NexusDispatchResult, NexusMetrics } from './universe-nexus';
export { DaoUniverseNexus } from './universe-nexus';

// ============================================================
// @daomind/docs — 文档层（知识图谱 + 版本追踪 + API 文档）
// ============================================================
export type { DocType, DaoDocEntry, DaoApiDescription, DaoVersionRecord, DaoKnowledgeNode } from '@daomind/docs';
export { daoDocStore, DaoDocStore, daoApiDocs, DaoApiDocs, daoVersionTracker, DaoVersionTracker, daoKnowledgeGraph, DaoKnowledgeGraph } from '@daomind/docs';

// DaoUniverseDocs — 知识图谱 × 哲学文档管理（daoDocs × DaoUniverseAudit）
export type { DocAuditResult, DocsSnapshot } from './universe-docs';
export { DaoUniverseDocs } from './universe-docs';

// ============================================================
// @daomind/spaces — 空间层（命名空间 + 资源定位）
// ============================================================
export type { DaoSpaceId, DaoSpace, DaoResourceLocator, PartitionStrategy } from '@daomind/spaces';
export { daoNamespace, DaoNamespaceManager } from '@daomind/spaces';

// DaoUniverseSpaces — 命名空间 × 服务网格路由归位（daoSpaces × DaoUniverseNexus）
export type { SpacesSnapshot } from './universe-spaces';
export { DaoUniverseSpaces } from './universe-spaces';

// ============================================================
// @daomind/pages — 页面层（组件树 + 状态绑定）
// ============================================================
export type { ComponentState, DaoComponent, DaoViewSnapshot, BindingPath, DaoBinding } from '@daomind/pages';
export { daoComponentTree, DaoComponentTree, daoStateBinding, DaoStateBinding } from '@daomind/pages';

// DaoUniversePages — 组件树 × 状态绑定 × 时序驱动刷新（daoPages × DaoUniverseScheduler）
export type { PagesSnapshot } from './universe-pages';
export { DaoUniversePages } from './universe-pages';

// ============================================================
// DaoUniverseAgents — Agent 生命周期 × 监控健康反馈（@daomind/agents × DaoUniverseMonitor）
// ============================================================
export type { AgentsSnapshot } from './universe-agents';
export { DaoUniverseAgents } from './universe-agents';

// ============================================================
// DaoUniverseApps — 应用状态机 × Agent 广播（@daomind/apps × DaoUniverseAgents）
// ============================================================
export type { AppsSnapshot } from './universe-apps';
export { DaoUniverseApps } from './universe-apps';

// ============================================================
// DaoUniverseTimes — 定时器 × 任务调度 × 时间窗口（@daomind/times × DaoUniverseApps）
// ============================================================
export type { TimesSnapshot } from './universe-times';
export { DaoUniverseTimes } from './universe-times';

// ============================================================
// DaoUniverseModules — IoC 容器 × Agent 广播（@daomind/anything × DaoUniverseApps）
// ============================================================
export type { ModulesSnapshot } from './universe-modules';
export { DaoUniverseModules } from './universe-modules';

// ============================================================
// DaoUniverseQi — 混元气总线 × 宇宙服务网格（@modulux/qi × DaoUniverseNexus）
// ============================================================
export type { QiSnapshot } from './universe-qi';
export { DaoUniverseQi } from './universe-qi';

// ============================================================
// DaoUniverseBenchmark — 性能基准 × 宇宙健康感知（@daomind/benchmark × DaoUniverseMonitor）
// ============================================================
export type { BenchmarkRunRecord, BenchmarkSnapshot } from './universe-benchmark';
export { DaoUniverseBenchmark } from './universe-benchmark';

// ============================================================
// DaoUniverseDiagnostic — 宇宙综合诊断（DaoUniverseAudit × DaoUniverseBenchmark）
// ============================================================
export type { DiagnosticRecord, DiagnosticSnapshot } from './universe-diagnostic';
export { DaoUniverseDiagnostic } from './universe-diagnostic';

// ============================================================
// DaoUniverseFacade — 全栈自动装配门面（17 桥接器一键构建）
// ============================================================
export type { DaoFacadeSnapshot } from './universe-facade';
export { DaoUniverseFacade } from './universe-facade';

// ============================================================
// DaoUniverseHealthBoard — 宇宙健康仪表盘（纯消费者，读取 DaoUniverseFacade）
// ============================================================
export type { HealthEntry, HealthTrend, HealthBoardSnapshot } from './universe-health-board';
export { DaoUniverseHealthBoard } from './universe-health-board';

// ============================================================
// DaoUniverseOptimizer — 宇宙优化建议引擎（DaoUniverseHealthBoard 二级消费者）
// ============================================================
export type { Recommendation, RecommendationLevel, RecommendationArea, OptimizationReport, OptimizerSnapshot } from './universe-optimizer';
export { DaoUniverseOptimizer } from './universe-optimizer';
