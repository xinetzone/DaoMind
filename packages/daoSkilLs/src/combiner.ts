// 帛书依据："三生万物"（德经·四十二章）
// 设计原则：技能组合器将多个技能融合为协同能力
// 组合须无循环依赖、总冷却可控

import type { SkillId, DaoSkillInstance } from './types.js';
import { daoSkillRegistry } from './skill-registry.js';

const DEFAULT_COOLDOWN_THRESHOLD = 30000;

class DaoSkillCombiner {
  private readonly combinations = new Set<string>();
  private cooldownThreshold: number;

  constructor(cooldownThreshold?: number) {
    this.cooldownThreshold = cooldownThreshold ?? DEFAULT_COOLDOWN_THRESHOLD;
  }

  combine(skillIds: readonly SkillId[]): readonly SkillId[] | null {
    if (skillIds.length < 2) return null;

    const uniqueIds = [...new Set(skillIds)];
    const instances: DaoSkillInstance[] = [];
    for (const id of uniqueIds) {
      const inst = daoSkillRegistry.get(id);
      if (!inst) return null;
      instances.push(inst);
    }

    if (this.hasCyclicDependency(instances)) return null;

    let totalCooldown = 0;
    for (const inst of instances) {
      totalCooldown += inst.definition.cooldown ?? 0;
    }
    if (totalCooldown > this.cooldownThreshold) return null;

    const key = [...uniqueIds].sort().join('+');
    this.combinations.add(key);
    return uniqueIds;
  }

  getCombinations(): ReadonlyArray<readonly SkillId[]> {
    const result: SkillId[][] = [];
    for (const combo of this.combinations) {
      result.push(combo.split('+') as SkillId[]);
    }
    return result;
  }

  private hasCyclicDependency(instances: ReadonlyArray<DaoSkillInstance>): boolean {
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const dfs = (id: string): boolean => {
      if (visiting.has(id)) return true;
      if (visited.has(id)) return false;
      visiting.add(id);

      const instance = instances.find((i) => i.definition.id === id);
      if (instance?.definition.dependencies) {
        for (const dep of instance.definition.dependencies) {
          if (instances.some((i) => i.definition.id === dep) && dfs(dep)) {
            return true;
          }
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
}

export const daoSkillCombiner = new DaoSkillCombiner();
export { DaoSkillCombiner };
