import type { User, UserRole, PermissionCheck } from './types';

/**
 * 角色权限映射
 */
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['*'],  // 管理员拥有所有权限
  editor: ['user:read', 'user:create', 'user:update'],
  viewer: ['user:read'],
};

/**
 * 权限服务
 */
export class PermissionService {
  /**
   * 检查用户是否拥有特定权限
   */
  hasPermission(user: User, permission: string): boolean {
    const permissions = ROLE_PERMISSIONS[user.role];
    
    // 管理员拥有所有权限
    if (permissions.includes('*')) {
      return true;
    }
    
    return permissions.includes(permission);
  }
  
  /**
   * 检查是否可以创建用户
   */
  canCreate(user: User): PermissionCheck {
    if (this.hasPermission(user, 'user:create')) {
      return { allowed: true };
    }
    
    return {
      allowed: false,
      reason: 'Insufficient permissions to create users',
    };
  }
  
  /**
   * 检查是否可以读取用户信息
   */
  canRead(user: User): PermissionCheck {
    if (this.hasPermission(user, 'user:read')) {
      return { allowed: true };
    }
    
    return {
      allowed: false,
      reason: 'Insufficient permissions to read user information',
    };
  }
  
  /**
   * 检查是否可以更新用户
   */
  canUpdate(operator: User, target: User): PermissionCheck {
    // 用户可以更新自己的信息
    if (operator.id === target.id) {
      return { allowed: true };
    }
    
    // 检查权限
    if (!this.hasPermission(operator, 'user:update')) {
      return {
        allowed: false,
        reason: 'Insufficient permissions to update users',
      };
    }
    
    // 编辑者不能更新管理员
    if (operator.role === 'editor' && target.role === 'admin') {
      return {
        allowed: false,
        reason: 'Cannot update admin users',
      };
    }
    
    return { allowed: true };
  }
  
  /**
   * 检查是否可以删除用户
   */
  canDelete(operator: User, target: User): PermissionCheck {
    // 不能删除自己
    if (operator.id === target.id) {
      return {
        allowed: false,
        reason: 'Cannot delete your own account',
      };
    }
    
    // 只有管理员可以删除用户
    if (operator.role !== 'admin') {
      return {
        allowed: false,
        reason: 'Only administrators can delete users',
      };
    }
    
    return { allowed: true };
  }
  
  /**
   * 检查是否可以更改角色
   */
  canChangeRole(operator: User, from: UserRole, to: UserRole): PermissionCheck {
    // 只有管理员可以更改角色
    if (operator.role !== 'admin') {
      return {
        allowed: false,
        reason: 'Only administrators can change user roles',
      };
    }
    
    return { allowed: true };
  }
  
  /**
   * 获取用户可执行的操作列表
   */
  getAvailableActions(user: User): string[] {
    const permissions = ROLE_PERMISSIONS[user.role];
    
    if (permissions.includes('*')) {
      return ['create', 'read', 'update', 'delete', 'manage_roles'];
    }
    
    const actions: string[] = [];
    
    if (permissions.includes('user:create')) {
      actions.push('create');
    }
    
    if (permissions.includes('user:read')) {
      actions.push('read');
    }
    
    if (permissions.includes('user:update')) {
      actions.push('update');
    }
    
    return actions;
  }
}
