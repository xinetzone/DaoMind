// 帛书依据："藏器于身，待时而动"（系辞传）
// 设计原则：技能库聚合类型定义、注册器、激活器、评分器与组合器
// 为行动者提供完整的能力管理体系

export type { SkillId, SkillState, DaoSkillDefinition, DaoSkillInstance, DaoSkillScore } from './types.js';
export { daoSkillRegistry, DaoSkillRegistry } from './skill-registry.js';
export { daoSkillActivator, DaoSkillActivator } from './skill-activator.js';
export { daoSkillScorer, DaoSkillScorer } from './scorer.js';
export { daoSkillCombiner, DaoSkillCombiner } from './combiner.js';

export const daoSkills = {
  name: '@dao/skills',
  description: '技能库 — 行动者的能力集合',
}
