# v2.13.0 计划 — DaoUniverseSkills（daoSkilLs × DaoUniverseScheduler）

## 背景

v2.12.0 完成了时序驱动调度（DaoUniverseScheduler）。
v2.13.0 将"藏器于身，待时而动"推进一层：
技能生命周期（latent → activating → active → cooling → depleted）
由 DaoUniverseScheduler 驱动：Clock 心跳扫描冷却恢复，Scheduler 驱动延迟激活与冷却重置。

## 架构（完成后）

```
DaoUniverse
  ├── DaoUniverseMonitor (v2.8.0)
  │       └── DaoUniverseClock (v2.9.0)
  │               ├── DaoUniverseFeedback (v2.10.0)
  │               └── DaoUniverseScheduler (v2.12.0)
  │                       └── DaoUniverseSkills (v2.13.0) ← 时序驱动技能生命周期
  └── DaoUniverseAudit (v2.11.0)
```

## 关键设计决策

| 决策 | 选择 | 原因 |
|------|------|------|
| 构造参数 | `DaoUniverseScheduler` | 既含 Clock（心跳驱动冷却扫描），又含 Scheduler（延迟激活/冷却重置） |
| registry | 新建 `new DaoSkillRegistry()` | 隔离全局单例，测试互不干扰 |
| 激活/使用/评分/组合 | 内联实现 | `DaoSkillActivator/Scorer/Combiner` 硬绑定 `daoSkillRegistry` 全局单例，无法注入 |
| 冷却重置 | `scheduler.schedule(() => _clearCooling(id), cooldown)` | 替代原 `setTimeout`，时序统一由 Scheduler 管理 |
| 冷却扫描 | `attach()` → `scheduler.clock.onTick()` → `_sweepCooling()` | Clock 心跳驱动 cooling→active 状态迁移 |
| 延迟激活 | `scheduleActivation(id, delayMs?)` → `scheduler.schedule(() => activate(id), delayMs)` | 未来时刻激活技能 |
| 评分存储 | 内部 `Map<SkillId, UsageStats>` | 独立于全局 scorer |
| 组合存储 | 内部 `Set<string>` | 独立于全局 combiner |
| 事件上限 | MAX_EVENTS = 200 | 与 executions 保持一致 |

## 接口设计

```typescript
// universe-skills.ts

export interface SkillEventRecord {
  readonly skillId: SkillId;
  readonly event: 'activated' | 'deactivated' | 'used' | 'cooled' | 'depleted';
  readonly timestamp: number;
}

export class DaoUniverseSkills {
  constructor(scheduler: DaoUniverseScheduler)

  // 生命周期订阅（幂等）
  attach(): void    // scheduler.clock.onTick() → _sweepCooling()
  detach(): void

  // 技能管理
  register(def: DaoSkillDefinition): void         // 注册 → latent
  unregister(id: SkillId): boolean

  // 生命周期操作
  async activate(id: SkillId): Promise<boolean>   // latent→active（检查依赖）
  async deactivate(id: SkillId): Promise<void>    // → latent
  scheduleActivation(id: SkillId, delayMs?: number): string  // 返回 taskId

  // 技能使用（状态检查 + 冷却检查 + maxUses 检查 + scheduler 冷却重置）
  async use<T>(id: SkillId, executor: () => T | Promise<T>): Promise<T>

  // 查询
  get(id: SkillId): DaoSkillInstance | undefined
  listAll(): ReadonlyArray<DaoSkillInstance>
  listByState(state: SkillState): ReadonlyArray<DaoSkillInstance>
  score(id: SkillId): DaoSkillScore        // 熟练度/频率/成功率/综合评分
  rank(limit?: number): ReadonlyArray<DaoSkillScore>
  combine(skillIds: readonly SkillId[]): readonly SkillId[] | null  // 组合验证（无环+冷却阈值）
  events(limit?: number): ReadonlyArray<SkillEventRecord>

  // Getters
  get isAttached(): boolean
  get scheduler(): DaoUniverseScheduler
  get registry(): DaoSkillRegistry
}
```

