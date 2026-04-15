/** 空接口 —— "无名"状态的接口表达，所有接口的原型 */
export interface EmptyInterface {
  readonly [key: string]: never;
}

/** 存在性契约 —— 从"无名"到"有名"的转化契约
 * 帛书："有名，万物之母也"
 * 说明：此契约定义了实体进入"有名"状态（被实例化）时必须满足的最小要求
 * 注意：id 和 createdAt 等具体属性属于"有名"状态，应由具体模块（如 daoAnything）实现 */
export interface ExistenceContract {
  readonly existentialType: 'nothing' | 'anything';
}

/** 变易性契约 —— 描述实体如何随时间变化 */
export interface MutabilityContract<T> {
  readonly from: T;
  readonly to: T;
  readonly transition: 'gradual' | 'sudden' | 'cyclic';
}
