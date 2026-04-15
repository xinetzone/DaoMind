import { TodoService } from './service';
import { getTodoStatus } from './todo';

/**
 * Todo List - 待办事项应用示例
 * 
 * 演示：
 * 1. CRUD 操作
 * 2. 数据过滤
 * 3. 统计信息
 */

console.log('\n╔════════════════════════════════════════════╗');
console.log('║  Todo List - 待办事项应用                  ║');
console.log('╚════════════════════════════════════════════╝\n');

// 创建服务
const service = new TodoService();

console.log('📝 创建 Todo 项目...\n');

// 创建多个 Todo
const todo1 = service.create({
  title: '学习 DaoMind 核心概念',
  description: '理解"无名"与"有名"的哲学',
  priority: 'high',
  dueDate: new Date('2026-05-01'),
});

const todo2 = service.create({
  title: '完成交互式教程',
  priority: 'medium',
  dueDate: new Date('2026-05-15'),
});

const todo3 = service.create({
  title: '构建第一个项目',
  description: '使用 DaoMind 构建实际应用',
  priority: 'high',
});

const todo4 = service.create({
  title: '阅读 API 文档',
  priority: 'low',
});

console.log(`✅ 创建了 ${service.getStats().total} 个 Todo\n`);

// 列出所有 Todo
console.log('📋 所有 Todo:');
service.list().forEach((todo, index) => {
  console.log(`  ${index + 1}. ${todo.title}`);
  console.log(`     状态: ${getTodoStatus(todo)}`);
  if (todo.description) {
    console.log(`     描述: ${todo.description}`);
  }
  if (todo.dueDate) {
    console.log(`     截止: ${todo.dueDate.toLocaleDateString()}`);
  }
});
console.log();

// 完成一些 Todo
console.log('✅ 完成部分 Todo...');
service.toggle(todo1.id);
service.toggle(todo4.id);
console.log(`  已完成: ${todo1.title}`);
console.log(`  已完成: ${todo4.title}`);
console.log();

// 按状态过滤
console.log('🔍 过滤查询:');

const active = service.list({ completed: false });
console.log(`  进行中: ${active.length} 个`);
active.forEach(todo => {
  console.log(`    - ${todo.title} [${todo.priority}]`);
});
console.log();

const completed = service.list({ completed: true });
console.log(`  已完成: ${completed.length} 个`);
completed.forEach(todo => {
  console.log(`    - ${todo.title}`);
});
console.log();

// 按优先级过滤
const highPriority = service.list({
  completed: false,
  priority: 'high',
});
console.log(`  高优先级（进行中）: ${highPriority.length} 个`);
highPriority.forEach(todo => {
  console.log(`    - ${todo.title}`);
});
console.log();

// 统计信息
console.log('📊 统计信息:');
const stats = service.getStats();
console.log(`  总计: ${stats.total} 个`);
console.log(`  进行中: ${stats.active} 个`);
console.log(`  已完成: ${stats.completed} 个`);
console.log(`  完成率: ${((stats.completed / stats.total) * 100).toFixed(1)}%`);
console.log();
console.log('  优先级分布:');
console.log(`    🔴 高: ${stats.byPriority.high} 个`);
console.log(`    🟡 中: ${stats.byPriority.medium} 个`);
console.log(`    🔵 低: ${stats.byPriority.low} 个`);
console.log();

// 更新 Todo
console.log('✏️  更新 Todo...');
service.update(todo2.id, {
  title: '完成交互式教程（进行中）',
  description: '已完成前3章',
});
console.log(`  更新: ${service.get(todo2.id)?.title}`);
console.log();

// 删除 Todo
console.log('🗑️  删除 Todo...');
const deleted = service.delete(todo4.id);
console.log(`  删除${deleted ? '成功' : '失败'}: ${todo4.title}`);
console.log();

// 最终统计
console.log('📈 最终统计:');
const finalStats = service.getStats();
console.log(`  总计: ${finalStats.total} 个`);
console.log(`  进行中: ${finalStats.active} 个`);
console.log(`  已完成: ${finalStats.completed} 个`);
console.log();

console.log('✅ 示例运行完成！');
console.log('💡 理解 CRUD 操作和数据管理了吗？\n');
