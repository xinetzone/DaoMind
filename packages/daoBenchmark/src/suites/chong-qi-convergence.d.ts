import type { DaoBenchmarkResult } from '../types.js';
export interface ConvergenceScenario {
    pairId: string;
    yinValue: number;
    yangValue: number;
}
export declare const DEFAULT_SCENARIOS: ReadonlyArray<ConvergenceScenario>;
export declare function daoMeasureConvergenceTime(scenarios?: ReadonlyArray<ConvergenceScenario>): Promise<DaoBenchmarkResult>;
//# sourceMappingURL=chong-qi-convergence.d.ts.map