# 理解无名与有名

深入理解 DaoMind 最核心的哲学概念。

## 哲学根源

帛书《道德经》第一章：

> **无名，万物之始；有名，万物之母。**
> 
> 故常无欲，以观其妙；常有欲，以观其徼。

在软件工程中：

- **无名（观其妙）** → 关注抽象、接口、契约的"妙"
- **有名（观其徼）** → 关注实现、边界、细节的"徼"

## TypeScript 的天然映射

TypeScript 天然具备这种二元性：

```typescript
// ── 无名空间 ──────────────────────────────────────
type Point = { x: number; y: number };        // type alias
interface Shape { area(): number }             // interface  
enum Direction { Up, Down, Left, Right }       // const enum (类型用途)

// 以上在编译后完全消失 → 零运行时

// ── 有名空间 ──────────────────────────────────────
const origin = { x: 0, y: 0 };               // 值
class Circle implements Shape { ... }          // 类
function distance(a: Point, b: Point) { ... } // 函数

// 以上在运行时真实存在 → 有运行时成本
```

## 实际应用

### 模式 1：契约驱动开发

```typescript
// 无名：先定义"什么"
interface CacheService {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttl?: number): void;
  delete(key: string): void;
  clear(): void;
}

// 有名：再实现"怎么做"
const memoryCache: CacheService = {
  _store: new Map(),
  get(key) { return this._store.get(key); },
  set(key, value) { this._store.set(key, value); },
  delete(key) { this._store.delete(key); },
  clear() { this._store.clear(); }
};
```

### 模式 2：多实现同一契约

```typescript
// 同一个无名契约 → 多个有名实现
const redisCache: CacheService = { /* Redis 实现 */ };
const localStorageCache: CacheService = { /* LocalStorage 实现 */ };
const nullCache: CacheService = { /* 空实现，用于测试 */ };
```

### 模式 3：泛型无名

```typescript
// 无名：泛型契约
type Repository<T> = {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
};

// 有名：具体实现
const userRepository: Repository<User> = { ... };
const productRepository: Repository<Product> = { ... };
```

## 常见误区

### 误区 1：class 是无名

```typescript
// ❌ 误解：以为 class 是无名
abstract class AbstractModule { ... }

// ✅ 正确：class 在运行时存在（有名），只有 interface 是纯无名
interface ModuleContract { ... } // 这才是无名
```

### 误区 2：过度抽象

```typescript
// ❌ 为了无名而无名
interface StringWrapper {
  value: string;
  toString(): string;
}

// ✅ 只有在需要多实现或测试时才提取契约
const name = 'DaoMind'; // 直接使用 string 即可
```

## 何时使用无名

| 场景 | 推荐 |
|------|------|
| 需要多个实现 | ✅ 定义接口 |
| 需要测试替换 | ✅ 定义接口 |
| 单一简单实现 | ❌ 直接写值 |
| 配置对象 | ✅ 定义 type |
| 函数签名共享 | ✅ 定义 type |

## 下一步

- [创建模块](/guide/creating-modules) — 将概念应用到模块系统
- [Agent 系统](/guide/agents) — 高级模块组合模式
