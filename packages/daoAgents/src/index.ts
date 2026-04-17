export type { DaoAgentCapability, AgentState, DaoAgent } from './types';
export { daoAgentRegistry, DaoAgentRegistry } from './registry';
export { DaoBaseAgent, AGENT_LIFECYCLE_EVENT } from './base';
export type { AgentMessage, MessageHandler, MessageFilter } from './messaging';
export { daoAgentMessenger, DaoAgentMessenger } from './messaging';
export { daoAgentContainerBridge, DaoAgentContainerBridge } from './container-bridge';

// 具体 Agent 实现
export { TaskAgent, ObserverAgent, CoordinatorAgent } from './agents';
export type {
  AgentTask, TaskResult, QueueSnapshot,
  Observation, SystemSnapshot,
  AssignmentRecord, CoordinatorSnapshot,
} from './agents';

export const daomindAgents = {
  name: '@daomind/agents',
  description: 'DaoMind Agents — 自主行动的实体',
};

// dao 前缀别名 — 命名规范对齐
export * from './dao-aliases';
