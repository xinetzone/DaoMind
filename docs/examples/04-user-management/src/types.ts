import type { DaoModuleMeta } from '@daomind/anything';

/**
 * 用户角色
 */
export type UserRole = 'admin' | 'editor' | 'viewer';

/**
 * 用户状态
 */
export type UserStatus = 'active' | 'suspended' | 'deleted';

/**
 * 用户权限
 */
export interface Permission {
  readonly resource: string;
  readonly actions: ReadonlyArray<'create' | 'read' | 'update' | 'delete'>;
}

/**
 * 用户接口
 */
export interface User extends DaoModuleMeta {
  /** 用户名（唯一） */
  readonly username: string;
  
  /** 邮箱（唯一） */
  readonly email: string;
  
  /** 密码哈希值 */
  readonly passwordHash: string;
  
  /** 用户角色 */
  readonly role: UserRole;
  
  /** 用户状态 */
  readonly status: UserStatus;
  
  /** 最后登录时间 */
  readonly lastLoginAt?: number;
  
  /** 用户元数据 */
  readonly metadata?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
  };
}

/**
 * 创建用户输入
 */
export interface CreateUserInput {
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly role: UserRole;
  readonly metadata?: User['metadata'];
}

/**
 * 更新用户输入
 */
export interface UpdateUserInput {
  readonly email?: string;
  readonly role?: UserRole;
  readonly status?: UserStatus;
  readonly metadata?: User['metadata'];
}

/**
 * 用户查询过滤器
 */
export interface UserFilter {
  readonly role?: UserRole;
  readonly status?: UserStatus;
  readonly searchTerm?: string;
}

/**
 * 登录凭证
 */
export interface LoginCredentials {
  readonly username: string;
  readonly password: string;
}

/**
 * 认证结果
 */
export interface AuthResult {
  readonly success: boolean;
  readonly user?: User;
  readonly error?: string;
}

/**
 * 权限检查结果
 */
export interface PermissionCheck {
  readonly allowed: boolean;
  readonly reason?: string;
}
