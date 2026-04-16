import type { ExistenceContract } from '@daomind/nothing';
import type { MessageHandler } from './messaging';

export interface DaoAgentCapability {
  readonly name: string;
  readonly version: string;
  readonly description?: string;
}

export type AgentState =
  | 'dormant'
  | 'awakening'
  | 'active'
  | 'resting'
  | 'deceased';

/** DaoAgent接口 —— "有名"状态的代理实体
 * 帛书："有名，万物之母也"
 * 说明：代理从"无名"（类型）进入"有名"（实例）状态后的完整定义 */
export interface DaoAgent extends ExistenceContract {
  readonly id: string;
  readonly agentType: string;
  readonly state: AgentState;
  readonly createdAt: number;
  readonly capabilities: ReadonlyArray<DaoAgentCapability>;
  initialize(): Promise<void>;
  activate(): Promise<void>;
  rest(): Promise<void>;
  terminate(): Promise<void>;
  execute<T>(action: string, payload?: unknown): Promise<T>;
  /** 向目标 Agent（或广播 '*'）发送消息 */
  send(to: string | '*', action: string, payload?: unknown): void;
  /** 注册消息接收处理器 */
  onMessage(handler: MessageHandler): void;
}
