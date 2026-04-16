# v2.27.0 计划：DaoUniverseOptimizer（宇宙优化建议引擎）

## 背景

v2.26.0 建立了 DaoUniverseHealthBoard（纯消费者，蒸馏健康指标 + 趋势感知）。

下一步：在 HealthBoard 基础上增加 **分析与建议** 层——DaoUniverseOptimizer。

消费者链：
```
DaoUniverseFacade
  └──▶ DaoUniverseHealthBoard（蒸馏 HealthEntry + 趋势）
           └──▶ DaoUniverseOptimizer（分析 HealthEntry[]，输出 OptimizationReport）
```

帛书依据："为学日益，为道日损，损之又损，以至于无为"（德经·四十八章）
分析即"损"——从原始数据中去除冗余，提炼出行动建议。

---

## 目标

**测试里程碑**：971 + 29 = **1000 tests（整）**

---

## 新增文件

### 1. `packages/daoCollective/src/universe-optimizer.ts`

```typescript
export interface Recommendation {
  readonly level:   'info' | 'warn' | 'critical';
  readonly area:    'monitor' | 'qi' | 'apps' | 'bench' | 'diag' | 'system';
  readonly message: string;
}

export interface OptimizationReport {
  readonly timestamp:       number;
  readonly trend:           HealthTrend;
  readonly sampleCount:     number;   // board.history() 样本数
  readonly averageScore:    number;   // monitorScore 平均值
  readonly minScore:        number;
  readonly maxScore:        number;
  readonly scoreRange:      number;   // maxScore - minScore
  readonly recommendations: readonly Recommendation[];
}

export interface OptimizerSnapshot {
  readonly timestamp:      number;
  readonly totalAnalyses:  number;
  readonly lastAnalysisAt: number | null;
  readonly lastTrend:      HealthTrend | undefined;
  readonly historySize:    number;
}

export class DaoUniverseOptimizer {
  private readonly _history: OptimizationReport[] = [];
  constructor(private readonly _board: DaoUniverseHealthBoard) {}

  analyze(): OptimizationReport   // 分析 board.history()，追加到 _history
  recommend(): readonly Recommendation[]  // shortcut = analyze().recommendations
  history(): ReadonlyArray<OptimizationReport>
  clearHistory(): void
  snapshot(): OptimizerSnapshot
  get board(): DaoUniverseHealthBoard
}
```

### analyze() 建议规则（6 条）

| 触发条件 | level | area | message |
|----------|-------|------|---------|
| trend === 'degrading' | critical | monitor | "宇宙健康持续下降，建议立即运行 diagnose() 进行深度诊断" |
| trend === 'unknown' | info | system | "健康数据不足（需 ≥2 次 check()），暂无趋势分析" |
| averageScore < 30 | warn | monitor | "平均健康分 ${avg.toFixed(1)} 偏低，建议检查 Agent 与 Module 激活状态" |
| scoreRange > 30 | warn | monitor | "健康分波动 ${range} 较大，系统状态不稳定" |
| latest.diagCount === 0 | info | diag | "尚未运行综合诊断，建议调用 diagnose() 获取哲学与性能报告" |
| latest.qiNodes === 0 | info | qi | "混元气总线无注册节点，建议配置服务网格节点" |

当 board.history() 为空时：仅输出"数据不足"info + trend='unknown'，averageScore/min/max/scoreRange 均为 0。

---

### 2. `packages/daoCollective/src/__tests__/universe-optimizer.test.ts`（29 个测试）

| 分组 | 数量 | 内容 |
|------|------|------|
| 构建 | 4 | constructor、board getter、history 初始为空、两实例独立 |
| analyze | 6 | 返回 OptimizationReport 形状、timestamp、averageScore 计算、空 board 行为、sampleCount、scoreRange |
| recommend | 3 | 返回 analyze().recommendations、空 board → info、degrading → critical |
| snapshot | 4 | 形状、totalAnalyses=0、lastAnalysisAt null、analyze 后更新 |
| history | 3 | analyze 后增长、clearHistory 清空、clearHistory 后继续 analyze |
| E2E | 9 | full chain、degrading 触发 critical、平均分低触发 warn、qiNodes=0 info、diagCount=0 info、稳定无 critical、两个 optimizer 在同一 board、clearHistory 后重新分析、recommend() 是 analyze() 的快捷方式 |

---

## 修改文件

### 3. `packages/daoCollective/src/index.ts`（追加导出）

```typescript
// DaoUniverseOptimizer
export type { Recommendation, OptimizationReport, OptimizerSnapshot } from './universe-optimizer';
export { DaoUniverseOptimizer } from './universe-optimizer';
```

### 4. `src/App.tsx`

- 测试数：971 → 1000（里程碑！）
- 版本：v2.26.0 → v2.27.0

### 5. `retrospectives/2026-04-16-daomind-v2.26.0.md`（复盘）

---

## 关键实现细节

### analyze() 空 board 边界处理

```typescript
if (entries.length === 0) {
  return {
    timestamp:       Date.now(),
    trend:           'unknown',
    sampleCount:     0,
    averageScore:    0,
    minScore:        0,
    maxScore:        0,
    scoreRange:      0,
    recommendations: [
      { level: 'info', area: 'system', message: '健康数据不足（需 ≥2 次 check()），暂无趋势分析' },
    ],
  };
}
```

### averageScore 精度

使用整数运算或保留 1 位小数：
```typescript
const avg = entries.reduce((s, e) => s + e.monitorScore, 0) / entries.length;
```

`noUncheckedIndexedAccess` 注意：
- `entries[0]!`, `entries[entries.length - 1]!` 用于取 min/max 的初始值（或用 `Math.min(...entries.map(e => e.monitorScore))`）

### latestEntry 访问

```typescript
const latest = entries[entries.length - 1];  // T | undefined
if (latest) { /* 检查 diagCount, qiNodes */ }
```

---

## 验证

```bash
npx jest packages/daoCollective/src/__tests__/universe-optimizer.test.ts --no-coverage
# 期望：29 passed, 29 total

npx jest --no-coverage
# 期望：1000 passed, 52 total（里程碑）

pnpm -r run build
# 期望：全部 Done
```
