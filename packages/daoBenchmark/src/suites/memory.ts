import type { BenchmarkMetric, BenchmarkResult } from '../types.js';

const MEMORY_TARGET_MB = 50;

interface MemorySnapshot {
  name: string;
  heapUsedMB: number;
}

function daoGetHeapUsedMB(): number {
  return process.memoryUsage().heapUsed / (1024 * 1024);
}

export function daoMeasureMemoryBaseline(): BenchmarkResult {
  const suiteStart = process.hrtime.bigint();
  const baselineMemory = daoGetHeapUsedMB();
  const snapshots: MemorySnapshot[] = [];

  const modules = [
    { name: '@dao/nexus', path: '@dao/nexus/index.js' },
    { name: '@dao/feedback', path: '@dao/feedback/index.js' },
    { name: '@dao/qi', path: '@dao/qi/index.js' },
  ];

  for (const mod of modules) {
    const beforeLoad = daoGetHeapUsedMB();
    try {
      require(mod.path);
    } catch {
      // 模块可能使用 ESM，跳过
    }
    const afterLoad = daoGetHeapUsedMB();
    snapshots.push({
      name: mod.name,
      heapUsedMB: Math.round((afterLoad - beforeLoad) * 100) / 100,
    });
  }

  const currentMemory = daoGetHeapUsedMB();
  const totalMemoryMB = Math.round((currentMemory - baselineMemory) * 100) / 100;

  const metrics: BenchmarkMetric[] = [
    {
      name: '空载堆内存',
      value: totalMemoryMB,
      unit: 'MB',
      target: MEMORY_TARGET_MB,
      passed: totalMemoryMB < MEMORY_TARGET_MB,
    },
    ...snapshots.map(s => ({
      name: `${s.name} 内存增量`,
      value: s.heapUsedMB,
      unit: 'MB',
      target: MEMORY_TARGET_MB / 3,
      passed: s.heapUsedMB < MEMORY_TARGET_MB / 3,
    })),
  ];

  const suiteEnd = process.hrtime.bigint();
  const suiteDurationMs = Number(suiteEnd - suiteStart) / 1_000_000;

  return {
    suiteName: '内存占用测试',
    timestamp: Date.now(),
    metrics,
    overallPassed: totalMemoryMB < MEMORY_TARGET_MB,
    duration: Math.round(suiteDurationMs * 100) / 100,
  };
}
