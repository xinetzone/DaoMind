// 帛书依据:"无名，万物之始也"（甲本·一章）
// "无名"状态：未被命名、未被定义的原初类型空间
// 设计原则：此文件仅包含类型定义，不含任何运行时实现

/** 虚空本身 —— "无名"的极致，无法被实例化的底层类型 */
export type Void = never;

/** 潜在性 —— "无名"向"有名"转化的中间态，可能成为任何类型的未确定状态 */
export type Potential<T = unknown> = T extends Void ? never : T | undefined;

/** 万物之始 —— "无名"状态的类型表达，所有类型空间的源头 */
export type Origin = Potential<unknown>;
