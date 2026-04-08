import type { Void } from './types.js';
/** 检查某值是否符合"无"的定义 */
export declare function daoIsNothing(value: unknown): value is Void;
/** 从无中生有 —— 安全的类型断言
 * 帛书依据："天下万物生于有，有生于无"（乙本·四十章）*/
export declare function daoBirthFromNothing<T>(potential: unknown): T;
//# sourceMappingURL=guards.d.ts.map