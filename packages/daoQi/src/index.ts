/**
 * 统一导出
 * 帛书《道德经》乙本·四十二章："万物负阴而抱阳，中气以为和"
 * 帛书二十五章："人法地，地法天，天法道，道法自然"
 * 三才（天/地/人）× 中气调和 四维传输基础设施 —— 道宇宙之生命线
 */

export type { DaoMessagePriority, DaoEncoding, DaoMessageHeader, DaoMessageBody, DaoMessage } from './types/message.js';
export type { QiChannelType, ZhongQiChannelType, QiDirection, QiChannelMeta } from './types/channel.js';
export type { BackpressureConfig } from './backpressure.js';
export { DaoSerializer } from './codec/serializer.js';
export { DaoRouter } from './router.js';
export { DaoSigner } from './signer.js';
export { DaoBackpressure } from './backpressure.js';
export { HunyuanBus } from './hunyuan.js';
export { TianQiChannel, DAO_ZHI, TIAN_MING, TIAN_SHI, TIAN_JI } from './channels/tian-qi.js';
export { DiQiChannel, DI_MAI, DI_XIANG, DI_YI, DI_GEN } from './channels/di-qi.js';
export { RenQiChannel, REN_YAN, REN_XIN, REN_YUE } from './channels/ren-qi.js';
export {
  ChongQiRegulator,
  CHONG_QI_CHANNEL,
  daoCreateChongQiRegulator,
} from './channels/chong-qi.js';
export type {
  ChongQiSignal,
  YinYangPair,
  ChongQiResult,
} from './channels/chong-qi.js';
