/**
 * 冲气通道 — 调和通道
 * 帛书《道德经》乙本·四十二章："万物负阴而抱阳，冲气以为和"
 * 冲气者，阴阳相搏而成和者也。在阴阳对偶节点之间流动的调和机制，
 * 维持系统动态平衡的核心调节器。
 */

export interface ChongQiSignal {
  readonly pairId: string;
  readonly yinNode: string;
  readonly yangNode: string;
  readonly imbalanceDirection: 'yin_excess' | 'yang_excess' | 'balanced';
  readonly deviationMagnitude: number;
  readonly compensationAction: 'tonify' | 'drain' | 'none';
  readonly targetValue: number;
  readonly urgency: 'low' | 'medium' | 'high' | 'critical';
  readonly ttl: number;
}

export interface YinYangPair {
  readonly id: string;
  readonly yinNode: string;
  readonly yangNode: string;
  readonly targetName: string;
  readonly idealRatio: number;
  readonly lowerThreshold: number;
  readonly upperThreshold: number;
  readonly metricExtractor: (yinValue: number, yangValue: number) => number;
}

export interface ChongQiResult {
  readonly pairId: string;
  readonly wasImbalanced: boolean;
  readonly signalSent: boolean;
  readonly actionTaken: ChongQiSignal['compensationAction'];
  readonly newDeviation?: number;
}

const DEFAULT_YIN_YANG_PAIRS: ReadonlyArray<YinYangPair> = [
  {
    id: 'nothing-anything',
    yinNode: 'daoNothing',
    yangNode: 'daoAnything',
    targetName: '有无比例平衡',
    idealRatio: 0.15,
    lowerThreshold: 0.08,
    upperThreshold: 0.5,
    metricExtractor: (yin, yang) => yin / (yin + yang),
  },
  {
    id: 'chronos-times',
    yinNode: 'daoChronos',
    yangNode: 'daotimes',
    targetName: '连续时间 vs 离散事件吞吐均衡',
    idealRatio: 0.5,
    lowerThreshold: 0.35,
    upperThreshold: 0.65,
    metricExtractor: (yin, yang) => yin / (yin + yang),
  },
  {
    id: 'spaces-agents',
    yinNode: 'daoSpaces',
    yangNode: 'daoAgents',
    targetName: '空间资源利用率 vs 主体活跃度',
    idealRatio: 0.5,
    lowerThreshold: 0.2,
    upperThreshold: 0.9,
    metricExtractor: (yin, yang) => yin / Math.max(yin + yang, 1),
  },
  {
    id: 'skills-nexus',
    yinNode: 'daoSkilLs',
    yangNode: 'daoNexus',
    targetName: '能力储备 vs 能力调用率',
    idealRatio: 0.5,
    lowerThreshold: 0.1,
    upperThreshold: 0.8,
    metricExtractor: (yin, yang) => yin / Math.max(yin + yang, 1),
  },
  {
    id: 'docs-apps',
    yinNode: 'daoDocs',
    yangNode: 'daoApps',
    targetName: '知识覆盖度 vs 功能执行率',
    idealRatio: 0.7,
    lowerThreshold: 0.4,
    upperThreshold: 0.95,
    metricExtractor: (yin, yang) => yin / Math.max(yin + yang, 1),
  },
];

interface AdjustmentHistory {
  directions: Array<'tonify' | 'drain'>;
}

export class ChongQiRegulator {
  private pairs: ReadonlyArray<YinYangPair>;
  private sensitivity: number = 0.7;
  private maxIterations: number = 10;
  private adjustmentHistories = new Map<string, AdjustmentHistory>();
  private snapshotCache = new Map<string, { status: 'balanced' | 'imbalanced'; deviation: number }>();

  constructor(pairs?: ReadonlyArray<YinYangPair>) {
    this.pairs = pairs ?? DEFAULT_YIN_YANG_PAIRS;
    for (const pair of this.pairs) {
      this.adjustmentHistories.set(pair.id, { directions: [] });
      this.snapshotCache.set(pair.id, { status: 'balanced', deviation: 0 });
    }
  }

