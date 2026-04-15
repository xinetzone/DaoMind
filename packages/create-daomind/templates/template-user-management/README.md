# User Management - 用户管理系统

完整的用户管理系统，学习认证、授权和复杂的状态管理。

## 📚 学习目标

- 用户 CRUD 操作
- 角色和权限管理
- 认证和授权
- 密码处理最佳实践
- 复杂查询和过滤

## 🚀 快速开始

```bash
cd 04-user-management
pnpm install
pnpm dev
```

## 📖 核心功能

### 用户管理
- ✅ 创建用户
- ✅ 更新用户信息
- ✅ 删除用户
- ✅ 查询用户

### 角色系统
- ✅ 管理员 (admin)
- ✅ 编辑者 (editor)
- ✅ 查看者 (viewer)

### 权限控制
- ✅ 基于角色的访问控制 (RBAC)
- ✅ 权限检查
- ✅ 操作审计

## 🎯 架构设计

```
UserService
├── UserRepository (数据访问)
├── AuthService (认证)
├── PermissionService (授权)
└── AuditService (审计)
```

## 💻 核心代码

### 用户模型

```typescript
interface User extends DaoModuleMeta {
  readonly username: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly role: UserRole;
  readonly status: UserStatus;
  readonly lastLoginAt?: number;
}

type UserRole = 'admin' | 'editor' | 'viewer';
type UserStatus = 'active' | 'suspended' | 'deleted';
```

### 权限检查

```typescript
class PermissionService {
  canCreate(user: User): boolean {
    return user.role === 'admin' || user.role === 'editor';
  }
  
  canDelete(user: User, target: User): boolean {
    return user.role === 'admin' && user.id !== target.id;
  }
}
```

## 📊 项目结构

```
04-user-management/
├── src/
│   ├── types.ts              # 类型定义
│   ├── user.ts               # 用户模块
│   ├── auth.ts               # 认证服务
│   ├── permission.ts         # 权限服务
│   ├── repository.ts         # 数据仓库
│   ├── service.ts            # 用户服务
│   └── index.ts              # 主入口
├── tests/
│   └── user.test.ts          # 单元测试
├── package.json
├── tsconfig.json
└── README.md
```

## 🔐 安全最佳实践

### 密码处理
```typescript
import { createHash } from 'crypto';

function hashPassword(password: string): string {
  return createHash('sha256')
    .update(password)
    .digest('hex');
}
```

### 输入验证
```typescript
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): boolean {
  return password.length >= 8;
}
```

## 💡 实践任务

### 任务 1: 添加邮箱验证
实现邮箱验证功能

### 任务 2: 实现密码重置
添加密码重置流程

### 任务 3: 添加登录历史
记录用户登录记录

---

**难度**: ⭐⭐ 中级  
**预计时间**: 45 分钟  
**前置知识**: Todo List 示例
