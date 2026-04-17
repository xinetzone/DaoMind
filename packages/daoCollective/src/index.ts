/** @daomind/collective — 道宇宙根节点（无为协调者）
 * 帛书依据："道常无为而无不为"（乙本·三十七章）
 * 设计原则：根节点自身保持精简（自组织 self-organizing），
 *           各层通过 observer / subscribe / listen 事件驱动模式协调，
 *           根节点协调而不控制，复杂逻辑下沉至各子模块。 */

export * from './exports/foundation';   // 无名 + 有名基础层
export * from './exports/actors';       // 执行者层
export * from './exports/transport';    // 传输层
export * from './exports/operations';   // 运营层
export * from './exports/advanced';     // 高级功能层
export * from './exports/universe';     // 宇宙门面层
export * from './exports/aliases';      // dao 前缀别名 — 命名规范对齐