  async regulateAll(
    metrics: Record<string, { yin: number; yang: number }>,
  ): Promise<ReadonlyArray<ChongQiResult>> {
    const results: ChongQiResult[] = [];
    for (const pair of this.pairs) {
      const metric = metrics[pair.id];
      if (!metric) continue;

      const detection = this.detect(pair.id, metric.yin, metric.yang);
      if (!detection.isImbalanced) {
        results.push({
          pairId: pair.id,
          wasImbalanced: false,
          signalSent: false,
          actionTaken: 'none',
        });
        this.snapshotCache.set(pair.id, { status: 'balanced', deviation: detection.deviation });
        continue;
      }

      const signal = this.generateSignal(pair, detection.deviation, detection.direction);
      const executed = await this.executeSignal(signal);

      let newDeviation: number | undefined;
      if (executed && detection.direction !== 'balanced') {
        const newDetection = this.detect(pair.id, signal.targetValue, metric.yang);
        newDeviation = newDetection.deviation;
      }

      results.push({
        pairId: pair.id,
        wasImbalanced: true,
        signalSent: executed,
        actionTaken: signal.compensationAction,
        newDeviation,
      });

      this.snapshotCache.set(pair.id, {
        status: executed ? 'imbalanced' : 'balanced',
        deviation: newDeviation ?? detection.deviation,
      });
    }

    return results;
  }

  detect(
    pairId: string,
    yinValue: number,
    yangValue: number,
  ): { isImbalanced: boolean; deviation: number; direction: ChongQiSignal['imbalanceDirection'] } {
    const pair = this.pairs.find((p) => p.id === pairId);
    if (!pair) {
      return { isImbalanced: false, deviation: 0, direction: 'balanced' };
    }

    const currentRatio = pair.metricExtractor(yinValue, yangValue);
    const deviation = Math.abs(currentRatio - pair.idealRatio) / pair.idealRatio;

    if (
      currentRatio >= pair.lowerThreshold &&
      currentRatio <= pair.upperThreshold
    ) {
      return { isImbalanced: false, deviation, direction: 'balanced' };
    }

    const direction: ChongQiSignal['imbalanceDirection'] =
      currentRatio < pair.idealRatio ? 'yang_excess' : 'yin_excess';

    return { isImbalanced: true, deviation, direction };
  }

  generateSignal(
    pair: YinYangPair,
    deviation: number,
    direction: ChongQiSignal['imbalanceDirection'],
  ): ChongQiSignal {
    const urgency = this.calculateUrgency(deviation);
    const compensationAction =
      direction === 'yang_excess'
        ? 'tonify'
        : direction === 'yin_excess'
          ? 'drain'
          : 'none';

    const adjustedSensitivity = this.getAdjustedSensitivity(pair.id);
    const compensationAmount = deviation * adjustedSensitivity;
    const currentRatio =
      direction === 'yang_excess'
        ? pair.idealRatio * (1 - deviation)
        : pair.idealRatio * (1 + deviation);

    let targetValue: number;
    if (direction === 'yang_excess') {
      targetValue = currentRatio + compensationAmount * pair.idealRatio;
    } else if (direction === 'yin_excess') {
      targetValue = currentRatio - compensationAmount * pair.idealRatio;
    } else {
      targetValue = pair.idealRatio;
    }

    targetValue = Math.max(pair.lowerThreshold, Math.min(pair.upperThreshold, targetValue));

    return {
      pairId: pair.id,
      yinNode: pair.yinNode,
      yangNode: pair.yangNode,
      imbalanceDirection: direction,
      deviationMagnitude: Math.min(deviation, 1),
      compensationAction,
      targetValue,
      urgency,
      ttl: Date.now() + this.getTtlForUrgency(urgency),
    };
  }

  async executeSignal(signal: ChongQiSignal): Promise<boolean> {
    if (signal.compensationAction === 'none') return false;

    const history = this.adjustmentHistories.get(signal.pairId);
    if (history) {
      history.directions.push(signal.compensationAction);
      if (history.directions.length > 5) {
        history.directions.shift();
      }
    }

    console.log(
      `[冲气] 执行信号: ${signal.pairId} | 方向: ${signal.imbalanceDirection} | ` +
        `动作: ${signal.compensationAction} | 紧急程度: ${signal.urgency} | ` +
        `目标值: ${signal.targetValue.toFixed(4)} | 偏差: ${(signal.deviationMagnitude * 100).toFixed(1)}%`,
    );

    return true;
  }

