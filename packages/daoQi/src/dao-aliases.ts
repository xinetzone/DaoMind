/**
 * dao 前缀类型/常量别名 — 命名规范对齐
 * 帛书依据：「道可道，非常名」— 以道为名，体现自然本性
 */
import type { QiChannelType } from './types/channel.js';
import type { BackpressureConfig } from './backpressure.js';
import type { ChongQiSignal, YinYangPair, ChongQiResult } from './channels/chong-qi.js';
import {
  CHONG_QI_CHANNEL,
} from './channels/chong-qi.js';
import {
  DI_MAI,
  DI_XIANG,
  DI_YI,
  DI_GEN,
} from './channels/di-qi.js';
import {
  REN_YAN,
  REN_XIN,
  REN_YUE,
} from './channels/ren-qi.js';
import {
  DAO_ZHI,
  TIAN_MING,
  TIAN_SHI,
  TIAN_JI,
} from './channels/tian-qi.js';

// ── 类型别名 ──────────────────────────────────────────────
/** 气通道类型 dao 前缀别名 */
export type DaoQiChannelType = QiChannelType;
/** 背压配置 dao 前缀别名 */
export type DaoBackpressureConfig = BackpressureConfig;
/** 冲气信号 dao 前缀别名 */
export type DaoChongQiSignal = ChongQiSignal;
/** 阴阳对 dao 前缀别名 */
export type DaoYinYangPair = YinYangPair;
/** 冲气结果 dao 前缀别名 */
export type DaoChongQiResult = ChongQiResult;

// ── 通道标识常量别名（dao 小写前缀）─────────────────────────
/** 冲气通道标识 */
export const daoChongQiChannel = CHONG_QI_CHANNEL;
/** 地脉通道标识 */
export const daoDiMai = DI_MAI;
/** 地象通道标识 */
export const daoDiXiang = DI_XIANG;
/** 地义通道标识 */
export const daoDiYi = DI_YI;
/** 地根通道标识 */
export const daoDiGen = DI_GEN;
/** 人言通道标识 */
export const daoRenYan = REN_YAN;
/** 人心通道标识 */
export const daoRenXin = REN_XIN;
/** 人月通道标识 */
export const daoRenYue = REN_YUE;
/** 道旨通道标识 */
export const daoDaoZhi = DAO_ZHI;
/** 天命通道标识 */
export const daoTianMing = TIAN_MING;
/** 天时通道标识 */
export const daoTianShi = TIAN_SHI;
/** 天机通道标识 */
export const daoTianJi = TIAN_JI;
