import { createHello, formatHello } from './module';

/**
 * Hello World - DaoMind 第一个示例
 * 
 * 这个简单的示例演示了 DaoMind 的核心概念：
 * 1. 类型定义（"无名"状态）
 * 2. 实例创建（"命名"过程）
 * 3. 使用实例（"有名"状态）
 */

console.log('\n╔════════════════════════════════════════════╗');
console.log('║  Hello World - DaoMind 第一个示例          ║');
console.log('╚════════════════════════════════════════════╝\n');

// 创建 Hello 模块实例（从"无名"到"有名"）
const hello = createHello('Hello, DaoMind!', 'en');

console.log('✨ 创建成功！\n');

// 显示模块信息
console.log('📦 模块信息:');
console.log('  存在性类型:', hello.existentialType);
console.log('  消息:', hello.message);
console.log('  语言:', hello.language);
console.log();

// 格式化显示
console.log('🎯 格式化输出:');
console.log(' ', formatHello(hello));
console.log();

// 创建多个实例
console.log('🌍 多语言示例:');

const greetings = [
  createHello('Hello, DaoMind!', 'en'),
  createHello('你好，道心！', 'zh'),
  createHello('こんにちは、DaoMind！', 'ja'),
  createHello('¡Hola, DaoMind!', 'es'),
];

greetings.forEach(greeting => {
  console.log(' ', formatHello(greeting));
});

console.log();
console.log('✅ 示例运行完成！');
console.log('💡 理解了"无名"到"有名"的过程了吗？\n');
