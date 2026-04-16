# v2.9.0 — DaoUniverseClock：daoChronos × daoUniverse 时序心跳

## Context

v2.8.0 完成了 `DaoUniverseMonitor`（系统快照 + 五感引擎），但快照目前只能手动触发（`monitor.capture()`）。  
v2.9.0 目标：引入 **`DaoUniverseClock`**，用 `daoChronos` 驱动定时心跳，每 N ms 自动调用 `monitor.capture()` 并向订阅者广播，为系统注入**时间维度**。

---

## 新文件

| 文件 | 说明 |
|------|------|
| `packages/daoCollective/src/universe-clock.ts` | `DaoUniverseClock` 类（核心） |
| `packages/daoCollective/src/__tests__/universe-clock.test.ts` | ~28 测试 |

## 修改文件

| 文件 | 变更 |
|------|------|
| `packages/daoCollective/package.json` | 添加 `@daomind/chronos: workspace:^` |
| `packages/daoCollective/tsconfig.json` | 添加 `{ "path": "../daoChronos" }` |
| `packages/daoCollective/src/index.ts` | 导出 `DaoUniverseClock` + chronos 再导出 |

---

## `DaoUniverseClock` API 设计

```typescript
import { DaoChronos } from '@daomind/chronos';
import type { DaoChronosPoint } from '@daomind/chronos';
import type { MonitorSnapshot } from '@daomind/monitor';
import type { DaoUniverseMonitor } from './universe-monitor';

type ClockTickCallback = (snap: MonitorSnapshot, point: DaoChronosPoint) => void;

export class DaoUniverseClock {
  constructor(monitor: DaoUniverseMonitor, intervalMs = 1000)

  start(): void          // 启动定时心跳（幂等）
  stop(): void           // 停止定时心跳（幂等）
  tick(): MonitorSnapshot  // 手动触发一次（不依赖定时器，测试友好）

  onTick(cb: ClockTickCallback): () => void  // 订阅 tick 事件，返回取消函数

  elapsed(): number | undefined  // 距离最后一次 tick 经过的毫秒数

  get ticks():     number                      // 累计 tick 次数（自建实例起算）
  get isRunning(): boolean                     // 是否正在运行
  get lastTick():  DaoChronosPoint | undefined // 最后一次 tick 的时间点
  get chronos():   DaoChronos                  // 底层 DaoChronos 实例
  get monitor():   DaoUniverseMonitor          // 传入的 monitor 实例
}
```

### 实现要点

- `start()` 调用 `this._chronos.sync(point => { ... })` 获得 unsync 函数，存入 `_unsync`；幂等：已运行则直接返回
- `stop()` 调用 `_unsync()`，置空；幂等：未运行则直接返回
- `tick()`：调用 `_chronos.now()` + `_monitor.capture()`，更新 `_ticks` / `_lastTick`，广播所有 `_callbacks`
- `start()` 内部的 sync 回调与 `tick()` 共享相同逻辑（提取私有方法 `_doTick(point)`）
- 构造时 `new DaoChronos({ source: 'system', tickInterval: intervalMs })`

---

## index.ts 再导出

```typescript
// DaoUniverseClock — 时序心跳（daoChronos × daoCollective）
export type { DaoChronosPoint, DaoChronosConfig, TimeSource } from '@daomind/chronos';
export { DaoChronos, daoGetChronos } from '@daomind/chronos';
export type { ClockTickCallback } from './universe-clock';  // 如已导出
export { DaoUniverseClock } from './universe-clock';
```

---

## 测试覆盖（~28 个）

| 分组 | 数量 | 要点 |
|------|------|------|
| 构建（7） | 7 | 可构建、默认 isRunning=false、ticks=0、lastTick=undefined、chronos/monitor getter、自定义 interval |
| start/stop（5） | 5 | start→isRunning=true、stop→false、幂等 start、幂等 stop、stop 后 ticks 不增 |
| tick() 手动（5） | 5 | 返回 MonitorSnapshot、ticks++、lastTick 更新、callbacks 触发、elapsed() 有值 |
| onTick callbacks（4） | 4 | 订阅触发、unsubscribe 停止、多 listener 都触发、参数结构正确 |
| 定时 tick（4） | 4 | fake timers: start+advance→ticks++、stop 后 advance→不变、每 tick 推 history、stop→start→ticks 累计 |
| elapsed（1） | 1 | tick 前 undefined，tick 后 ≥ 0 |
| E2E（2） | 2 | Universe→Monitor→Clock 整栈、可从 @daomind/collective 导入 |

**定时 tick 组使用 `jest.useFakeTimers()` + `jest.advanceTimersByTime()` 避免实际等待**

---

## 执行顺序

1. 更新 `packages/daoCollective/package.json`（加 `@daomind/chronos`）
2. 更新 `packages/daoCollective/tsconfig.json`（加 `../daoChronos`）
3. 创建 `packages/daoCollective/src/universe-clock.ts`
4. 更新 `packages/daoCollective/src/index.ts`（加 chronos 再导出 + DaoUniverseClock）
5. 创建 `packages/daoCollective/src/__tests__/universe-clock.test.ts`
6. `pnpm install && pnpm -r build && npx jest packages/daoCollective`
7. `git commit -m "feat(clock): v2.9.0 — DaoUniverseClock"` + `git tag v2.9.0` + push

---

## 验证

```bash
npx jest packages/daoCollective/src/__tests__/universe-clock.test.ts --no-coverage
# 期望：~28 tests passed
npx jest --no-coverage
# 期望：~435 tests passed，33 suites
pnpm -r run build
# 期望：全部 Done
```
