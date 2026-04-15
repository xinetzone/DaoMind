import type { TodoItem, CreateTodoInput, UpdateTodoInput } from './types';

/**
 * 创建 Todo 项目
 * 
 * @param input - 创建输入
 * @returns 新的 TodoItem
 */
export function createTodo(input: CreateTodoInput): TodoItem {
  const now = Date.now();
  
  return {
    existentialType: 'anything',
    id: crypto.randomUUID(),
    name: `Todo:${input.title}`,
    lifecycle: 'active',
    createdAt: now,
    registeredAt: now,
    activatedAt: now,
    title: input.title,
    description: input.description,
    completed: false,
    priority: input.priority,
    dueDate: input.dueDate,
  };
}

/**
 * 更新 Todo 项目
 * 
 * @param todo - 原 Todo
 * @param input - 更新输入
 * @returns 更新后的 TodoItem
 */
export function updateTodo(
  todo: TodoItem,
  input: UpdateTodoInput
): TodoItem {
  return {
    ...todo,
    ...input,
  };
}

/**
 * 切换 Todo 完成状态
 * 
 * @param todo - Todo 项目
 * @returns 更新后的 TodoItem
 */
export function toggleTodo(todo: TodoItem): TodoItem {
  return {
    ...todo,
    completed: !todo.completed,
  };
}

/**
 * 检查 Todo 是否逾期
 * 
 * @param todo - Todo 项目
 * @returns 是否逾期
 */
export function isOverdue(todo: TodoItem): boolean {
  if (!todo.dueDate || todo.completed) {
    return false;
  }
  return todo.dueDate.getTime() < Date.now();
}

/**
 * 获取 Todo 状态描述
 * 
 * @param todo - Todo 项目
 * @returns 状态描述
 */
export function getTodoStatus(todo: TodoItem): string {
  if (todo.completed) {
    return '✅ 已完成';
  }
  
  if (isOverdue(todo)) {
    return '⚠️ 已逾期';
  }
  
  const priorityIcons = {
    low: '🔵',
    medium: '🟡',
    high: '🔴',
  };
  
  return `${priorityIcons[todo.priority]} ${todo.priority.toUpperCase()}`;
}
