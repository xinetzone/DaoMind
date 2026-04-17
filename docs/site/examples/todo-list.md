# Todo List 示例

构建一个完整的待办事项应用，展示模块化开发实践。

## 模块设计

```
todo-app/
├── contracts/
│   └── todo.ts          # 无名：类型定义
├── modules/
│   ├── todo.module.ts   # 有名：业务逻辑
│   └── storage.module.ts # 有名：持久化
└── main.ts
```

## 契约定义（无名）

```typescript
// contracts/todo.ts
export type TodoId = string

export type Todo = {
  id: TodoId
  title: string
  completed: boolean
  createdAt: Date
}

export type CreateTodoDto = Pick<Todo, 'title'>
export type UpdateTodoDto = Partial<Pick<Todo, 'title' | 'completed'>>

export interface TodoRepository {
  findAll(): Promise<Todo[]>
  findById(id: TodoId): Promise<Todo | null>
  create(dto: CreateTodoDto): Promise<Todo>
  update(id: TodoId, dto: UpdateTodoDto): Promise<Todo | null>
  delete(id: TodoId): Promise<boolean>
}

export interface TodoService {
  getTodos(filter?: 'all' | 'active' | 'completed'): Promise<Todo[]>
  addTodo(title: string): Promise<Todo>
  toggleTodo(id: TodoId): Promise<Todo | null>
  editTodo(id: TodoId, title: string): Promise<Todo | null>
  deleteTodo(id: TodoId): Promise<boolean>
  clearCompleted(): Promise<number>
}
```

## 内存存储（有名）

```typescript
// modules/storage.module.ts
import { defineModule } from '@daomind/anything'
import type { TodoRepository, Todo, CreateTodoDto, UpdateTodoDto, TodoId } from '../contracts/todo'

export const memoryRepository = defineModule<TodoRepository>({
  id: 'todo-repository',

  setup() {
    const store = new Map<TodoId, Todo>()

    return {
      async findAll() {
        return Array.from(store.values()).sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
        )
      },

      async findById(id) {
        return store.get(id) ?? null
      },

      async create(dto: CreateTodoDto) {
        const todo: Todo = {
          id: crypto.randomUUID(),
          title: dto.title,
          completed: false,
          createdAt: new Date(),
        }
        store.set(todo.id, todo)
        return todo
      },

      async update(id, dto: UpdateTodoDto) {
        const todo = store.get(id)
        if (!todo) return null
        const updated = { ...todo, ...dto }
        store.set(id, updated)
        return updated
      },

      async delete(id) {
        return store.delete(id)
      },
    }
  },
})
```

## 业务逻辑（有名）

```typescript
// modules/todo.module.ts
import { defineModule } from '@daomind/anything'
import type { TodoService } from '../contracts/todo'
import { memoryRepository } from './storage.module'

export const todoService = defineModule<TodoService>({
  id: 'todo-service',
  deps: { repo: memoryRepository },

  setup({ repo }) {
    return {
      async getTodos(filter = 'all') {
        const todos = await repo.findAll()
        if (filter === 'active') return todos.filter((t) => !t.completed)
        if (filter === 'completed') return todos.filter((t) => t.completed)
        return todos
      },

      async addTodo(title) {
        if (!title.trim()) throw new Error('标题不能为空')
        return repo.create({ title: title.trim() })
      },

      async toggleTodo(id) {
        const todo = await repo.findById(id)
        if (!todo) return null
        return repo.update(id, { completed: !todo.completed })
      },

      async editTodo(id, title) {
        if (!title.trim()) throw new Error('标题不能为空')
        return repo.update(id, { title: title.trim() })
      },

      async deleteTodo(id) {
        return repo.delete(id)
      },

      async clearCompleted() {
        const completed = await repo.findAll().then((t) => t.filter((t) => t.completed))
        await Promise.all(completed.map((t) => repo.delete(t.id)))
        return completed.length
      },
    }
  },
})
```

## 使用

```typescript
// main.ts
import { createContainer } from '@daomind/anything'
import { todoService } from './modules/todo.module'

const container = createContainer()
container.register(todoService)
await container.initialize()

const todos = container.get<TodoService>('todo-service')

const t1 = await todos.addTodo('学习 DaoMind')
const t2 = await todos.addTodo('阅读道德经')
const t3 = await todos.addTodo('构建第一个应用')

await todos.toggleTodo(t1.id) // 标记完成

const active = await todos.getTodos('active')
console.log(`未完成：${active.length} 项`) // 未完成：2 项

const cleared = await todos.clearCompleted()
console.log(`清理了 ${cleared} 个已完成项`) // 清理了 1 个已完成项
```
