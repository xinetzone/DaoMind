import type {
  DaoAggregatedFeedback,
  SignalCategory
} from './types.js';

/** 冲气信号 — 帛书《道德经》乙本·四十二章：万物负阴而抱阳，冲气以为和 */
export interface ChongQiSignal {
  pairId: string;
  direction: string;
  magnitude: number;
}

/** 冲和结果 */
export interface HarmonizeResult {
  shouldAct: boolean;
  chongQiSignals: ChongQiSignal[];
  filteredScore: number;
}

/** 无的约束配置 */
export interface NothingConstraint {
  ideal: number;
  tolerance: number;
}

const DEFAULT_NOISE_THRESHOLD = 5; // 默认噪声过滤阈值

/** 阶段三：冲和（Chong He）— Anything 层接收聚合反馈，进行"有无相生"层面的调和处理 */
export class DaoHarmonizer {
  private noiseThreshold: number;

  constructor(noiseThreshold?: number) {
    this.noiseThreshold = noiseThreshold ?? DEFAULT_NOISE_THRESHOLD;
  }

  /** 冲和处理 — 查询理想约束、计算偏差、生成冲气建议、过滤噪声 */
  harmonize(
    aggregated: DaoAggregatedFeedback,
    nothingConstraints?: Record<string, NothingConstraint>
  ): HarmonizeResult {
    const chongQiSignals: ChongQiSignal[] = [];
    const dimensions = this.extractDimensions(aggregated);

    for (const [dimension, currentValue] of Object.entries(dimensions)) {
      const constraint = nothingConstraints?.[dimension];

      if (constraint) {
        /** 与"无"协商 — 帛书原文：有无相生 */
        const result = this.consultNothing(dimension, currentValue, constraint);

        if (!result.isWithinTolerance && Math.abs(result.deviation) > this.noiseThreshold) {
          chongQiSignals.push({
            pairId: dimension,
            direction: result.deviation > 0 ? 'excess' : 'deficit',
            magnitude: Math.abs(result.deviation)
          });
        }
      } else {
        /** 无约束时使用相对偏差检测 */
        const relativeDeviation = Math.abs(currentValue - aggregated.aggregateScore);
        if (relativeDeviation > this.noiseThreshold * 2) {
          chongQiSignals.push({
            pairId: dimension,
            direction: currentValue > aggregated.aggregateScore ? 'excess' : 'deficit',
            magnitude: relativeDeviation
          });
        }
      }
    }

    /** 计算过滤后的平衡分数 */
    const filteredScore = this.calculateBalanceScore(dimensions, chongQiSignals);

    return {
      shouldAct: chongQiSignals.length > 0,
      chongQiSignals,
      filteredScore
    };
  }

  /** 与"无"协商 — 判断当前值是否在理想约束范围内 */
  consultNothing(
    dimension: string,
    currentValue: number,
    constraint?: NothingConstraint
  ): { isWithinTolerance: boolean; deviation: number } {
    if (!constraint) {
      return { isWithinTolerance: true, deviation: 0 };
    }

    const deviation = currentValue - constraint.ideal;
    const isWithinTolerance = Math.abs(deviation) <= constraint.tolerance;

    return { isWithinTolerance, deviation };
  }

  /** 计算综合平衡分数 — 帛书原文：冲气以为和 */
  calculateBalanceScore(
    dimensions: Record<string, number>,
    deviations?: ChongQiSignal[]
  ): number {
    if (Object.keys(dimensions).length === 0) return 100;

    const values = Object.values(dimensions);
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length;

    let varianceSum = 0;
    for (const value of values) {
      varianceSum += Math.pow(value - avgValue, 2);
    }
    const variance = varianceSum / values.length;
    const stdDev = Math.sqrt(variance);

    /** 偏差惩罚 */
    let deviationPenalty = 0;
    if (deviations && deviations.length > 0) {
      for (const dev of deviations) {
        deviationPenalty += dev.magnitude;
      }
      deviationPenalty /= deviations.length;
    }

    /** 平衡分数：基于标准差和偏差的综合评估 */
    const balanceScore = Math.max(0, Math.min(100, 100 - stdDev - deviationPenalty * 0.5));

    return Math.round(balanceScore * 100) / 100;
  }

  /** 设置噪声过滤阈值 */
  setNoiseThreshold(threshold: number): void {
    this.noiseThreshold = threshold;
  }

  private extractDimensions(aggregated: DaoAggregatedFeedback): Record<string, number> {
    const dimensions: Record<string, number> = {};

    dimensions['aggregateScore'] = aggregated.aggregateScore;

    /** 从信号中提取各维度的关键指标 */
    const categoryMetrics = new Map<SignalCategory, number[]>();
    for (const signal of aggregated.signals) {
      const values = categoryMetrics.get(signal.category) || [];
      const metricAvg = Object.values(signal.metrics).reduce((a, b) => a + b, 0) /
        Math.max(Object.keys(signal.metrics).length, 1);
      values.push(metricAvg);
      categoryMetrics.set(signal.category, values);
    }

    for (const [category, values] of categoryMetrics) {
      dimensions[category] = values.reduce((a, b) => a + b, 0) / values.length;
    }

    return dimensions;
  }
}
