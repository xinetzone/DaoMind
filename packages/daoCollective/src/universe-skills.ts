/** DaoUniverseSkills — 道宇宙技能生命周期管理
 * 帛书依据："藏器于身，待时而动"（系辞传）
 *           "君子藏器于身，待时而动，何不利之有"（系辞传）
 *
 * 架构：DaoUniverseScheduler → DaoUniverseSkills
 *       Clock.onTick() → _sweepCooling()  （冷却态心跳扫描）
 *       scheduler.schedule()              （延迟激活 + 冷却重置）
 *
 *   DaoUniverse
 *      └── DaoUniverseMonitor
 *              └── DaoUniverseClock
 *                      └── DaoUniverseScheduler
 *                              └── DaoUniverseSkills  ← 时序驱动技能生命周期
 */

import { DaoSkillRegistry } from '@daomind/skills';
import type { SkillId, SkillState, DaoSkillDefinition, DaoSkillInstance, DaoSkillScore } from '@daomind/skills';
import type { DaoUniverseScheduler } from './universe-scheduler';

const MAX_EVENTS = 200;
const DEFAULT_COOLDOWN_THRESHOLD = 30_000;

/** 技能事件记录 */
export interface SkillEventRecord {
  readonly skillId: SkillId;
  readonly event: 'activated' | 'deactivated' | 'used' | 'cooled' | 'depleted';
  readonly timestamp: number;
}

interface UsageStats {
  totalUses:    number;
  successCount: number;
  firstUseAt?:  number;
  lastUseAt?:   number;
}

export class DaoUniverseSkills {
  private readonly _registry: DaoSkillRegistry;
  private readonly _stats   = new Map<SkillId, UsageStats>();
  private readonly _combos  = new Set<string>();
  private readonly _events  : SkillEventRecord[] = [];
  private _unsubscribe?: () => void;

  /** 组合冷却阈值（ms），超过此值组合将被拒绝 */
  readonly cooldownThreshold: number;

  constructor(
    private readonly _scheduler: DaoUniverseScheduler,
    cooldownThreshold = DEFAULT_COOLDOWN_THRESHOLD,
  ) {
    this._registry       = new DaoSkillRegistry();
    this.cooldownThreshold = cooldownThreshold;
  }

  // ── 生命周期订阅 ──────────────────────────────────────────────────────────

  /**
   * attach — 订阅 Clock.onTick() → _sweepCooling()（幂等）
   */
  attach(): void {
    if (this._unsubscribe) return;
    this._unsubscribe = this._scheduler.clock.onTick(() => {
      this._sweepCooling();
    });
  }

  /**
   * detach — 取消订阅（幂等）
   */
  detach(): void {
    if (!this._unsubscribe) return;
    this._unsubscribe();
    this._unsubscribe = undefined;
  }

  // ── 技能管理 ──────────────────────────────────────────────────────────────

  /**
   * register — 注册技能（初始状态 latent）
   */
  register(def: DaoSkillDefinition): void {
    this._registry.register(def);
  }

  /**
   * unregister — 注销技能
   */
  unregister(id: SkillId): boolean {
    return this._registry.unregister(id);
  }

  // ── 生命周期操作 ──────────────────────────────────────────────────────────

  /**
   * activate — latent → active（检查依赖，满足则激活）
   * @returns true 若成功激活
   */
  async activate(id: SkillId): Promise<boolean> {
    const instance = this._registry.get(id);
    if (!instance) return false;
    if (instance.state === 'active') return true;
    if (instance.state === 'activating') return false;

    const deps = instance.definition.dependencies;
    if (deps && deps.length > 0) {
      for (const depId of deps) {
        const dep = this._registry.get(depId);
        if (!dep || dep.state !== 'active') return false;
      }
    }

    this._registry.updateState(id, 'activating');
    this._registry.setActivatedAt(id, Date.now());
    this._registry.updateState(id, 'active');
    this._pushEvent({ skillId: id, event: 'activated', timestamp: Date.now() });
    return true;
  }

