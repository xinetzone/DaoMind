/** 基准测试指标 */
export interface DaoBenchmarkMetric {
    readonly name: string;
    readonly value: number;
    readonly unit: string;
    readonly target: number;
    readonly passed: boolean;
}
export interface DaoBenchmarkResult {
    readonly suiteName: string;
    readonly timestamp: number;
    readonly metrics: ReadonlyArray<DaoBenchmarkMetric>;
    readonly overallPassed: boolean;
    readonly duration: number;
}
export interface DaoPerformanceReport {
    readonly generatedAt: number;
    readonly benchmarks: ReadonlyArray<DaoBenchmarkResult>;
    readonly summary: {
        totalSuites: number;
        passedSuites: number;
        failedSuites: number;
        criticalFailures: ReadonlyArray<string>;
        recommendations: ReadonlyArray<string>;
    };
}
//# sourceMappingURL=types.d.ts.map