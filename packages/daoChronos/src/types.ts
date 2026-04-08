export type TimeSource = 'system' | 'monotonic' | 'custom';

export interface DaoChronosPoint {
  readonly value: number;
  readonly source: TimeSource;
  readonly epoch: number;
}

export interface DaoChronosConfig {
  readonly source?: TimeSource;
  readonly tickInterval?: number;
}