  /**
   * deactivate — active/cooling → latent
   */
  async deactivate(id: SkillId): Promise<void> {
    const instance = this._registry.get(id);
    if (!instance || instance.state === 'latent') return;
    this._registry.updateState(id, 'latent');
    this._pushEvent({ skillId: id, event: 'deactivated', timestamp: Date.now() });
  }

  /**
   * scheduleActivation — 在 delayMs 毫秒后激活技能（通过 Scheduler）
   * @returns taskId
   */
  scheduleActivation(id: SkillId, delayMs = 0): string {
    return this._scheduler.schedule(() => this.activate(id), delayMs);
  }

  // ── 技能使用 ──────────────────────────────────────────────────────────────

  /**
   * use — 执行技能（状态检查 + 冷却检查 + maxUses 检查 + 冷却重置）
   * 冷却重置通过 scheduler.schedule() 实现，时序统一由 Scheduler 管理
   */
  async use<T>(id: SkillId, executor: () => T | Promise<T>): Promise<T> {
    const instance = this._registry.get(id);
    if (!instance) {
      throw new Error(`[DaoUniverseSkills] 技能不存在: ${id}`);
    }
    if (instance.state !== 'active') {
      throw new Error(`[DaoUniverseSkills] 技能不可用 (${instance.state}): ${id}`);
    }

    const now      = Date.now();
    const cooldown = instance.definition.cooldown ?? 0;
    if (cooldown > 0 && instance.lastUsedAt != null) {
      const elapsed = now - instance.lastUsedAt;
      if (elapsed < cooldown) {
        throw new Error(`[DaoUniverseSkills] 冷却中，剩余 ${cooldown - elapsed}ms: ${id}`);
      }
    }

    const maxUses = instance.definition.maxUses;
    if (maxUses != null && maxUses !== Infinity && instance.useCount >= maxUses) {
      this._registry.updateState(id, 'depleted');
      this._pushEvent({ skillId: id, event: 'depleted', timestamp: now });
      throw new Error(`[DaoUniverseSkills] 技能已耗尽: ${id}`);
    }

    try {
      const result = await Promise.resolve(executor());
      this._registry.incrementUseCount(id, now);
      this._recordUsage(id, true);
      if (cooldown > 0) {
        this._registry.updateState(id, 'cooling');
        // 用 Scheduler 替代 setTimeout，时序由 DaoUniverseScheduler 统一管理
        this._scheduler.schedule(() => this._clearCooling(id), cooldown);
      }
      this._pushEvent({ skillId: id, event: 'used', timestamp: now });
      return result;
    } catch (err) {
      this._recordUsage(id, false);
      throw err;
    }
  }

  // ── 查询 ──────────────────────────────────────────────────────────────────

  get(id: SkillId): DaoSkillInstance | undefined {
    return this._registry.get(id);
  }

  listAll(): ReadonlyArray<DaoSkillInstance> {
    return this._registry.listAll();
  }

  listByState(state: SkillState): ReadonlyArray<DaoSkillInstance> {
    return this._registry.listByState(state);
  }

  /**
   * score — 计算技能综合评分（与 DaoSkillScorer 公式一致）
   */
  score(id: SkillId): DaoSkillScore {
    const instance = this._registry.get(id);
    if (!instance) throw new Error(`[DaoUniverseSkills] 技能不存在: ${id}`);

    const stat       = this._stats.get(id) ?? { totalUses: 0, successCount: 0 };
    const proficiency = this._calcProficiency(instance);
    const frequency   = this._calcFrequency(stat);
    const successRate = stat.totalUses > 0 ? stat.successCount / stat.totalUses : 1;
    const overallScore = proficiency * 40 + successRate * 30 + Math.min(frequency * 10, 30);

    return { skillId: id, proficiency, frequency, successRate, overallScore };
  }

  /**
   * rank — 按综合评分排名
   */
  rank(limit?: number): ReadonlyArray<DaoSkillScore> {
    const scores = this._registry.listAll().map((inst) => this.score(inst.definition.id));
    scores.sort((a, b) => b.overallScore - a.overallScore);
    return limit != null ? scores.slice(0, limit) : scores;
  }

