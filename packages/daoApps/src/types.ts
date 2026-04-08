export type AppState =
  | 'registered'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'error';

export interface DaoAppDefinition {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly entry: string;
  readonly dependencies?: readonly string[];
  readonly config?: Record<string, unknown>;
}

export interface DaoAppInstance {
  readonly definition: DaoAppDefinition;
  readonly state: AppState;
  readonly startedAt?: number;
  readonly stoppedAt?: number;
  readonly error?: Error;
}
