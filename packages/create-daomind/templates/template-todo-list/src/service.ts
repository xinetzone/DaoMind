import type {
  TodoItem,
  CreateTodoInput,
  UpdateTodoInput,
  TodoFilter,
  TodoStats,
} from './types';
import { createTodo, updateTodo, toggleTodo } from './todo';

/**
 * Todo 服务类 - 管理所有 Todo 操作
 */
export class TodoService {
  private todos: Map<string, TodoItem> = new Map();
  
  /**
   * 创建新的 Todo
   * 
   * @param input - 创建输入
   * @returns 创建的 TodoItem
   */
  create(input: CreateTodoInput): TodoItem {
    const todo = createTodo(input);
    this.todos.set(todo.id, todo);
    return todo;
  }
  
  /**
   * 获取 Todo
   * 
   * @param id - Todo ID
   * @returns TodoItem 或 undefined
   */
  get(id: string): TodoItem | undefined {
    return this.todos.get(id);
  }
  
  /**
   * 更新 Todo
   * 
   * @param id - Todo ID
   * @param input - 更新输入
   * @returns 更新后的 TodoItem
   * @throws 如果 Todo 不存在
   */
  update(id: string, input: UpdateTodoInput): TodoItem {
    const todo = this.todos.get(id);
    if (!todo) {
      throw new Error(`Todo with ID "${id}" not found`);
    }
    
    const updated = updateTodo(todo, input);
    this.todos.set(id, updated);
    return updated;
  }
  
  /**
   * 切换 Todo 完成状态
   * 
   * @param id - Todo ID
   * @returns 更新后的 TodoItem
   * @throws 如果 Todo 不存在
   */
  toggle(id: string): TodoItem {
    const todo = this.todos.get(id);
    if (!todo) {
      throw new Error(`Todo with ID "${id}" not found`);
    }
    
    const updated = toggleTodo(todo);
    this.todos.set(id, updated);
    return updated;
  }
  
  /**
   * 删除 Todo
   * 
   * @param id - Todo ID
   * @returns 是否删除成功
   */
  delete(id: string): boolean {
    return this.todos.delete(id);
  }
  
  /**
   * 列出所有 Todo（可选过滤）
   * 
   * @param filter - 过滤条件
   * @returns Todo 数组
   */
  list(filter?: TodoFilter): TodoItem[] {
    let todos = Array.from(this.todos.values());
    
    if (!filter) {
      return todos;
    }
    
    if (filter.completed !== undefined) {
      todos = todos.filter(t => t.completed === filter.completed);
    }
    
    if (filter.priority !== undefined) {
      todos = todos.filter(t => t.priority === filter.priority);
    }
    
    if (filter.hasDescription !== undefined) {
      todos = todos.filter(t =>
        filter.hasDescription
          ? !!t.description
          : !t.description
      );
    }
    
    if (filter.hasDueDate !== undefined) {
      todos = todos.filter(t =>
        filter.hasDueDate
          ? !!t.dueDate
          : !t.dueDate
      );
    }
    
    return todos;
  }
  
  /**
   * 清空所有 Todo
   */
  clear(): void {
    this.todos.clear();
  }
  
  /**
   * 获取统计信息
   * 
   * @returns TodoStats
   */
  getStats(): TodoStats {
    const todos = Array.from(this.todos.values());
    
    return {
      total: todos.length,
      completed: todos.filter(t => t.completed).length,
      active: todos.filter(t => !t.completed).length,
      byPriority: {
        low: todos.filter(t => t.priority === 'low').length,
        medium: todos.filter(t => t.priority === 'medium').length,
        high: todos.filter(t => t.priority === 'high').length,
      },
    };
  }
}
