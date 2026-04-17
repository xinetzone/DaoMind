// 帛书依据："无名，万物之始也"（甲本·一章）
// 设计原则：模块相关纯类型定义 —— 无运行时代码，属于"无名"类型空间
// 从 daoAnything 迁入：这些接口仅描述形状，不创建任何实例

import type { ExistenceContract } from './contracts';

/** 模块注册描述 —— "无名"状态，描述一个待实例化模块的静态结构 */
export interface DaoModuleRegistration {
  readonly name: string;
  readonly version: string;
  readonly path: string;
  readonly dependencies?: readonly string[];
}

/** 模块生命周期状态 —— 纯字符串联合，描述模块从注册到终止的状态空间 */
export type ModuleLifecycle =
  | 'registered'
  | 'initialized'
  | 'active'
  | 'suspending'
  | 'terminated';

/** DaoModule元数据 —— "有名"状态的类型契约
 * 帛书："有名，万物之母也"
 * 说明：当模块从"无名"（类型定义）进入"有名"（实例化）状态时，
 * 需要具备这些具体属性：id、name、时间戳等
 * 注：此接口仍属纯类型空间——仅描述有名状态的形状，不创建实例 */
export interface DaoModuleMeta extends ExistenceContract {
  readonly id: string;
  readonly name: string;
  readonly lifecycle: ModuleLifecycle;
  readonly createdAt: number;
  readonly registeredAt: number;
  readonly activatedAt?: number;
}
