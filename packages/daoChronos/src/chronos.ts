import type { DaoChronosConfig, DaoChronosPoint, TimeSource } from './types';

class DaoChronos {
  private readonly config: Required<DaoChronosConfig>;
  private readonly listeners = new Set<(point: DaoChronosPoint) => void>();
  private tickTimer?: ReturnType<typeof setInterval>;
  private epoch: number;

  constructor(config?: DaoChronosConfig) {
    this.config = {
      source: config?.source ?? 'system',
      tickInterval: config?.tickInterval ?? 1,
    };
    this.epoch = Date.now();
  }

  now(): DaoChronosPoint {
    return {
      value: this.getValue(),
      source: this.config.source,
      epoch: this.epoch,
    };
  }

  since(epoch: number): number {
    return this.getValue() - epoch;
  }

  elapsed(point: DaoChronosPoint): number {
    return this.getValue() - point.value;
  }

  between(a: DaoChronosPoint, b: DaoChronosPoint): number {
    return Math.abs(b.value - a.value);
  }

  sync(callback: (point: DaoChronosPoint) => void): () => void {
    this.listeners.add(callback);
    if (!this.tickTimer) {
      this.tickTimer = setInterval(() => {
        const point = this.now();
        for (const listener of this.listeners) {
          listener(point);
        }
      }, this.config.tickInterval);
    }
    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0 && this.tickTimer) {
        clearInterval(this.tickTimer);
        this.tickTimer = undefined;
      }
    };
  }

  private getValue(): number {
    switch (this.config.source) {
      case 'monotonic':
        if (typeof process !== 'undefined' && typeof process.hrtime === 'function') {
          const [s, ns] = process.hrtime();
          return s * 1000 + ns / 1_000_000;
        }
        return performance.now();
      case 'custom':
        return Date.now();
      case 'system':
      default:
        return Date.now();
    }
  }
}

let instance: DaoChronos | null = null;

export function daoGetChronos(config?: DaoChronosConfig): DaoChronos {
  if (!instance) {
    instance = new DaoChronos(config);
  }
  return instance;
}

export { DaoChronos };