## 评分公式（与 DaoSkillScorer 一致）

```
proficiency = min(1, useCount / (maxUses || 100))
frequency   = totalUses / hours（自首次使用到最后使用，hours=0时取totalUses）
successRate = successCount / totalUses（无数据时=1）
overallScore= proficiency*40 + successRate*30 + min(frequency*10, 30)
```

## 实现要点

### `use()` 冷却重置（替代 setTimeout）

```typescript
async use<T>(id, executor): Promise<T> {
  // 1. validate state + cooldown + maxUses
  // 2. result = await executor()
  // 3. registry.incrementUseCount(id, now)
  // 4. _recordUsage(id, true)
  // 5. if cooldown > 0:
  //      registry.updateState(id, 'cooling')
  //      this._scheduler.schedule(() => this._clearCooling(id), cooldown)
  // 6. push event 'used'
  // 7. return result
  // on error: _recordUsage(id, false), re-throw
}
```

### `_sweepCooling()` 心跳扫描

```typescript
private _sweepCooling(): void {
  const now = Date.now();
  for (const inst of this._registry.listByState('cooling')) {
    const cooldown = inst.definition.cooldown ?? 0;
    if (inst.lastUsedAt != null && now - inst.lastUsedAt >= cooldown) {
      this._clearCooling(inst.definition.id);
    }
  }
}
```

## 文件变更清单

| 文件 | 操作 |
|------|------|
| `retrospectives/2026-04-16-daomind-v2.12.0.md` | 新建（v2.12.0 复盘） |
| `packages/daoCollective/src/universe-skills.ts` | 新建 |
| `packages/daoCollective/package.json` | 添加 `@daomind/skills: workspace:^` |
| `packages/daoCollective/tsconfig.json` | 添加 `../daoSkilLs` 引用 |
| `packages/daoCollective/src/index.ts` | 导出 DaoUniverseSkills + SkillEventRecord + @daomind/skills 再导出 |
| `packages/daoCollective/src/__tests__/universe-skills.test.ts` | 新建（~30 测试） |

## 测试计划（~30 tests）

| 分组 | 数量 | 内容 |
|------|------|------|
| 构建 | 5 | construct / isAttached=false / scheduler getter / registry getter / pending=0 |
| attach/detach | 4 | attach→true / detach→false / 幂等attach / 幂等detach |
| register/unregister | 4 | register / 重复注册报错 / unregister / get() |
| activate/deactivate | 5 | activate latent→active / deps未满足→false / deactivate→latent / scheduleActivation返回taskId / scheduleActivation实际激活 |
| use() | 5 | 基本use / 非active状态报错 / maxUses耗尽 / 冷却中报错 / 失败记录error |
| Clock驱动生命周期 | 3 | 手动tick→sweepCooling冷却恢复 / attach后tick自动扫描 / detach后不再扫描 |
| 评分/组合/事件 | 4 | score() / rank() / combine() / events(limit) |
| E2E | 3 | 全栈 Universe→Scheduler→Skills / 与Feedback共存 / @daomind/collective导入 |

## 验证步骤

```bash
pnpm install
npx tsc --build packages/daoCollective/tsconfig.json  # 无 TS 错误
npx jest packages/daoCollective/src/__tests__/universe-skills.test.ts --no-coverage  # 30/30
npx jest --no-coverage  # 全量 ≥555 tests
pnpm -r run build  # 全量 Done
```

## Git 操作

```bash
git add -A
git commit -m "feat(skills): v2.13.0 — DaoUniverseSkills（daoSkilLs × DaoUniverseScheduler）..."
git tag -a v2.13.0 -m "release: v2.13.0 — DaoUniverseSkills"
git push github main:main && git push github v2.13.0
git push origin main && git push origin v2.13.0
```
