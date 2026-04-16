import type { DaoBenchmarkResult, DaoPerformanceReport } from './types';
export declare class DaoBenchmarkRunner {
    private results;
    daoRunAll(): Promise<DaoPerformanceReport>;
    daoRunSuite(name: string): Promise<DaoBenchmarkResult>;
    daoRunQuick(): Promise<DaoPerformanceReport>;
    daoCompareWithBaseline(baselinePath: string): Promise<DaoPerformanceReport>;
    daoGenerateReport(format?: 'text' | 'json' | 'markdown'): string;
    private daoBuildReport;
    private daoGenerateText;
    private daoGenerateMarkdown;
}
//# sourceMappingURL=runner.d.ts.map