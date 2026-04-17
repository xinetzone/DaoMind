/**
 * 通道类型定义
 *
 * 哲学基础（两章合参）：
 *   · 天/地/人 — 三才，源自《道德经》二十五章帛书：
 *       "人法地，地法天，天法道，道法自然"
 *       天气（下行/阳），地气（上行/阴），人气（横向/居中）
 *   · 中气（'chong'）— 调和机制，源自《道德经》四十二章帛书：
 *       "万物负阴而抱阳，中气以为和"
 *       中气者，居于阴阳之间，自然交融而成和；非"激荡相搏"之冲气。
 *
 * 架构说明：
 *   · 天/地/人 = 三才路由通道（方向性路由：下行 / 上行 / 横向）
 *   · 中气     = 调和信号通道（非方向性，携带阴阳平衡修正信号）
 *   这是"三才 × 中气"四维通信机制，并非传统"四气"并列。
 *
 * 标识符说明：
 *   'chong' 保留通行本拼音字形（API 兼容），哲学内涵为帛书"中气"（zhōng qì）。
 *   如需强调帛书对齐，可使用别名 ZhongQiChannel（见下方类型别名）。
 */

/** 气通道类型
 *
 * - `'tian'`  天气通道：下行路由，承载全局指令（道德经二十五章 天大）
 * - `'di'`    地气通道：上行路由，承载状态上报（道德经二十五章 地大）
 * - `'ren'`   人气通道：横向路由，承载同级协作（道德经二十五章 人亦大）
 * - `'chong'` 中气通道：调和信号，承载阴阳平衡修正（帛书四十二章 中气以为和）
 */
export type QiChannelType = 'tian' | 'di' | 'ren' | 'chong';

/** 中气通道标识符（帛书对齐别名，与 'chong' 完全等价） */
export type ZhongQiChannelType = 'chong';

/** 通道方向 */
export type QiDirection = 'downstream' | 'upstream' | 'lateral' | 'balancing';

/**
 * 通道元信息
 * 描述一条气通道的属性：类型、方向、起止节点
 */
export interface QiChannelMeta {
  readonly type: QiChannelType;
  readonly direction: QiDirection;
  readonly sourceNode: string;
  readonly targetNode: string;
}
