import type { DaoBenchmarkMetric, DaoBenchmarkResult } from '../types.js';

const CONVERGENCE_TARGET_SEC = 30;

export interface ConvergenceScenario {
  pairId: string;
  yinValue: number;
  yangValue: number;
}

export const DEFAULT_SCENARIOS: ReadonlyArray<ConvergenceScenario> = [
  { pairId: '极端-阳亢', yinValue: 0.1, yangValue: 0.95 },
  { pairId: '极端-阴盛', yinValue: 0.95, yangValue: 0.1 },
  { pairId: '中度-偏阳', yinValue: 0.3, yangValue: 0.8 },
  { pairId: '中度-偏阴', yinValue: 0.8, yangValue: 0.3 },
  { pairId: '正常-波动', yinValue: 0.45, yangValue: 0.55 },
];

interface ConvergenceResult {
  scenarioId: string;
  convergenceTimeMs: number;
  converged: boolean;
}

async function daoSimulateConvergence(scenario: ConvergenceScenario): Promise<ConvergenceResult> {
  const start = process.hrtime.bigint();
  let yin = scenario.yinValue;
  let yang = scenario.yangValue;
  const balanceThreshold = 0.05;
  const maxIterations = 10000;
  let iteration = 0;

  while (iteration < maxIterations) {
    const diff = yang - yin;
    const adjustment = diff * 0.01;

    if (Math.abs(diff) <= balanceThreshold) {
      const end = process.hrtime.bigint();
      return {
        scenarioId: scenario.pairId,
        convergenceTimeMs: Number(end - start) / 1_000_000,
        converged: true,
      };
    }

    yin += adjustment;
    yang -= adjustment;
    yin = Math.max(0, Math.min(1, yin));
    yang = Math.max(0, Math.min(1, yang));

    iteration++;

    if (iteration % 100 === 0) {
      await new Promise(resolve => setImmediate(resolve));
    }
  }

  const end = process.hrtime.bigint();
  return {
    scenarioId: scenario.pairId,
    convergenceTimeMs: Number(end - start) / 1_000_000,
    converged: false,
  };
}

export async function daoMeasureConvergenceTime(
  scenarios: ReadonlyArray<ConvergenceScenario> = DEFAULT_SCENARIOS
): Promise<DaoBenchmarkResult> {
  const suiteStart = process.hrtime.bigint();
  const results: ConvergenceResult[] = [];

  for (const scenario of scenarios) {
    const result = await daoSimulateConvergence(scenario);
    results.push(result);
  }

  const maxConvergenceTimeMs = Math.max(...results.map(r => r.convergenceTimeMs));
  const allConverged = results.every(r => r.converged);
  const maxConvergenceTimeSec = maxConvergenceTimeMs / 1000;

  const metrics: DaoBenchmarkMetric[] = [
    {
      name: '最大收敛时间',
      value: Math.round(maxConvergenceTimeSec * 100) / 100,
      unit: 's',
      target: CONVERGENCE_TARGET_SEC,
      passed: maxConvergenceTimeSec < CONVERGENCE_TARGET_SEC && allConverged,
    },
    {
      name: '全部收敛',
      value: allConverged ? 1 : 0,
      unit: 'bool',
      target: 1,
      passed: allConverged,
    },
    ...results.map(r => ({
      name: `${r.scenarioId} 收敛时间`,
      value: Math.round(r.convergenceTimeMs) / 1000,
      unit: 's',
      target: CONVERGENCE_TARGET_SEC,
      passed: r.converged && r.convergenceTimeMs < CONVERGENCE_TARGET_SEC * 1000,
    })),
  ];

  const suiteEnd = process.hrtime.bigint();
  const suiteDurationMs = Number(suiteEnd - suiteStart) / 1_000_000;

  return {
    suiteName: '冲气收敛时间测试',
    timestamp: Date.now(),
    metrics,
    overallPassed: maxConvergenceTimeSec < CONVERGENCE_TARGET_SEC && allConverged,
    duration: Math.round(suiteDurationMs * 100) / 100,
  };
}
