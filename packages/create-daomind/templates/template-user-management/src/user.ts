import { createHash } from 'node:crypto';
import type { User, CreateUserInput } from './types';

/**
 * 哈希密码
 */
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

/**
 * 验证密码
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * 验证邮箱格式
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证密码强度
 */
export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

/**
 * 验证用户名
 */
export function validateUsername(username: string): boolean {
  return username.length >= 3 && /^[a-zA-Z0-9_-]+$/.test(username);
}

/**
 * 创建用户
 */
export function createUser(input: CreateUserInput): User {
  // 验证输入
  if (!validateUsername(input.username)) {
    throw new Error('Invalid username: must be at least 3 characters and contain only letters, numbers, hyphens, and underscores');
  }
  
  if (!validateEmail(input.email)) {
    throw new Error('Invalid email format');
  }
  
  if (!validatePassword(input.password)) {
    throw new Error('Invalid password: must be at least 8 characters');
  }
  
  const now = Date.now();
  
  return {
    existentialType: 'anything',
    id: crypto.randomUUID(),
    name: `User:${input.username}`,
    lifecycle: 'active',
    createdAt: now,
    registeredAt: now,
    activatedAt: now,
    username: input.username,
    email: input.email,
    passwordHash: hashPassword(input.password),
    role: input.role,
    status: 'active',
    metadata: input.metadata,
  };
}

/**
 * 获取用户显示名称
 */
export function getUserDisplayName(user: User): string {
  if (user.metadata?.firstName && user.metadata?.lastName) {
    return `${user.metadata.firstName} ${user.metadata.lastName}`;
  }
  return user.username;
}

/**
 * 检查用户是否活跃
 */
export function isUserActive(user: User): boolean {
  return user.status === 'active' && user.lifecycle === 'active';
}

/**
 * 更新最后登录时间
 */
export function updateLastLogin(user: User): User {
  return {
    ...user,
    lastLoginAt: Date.now(),
  };
}
