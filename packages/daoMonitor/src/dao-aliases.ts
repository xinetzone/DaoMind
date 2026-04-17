/**
 * dao 前缀类型别名 — 命名规范对齐
 * 帛书依据：「道可道，非常名」— 以道为名，体现自然本性
 */
import type {
  QiChannelType,
  HeatmapPoint,
  FlowVector,
  YinYangGauge,
  MeridianAlert,
  QiDiagnosis,
  MonitorSnapshot,
} from './types.js';
import type { AlertRule } from './alerts.js';

/** 气通道类型 dao 前缀别名 */
export type DaoMonitorQiChannelType = QiChannelType;
/** 热力图点 dao 前缀别名 */
export type DaoHeatmapPoint = HeatmapPoint;
/** 流向量 dao 前缀别名（flow — 道的流动性） */
export type DaoFlowVector = FlowVector;
/** 阴阳仪表 dao 前缀别名 */
export type DaoYinYangGauge = YinYangGauge;
/** 经络警报 dao 前缀别名 */
export type DaoMeridianAlert = MeridianAlert;
/** 气诊断 dao 前缀别名 */
export type DaoQiDiagnosis = QiDiagnosis;
/** 监控快照 dao 前缀别名 */
export type DaoMonitorSnapshot = MonitorSnapshot;
/** 警报规则 dao 前缀别名 */
export type DaoAlertRule = AlertRule;
