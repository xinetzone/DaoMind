import type { CounterModule } from './types';

/**
 * 创建计数器模块
 * 
 * @param initialCount - 初始计数值，默认为 0
 * @param step - 步长，默认为 1
 * @returns 新的计数器模块实例
 */
export function createCounter(
  initialCount = 0,
  step = 1
): CounterModule {
  const now = Date.now();
  
  return {
    existentialType: 'anything',
    id: crypto.randomUUID(),
    name: `Counter:${initialCount}`,
    lifecycle: 'active',
    createdAt: now,
    registeredAt: now,
    activatedAt: now,
    count: initialCount,
    step,
  };
}

/**
 * 增加计数器
 * 
 * 遵循不可变性原则，返回新的计数器对象
 * 
 * @param counter - 计数器模块
 * @returns 更新后的计数器模块
 */
export function increment(counter: CounterModule): CounterModule {
  return {
    ...counter,
    count: counter.count + counter.step,
  };
}

/**
 * 减少计数器
 * 
 * @param counter - 计数器模块
 * @returns 更新后的计数器模块
 */
export function decrement(counter: CounterModule): CounterModule {
  return {
    ...counter,
    count: counter.count - counter.step,
  };
}

/**
 * 重置计数器到指定值
 * 
 * @param counter - 计数器模块
 * @param value - 要重置到的值，默认为 0
 * @returns 更新后的计数器模块
 */
export function reset(counter: CounterModule, value = 0): CounterModule {
  return {
    ...counter,
    count: value,
  };
}

/**
 * 设置步长
 * 
 * @param counter - 计数器模块
 * @param step - 新的步长
 * @returns 更新后的计数器模块
 */
export function setStep(counter: CounterModule, step: number): CounterModule {
  if (step <= 0) {
    throw new Error('Step must be greater than 0');
  }
  
  return {
    ...counter,
    step,
  };
}

/**
 * 获取计数器状态描述
 * 
 * @param counter - 计数器模块
 * @returns 状态描述字符串
 */
export function getStatus(counter: CounterModule): string {
  const direction = counter.count >= 0 ? '↑' : '↓';
  return `${direction} ${counter.count} (步长: ${counter.step})`;
}
