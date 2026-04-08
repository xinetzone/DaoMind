/** 基准测试指标 */
export interface BenchmarkMetric {
  readonly name: string;
  readonly value: number;
  readonly unit: string;
  readonly target: number;
  readonly passed: boolean;
}

/** 基准测试结果 */
export interface BenchmarkResult {
  readonly suiteName: string;
  readonly timestamp: number;
  readonly metrics: ReadonlyArray<BenchmarkMetric>;
  readonly overallPassed: boolean;
  readonly duration: number;
}

/** 性能报告 */
export interface PerformanceReport {
  readonly generatedAt: number;
  readonly benchmarks: ReadonlyArray<BenchmarkResult>;
  readonly summary: {
    totalSuites: number;
    passedSuites: number;
    failedSuites: number;
    criticalFailures: ReadonlyArray<string>;
    recommendations: ReadonlyArray<string>;
  };
}
