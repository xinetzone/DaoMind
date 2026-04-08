/** 气通道类型 — 对应中医经络系统的四大主干 */
export type QiChannelType = 'tian' | 'di' | 'ren' | 'chong';

/** 热力图数据点 — 记录单条气通道的流量与质量指标 */
export interface HeatmapPoint {
  readonly channelType: QiChannelType;
  readonly sourceNode: string;
  readonly targetNode: string;
  readonly messageRate: number;
  readonly avgLatency: number;
  readonly errorRate: number;
  readonly timestamp: number;
}

/** 向量场数据 — 描述气在节点间的流动方向与强度 */
export interface FlowVector {
  readonly from: string;
  readonly to: string;
  readonly magnitude: number;
  readonly direction: 'downstream' | 'upstream' | 'lateral' | 'balancing';
  readonly pressure: number;
}

/** 阴阳平衡仪表读数 — 衡量对立节点的和谐程度 */
export interface YinYangGauge {
  readonly pairId: string;
  readonly yinNode: string;
  readonly yangNode: string;
  readonly yinValue: number;
  readonly yangValue: number;
  readonly ratio: number;
  readonly idealRatio: number;
  readonly status: 'balanced' | 'yin_excess' | 'yang_excess' | 'critical';
  readonly deviation: number;
  readonly timestamp: number;
}

/** 经络阻塞告警 — 当气机运行异常时触发 */
export interface MeridianAlert {
  readonly id: string;
  readonly severity: 'warning' | 'critical' | 'info';
  readonly channelType: QiChannelType;
  readonly affectedNodes: ReadonlyArray<string>;
  readonly reason: 'congestion' | 'disconnection' | 'latency_spike' | 'error_surge';
  readonly description: string;
  readonly detectedAt: number;
  readonly resolvedAt?: number;
}

/** 气虚/气盛诊断 — 判定单个节点的生命活力状态 */
export interface QiDiagnosis {
  readonly nodeId: string;
  readonly condition: 'deficient' | 'excess' | 'balanced';
  readonly incomingRate: number;
  readonly outgoingRate: number;
  readonly activityScore: number;
  readonly trend: 'rising' | 'falling' | 'stable';
  readonly recommendation: string;
  readonly timestamp: number;
}

/** 监控快照 — 某一时刻系统整体状态的完整映像 */
export interface MonitorSnapshot {
  readonly timestamp: number;
  readonly heatmaps: ReadonlyArray<HeatmapPoint>;
  readonly flowVectors: ReadonlyArray<FlowVector>;
  readonly gauges: ReadonlyArray<YinYangGauge>;
  readonly alerts: ReadonlyArray<MeridianAlert>;
  readonly diagnoses: ReadonlyArray<QiDiagnosis>;
  readonly systemHealth: number;
}
