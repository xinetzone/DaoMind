export type { AppState, DaoAppDefinition, DaoAppInstance } from './types';
export { daoAppContainer, DaoAppContainer } from './container';
export { daoLifecycleManager, DaoLifecycleManager } from './lifecycle';

export const daoApps = {
  name: '@dao/apps',
  description: '应用层 — 功能之形，具体的可执行程序逻辑',
}
