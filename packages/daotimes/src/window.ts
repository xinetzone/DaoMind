import type { DaoTimeWindow } from './types';

function create(start: number, duration: number): DaoTimeWindow {
  return { start, end: start + duration, duration };
}

function contains(window: DaoTimeWindow, timestamp: number): boolean {
  return timestamp >= window.start && timestamp <= window.end;
}

function overlaps(a: DaoTimeWindow, b: DaoTimeWindow): boolean {
  return a.start < b.end && b.start < a.end;
}

function now(duration: number): DaoTimeWindow {
  const start = Date.now();
  return create(start, duration);
}

export const daoTimeWindow = { create, contains, overlaps, now };
