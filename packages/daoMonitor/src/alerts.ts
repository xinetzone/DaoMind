import type { QiChannelType, MeridianAlert } from './types.js';

export interface AlertRule {
  readonly condition: (metrics: {
    rate: number;
    latency: number;
    errorRate: number;
  }) => boolean;
  readonly severity: MeridianAlert['severity'];
  readonly reason: MeridianAlert['reason'];
  readonly messageTemplate: string;
}

const DEFAULT_RULES: ReadonlyArray<AlertRule> = [
  {
    condition: (m) => m.rate > 5000,
    severity: 'critical',
    reason: 'congestion',
    messageTemplate: '通道严重拥塞：消息速率 {rate} msg/s 超过阈值 5000',
  },
  {
    condition: (m) => m.rate > 1000,
    severity: 'warning',
    reason: 'congestion',
    messageTemplate: '通道拥塞预警：消息速率 {rate} msg/s 超过阈值 1000',
  },
  {
    condition: (_m) => false,
    severity: 'warning',
    reason: 'disconnection',
    messageTemplate: '通道断连：{source} → {target} 连续 30s 无消息',
  },
  {
    condition: (m) => m.latency > 10000,
    severity: 'critical',
    reason: 'latency_spike',
    messageTemplate: '延迟严重尖峰：P99 延迟 {latency}ms 超过平均 10 倍',
  },
  {
    condition: (m) => m.latency > 5000,
    severity: 'warning',
    reason: 'latency_spike',
    messageTemplate: '延迟尖峰：P99 延迟 {latency}ms 超过平均 5 倍',
  },
  {
    condition: (m) => m.errorRate > 0.2,
    severity: 'critical',
    reason: 'error_surge',
    messageTemplate: '错误率激增：错误率 {(errorRate * 100).toFixed(1)}% 超过 20%',
  },
  {
    condition: (m) => m.errorRate > 0.05,
    severity: 'warning',
    reason: 'error_surge',
    messageTemplate: '错误率上升：错误率 {(errorRate * 100).toFixed(1)}% 超过 5%',
  },
];

let alertIdCounter = 0;

export class DaoAlertEngine {
  private rules: AlertRule[] = [...DEFAULT_RULES];
  private alerts = new Map<string, MeridianAlert>();
  private lastActivity = new Map<string, number>();

  check(
    channelType: QiChannelType,
    source: string,
    target: string,
    metrics: { rate: number; latency: number; errorRate: number },
  ): MeridianAlert | null {
    const key = `${channelType}:${source}->${target}`;
    this.lastActivity.set(key, Date.now());

    for (const rule of this.rules) {
      if (rule.condition(metrics)) {
        const id = `alert_${++alertIdCounter}_${Date.now()}`;
        const description = rule.messageTemplate
          .replace('{rate}', String(metrics.rate))
          .replace('{latency}', String(metrics.latency))
          .replace('{errorRate}', String(metrics.errorRate))
          .replace('{source}', source)
          .replace('{target}', target);
        const alert: MeridianAlert = {
          id,
          severity: rule.severity,
          channelType,
          affectedNodes: [source, target],
          reason: rule.reason,
          description,
          detectedAt: Date.now(),
        };
        this.alerts.set(id, alert);
        return alert;
      }
    }
    return null;
  }

  getActiveAlerts(): ReadonlyArray<MeridianAlert> {
    return Array.from(this.alerts.values()).filter((a) => !a.resolvedAt);
  }

  acknowledge(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolvedAt) {
      this.alerts.set(alertId, { ...alert });
    }
  }

  resolve(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      this.alerts.set(alertId, { ...alert, resolvedAt: Date.now() });
    }
  }

  setRules(rules: ReadonlyArray<AlertRule>): void {
    this.rules = [...rules];
  }
}
