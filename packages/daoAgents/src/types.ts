import type { ExistenceContract } from '@daomind/nothing';

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

export interface DaoAgent extends ExistenceContract {
  readonly agentType: string;
  readonly state: AgentState;
  readonly capabilities: ReadonlyArray<DaoAgentCapability>;
  initialize(): Promise<void>;
  activate(): Promise<void>;
  rest(): Promise<void>;
  terminate(): Promise<void>;
  execute<T>(action: string, payload?: unknown): Promise<T>;
}
