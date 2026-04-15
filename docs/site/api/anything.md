# @daomind/anything

**有名** 核心包 — 提供运行时模块系统和依赖容器。

## 安装

```bash
pnpm add @daomind/anything
```

## 核心 API

### `defineModule(config)`

定义一个模块：

```typescript
import { defineModule } from '@daomind/anything';

const greetModule = defineModule({
  id: 'greet',
  version: '1.0.0',
  
  setup() {
    return {
      greet: (name: string) => `你好，${name}！`
    };
  }
});
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | ✅ | 模块唯一标识符 |
| `version` | `string` | ❌ | 语义化版本号 |
| `deps` | `Record<string, Module>` | ❌ | 模块依赖声明 |
| `setup` | `(deps) => T \| Promise<T>` | ✅ | 模块工厂函数 |
| `teardown` | `(instance) => void \| Promise<void>` | ❌ | 销毁钩子 |

### `createContainer()`

创建模块容器：

```typescript
import { createContainer } from '@daomind/anything';

const container = createContainer({
  // 可选配置
  strict: true,         // 严格模式：检测循环依赖
  timeout: 5000,        // 初始化超时（ms）
  logger: console,      // 日志记录器
});

// 注册模块
container.register(greetModule);
container.register(userModule);

// 初始化（自动解析依赖顺序）
await container.initialize();

// 获取模块
const greeter = container.get('greet');
greeter.greet('道友'); // 你好，道友！

// 销毁
await container.destroy();
```

### `container.get<T>(id)`

获取已初始化的模块实例：

```typescript
// 类型安全获取
const user = container.get<UserService>('user');

// 检查模块是否存在
if (container.has('optional-module')) {
  const mod = container.get('optional-module');
}
```

### `container.register(module, options?)`

注册模块：

```typescript
container.register(myModule, {
  // 覆盖默认实现（用于测试）
  override: true,
  
  // 懒加载：首次 get 时才初始化
  lazy: true,
});
```

## 高级用法

### 作用域容器

```typescript
const appContainer = createContainer();
appContainer.register(dbModule);
appContainer.register(loggerModule);

// 创建请求作用域容器
const requestContainer = appContainer.createScope();
requestContainer.register(requestContextModule);

await requestContainer.initialize();
// requestContainer 可访问 appContainer 中的所有模块
```

### 模块替换（测试用）

```typescript
// 生产
container.register(emailModule);

// 测试
const testContainer = createContainer();
testContainer.register(mockEmailModule, { override: true });
```

## 错误类型

| 错误 | 描述 |
|------|------|
| `ModuleNotFoundError` | 尝试获取未注册的模块 |
| `CircularDependencyError` | 检测到循环依赖 |
| `InitializationTimeoutError` | 模块初始化超时 |
| `DuplicateModuleError` | 注册同名模块（非 override 模式） |
