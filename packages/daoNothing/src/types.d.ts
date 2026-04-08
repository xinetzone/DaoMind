/** 虚空本身 —— 无法被实例化的底层类型 */
export type Void = never;
/** 潜在性 —— 可能成为任何类型的未确定类型 */
export type Potential<T = unknown> = T extends Void ? never : T | undefined;
/** 万物之始 —— 所有类型的联合上限 */
export type Origin = Potential<any>;
//# sourceMappingURL=types.d.ts.map