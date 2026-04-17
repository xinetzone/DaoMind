# 最佳实践

使用 DaoMind 构建高质量应用的推荐做法。

## 契约设计原则

### 1. 接口隔离原则

将大型接口拆分为小的、专注的接口：

```typescript
// ❌ 避免：过大的接口
interface GodModule {
  createUser(data: unknown): Promise<User>
  deleteUser(id: string): Promise<void>
  sendEmail(to: string, content: string): Promise<void>
  generateReport(): Promise<Report>
  // ... 20 more methods
}

// ✅ 推荐：职责单一的接口
interface UserRepository {
  create(data: CreateUserDto): Promise<User>
  delete(id: string): Promise<void>
}

interface EmailService {
  send(to: string, content: string): Promise<void>
}

interface ReportGenerator {
  generate(): Promise<Report>
}
```

### 2. 依赖倒置

高层模块依赖抽象（无名），不依赖具体实现（有名）：

```typescript
// ✅ 正确：依赖接口
interface PaymentGateway {
  charge(amount: number, currency: string): Promise<ChargeResult>
}

const orderModule = defineModule({
  deps: { payment: paymentGateway }, // 依赖抽象
  setup({ payment }) {
    return {
      async createOrder(items: OrderItem[]) {
        const total = calculateTotal(items)
        return payment.charge(total, 'CNY') // 不关心具体实现
      },
    }
  },
})
```

---

## 模块组织

### 目录结构

```
src/
├── contracts/          # 无名：所有类型/接口定义
│   ├── core.ts
│   ├── user.ts
│   └── payment.ts
├── modules/            # 有名：运行时实现
│   ├── user/
│   │   ├── index.ts
│   │   └── user.module.ts
│   └── payment/
│       ├── index.ts
│       └── stripe.module.ts
├── agents/             # Agent 定义
│   └── order.agent.ts
└── container.ts        # 容器配置
```

### 命名约定

```typescript
// 类型：PascalCase + Contract/Type 后缀
interface UserContract { ... }
type PaymentConfig = { ... }

// 模块实例：camelCase
const userModule = defineModule({ ... });

// Agent：camelCase + Agent 后缀
const orderAgent = defineAgent({ ... });

// 容器：camelCase + Container 后缀
const appContainer = createContainer();
```

---

## 错误处理

### 使用 Result 类型

```typescript
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E }

interface UserService {
  findUser(id: string): Promise<Result<User, 'NOT_FOUND' | 'DB_ERROR'>>
}

// 使用时强制处理错误
const result = await userService.findUser('123')
if (!result.ok) {
  switch (result.error) {
    case 'NOT_FOUND':
      return handle404()
    case 'DB_ERROR':
      return handle500()
  }
}
// 此处 result.value 类型安全
```

---

## 测试策略

### 用无名替换实现

```typescript
// 生产实现
const emailService: EmailService = new SmtpEmailService(config)

// 测试替换
const mockEmailService: EmailService = {
  send: vi.fn().mockResolvedValue(undefined),
}

// 测试
test('创建用户时发送欢迎邮件', async () => {
  const userModule = createUserModule({ email: mockEmailService })
  await userModule.createUser({ name: '测试用户', email: 'test@test.com' })
  expect(mockEmailService.send).toHaveBeenCalledWith(
    'test@test.com',
    expect.stringContaining('欢迎'),
  )
})
```

---

## 性能优化

### 懒加载模块

```typescript
const heavyModule = defineModule({
  id: 'heavy-computation',
  // 只在第一次使用时初始化
  lazy: true,
  async setup() {
    const { HeavyLibrary } = await import('./heavy-library')
    return new HeavyLibrary()
  },
})
```

### 不可变状态

```typescript
// Agent 中使用不可变更新
handlers: {
  ADD_ITEM({ state, message }) {
    // ✅ 创建新对象而非修改
    return {
      ...state,
      items: [...state.items, message.item]
    };

    // ❌ 避免直接修改
    // state.items.push(message.item);
    // return state;
  }
}
```

---

## 下一步

- [API 参考](/api/) — 完整 API 文档
- [示例库](/examples/) — 生产级代码示例
- [FAQ](/faq) — 常见问题解答
