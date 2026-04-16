# v2.12.0 Plan — DaoUniverseScheduler（daotimes × DaoUniverseClock）

## Context

v2.11.0 已完成 DaoUniverseAudit（496 tests, 36 suites）。
v2.12.0 目标：将 `@daomind/times` 的 `DaoScheduler` 接入 `DaoUniverseClock.onTick()`，
实现"待时而动"——任务按延迟时间注册，每次心跳触发 `flush()` 执行所有到期任务。

---

## 架构

```
DaoUniverse
  ├── DaoUniverseMonitor (v2.8.0)
  │       ├── DaoUniverseClock (v2.9.0)
  │       │       ├── DaoUniverseFeedback (v2.10.0)
  │       │       └── DaoUniverseScheduler (v2.12.0) ← 时序驱动调度
  │       └── ↑ runtimeHealth
  └── DaoUniverseAudit (v2.11.0)
```

---

## 核心设计

### 类型

```typescript
export interface ExecutionRecord {
  readonly taskId: string;
  readonly executedAt: number;
  readonly status: 'success' | 'error';
}
```

### DaoUniverseScheduler API

```typescript
class DaoUniverseScheduler {
  constructor(clock: DaoUniverseClock)          // 内部 new DaoScheduler()（非全局单例）

  attach(): void                                 // 订阅 clock.onTick() → flush()（幂等）
  detach(): void                                 // 取消订阅（幂等）

  schedule<T>(handler, delayMs=0, priority=1): string  // 注册任务，返回 taskId
  cancel(taskId: string): boolean                // 取消任务
  async flush(): Promise<number>                 // 执行所有到期任务，返回执行数量

  pending(): number                              // 当前到期待执行任务数
  executions(limit?: number): ReadonlyArray<ExecutionRecord>

  get isAttached(): boolean
  get clock(): DaoUniverseClock
  get scheduler(): DaoScheduler
}
```

### schedule() 实现要点

用闭包捕获 id（handler 被调用时 id 已赋值）：
```typescript
let capturedId = '';
const wrapped = async () => {
  try {
    const r = await Promise.resolve(handler());
    this._executions.push({ taskId: capturedId, executedAt: Date.now(), status: 'success' });
    return r;
  } catch (err) {
    this._executions.push({ taskId: capturedId, executedAt: Date.now(), status: 'error' });
    throw err;
  }
};
capturedId = this._scheduler.schedule({ executeAt: Date.now() + delayMs, handler: wrapped, priority });
return capturedId;
```

### flush() 实现

DaoScheduler.pending() > 0 时 next() 不等待，可安全循环：
```typescript
async flush(): Promise<number> {
  let count = 0;
  while (this._scheduler.pending() > 0) {
    await this._scheduler.next();
    count++;
  }
  return count;
}
```

---

## 文件

| 操作 | 路径 |
|------|------|
| 新建 | `retrospectives/2026-04-16-daomind-v2.11.0.md` |
| 新建 | `packages/daoCollective/src/universe-scheduler.ts` |
| 修改 | `packages/daoCollective/package.json` — 添加 `@daomind/times: workspace:^` |
| 修改 | `packages/daoCollective/tsconfig.json` — 添加 `../daotimes` |
| 修改 | `packages/daoCollective/src/index.ts` — 导出 DaoUniverseScheduler + daotimes 再导出 |
| 新建 | `packages/daoCollective/src/__tests__/universe-scheduler.test.ts` |

---

## 测试设计（~30 个）

| 分组 | 测试数 |
|------|--------|
| 构建（isAttached=false / scheduler/clock getter / pending=0 / executions=[]）| 6 |
| attach / detach（+ 幂等）| 4 |
| schedule（返回 id / pending 增加 / cancel / delayMs / priority）| 5 |
| flush()（执行到期任务 / 计数 / 无任务返回 0 / 错误不崩溃 / 连续调用）| 5 |
| attach + fake timers（onTick → flush / 执行积累 / detach 后冻结）| 4 |
| executions()（limit / success/error status / 顺序）| 3 |
| E2E（Universe→Clock→Scheduler / 延迟任务 / 与 Feedback 共存）| 3 |

---

## 再导出（index.ts 新增）

```typescript
// @daomind/times
export type { DaoTimerHandle, DaoTimerOptions, DaoScheduledTask, DaoTimeWindow } from '@daomind/times';
export { DaoTimer, DaoScheduler, daoTimer, daoScheduler, daoTimeWindow } from '@daomind/times';

// DaoUniverseScheduler
export type { ExecutionRecord } from './universe-scheduler';
export { DaoUniverseScheduler } from './universe-scheduler';
```

---

## 验证

```bash
pnpm install
npx tsc --build packages/daoCollective/tsconfig.json    # 无 error TS
npx jest packages/daoCollective --no-coverage            # 全部通过
npx jest --no-coverage                                   # 全量 ≥ 526 tests
pnpm -r run build                                        # 全部 Done
git commit + git tag v2.12.0 + push origin + push github
```
