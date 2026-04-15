import type { ExistenceContract } from '@daomind/nothing';

export interface DaoModuleRegistration {
  readonly name: string;
  readonly version: string;
  readonly path: string;
  readonly dependencies?: readonly string[];
}

export type ModuleLifecycle =
  | 'registered'
  | 'initialized'
  | 'active'
  | 'suspending'
  | 'terminated';

/** DaoModule元数据 —— "有名"状态的具体实现
 * 帛书："有名，万物之母也"
 * 说明：当模块从"无名"（类型定义）进入"有名"（实例化）状态时，
 * 需要具备这些具体属性：id、name、时间戳等 */
export interface DaoModuleMeta extends ExistenceContract {
  readonly id: string;
  readonly name: string;
  readonly lifecycle: ModuleLifecycle;
  readonly createdAt: number;
  readonly registeredAt: number;
  readonly activatedAt?: number;
}
