import type {
  User,
  CreateUserInput,
  UpdateUserInput,
  UserFilter,
  LoginCredentials,
  AuthResult,
} from './types';
import {
  createUser,
  verifyPassword,
  isUserActive,
  updateLastLogin,
} from './user';
import { PermissionService } from './permission';

/**
 * 用户管理服务
 */
export class UserService {
  private users: Map<string, User> = new Map();
  private usernameIndex: Map<string, string> = new Map();
  private emailIndex: Map<string, string> = new Map();
  private permission = new PermissionService();
  
  /**
   * 创建新用户
   */
  create(input: CreateUserInput): User {
    // 检查用户名是否已存在
    if (this.usernameIndex.has(input.username)) {
      throw new Error(`Username "${input.username}" already exists`);
    }
    
    // 检查邮箱是否已存在
    if (this.emailIndex.has(input.email)) {
      throw new Error(`Email "${input.email}" already exists`);
    }
    
    const user = createUser(input);
    
    // 存储用户
    this.users.set(user.id, user);
    this.usernameIndex.set(user.username, user.id);
    this.emailIndex.set(user.email, user.id);
    
    return user;
  }
  
  /**
   * 根据 ID 获取用户
   */
  getById(id: string): User | undefined {
    return this.users.get(id);
  }
  
  /**
   * 根据用户名获取用户
   */
  getByUsername(username: string): User | undefined {
    const id = this.usernameIndex.get(username);
    return id ? this.users.get(id) : undefined;
  }
  
  /**
   * 根据邮箱获取用户
   */
  getByEmail(email: string): User | undefined {
    const id = this.emailIndex.get(email);
    return id ? this.users.get(id) : undefined;
  }
  
  /**
   * 更新用户
   */
  update(id: string, input: UpdateUserInput, operator: User): User {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with ID "${id}" not found`);
    }
    
    // 权限检查
    if (!this.permission.canUpdate(operator, user)) {
      throw new Error('Permission denied: cannot update this user');
    }
    
    // 检查邮箱唯一性
    if (input.email && input.email !== user.email) {
      if (this.emailIndex.has(input.email)) {
        throw new Error(`Email "${input.email}" already exists`);
      }
      // 更新邮箱索引
      this.emailIndex.delete(user.email);
      this.emailIndex.set(input.email, user.id);
    }
    
    const updated: User = {
      ...user,
      ...input,
    };
    
    this.users.set(id, updated);
    return updated;
  }
  
  /**
   * 删除用户（软删除）
   */
  delete(id: string, operator: User): boolean {
    const user = this.users.get(id);
    if (!user) {
      return false;
    }
    
    // 权限检查
    if (!this.permission.canDelete(operator, user)) {
      throw new Error('Permission denied: cannot delete this user');
    }
    
    // 软删除：更新状态
    const deleted: User = {
      ...user,
      status: 'deleted',
      lifecycle: 'terminated',
    };
    
    this.users.set(id, deleted);
    return true;
  }
  
  /**
   * 列出所有用户
   */
  list(filter?: UserFilter): User[] {
    let users = Array.from(this.users.values());
    
    if (!filter) {
      return users;
    }
    
    if (filter.role !== undefined) {
      users = users.filter(u => u.role === filter.role);
    }
    
    if (filter.status !== undefined) {
      users = users.filter(u => u.status === filter.status);
    }
    
    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      users = users.filter(u =>
        u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    }
    
    return users;
  }
  
  /**
   * 用户登录
   */
  login(credentials: LoginCredentials): AuthResult {
    const user = this.getByUsername(credentials.username);
    
    if (!user) {
      return {
        success: false,
        error: 'Invalid username or password',
      };
    }
    
    if (!isUserActive(user)) {
      return {
        success: false,
        error: 'User account is not active',
      };
    }
    
    if (!verifyPassword(credentials.password, user.passwordHash)) {
      return {
        success: false,
        error: 'Invalid username or password',
      };
    }
    
    // 更新最后登录时间
    const updated = updateLastLogin(user);
    this.users.set(user.id, updated);
    
    return {
      success: true,
      user: updated,
    };
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    const users = Array.from(this.users.values());
    
    return {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      suspended: users.filter(u => u.status === 'suspended').length,
      deleted: users.filter(u => u.status === 'deleted').length,
      byRole: {
        admin: users.filter(u => u.role === 'admin').length,
        editor: users.filter(u => u.role === 'editor').length,
        viewer: users.filter(u => u.role === 'viewer').length,
      },
    };
  }
}
