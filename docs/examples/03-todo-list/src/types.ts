import type { DaoModuleMeta } from '@daomind/anything';

/**
 * Todo 优先级
 */
export type TodoPriority = 'low' | 'medium' | 'high';

/**
 * Todo 项目接口
 */
export interface TodoItem extends DaoModuleMeta {
  /** Todo 标题 */
  readonly title: string;
  
  /** Todo 描述（可选） */
  readonly description?: string;
  
  /** 是否完成 */
  readonly completed: boolean;
  
  /** 优先级 */
  readonly priority: TodoPriority;
  
  /** 截止日期（可选） */
  readonly dueDate?: Date;
}

/**
 * 创建 Todo 的输入
 */
export interface CreateTodoInput {
  readonly title: string;
  readonly description?: string;
  readonly priority: TodoPriority;
  readonly dueDate?: Date;
}

/**
 * 更新 Todo 的输入
 */
export interface UpdateTodoInput {
  readonly title?: string;
  readonly description?: string;
  readonly completed?: boolean;
  readonly priority?: TodoPriority;
  readonly dueDate?: Date;
}

/**
 * Todo 过滤条件
 */
export interface TodoFilter {
  readonly completed?: boolean;
  readonly priority?: TodoPriority;
  readonly hasDescription?: boolean;
  readonly hasDueDate?: boolean;
}

/**
 * Todo 统计信息
 */
export interface TodoStats {
  readonly total: number;
  readonly completed: number;
  readonly active: number;
  readonly byPriority: {
    low: number;
    medium: number;
    high: number;
  };
}
