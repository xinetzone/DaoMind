# v2.10.0 Plan — DaoUniverseFeedback（daoFeedback × DaoUniverseClock）

## Context

v2.9.0 完成了 `DaoUniverseClock`（daoChronos 驱动的时序心跳）。
现在要利用每次心跳产生的健康分数，接入 `daoFeedback` 的 S 型曲线调节器，
形成**闭环自调节**：宇宙状态 → 健康分数 → 信号调节 → RegulationResult。

## 里程碑零：复盘文档

**文件：** `retrospectives/2026-04-16-daomind-v2.9.0.md`

内容提纲：
- 目标：daoChronos × daoCollective 时序心跳
- 关键设计：`DaoChronos.sync()` + `_doTick()` 私有方法 + `tick()` 手动 API
- `jest.useFakeTimers()` 测试定时行为
- 结果：29 tests，架构层：Universe → Monitor → Clock

## 里程碑一：`DaoUniverseFeedback`

**文件：** `packages/daoCollective/src/universe-feedback.ts`（新建）

```typescript
export interface FeedbackEntry {
  readonly timestamp: number;
  readonly health: number;
  readonly result: RegulationResult;
}

export class DaoUniverseFeedback {
  private readonly _regulator: DaoFeedbackRegulator;
  private readonly _history: FeedbackEntry[] = [];
  private _unsubscribe?: () => void;

  constructor(
    private readonly _clock: DaoUniverseClock,
    config?: Partial<FeedbackRegulatorConfig>,
    private readonly _windowMs = 60_000,
  ) {
    this._regulator = new DaoFeedbackRegulator(config);
  }

  /** attach(): 订阅 clock.onTick()，每次心跳自动 regulate（幂等） */
  attach(): void

  /** detach(): 取消订阅（幂等） */
  detach(): void

  /** regulate(health): 手动传入健康分数 → RegulationResult，写入 history */
  regulate(health: number): RegulationResult

  /** tick(): 手动以 clock.monitor 最新快照健康分数触发一次 regulate */
  tick(): RegulationResult | null  // 若 monitor 无历史则返回 null

  /** history(limit?): 历史调节记录 */
  history(limit?: number): ReadonlyArray<FeedbackEntry>

  get lastResult(): RegulationResult | undefined
  get isAttached(): boolean
  get regulator(): DaoFeedbackRegulator
  get clock(): DaoUniverseClock
}
```

**信号转换逻辑：**
```typescript
// health = 0–100（100 = 完美），转换为 signalStrength = 0–100（越高越需要调节）
const signalStrength = 100 - health;
const result = this._regulator.regulate(signalStrength, this._windowMs);
this._regulator.tick();  // 按恢复速率衰减 currentIntensity
this._history.push({ timestamp: Date.now(), health, result });
```

## 里程碑二：基础设施更新

| 文件 | 变更 |
|------|------|
| `packages/daoCollective/package.json` | `"@daomind/feedback": "workspace:^"` |
| `packages/daoCollective/tsconfig.json` | `{ "path": "../daoFeedback" }` |
| `packages/daoCollective/src/index.ts` | export `DaoUniverseFeedback` + `FeedbackEntry` + `@daomind/feedback` re-exports |

**index.ts 新增再导出：**
```typescript
export type { FeedbackRegulatorConfig, RegulationResult } from '@daomind/feedback';
export { DaoFeedbackRegulator, DaoFeedbackLifecycle } from '@daomind/feedback';
export type { FeedbackEntry } from './universe-feedback';
export { DaoUniverseFeedback } from './universe-feedback';
```

## 里程碑三：测试（~28 个）

**文件：** `packages/daoCollective/src/__tests__/universe-feedback.test.ts`

| 分组 | 数量 | 内容 |
|------|------|------|
| 构建 | 6 | 构建、isAttached=false、lastResult=undefined、regulator getter、clock getter、自定义 config |
| attach/detach | 4 | attach → isAttached=true、detach → false、幂等 attach、幂等 detach |
| regulate() | 5 | 返回 RegulationResult、health=100→低信号、health=0→高信号、outputIntensity∈[0,1]、effectiveSignals≥0 |
| attach 自动调节 | 4 | fake timers：Clock tick → history++、lastResult 更新、isSaturated=false（正常情况）、多次 tick |
| history | 5 | 初始为空、regulate 后增长、limit 限制、entry 含 {timestamp,health,result}、lastResult = 最新 |
| regulator 集成 | 2 | tick() 衰减 intensity、setSensitivity 影响输出 |
| E2E | 2 | 全栈（Universe→Monitor→Clock→Feedback）、可从 @daomind/collective 导入 |

## 里程碑四：验证 + 发布

```bash
npx jest packages/daoCollective --no-coverage   # 145+ tests pass
pnpm -r run build                                 # 全包 Done
git commit + git tag v2.10.0 + push
```

## 标准 push 命令

```bash
ANON_KEY="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
GITHUB_PAT=$(curl ... get-secrets)
git remote add github "https://x-access-token:${PAT}@github.com/xinetzone/DaoMind.git"
git push github main:main && git tag v2.10.0 && git push github v2.10.0
```
