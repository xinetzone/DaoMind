import type {
  FeedbackSource,
  SignalLevel,
  SignalCategory,
  DaoFeedbackSignal
} from './types.js';

/** 感知配置 — 帛书《道德经》乙本·四十章：反也者，道之动也 */
export interface PerceiveConfig {
  thresholds: {
    performance: { responseTimeMultiplier: number };
    error: { ratePercent: number; durationMs: number };
    resource: { usagePercent: number };
    behavior: { distributionShift: number };
    demand: { uncoveredTriggersPerHour: number };
  };
}

const DEFAULT_CONFIG: PerceiveConfig = {
  thresholds: {
    performance: { responseTimeMultiplier: 2 },
    error: { ratePercent: 5, durationMs: 60000 },
    resource: { usagePercent: 85 },
    behavior: { distributionShift: 30 },
    demand: { uncoveredTriggersPerHour: 10 }
  }
};

/** 阶段一：感知（Guan Zhi）— 叶节点捕获自身运行态并生成原始反馈信号 */
export class DaoPerceiver {
  private config: PerceiveConfig;

  constructor(config?: Partial<PerceiveConfig>) {
    this.config = this.mergeConfig(DEFAULT_CONFIG, config || {});
  }

  /** 捕获反馈信号 — 自动确定级别、添加时间戳 */
  capture(
    source: FeedbackSource,
    category: SignalCategory,
    metrics: Record<string, number>,
    context?: string
  ): DaoFeedbackSignal {
    const level = this.evaluateLevel(category, metrics);
    return {
      source,
      timestamp: Date.now(),
      level,
      category,
      metrics: { ...metrics },
      context
    };
  }

  /** 根据阈值规则评估信号级别 — 帛书原文：观其妙 */
  evaluateLevel(
    category: SignalCategory,
    metrics: Record<string, number>
  ): SignalLevel {
    const thresholds = this.config.thresholds;
    switch (category) {
      case 'performance': {
        const threshold = thresholds.performance;
        const responseTime = metrics.responseTime ?? 0;
        const baseline = metrics.baseline ?? 1;
        const multiplier = responseTime / Math.max(baseline, 1);
        if (multiplier >= threshold.responseTimeMultiplier * 3) return 'critical';
        if (multiplier >= threshold.responseTimeMultiplier * 2) return 'warning';
        if (multiplier >= threshold.responseTimeMultiplier) return 'info';
        return 'opportunity';
      }
      case 'error': {
        const threshold = thresholds.error;
        const rate = metrics.errorRate ?? 0;
        const duration = metrics.errorDurationMs ?? 0;
        if (rate >= threshold.ratePercent * 3 && duration >= threshold.durationMs) return 'critical';
        if (rate >= threshold.ratePercent * 2 || duration >= threshold.durationMs * 2) return 'warning';
        if (rate >= threshold.ratePercent || duration >= threshold.durationMs) return 'info';
        return 'opportunity';
      }
      case 'resource': {
        const threshold = thresholds.resource;
        const usage = metrics.usagePercent ?? 0;
        if (usage >= 98) return 'critical';
        if (usage >= threshold.usagePercent + 10) return 'warning';
        if (usage >= threshold.usagePercent) return 'info';
        return 'opportunity';
      }
      case 'behavior': {
        const threshold = thresholds.behavior;
        const shift = metrics.distributionShift ?? 0;
        if (shift >= threshold.distributionShift * 2) return 'critical';
        if (shift >= threshold.distributionShift * 1.5) return 'warning';
        if (shift >= threshold.distributionShift) return 'info';
        return 'opportunity';
      }
      case 'demand': {
        const threshold = thresholds.demand;
        const uncovered = metrics.uncoveredTriggersPerHour ?? 0;
        if (uncovered >= threshold.uncoveredTriggersPerHour * 5) return 'critical';
        if (uncovered >= threshold.uncoveredTriggersPerHour * 3) return 'warning';
        if (uncovered >= threshold.uncoveredTriggersPerHour) return 'info';
        return 'opportunity';
      }
      default:
        return 'info';
    }
  }

  /** 更新感知配置 */
  setConfig(config: Partial<PerceiveConfig>): void {
    this.config = this.mergeConfig(this.config, config);
  }

  /** 获取当前配置 */
  getConfig(): Readonly<PerceiveConfig> {
    return this.config;
  }

  private mergeConfig(base: PerceiveConfig, partial: Partial<PerceiveConfig>): PerceiveConfig {
    return {
      thresholds: {
        ...base.thresholds,
        ...(partial.thresholds || {})
      } as PerceiveConfig['thresholds']
    };
  }
}
