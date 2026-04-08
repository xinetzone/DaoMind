export type {
  DaoTimerHandle,
  DaoTimerOptions,
  DaoScheduledTask,
  DaoTimeWindow,
} from './types';

export { daoTimer, DaoTimer } from './timer';
export { daoScheduler, DaoScheduler } from './scheduler';
export { daoTimeWindow } from './window';

export const daoTimes = {
  name: '@dao/times',
  description: '时 — 离散时刻，时间的基本单位',
}
