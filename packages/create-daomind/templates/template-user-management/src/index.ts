import { UserService } from './service';
import { getUserDisplayName } from './user';

console.log('\n╔════════════════════════════════════════════╗');
console.log('║  User Management - 用户管理系统             ║');
console.log('╚════════════════════════════════════════════╝\n');

const service = new UserService();

console.log('👤 创建用户...\n');

const admin = service.create({
  username: 'admin',
  email: 'admin@daomind.dev',
  password: 'admin123',
  role: 'admin',
  metadata: {
    firstName: 'Admin',
    lastName: 'User',
  },
});

console.log(`✅ 创建管理员: ${getUserDisplayName(admin)}`);

const editor = service.create({
  username: 'alice',
  email: 'alice@daomind.dev',
  password: 'alice123',
  role: 'editor',
  metadata: {
    firstName: 'Alice',
    lastName: 'Smith',
  },
});

const viewer = service.create({
  username: 'bob',
  email: 'bob@daomind.dev',
  password: 'bob12345',
  role: 'viewer',
  metadata: {
    firstName: 'Bob',
    lastName: 'Jones',
  },
});

console.log(`✅ 创建编辑者: ${getUserDisplayName(editor)}`);
console.log(`✅ 创建查看者: ${getUserDisplayName(viewer)}`);
console.log();

console.log('🔐 登录测试...\n');

const loginResult = service.login({
  username: 'alice',
  password: 'alice123',
});

if (loginResult.success && loginResult.user) {
  console.log(`✅ 登录成功: ${loginResult.user.username}`);
  console.log(`   角色: ${loginResult.user.role}`);
} else {
  console.log(`❌ 登录失败: ${loginResult.error}`);
}
console.log();

console.log('🔒 权限测试...\n');

try {
  service.update(viewer.id, { role: 'admin' }, editor);
  console.log('❌ 不应该允许编辑者更新角色');
} catch (error) {
  console.log(`✅ 正确阻止: ${(error as Error).message}`);
}

console.log();

console.log('📋 活跃用户列表:\n');
const users = service.list({ status: 'active' });
users.forEach((user, index) => {
  console.log(`  ${index + 1}. ${getUserDisplayName(user)} (@${user.username})`);
  console.log(`     角色: ${user.role}, 状态: ${user.status}`);
});
console.log();

console.log('📊 统计信息:');
const stats = service.getStats();
console.log(`  总用户数: ${stats.total}`);
console.log(`  活跃: ${stats.active}`);
console.log(`  角色分布 - 管理员: ${stats.byRole.admin}, 编辑者: ${stats.byRole.editor}, 查看者: ${stats.byRole.viewer}`);
console.log();

console.log('✅ 示例运行完成！\n');
