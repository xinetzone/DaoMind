import type { DaoBenchmarkMetric, DaoBenchmarkResult } from '../types.js';

const STARTUP_TARGET_MS = 2000;

interface ImportTiming {
  name: string;
  durationMs: number;
}

async function daoMeasureImportTime(importFn: () => Promise<unknown>): Promise<number> {
  const start = process.hrtime.bigint();
  await importFn();
  const end = process.hrtime.bigint();
  return Number(end - start) / 1_000_000;
}

export async function daoMeasureStartupTime(): Promise<DaoBenchmarkResult> {
  const suiteStart = process.hrtime.bigint();
  const importTimings: ImportTiming[] = [];

  const packages = [
    { name: '@dao/nexus', importFn: (): Promise<unknown> => import('../../daoNexus/dist/index.js' as string) },
    { name: '@dao/feedback', importFn: (): Promise<unknown> => import('../../daoFeedback/dist/index.js' as string) },
    { name: '@dao/qi', importFn: (): Promise<unknown> => import('../../daoQi/dist/index.js' as string) },
  ];

  for (const pkg of packages) {
    try {
      const duration = await daoMeasureImportTime(pkg.importFn);
      importTimings.push({ name: pkg.name, durationMs: duration });
    } catch {
      importTimings.push({ name: pkg.name, durationMs: -1 });
    }
  }

  const totalDurationMs = importTimings
    .filter(t => t.durationMs >= 0)
    .reduce((sum, t) => sum + t.durationMs, 0);

  const metrics: DaoBenchmarkMetric[] = [
    {
      name: '总启动时间',
      value: Math.round(totalDurationMs * 100) / 100,
      unit: 'ms',
      target: STARTUP_TARGET_MS,
      passed: totalDurationMs < STARTUP_TARGET_MS,
    },
    ...importTimings.map(t => ({
      name: `${t.name} 导入时间`,
      value: Math.round(t.durationMs * 100) / 100,
      unit: 'ms',
      target: STARTUP_TARGET_MS / 2,
      passed: t.durationMs >= 0 && t.durationMs < STARTUP_TARGET_MS / 2,
    })),
  ];

  const suiteEnd = process.hrtime.bigint();
  const suiteDurationMs = Number(suiteEnd - suiteStart) / 1_000_000;

  return {
    suiteName: '启动时间测试',
    timestamp: Date.now(),
    metrics,
    overallPassed: totalDurationMs < STARTUP_TARGET_MS,
    duration: Math.round(suiteDurationMs * 100) / 100,
  };
}
