import type { YinYangGauge } from './types.js';

const MAX_HISTORY = 20;

interface PairState {
  yinNode: string;
  yangNode: string;
  yinValue: number;
  yangValue: number;
  idealRatio: number;
  history: Array<{ yin: number; yang: number; timestamp: number }>;
}

export class DaoYinYangGaugeEngine {
  private pairs = new Map<string, PairState>();

  updatePair(
    pairId: string,
    yinValue: number,
    yangValue: number,
    idealRatio: number,
  ): YinYangGauge {
    let state = this.pairs.get(pairId);
    if (!state) {
      state = {
        yinNode: `${pairId}_yin`,
        yangNode: `${pairId}_yang`,
        yinValue: 0,
        yangValue: 0,
        idealRatio,
        history: [],
      };
      this.pairs.set(pairId, state);
    }
    state.yinValue = yinValue;
    state.yangValue = yangValue;
    state.idealRatio = idealRatio;
    state.history.push({ yin: yinValue, yang: yangValue, timestamp: Date.now() });
    if (state.history.length > MAX_HISTORY) state.history.shift();

    const ratio = yangValue > 0 ? yinValue / yangValue : Infinity;
    const deviation = Math.min(1, Math.abs(ratio - idealRatio) / Math.max(idealRatio, 0.001));

    let status: YinYangGauge['status'];
    if (deviation > 0.8) status = 'critical';
    else if (ratio < idealRatio * 0.6) status = 'yang_excess';
    else if (ratio > idealRatio * 1.4) status = 'yin_excess';
    else status = 'balanced';

    return {
      pairId,
      yinNode: state.yinNode,
      yangNode: state.yangNode,
      yinValue,
      yangValue,
      ratio: isFinite(ratio) ? ratio : 0,
      idealRatio,
      status,
      deviation,
      timestamp: Date.now(),
    };
  }

  getAllGauges(): ReadonlyArray<YinYangGauge> {
    return Array.from(this.pairs.entries()).map(([pairId, s]) => this.buildGauge(pairId, s));
  }

  getImbalancedPairs(): ReadonlyArray<YinYangGauge> {
    return this.getAllGauges().filter((g) => g.status !== 'balanced');
  }

  getCriticalPairs(): ReadonlyArray<YinYangGauge> {
    return this.getAllGauges().filter((g) => g.status === 'critical');
  }

  private buildGauge(pairId: string, state: PairState): YinYangGauge {
    const ratio =
      state.yangValue > 0 ? state.yinValue / state.yangValue : Infinity;
    const deviation = Math.min(
      1,
      Math.abs(ratio - state.idealRatio) / Math.max(state.idealRatio, 0.001),
    );

    let status: YinYangGauge['status'];
    if (deviation > 0.8) status = 'critical';
    else if (ratio < state.idealRatio * 0.6) status = 'yang_excess';
    else if (ratio > state.idealRatio * 1.4) status = 'yin_excess';
    else status = 'balanced';

    return {
      pairId,
      yinNode: state.yinNode,
      yangNode: state.yangNode,
      yinValue: state.yinValue,
      yangValue: state.yangValue,
      ratio: isFinite(ratio) ? ratio : 0,
      idealRatio: state.idealRatio,
      status,
      deviation,
      timestamp: Date.now(),
    };
  }
}
