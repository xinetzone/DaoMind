# @daomind/nothing

**无名** 核心包 — 提供零运行时的类型契约系统。

## 安装

```bash
pnpm add @daomind/nothing
```

## 核心类型

### `Contract<T>`

定义模块契约的基础类型：

```typescript
import type { Contract } from '@daomind/nothing';

type UserContract = Contract<{
  findById(id: string): Promise<User | null>;
  create(data: CreateUserDto): Promise<User>;
  update(id: string, data: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
}>;
```

### `Satisfies<T, C>`

验证实现是否满足契约：

```typescript
import type { Satisfies } from '@daomind/nothing';

const userService = {
  async findById(id: string) { /* ... */ },
  async create(data: CreateUserDto) { /* ... */ },
  async update(id: string, data: UpdateUserDto) { /* ... */ },
  async delete(id: string) { /* ... */ },
} satisfies UserContract;
```

### `Infer<M>`

从模块中提取契约类型：

```typescript
import type { Infer } from '@daomind/nothing';

const userModule = defineModule<UserContract>({ /* ... */ });

type UserModuleType = Infer<typeof userModule>;
// 等同于 UserContract
```

### `DeepReadonly<T>`

深度只读类型，用于不可变状态：

```typescript
import type { DeepReadonly } from '@daomind/nothing';

type ImmutableConfig = DeepReadonly<{
  database: {
    host: string;
    port: number;
  };
  cache: {
    ttl: number;
  };
}>;
```

### `AsyncResult<T, E>`

异步操作的类型安全结果：

```typescript
import type { AsyncResult } from '@daomind/nothing';

interface PaymentService {
  charge(
    amount: number,
    currency: string
  ): AsyncResult<ChargeResult, 'INSUFFICIENT_FUNDS' | 'INVALID_CARD'>;
}
```

## 工具类型

### `Optional<T, K>`

使特定字段可选：

```typescript
import type { Optional } from '@daomind/nothing';

type CreateUserDto = Optional<User, 'id' | 'createdAt' | 'updatedAt'>;
```

### `RequireAtLeastOne<T>`

至少需要一个字段：

```typescript
import type { RequireAtLeastOne } from '@daomind/nothing';

type UserFilter = RequireAtLeastOne<{
  id?: string;
  email?: string;
  name?: string;
}>;
```

## TypeScript 版本要求

`@daomind/nothing` 需要 TypeScript **5.0+** 以支持 `satisfies` 关键字。

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true
  }
}
```