  async converge(
    pairId: string,
    yinValue: number,
    yangValue: number,
    maxIterations?: number,
  ): Promise<ChongQiResult> {
    const maxIter = maxIterations ?? this.maxIterations;
    const pair = this.pairs.find((p) => p.id === pairId);
    if (!pair) {
      return {
        pairId,
        wasImbalanced: false,
        signalSent: false,
        actionTaken: 'none',
      };
    }

    let currentYin = yinValue;
    let currentYang = yangValue;
    let consecutiveBalanced = 0;
    let lastAction: ChongQiSignal['compensationAction'] = 'none';

    for (let i = 0; i < maxIter; i++) {
      const detection = this.detect(pairId, currentYin, currentYang);

      if (!detection.isImbalanced || detection.deviation < 0.05) {
        consecutiveBalanced++;
        if (consecutiveBalanced >= 2) {
          return {
            pairId,
            wasImbalanced: i > 0,
            signalSent: i > 0,
            actionTaken: lastAction,
            newDeviation: detection.deviation,
          };
        }
        continue;
      }

      consecutiveBalanced = 0;

      if (this.isOscillating(pairId)) {
        continue;
      }

      const signal = this.generateSignal(pair, detection.deviation, detection.direction);
      await this.executeSignal(signal);
      lastAction = signal.compensationAction;

      if (signal.compensationAction === 'tonify') {
        const adjustment = (signal.targetValue - pair.metricExtractor(currentYin, currentYang)) * currentYang;
        currentYin += adjustment;
      } else if (signal.compensationAction === 'drain') {
        const adjustment = (pair.metricExtractor(currentYin, currentYang) - signal.targetValue) * currentYang;
        currentYin -= adjustment;
      }
    }

    const finalDetection = this.detect(pairId, currentYin, currentYang);
    return {
      pairId,
      wasImbalanced: true,
      signalSent: true,
      actionTaken: lastAction,
      newDeviation: finalDetection.deviation,
    };
  }

  getSnapshot(): ReadonlyArray<{
    pairId: string;
    status: 'balanced' | 'imbalanced';
    deviation: number;
  }> {
    return Array.from(this.snapshotCache.entries()).map(([pairId, state]) => ({
      pairId,
      status: state.status,
      deviation: state.deviation,
    }));
  }

  setSensitivity(sensitivity: number): void {
    this.sensitivity = Math.max(0, Math.min(1, sensitivity));
  }

  setMaxIterations(max: number): void {
    this.maxIterations = Math.max(1, Math.floor(max));
  }

  private calculateUrgency(
    deviation: number,
  ): ChongQiSignal['urgency'] {
    if (deviation < 0.3) return 'low';
    if (deviation < 0.6) return 'medium';
    if (deviation < 0.9) return 'high';
    return 'critical';
  }

  private getTtlForUrgency(urgency: ChongQiSignal['urgency']): number {
    switch (urgency) {
      case 'low':
        return 10000;
      case 'medium':
        return 5000;
      case 'high':
        return 2000;
      case 'critical':
        return 1000;
    default:
        return 5000;
    }
  }

  private getAdjustedSensitivity(pairId: string): number {
    const history = this.adjustmentHistories.get(pairId);
    if (!history || history.directions.length < 3) return this.sensitivity;

    const recent = history.directions.slice(-3);
    let alternations = 0;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i] !== recent[i - 1]) alternations++;
    }

    return alternations >= 2 ? this.sensitivity * 0.5 : this.sensitivity;
  }

  private isOscillating(pairId: string): boolean {
    const history = this.adjustmentHistories.get(pairId);
    if (!history || history.directions.length < 3) return false;

    const recent = history.directions.slice(-3);
    return recent[0] !== recent[1] && recent[1] !== recent[2];
  }
}

export const CHONG_QI_CHANNEL = '::chong/qi' as const;
export function daoCreateChongQiRegulator(
  pairs?: ReadonlyArray<YinYangPair>,
): ChongQiRegulator {
  return new ChongQiRegulator(pairs);
}
