# Counter - 计数器应用

带状态管理的计数器应用，学习如何处理状态变化和事件。

## 📚 学习目标

- 状态管理
- 不可变更新
- 事件发布/订阅
- 模块生命周期

## 🚀 快速开始

### 安装依赖

```bash
cd 02-counter
pnpm install
```

### 运行示例

```bash
pnpm dev
```

## 📖 代码讲解

### 计数器模块定义

```typescript
interface CounterModule extends DaoModuleMeta {
  readonly count: number;
  readonly step: number;
}
```

**关键点**:
- 继承 `DaoModuleMeta` 包含完整的模块元数据
- `readonly` 确保不可变性
- 所有状态都是只读的

### 状态更新

```typescript
function increment(counter: CounterModule): CounterModule {
  return {
    ...counter,
    count: counter.count + counter.step,
  };
}
```

**关键点**:
- 不直接修改原对象
- 创建新对象表示新状态
- 保持不可变性原则

### 事件系统

```typescript
class CounterService {
  private bus = new QiBus();
  
  increment(counter: CounterModule): CounterModule {
    const newCounter = incrementCounter(counter);
    
    // 发布状态变化事件
    this.bus.publish({
      type: 'counter.changed',
      payload: { oldValue: counter.count, newValue: newCounter.count },
      source: 'counter-service',
    });
    
    return newCounter;
  }
}
```

## 🎯 核心概念

### 不可变更新

```
原状态    →    更新函数    →    新状态
{ count: 0 }  increment()  { count: 1 }
    ↓                           ↓
原对象不变                   创建新对象
```

### 事件驱动

```
状态变化  →  发布事件  →  订阅者响应
increment   'counter.changed'  更新UI
```

## 💡 实践任务

### 任务 1: 添加减法

实现 `decrement` 函数：

```typescript
export function decrement(counter: CounterModule): CounterModule {
  return {
    ...counter,
    count: counter.count - counter.step,
  };
}
```

### 任务 2: 添加重置功能

实现重置到初始值：

```typescript
export function reset(counter: CounterModule, initialValue = 0): CounterModule {
  return {
    ...counter,
    count: initialValue,
  };
}
```

### 任务 3: 添加范围限制

限制计数器的最小值和最大值：

```typescript
interface BoundedCounterModule extends CounterModule {
  readonly min: number;
  readonly max: number;
}

export function incrementBounded(counter: BoundedCounterModule): BoundedCounterModule {
  const newCount = Math.min(
    counter.count + counter.step,
    counter.max
  );
  return { ...counter, count: newCount };
}
```

## 📊 项目结构

```
02-counter/
├── src/
│   ├── types.ts          # 类型定义
│   ├── counter.ts        # 计数器逻辑
│   ├── service.ts        # 服务层
│   └── index.ts          # 主入口
├── package.json
├── tsconfig.json
└── README.md
```

## 🔗 下一步

- 进入 [03-todo-list](../03-todo-list/) 学习 CRUD 操作
- 了解 [@modulux/qi](../../api/API-REFERENCE.md#moduluxqi) 消息总线
- 阅读[最佳实践 - 状态管理](../../guides/BEST-PRACTICES.md)

---

**难度**: ⭐ 入门  
**预计时间**: 20 分钟  
**前置知识**: Hello World 示例
