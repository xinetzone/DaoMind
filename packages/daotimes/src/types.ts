export type DaoTimerHandle = symbol;

export interface DaoTimerOptions {
  readonly interval: number;
  readonly immediate?: boolean;
  readonly maxFires?: number;
}

export interface DaoScheduledTask<T = unknown> {
  readonly id: string;
  readonly executeAt: number;
  readonly handler: () => T | Promise<T>;
  readonly priority: number;
}

export interface DaoTimeWindow {
  readonly start: number;
  readonly end: number;
  readonly duration: number;
}
