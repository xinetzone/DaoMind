// 帛书依据："无，名天地之始"（甲本·一章）
// 设计原则：此文件仅包含类型定义，不含任何运行时实现

/** 虚空本身 —— 无法被实例化的底层类型 */
export type Void = never;

/** 潜在性 —— 可能成为任何类型的未确定类型 */
export type Potential<T = unknown> = T extends Void ? never : T | undefined;

/** 万物之始 —— 所有类型的联合上限 */
export type Origin = Potential<unknown>;
