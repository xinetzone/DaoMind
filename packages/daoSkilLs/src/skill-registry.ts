// 帛书依据："君子藏器于身，待时而动"（系辞传）
// 设计原则：技能库为行动者提供能力存储与管理
// 新注册之技能默认处于潜能态，体现"藏器"之意

import type { SkillId, SkillState, DaoSkillDefinition, DaoSkillInstance } from './types';

class DaoSkillRegistry {
  private readonly skills = new Map<SkillId, DaoSkillInstance>();

  register(definition: DaoSkillDefinition): void {
    if (this.skills.has(definition.id)) {
      throw new Error(`[daoSkills] 技能已注册: ${definition.id}`);
    }
    const instance: DaoSkillInstance = {
      definition,
      state: 'latent',
      useCount: 0,
    };
    this.skills.set(definition.id, instance);
  }

  unregister(id: SkillId): boolean {
    return this.skills.delete(id);
  }

  get(id: SkillId): DaoSkillInstance | undefined {
    return this.skills.get(id);
  }

  listAll(): ReadonlyArray<DaoSkillInstance> {
    return Array.from(this.skills.values());
  }

  listByState(state: SkillState): ReadonlyArray<DaoSkillInstance> {
    const result: DaoSkillInstance[] = [];
    for (const skill of this.skills.values()) {
      if (skill.state === state) {
        result.push(skill);
      }
    }
    return result;
  }

  updateState(id: SkillId, state: SkillState): boolean {
    const instance = this.skills.get(id);
    if (!instance) return false;
    (instance as { state: SkillState }).state = state;
    return true;
  }

  incrementUseCount(id: SkillId, timestamp: number): boolean {
    const instance = this.skills.get(id);
    if (!instance) return false;
    (instance as { useCount: number }).useCount = instance.useCount + 1;
    (instance as { lastUsedAt?: number }).lastUsedAt = timestamp;
    return true;
  }

  setActivatedAt(id: SkillId, timestamp: number): boolean {
    const instance = this.skills.get(id);
    if (!instance) return false;
    (instance as { activatedAt?: number }).activatedAt = timestamp;
    return true;
  }

  has(id: SkillId): boolean {
    return this.skills.has(id);
  }
}

export const daoSkillRegistry = new DaoSkillRegistry();
export { DaoSkillRegistry };
