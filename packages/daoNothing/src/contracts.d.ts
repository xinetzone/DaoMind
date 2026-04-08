/** 空接口 —— 所有其他接口的原型 */
export interface EmptyInterface {
    readonly [key: string]: never;
}
/** 存在性契约 —— 任何实体必须满足的最小契约 */
export interface ExistenceContract {
    readonly id: string;
    readonly createdAt: number;
    readonly existentialType: 'nothing' | 'anything';
}
/** 变易性契约 —— 描述实体如何随时间变化 */
export interface MutabilityContract<T> {
    readonly from: T;
    readonly to: T;
    readonly transition: 'gradual' | 'sudden' | 'cyclic';
}
//# sourceMappingURL=contracts.d.ts.map