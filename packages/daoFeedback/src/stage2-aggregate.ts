import type {
  DaoFeedbackSignal,
  DaoAggregatedFeedback,
  CausalLink,
  SignalLevel,
  SignalCategory,
  TrendDirection
} from './types.js';

/** 信号级别权重 — 帛书《道德经》乙本·二十五章：大曰逝，逝曰远，远曰反 */
const LEVEL_WEIGHTS: Record<SignalLevel, number> = {
  critical: 4,
  warning: 3,
  info: 2,
  opportunity: 1
};

/** 因果规则类型 */
interface CausalRule {
  pattern: [SignalCategory, SignalCategory];
  result: CausalLink;
}

/** 预定义因果规则库 — 基于系统运行经验归纳 */
const DEFAULT_CAUSAL_RULES: CausalRule[] = [
  {
    pattern: ['error', 'resource'],
    result: {
      cause: 'error',
      effect: 'resource',
      confidence: 0.85,
      description: '高频错误导致资源耗尽'
    }
  },
  {
    pattern: ['resource', 'performance'],
    result: {
      cause: 'resource',
      effect: 'performance',
      confidence: 0.9,
      description: '资源瓶颈导致性能下降'
    }
  },
  {
    pattern: ['performance', 'behavior'],
    result: {
      cause: 'performance',
      effect: 'behavior',
      confidence: 0.75,
      description: '性能劣化引发用户行为异常'
    }
  },
  {
    pattern: ['demand', 'performance'],
    result: {
      cause: 'demand',
      effect: 'performance',
      confidence: 0.8,
      description: '需求激增超出系统承载能力'
    }
  },
  {
    pattern: ['error', 'behavior'],
    result: {
      cause: 'error',
      effect: 'behavior',
      confidence: 0.7,
      description: '错误频发导致用户行为偏离'
    }
  }
];

const DEFAULT_WINDOW_MS = 300000; // 默认5分钟窗口

/** 阶段二：聚合（Ju He）— Nexus 级智能聚合 */
export class DaoAggregator {
  private windowMs: number;
  private causalRules: CausalRule[];

  constructor(windowMs?: number) {
    this.windowMs = windowMs ?? DEFAULT_WINDOW_MS;
    this.causalRules = [...DEFAULT_CAUSAL_RULES];
  }

  /** 聚合信号 — 去重合并、趋势识别、因果关联、综合评分 */
  aggregate(
    signals: ReadonlyArray<DaoFeedbackSignal>,
    windowMs?: number
  ): DaoAggregatedFeedback {
    const effectiveWindow = windowMs ?? this.windowMs;
    const now = Date.now();
    const windowStart = now - effectiveWindow;

    /** 去重合并：同一 source + 同类信号保留最新 metrics */
    const deduplicated = this.deduplicateSignals(signals, windowStart);

    /** 计算综合评分 */
    const aggregateScore = this.calculateAggregateScore(deduplicated);

    /** 识别趋势 */
    const trends = this.identifyTrends(deduplicated);

    /** 匹配因果链 */
    const causalChains = this.matchCausalChains(deduplicated);

    /** 生成建议行动 */
    const recommendedAction = this.generateRecommendation(aggregateScore, causalChains);

    return {
      windowStart,
      windowEnd: now,
      signals: deduplicated,
      aggregateScore,
      trends,
      causalChains,
      recommendedAction
    };
  }

  /** 获取因果规则库 */
  getCausalRules(): ReadonlyArray<{ pattern: [SignalCategory, SignalCategory]; result: CausalLink }> {
    return this.causalRules.map(rule => ({
      pattern: rule.pattern,
      result: { ...rule.result }
    }));
  }

  /** 设置聚合窗口大小 */
  setWindowMs(ms: number): void {
    this.windowMs = ms;
  }

  /** 添加自定义因果规则 */
  addCausalRule(rule: CausalRule): void {
    this.causalRules.push(rule);
  }

  private deduplicateSignals(
    signals: ReadonlyArray<DaoFeedbackSignal>,
    windowStart: number
  ): DaoFeedbackSignal[] {
    const filtered = signals.filter(s => s.timestamp >= windowStart);
    const map = new Map<string, DaoFeedbackSignal>();

    for (const signal of filtered) {
      const key = `${signal.source}:${signal.category}`;
      const existing = map.get(key);
      if (!existing || signal.timestamp > existing.timestamp) {
        map.set(key, signal);
      }
    }

    return Array.from(map.values());
  }

  private calculateAggregateScore(signals: DaoFeedbackSignal[]): number {
    if (signals.length === 0) return 100;

    let weightedSum = 0;
    for (const signal of signals) {
      weightedSum += LEVEL_WEIGHTS[signal.level];
    }

    const maxPossibleScore = signals.length * LEVEL_WEIGHTS.critical;
    const normalizedScore = (weightedSum / Math.max(maxPossibleScore, 1)) * 100;

    return Math.max(0, Math.min(100, 100 - normalizedScore));
  }

  private identifyTrends(signals: DaoFeedbackSignal[]): Record<string, TrendDirection> {
    const trends: Record<string, TrendDirection> = {};
    const categoryGroups = new Map<SignalCategory, DaoFeedbackSignal[]>();

    for (const signal of signals) {
      const group = categoryGroups.get(signal.category) || [];
      group.push(signal);
      categoryGroups.set(signal.category, group);
    }

    for (const [category, group] of categoryGroups) {
      if (group.length < 2) {
        trends[category] = 'stable';
        continue;
      }

      const sorted = [...group].sort((a, b) => a.timestamp - b.timestamp);
      const mid = Math.floor(sorted.length / 2);
      const firstHalf = sorted.slice(0, mid);
      const secondHalf = sorted.slice(mid);

      const firstAvg = this.calculateWeightedAverage(firstHalf);
      const secondAvg = this.calculateWeightedAverage(secondHalf);

      const delta = secondAvg - firstAvg;
      const threshold = 0.15 * Math.max(Math.abs(firstAvg), 1);

      if (Math.abs(delta) < threshold) {
        trends[category] = 'stable';
      } else if (delta > 0) {
        trends[category] = 'rising';
      } else {
        trends[category] = 'falling';
      }
    }

    return trends;
  }

  private calculateWeightedAverage(signals: DaoFeedbackSignal[]): number {
    if (signals.length === 0) return 0;

    let totalWeight = 0;
    let weightedSum = 0;

    for (const signal of signals) {
      const weight = LEVEL_WEIGHTS[signal.level];
      const metricValues = Object.values(signal.metrics);
      const avgMetric = metricValues.reduce((a, b) => a + b, 0) / Math.max(metricValues.length, 1);
      weightedSum += weight * avgMetric;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private matchCausalChains(signals: DaoFeedbackSignal[]): CausalLink[] {
    const categories = new Set(signals.map(s => s.category));
    const chains: CausalLink[] = [];

    for (const rule of this.causalRules) {
      const [cause, effect] = rule.pattern;
      if (categories.has(cause) && categories.has(effect)) {
        chains.push({ ...rule.result });
      }
    }

    return chains;
  }

  private generateRecommendation(
    score: number,
    chains: CausalLink[]
  ): string | undefined {
    if (score >= 80) return undefined;
    const firstChain = chains[0];
    if (firstChain) {
      return `优先处理：${firstChain.description}（置信度 ${Math.round(firstChain.confidence * 100)}%）`;
    }
    if (score < 50) return '系统健康度严重下降，建议立即介入排查';
    if (score < 70) return '检测到异常信号，建议关注并优化';
    return undefined;
  }
}
