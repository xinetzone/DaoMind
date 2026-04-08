// 帛书依据："藏器于身，待时而动"（系辞传）
// 设计原则：技能定义行动者的能力边界与行为契约
// 每个技能自注册之时起即处于"潜能态"，待机而动

/** 技能唯一标识 */
export type SkillId = string;

/** 技能状态 */
export type SkillState =
  | 'latent'       // 潜能态（已注册但未激活）
  | 'activating'   // 激活中
  | 'active'       // 活跃态（可用）
  | 'cooling'      // 冷却中
  | 'depleted';    // 耗尽

/** 技能定义 */
export interface DaoSkillDefinition {
  readonly id: SkillId;
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly cooldown?: number;     // 冷却时间(ms)，默认0
  readonly maxUses?: number;      // 最大使用次数，Infinity表示不限
  readonly dependencies?: readonly SkillId[]; // 前置技能
}

/** 技能实例 */
export interface DaoSkillInstance {
  readonly definition: DaoSkillDefinition;
  readonly state: SkillState;
  readonly useCount: number;
  readonly lastUsedAt?: number;
  readonly activatedAt?: number;
}

/** 技能评分 */
export interface DaoSkillScore {
  readonly skillId: SkillId;
  readonly proficiency: number;    // 熟练度 0-1
  readonly frequency: number;       // 使用频率（次/小时）
  readonly successRate: number;    // 成功率 0-1
  readonly overallScore: number;    // 综合评分 0-100
}
