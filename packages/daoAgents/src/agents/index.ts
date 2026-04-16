// 具体 Agent 实现 —— "有名，万物之母也"

export { TaskAgent } from './task-agent';
export type { AgentTask, TaskResult, QueueSnapshot } from './task-agent';

export { ObserverAgent } from './observer-agent';
export type { Observation, SystemSnapshot } from './observer-agent';

export { CoordinatorAgent } from './coordinator-agent';
export type { AssignmentRecord, CoordinatorSnapshot } from './coordinator-agent';
