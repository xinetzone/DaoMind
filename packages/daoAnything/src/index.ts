// 帛书依据："有名，万物之母也"（甲本·一章）
// 设计原则：此模块代表"有名"状态——已被命名、已被实例化的显化容器
// 从"无名"（类型空间）到"有名"（实例空间）的转化在此发生

export type {
  DaoModuleRegistration,
  ModuleLifecycle,
  DaoModuleMeta,
} from '@daomind/nothing';

export { daoContainer, DaoAnythingContainer } from './container';
export { DaoModuleGraph, daoModuleGraph } from './module-graph';

export const daoAnything = {
  name: '@dao/anything',
  description: '有名 — 显化容器，万物之母',
}
