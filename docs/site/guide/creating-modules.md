# 创建模块

学习如何在 DaoMind 中创建、注册和使用模块。

## 模块的结构

一个完整的 DaoMind 模块由三部分组成：

```
模块
├── 契约 (Contract)  → 无名：类型定义
├── 实现 (Impl)      → 有名：运行时对象
└── 元数据 (Meta)    → 模块 ID、版本、依赖
```

## 创建基础模块

```typescript
import { defineModule } from '@daomind/core';

// 定义模块契约
interface LoggerModule {
  log(message: string, level?: 'info' | 'warn' | 'error'): void;
  getLogs(): string[];
}

// 创建模块
const loggerModule = defineModule<LoggerModule>({
  id: '@myapp/logger',
  version: '1.0.0',
  
  setup() {
    const logs: string[] = [];
    
    return {
      log(message, level = 'info') {
        const entry = `[${level.toUpperCase()}] ${new Date().toISOString()} ${message}`;
        logs.push(entry);
        console[level](entry);
      },
      getLogs() {
        return [...logs];
      }
    };
  }
});
```

## 模块依赖

模块可以声明对其他模块的依赖：

```typescript
const analyticsModule = defineModule({
  id: '@myapp/analytics',
  version: '1.0.0',
  
  // 声明依赖
  deps: {
    logger: loggerModule,
  },
  
  setup({ logger }) {
    // 使用依赖的模块
    return {
      track(event: string, data?: Record<string, unknown>) {
        logger.log(`Event: ${event} ${JSON.stringify(data ?? {})}`);
      }
    };
  }
});
```

## 异步初始化

```typescript
const dbModule = defineModule({
  id: '@myapp/database',
  version: '1.0.0',
  
  async setup() {
    // 异步初始化
    const connection = await createConnection({
      host: 'localhost',
      port: 5432,
      database: 'myapp'
    });
    
    return {
      async query(sql: string, params?: unknown[]) {
        return connection.execute(sql, params);
      },
      async close() {
        await connection.close();
      }
    };
  }
});
```

## 注册到容器

```typescript
import { createContainer } from '@daomind/core';

const container = createContainer();

// 注册模块
container.register(loggerModule);
container.register(analyticsModule);
container.register(dbModule);

// 初始化所有模块（按依赖顺序）
await container.initialize();

// 获取模块实例
const logger = container.get('@myapp/logger');
logger.log('应用启动成功！');
```

## 模块生命周期

```
注册 → 初始化 → 运行 → 销毁
register  setup    use   teardown
```

```typescript
const module = defineModule({
  id: '@myapp/worker',
  
  async setup() {
    const worker = new Worker('./worker.js');
    
    return {
      execute: (task) => worker.postMessage(task),
      
      // 清理钩子
      [Symbol.asyncDispose]: async () => {
        worker.terminate();
      }
    };
  }
});
```

## 下一步

- [Agent 系统](/guide/agents) — 更高级的模块协作模式
- [API 参考](/api/) — 完整的 API 文档
