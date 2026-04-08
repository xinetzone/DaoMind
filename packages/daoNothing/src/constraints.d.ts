/** 无为约束 —— 定义什么是不应该做的
 * 帛书依据："道恒无为而无不为"（乙本·三十七章）*/
export type WuWeiConstraint<T> = {
    [K in keyof T]?: never;
};
/** 自然约束 —— 定义事物应有的本性
 * 帛书："人法地，地法天，天法道，道法自然"（乙本·二十五章）*/
export type ZiRanInvariant<T> = T extends object ? {
    [K in keyof T]: ZiRanInvariant<T[K]>;
} : T;
//# sourceMappingURL=constraints.d.ts.map