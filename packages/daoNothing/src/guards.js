/** 检查某值是否符合"无"的定义 */
export function daoIsNothing(value) {
    return value === undefined || value === null;
}
/** 从无中生有 —— 安全的类型断言
 * 帛书依据："天下万物生于有，有生于无"（乙本·四十章）*/
export function daoBirthFromNothing(potential) {
    if (daoIsNothing(potential)) {
        throw new Error('[daoNothing] 无法从绝对的"无"中生有');
    }
    return potential;
}
//# sourceMappingURL=guards.js.map