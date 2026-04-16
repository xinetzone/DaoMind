export type { DaoAgentCapability, AgentState, DaoAgent } from './types';
export { daoAgentRegistry, DaoAgentRegistry } from './registry';
export { DaoBaseAgent, AGENT_LIFECYCLE_EVENT } from './base';
export type { AgentMessage, MessageHandler, MessageFilter } from './messaging';
export { daoAgentMessenger, DaoAgentMessenger } from './messaging';
export { daoAgentContainerBridge, DaoAgentContainerBridge } from './container-bridge';

export const daomindAgents = {
  name: '@daomind/agents',
  description: 'DaoMind Agents — 自主行动的实体',
};
