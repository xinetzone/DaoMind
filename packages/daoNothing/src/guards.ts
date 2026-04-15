import type { Void } from './types';

/** 检查某值是否处于"无名"状态（未定义、未命名）
 * 帛书："无名，万物之始也" */
export function daoIsNothing(value: unknown): value is Void {
  return value === undefined || value === null;
}

/** 从"无名"到"有名"的转化 —— 安全的类型断言
 * 帛书依据："天下万物生于有，有生于无"（乙本·四十章）
 * "有生于无"意为：已命名的存在（有）源自未命名的潜在（无）*/
export function daoBirthFromNothing<T>(potential: unknown): T {
  if (daoIsNothing(potential)) {
    throw new Error('[daoNothing] 无法从绝对的"无名"（Void）中生有');
  }
  return potential as T;
}
