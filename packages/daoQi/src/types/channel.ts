/**
 * 通道类型定义
 * 帛书《道德经》乙本·四十二章："万物负阴而抱阳，中气以为和"
 * [注] 帛书（马王堆乙本）作"中气"；通行本（王弼）作"冲气"。
 * 天地人三才通道 + 中气调和通道，构成完整的传输网络。
 * QiChannelType 中 'chong' 标识符保留通行本字形以维持 API 兼容，
 * 其哲学内涵对应帛书"中气"（居间调和）。
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