  /**
   * combine — 验证技能组合（无环依赖 + 冷却总和 ≤ 阈值）
   * @returns 去重后的技能 ID 列表，验证失败返回 null
   */
  combine(skillIds: readonly SkillId[]): readonly SkillId[] | null {
    if (skillIds.length < 2) return null;

    const uniqueIds = [...new Set(skillIds)];
    const instances: DaoSkillInstance[] = [];
    for (const id of uniqueIds) {
      const inst = this._registry.get(id);
      if (!inst) return null;
      instances.push(inst);
    }

    if (this._hasCyclicDependency(instances)) return null;

    let totalCooldown = 0;
    for (const inst of instances) {
      totalCooldown += inst.definition.cooldown ?? 0;
    }
    if (totalCooldown > this.cooldownThreshold) return null;

    const key = [...uniqueIds].sort().join('+');
    this._combos.add(key);
    return uniqueIds;
  }

  /**
   * combinations — 已验证的组合列表
   */
  combinations(): ReadonlyArray<readonly SkillId[]> {
    return Array.from(this._combos).map((k) => k.split('+') as SkillId[]);
  }

  /**
   * events — 历史技能事件记录
   */
  events(limit?: number): ReadonlyArray<SkillEventRecord> {
    if (!limit) return [...this._events];
    return this._events.slice(-limit);
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get isAttached(): boolean { return !!this._unsubscribe; }
  get scheduler(): DaoUniverseScheduler { return this._scheduler; }
  get registry(): DaoSkillRegistry { return this._registry; }

  // ── Private ───────────────────────────────────────────────────────────────

  /** 心跳扫描：冷却到期的技能 → active */
  private _sweepCooling(): void {
    const now = Date.now();
    for (const inst of this._registry.listByState('cooling')) {
      const cooldown = inst.definition.cooldown ?? 0;
      if (inst.lastUsedAt != null && now - inst.lastUsedAt >= cooldown) {
        this._clearCooling(inst.definition.id);
      }
    }
  }

  private _clearCooling(id: SkillId): void {
    const current = this._registry.get(id);
    if (current && current.state === 'cooling') {
      this._registry.updateState(id, 'active');
      this._pushEvent({ skillId: id, event: 'cooled', timestamp: Date.now() });
    }
  }

  private _recordUsage(id: SkillId, success: boolean): void {
    let stat = this._stats.get(id);
    if (!stat) {
      stat = { totalUses: 0, successCount: 0 };
      this._stats.set(id, stat);
    }
    stat.totalUses++;
    if (success) stat.successCount++;
    if (stat.firstUseAt == null) stat.firstUseAt = Date.now();
    stat.lastUseAt = Date.now();
  }

  private _calcProficiency(inst: DaoSkillInstance): number {
    const max = inst.definition.maxUses;
    const ratio = max != null && max !== Infinity
      ? inst.useCount / max
      : inst.useCount / 100;
    return Math.min(1, ratio);
  }

  private _calcFrequency(stat: UsageStats): number {
    if (stat.totalUses === 0 || stat.firstUseAt == null || stat.lastUseAt == null) return 0;
    const hours = (stat.lastUseAt - stat.firstUseAt) / (1000 * 60 * 60);
    if (hours <= 0) return stat.totalUses;
    return stat.totalUses / hours;
  }

  private _hasCyclicDependency(instances: ReadonlyArray<DaoSkillInstance>): boolean {
    const visited  = new Set<string>();
    const visiting = new Set<string>();

    const dfs = (id: string): boolean => {
      if (visiting.has(id)) return true;
      if (visited.has(id)) return false;
      visiting.add(id);
      const inst = instances.find((i) => i.definition.id === id);
      if (inst?.definition.dependencies) {
        for (const dep of inst.definition.dependencies) {
          if (instances.some((i) => i.definition.id === dep) && dfs(dep)) return true;
        }
      }
      visiting.delete(id);
      visited.add(id);
      return false;
    };

    for (const inst of instances) {
      visited.clear();
      visiting.clear();
      if (dfs(inst.definition.id)) return true;
    }
    return false;
  }

  private _pushEvent(record: SkillEventRecord): void {
    this._events.push(record);
    if (this._events.length > MAX_EVENTS) this._events.shift();
  }
}
