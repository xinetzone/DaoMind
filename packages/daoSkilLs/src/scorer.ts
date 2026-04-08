// 帛书依据："知者不博，博者不知"（德经·八十一章）
// 设计原则：技能评分器量化技能的熟练程度与效用
// 不以多取胜，而以精深为贵

import type { SkillId, DaoSkillScore, DaoSkillInstance } from './types.js';
import { daoSkillRegistry } from './skill-registry.js';

interface SkillUsageStats {
  totalUses: number;
  successCount: number;
  firstUseAt?: number;
  lastUseAt?: number;
}

class DaoSkillScorer {
  private readonly stats = new Map<SkillId, SkillUsageStats>();

  recordUsage(skillId: SkillId, success: boolean): void {
    let stat = this.stats.get(skillId);
    if (!stat) {
      stat = { totalUses: 0, successCount: 0 };
      this.stats.set(skillId, stat);
    }
    stat.totalUses++;
    if (success) stat.successCount++;
    if (stat.firstUseAt == null) stat.firstUseAt = Date.now();
    stat.lastUseAt = Date.now();
  }

  score(id: SkillId): DaoSkillScore {
    const instance = daoSkillRegistry.get(id);
    if (!instance) {
      throw new Error(`[daoSkills] 技能不存在: ${id}`);
    }

    const stat = this.stats.get(id) ?? { totalUses: 0, successCount: 0 };
    const proficiency = this.calcProficiency(instance);
    const frequency = this.calcFrequency(stat);
    const successRate = stat.totalUses > 0 ? stat.successCount / stat.totalUses : 1;
    const overallScore = proficiency * 40 + successRate * 30 + Math.min(frequency * 10, 30);

    return {
      skillId: id,
      proficiency,
      frequency,
      successRate,
      overallScore,
    };
  }

  scoreAll(): ReadonlyArray<DaoSkillScore> {
    const instances = daoSkillRegistry.listAll();
    return instances.map((inst) => this.score(inst.definition.id));
  }

  rank(limit?: number): ReadonlyArray<DaoSkillScore> {
    const scores = [...this.scoreAll()].sort((a, b) => b.overallScore - a.overallScore);
    if (limit != null && limit < scores.length) {
      return scores.slice(0, limit);
    }
    return scores;
  }

  private calcProficiency(instance: DaoSkillInstance): number {
    const ratio = instance.definition.maxUses
      ? instance.useCount / (instance.definition.maxUses === Infinity ? 1 : instance.definition.maxUses)
      : instance.useCount / 100;
    return Math.min(1, ratio);
  }

  private calcFrequency(stat: SkillUsageStats): number {
    if (stat.totalUses === 0 || stat.firstUseAt == null || stat.lastUseAt == null) return 0;
    const hours = (stat.lastUseAt - stat.firstUseAt) / (1000 * 60 * 60);
    if (hours <= 0) return stat.totalUses;
    return stat.totalUses / hours;
  }
}

export const daoSkillScorer = new DaoSkillScorer();
export { DaoSkillScorer };
