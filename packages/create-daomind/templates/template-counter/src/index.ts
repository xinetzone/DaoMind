import {
  createCounter,
  increment,
  decrement,
  reset,
  setStep,
  getStatus,
} from './counter';

/**
 * Counter - 计数器应用示例
 * 
 * 演示：
 * 1. 状态管理
 * 2. 不可变更新
 * 3. 模块生命周期
 */

console.log('\n╔════════════════════════════════════════════╗');
console.log('║  Counter - 计数器应用                      ║');
console.log('╚════════════════════════════════════════════╝\n');

// 创建计数器
let counter = createCounter(0, 1);

console.log('📦 计数器创建成功！');
console.log('  ID:', counter.id);
console.log('  初始值:', counter.count);
console.log('  步长:', counter.step);
console.log();

// 增加计数
console.log('➕ 执行增加操作 (5次)...');
for (let i = 0; i < 5; i++) {
  counter = increment(counter);
  console.log(`  ${i + 1}. ${getStatus(counter)}`);
}
console.log();

// 减少计数
console.log('➖ 执行减少操作 (3次)...');
for (let i = 0; i < 3; i++) {
  counter = decrement(counter);
  console.log(`  ${i + 1}. ${getStatus(counter)}`);
}
console.log();

// 修改步长
console.log('⚙️  修改步长为 5...');
counter = setStep(counter, 5);
console.log('  新步长:', counter.step);
console.log();

// 继续增加
console.log('➕ 使用新步长增加 (3次)...');
for (let i = 0; i < 3; i++) {
  counter = increment(counter);
  console.log(`  ${i + 1}. ${getStatus(counter)}`);
}
console.log();

// 重置
console.log('🔄 重置计数器到 100...');
counter = reset(counter, 100);
console.log('  当前值:', counter.count);
console.log();

// 最终状态
console.log('📊 最终状态:');
console.log('  ID:', counter.id);
console.log('  值:', counter.count);
console.log('  步长:', counter.step);
console.log('  生命周期:', counter.lifecycle);
console.log('  创建时间:', new Date(counter.createdAt).toLocaleString());
console.log();

// 演示不可变性
console.log('🔍 不可变性验证:');
const originalCounter = createCounter(10);
const modifiedCounter = increment(originalCounter);

console.log('  原始计数器:', originalCounter.count);
console.log('  修改后计数器:', modifiedCounter.count);
console.log('  原始计数器未改变:', originalCounter.count === 10 ? '✅' : '❌');
console.log();

console.log('✅ 示例运行完成！');
console.log('💡 理解状态管理和不可变性了吗？\n');
