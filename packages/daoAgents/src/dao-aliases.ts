/**
 * dao 前缀类型别名 — 命名规范对齐
 * 帛书依据：「道可道，非常名」— 以道为名，体现自然本性
 */
import type { AgentState } from './types';
import type { AgentMessage, MessageHandler, MessageFilter } from './messaging';
import type {
  AgentTask,
  TaskResult,
  QueueSnapshot,
  Observation,
  SystemSnapshot,
  AssignmentRecord,
  CoordinatorSnapshot,
} from './agents';

/** 代理状态 dao 前缀别名 */
export type DaoAgentState = AgentState;
/** 代理消息 dao 前缀别名 */
export type DaoAgentMessage = AgentMessage;
/** 消息处理器 dao 前缀别名 */
export type DaoMessageHandler = MessageHandler;
/** 消息过滤器 dao 前缀别名 */
export type DaoMessageFilter = MessageFilter;
/** 代理任务 dao 前缀别名 */
export type DaoAgentTask = AgentTask;
/** 任务结果 dao 前缀别名 */
export type DaoTaskResult = TaskResult;
/** 队列快照 dao 前缀别名 */
export type DaoQueueSnapshot = QueueSnapshot;
/** 观察记录 dao 前缀别名 */
export type DaoObservation = Observation;
/** 系统快照 dao 前缀别名 */
export type DaoSystemSnapshot = SystemSnapshot;
/** 分配记录 dao 前缀别名 */
export type DaoAssignmentRecord = AssignmentRecord;
/** 协调者快照 dao 前缀别名 */
export type DaoCoordinatorSnapshot = CoordinatorSnapshot;
