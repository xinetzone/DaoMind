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
