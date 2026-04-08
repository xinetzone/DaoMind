import type { DaoTimerHandle, DaoTimerOptions } from './types';

class DaoTimer {
  private readonly timers = new Map<DaoTimerHandle, ReturnType<typeof setInterval>>();

  setInterval(callback: () => void, options: DaoTimerOptions): DaoTimerHandle {
    const handle = Symbol('dao-timer');
    let fireCount = 0;
    const maxFires = options.maxFires ?? Infinity;

    const tick = (): void => {
      if (fireCount >= maxFires && maxFires !== Infinity) {
        this.clearInterval(handle);
        return;
      }
      fireCount++;
      try {
        callback();
      } catch {
        // 静默处理回调异常
      }
    };

    if (options.immediate) {
      tick();
    }

    const timerId = setInterval(tick, options.interval);
    this.timers.set(handle, timerId);
    return handle;
  }

  clearInterval(handle: DaoTimerHandle): void {
    const timerId = this.timers.get(handle);
    if (timerId !== undefined) {
      clearInterval(timerId);
      this.timers.delete(handle);
    }
  }

  setTimeout(callback: () => void, delay: number): DaoTimerHandle {
    const handle = Symbol('dao-timer');
    const timerId = setTimeout(() => {
      try {
        callback();
      } catch {
        // 静默处理
      }
      this.timers.delete(handle);
    }, delay);
    this.timers.set(handle, timerId as unknown as ReturnType<typeof setInterval>);
    return handle;
  }

  clearTimeout(handle: DaoTimerHandle): void {
    const timerId = this.timers.get(handle);
    if (timerId !== undefined) {
      clearTimeout(timerId as unknown as ReturnType<typeof setTimeout>);
      this.timers.delete(handle);
    }
  }
}

export const daoTimer = new DaoTimer();
export { DaoTimer };
