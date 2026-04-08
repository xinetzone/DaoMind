/**
 * 通道类型定义
 * 帛书《道德经》乙本·四十二章："万物负阴而抱阳，冲气以为和"
 * 天地人三才通道 + 冲气平衡通道，构成完整的传输网络
 */

/** 气通道类型 */
export type QiChannelType = 'tian' | 'di' | 'ren' | 'chong';

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
