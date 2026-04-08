// 帛书依据："动而不括，是用不窮"（系辞传）
// 设计原则：技能激活器管理技能的生命周期转换
// 从潜能态到活跃态的跃迁，需满足依赖条件方可完成

import type { SkillId, SkillState, DaoSkillInstance } from './types.js';
import { daoSkillRegistry } from './skill-registry.js';

class DaoSkillActivator {

  async activate(id: SkillId): Promise<boolean> {
    const instance = daoSkillRegistry.get(id);
    if (!instance) return false;
    if (instance.state === 'active') return true;
    if (instance.state === 'activating') return false;

    const deps = instance.definition.dependencies;
    if (deps && deps.length > 0) {
      for (const depId of deps) {
        const depInstance = daoSkillRegistry.get(depId);
        if (!depInstance || depInstance.state !== 'active') {
          return false;
        }
      }
    }

    daoSkillRegistry.updateState(id, 'activating');
    daoSkillRegistry.setActivatedAt(id, Date.now());
    daoSkillRegistry.updateState(id, 'active');
    return true;
  }

  async deactivate(id: SkillId): Promise<void> {
    const instance = daoSkillRegistry.get(id);
    if (!instance || instance.state === 'latent') return;
    daoSkillRegistry.updateState(id, 'latent');
  }

  async use<T>(id: SkillId, executor: () => T | Promise<T>): Promise<T> {
    const instance = daoSkillRegistry.get(id);
    if (!instance) {
      throw new Error(`[daoSkills] 技能不存在: ${id}`);
    }
    if (instance.state !== 'active') {
      throw new Error(`[daoSkills] 技能不可用 (${instance.state}): ${id}`);
    }

    const now = Date.now();
    const cooldown = instance.definition.cooldown ?? 0;
    if (cooldown > 0 && instance.lastUsedAt != null) {
      const elapsed = now - instance.lastUsedAt;
      if (elapsed < cooldown) {
        throw new Error(`[daoSkills] 技能冷却中，剩余 ${cooldown - elapsed}ms: ${id}`);
      }
    }

    const maxUses = instance.definition.maxUses;
    if (maxUses != null && maxUses !== Infinity && instance.useCount >= maxUses) {
      daoSkillRegistry.updateState(id, 'depleted');
      throw new Error(`[daoSkills] 技能已耗尽: ${id}`);
    }

    try {
      const result = await executor();
      daoSkillRegistry.incrementUseCount(id, now);
      if (cooldown > 0) {
        daoSkillRegistry.updateState(id, 'cooling');
        setTimeout(() => {
          const current = daoSkillRegistry.get(id);
          if (current && current.state === 'cooling') {
            daoSkillRegistry.updateState(id, 'active');
          }
        }, cooldown);
      }
      return result;
    } catch (error) {
      throw error;
    }
  }
}

export const daoSkillActivator = new DaoSkillActivator();
export { DaoSkillActivator };
