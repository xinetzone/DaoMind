/**
 * 反馈强度调节器 — 帛书《道德经》乙本：甚爱必大费，多藏必厚亡
 *
 * 中庸思想：反馈应适度，过犹不及。
 * 通过 S 型响应曲线实现反馈强度的自适应调节，
 * 避免过度反应（甚爱必大费）和信号堆积（多藏必厚亡）。
 */

/** 调节器配置 */
export interface FeedbackRegulatorConfig {
  readonly baseSensitivity: number;
  readonly dampeningFactor: number;
  readonly saturationThreshold: number;
  readonly recoveryRate: number;
}

/** 调节结果 */
export interface RegulationResult {
  readonly inputCount: number;
  readonly outputIntensity: number;
  readonly isSaturated: boolean;
  readonly effectiveSignals: number;
  readonly droppedSignals: number;
}

const DEFAULT_CONFIG: FeedbackRegulatorConfig = {
  baseSensitivity: 0.5,
  dampeningFactor: 0.7,
  saturationThreshold: 100,
  recoveryRate: 0.1
};

/**
 * 反馈强度调节器 — 基于 S 型曲线的自适应反馈控制
 *
 * 核心算法：
 * - 低输入区：线性增长，保持灵敏度
 * - 中间区：sigmoid 平滑过渡
 * - 高输入区：指数趋近饱和
 * - 超阈值区：强制限幅 + 信号丢弃
 */
export class DaoFeedbackRegulator {
  private config: FeedbackRegulatorConfig;
  private currentIntensity: number = 0;
  private signalsThisWindow: number = 0;
  private droppedThisWindow: number = 0;

  constructor(config?: Partial<FeedbackRegulatorConfig>) {
    this.config = this.mergeConfig(DEFAULT_CONFIG, config || {});
  }

  /** 核心方法：调节输入信号量到合适的输出强度 */
  regulate(signalCount: number, timeWindowMs: number = 60000): RegulationResult {
    const inputRate = (signalCount / Math.max(timeWindowMs, 1)) * 60000;
    const rawOutput = this.calculateResponse(inputRate);
    const isSaturated = inputRate > this.config.saturationThreshold;
    let outputIntensity: number;
    let effectiveSignals: number;
    let droppedSignals: number;

    if (isSaturated) {
      const saturationRatio = this.config.saturationThreshold / Math.max(inputRate, 1);
      outputIntensity = Math.min(rawOutput, 0.95) * saturationRatio;
      effectiveSignals = Math.floor(signalCount * saturationRatio);
      droppedSignals = signalCount - effectiveSignals;
      this.droppedThisWindow += droppedSignals;
    } else {
      outputIntensity = Math.min(rawOutput, 0.95);
      effectiveSignals = signalCount;
      droppedSignals = 0;
    }

    this.currentIntensity = Math.max(this.currentIntensity, outputIntensity);
    this.signalsThisWindow += signalCount;

    return {
      inputCount: signalCount,
      outputIntensity: Math.max(0, Math.min(1, outputIntensity)),
      isSaturated,
      effectiveSignals,
      droppedSignals
    };
  }

  /** S 型响应曲线 — 核心算法 */
  private calculateResponse(inputRate: number): number {
    const { baseSensitivity: k, dampeningFactor: d, saturationThreshold } = this.config;
    const x = inputRate / Math.max(saturationThreshold, 1);
    let output: number;

    if (x < 0.3) {
      output = k * x / 0.3;
    } else if (x <= 0.8) {
      const t = (x - 0.3) / 0.5;
      const sigmoid = 1 / (1 + Math.exp(-10 * (t - 0.5)));
      output = k * 0.3 + (1 - k * 0.3) * sigmoid;
    } else {
      const t = 1;
      const sigmoid = 1 / (1 + Math.exp(-10 * (t - 0.5)));
      const base = k * 0.3 + (1 - k * 0.3) * sigmoid;
      const excess = x - 0.8;
      output = base + (1 - base) * (1 - Math.exp(-d * excess));
    }

    return Math.min(output, 0.95);
  }

  /** 更新内部状态 — 按恢复速率衰减当前累积强度 */
  tick(): void {
    this.currentIntensity *= (1 - this.config.recoveryRate);
    this.signalsThisWindow = 0;
    this.droppedThisWindow = 0;
  }

  /** 动态调整基础灵敏度 */
  setSensitivity(sensitivity: number): void {
    this.config = { ...this.config, baseSensitivity: Math.max(0, Math.min(1, sensitivity)) };
  }

  /** 动态调整阻尼系数 */
  setDampening(factor: number): void {
    this.config = { ...this.config, dampeningFactor: Math.max(0, Math.min(1, factor)) };
  }

  /** 动态调整饱和阈值 */
  setSaturationThreshold(threshold: number): void {
    this.config = { ...this.config, saturationThreshold: Math.max(1, threshold) };
  }

  /** 获取当前状态 */
  getState(): {
    currentIntensity: number;
    config: Readonly<FeedbackRegulatorConfig>;
    windowStats: { signalsThisWindow: number; droppedThisWindow: number };
  } {
    return {
      currentIntensity: this.currentIntensity,
      config: { ...this.config },
      windowStats: {
        signalsThisWindow: this.signalsThisWindow,
        droppedThisWindow: this.droppedThisWindow
      }
    };
  }

  /** 重置状态 */
  reset(): void {
    this.currentIntensity = 0;
    this.signalsThisWindow = 0;
    this.droppedThisWindow = 0;
  }

  /** 生成 S 型曲线采样数据 — 用于可视化验证 */
  generateCurveData(points: number = 50): Array<{ input: number; output: number }> {
    const maxInput = this.config.saturationThreshold * 1.5;
    const step = maxInput / points;
    const data: Array<{ input: number; output: number }> = [];

    for (let i = 0; i <= points; i++) {
      const input = i * step;
      const output = this.calculateResponse(input);
      data.push({ input, output });
    }

    return data;
  }

  private mergeConfig(
    defaults: FeedbackRegulatorConfig,
    partial: Partial<FeedbackRegulatorConfig>
  ): FeedbackRegulatorConfig {
    return {
      baseSensitivity: partial.baseSensitivity ?? defaults.baseSensitivity,
      dampeningFactor: partial.dampeningFactor ?? defaults.dampeningFactor,
      saturationThreshold: partial.saturationThreshold ?? defaults.saturationThreshold,
      recoveryRate: partial.recoveryRate ?? defaults.recoveryRate
    };
  }
}
