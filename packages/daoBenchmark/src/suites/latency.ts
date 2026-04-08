import type { BenchmarkMetric, BenchmarkResult } from '../types.js';

const LATENCY_P99_TARGET_MS = 500;

function daoCalculatePercentile(values: readonly number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower] ?? 0;
  return (sorted[lower] ?? 0) + ((sorted[upper] ?? 0) - (sorted[lower] ?? 0)) * (index - lower);
}

async function daoSimulateFeedbackLoop(): Promise<number> {
  const start = process.hrtime.bigint();

  // 阶段一：感知
  await new Promise(resolve => setTimeout(resolve, Math.random() * 10));

  // 阶段二：聚合
  await new Promise(resolve => setTimeout(resolve, Math.random() * 20));

  // 阶段三：冲和
  await new Promise(resolve => setTimeout(resolve, Math.random() * 30));

  // 阶段四：归元
  await new Promise(resolve => setTimeout(resolve, Math.random() * 15));

  const end = process.hrtime.bigint();
  return Number(end - start) / 1_000_000;
}

export async function daoMeasureFeedbackLatency(iterations: number = 1000): Promise<BenchmarkResult> {
  const suiteStart = process.hrtime.bigint();
  const latencies: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const latency = await daoSimulateFeedbackLoop();
    latencies.push(latency);
  }

  const p50 = daoCalculatePercentile(latencies, 50);
  const p90 = daoCalculatePercentile(latencies, 90);
  const p99 = daoCalculatePercentile(latencies, 99);
  const p999 = daoCalculatePercentile(latencies, 99.9);

  const metrics: BenchmarkMetric[] = [
    {
      name: 'P50 延迟',
      value: Math.round(p50 * 100) / 100,
      unit: 'ms',
      target: LATENCY_P99_TARGET_MS * 0.3,
      passed: p50 < LATENCY_P99_TARGET_MS * 0.3,
    },
    {
      name: 'P90 延迟',
      value: Math.round(p90 * 100) / 100,
      unit: 'ms',
      target: LATENCY_P99_TARGET_MS * 0.6,
      passed: p90 < LATENCY_P99_TARGET_MS * 0.6,
    },
    {
      name: 'P99 延迟',
      value: Math.round(p99 * 100) / 100,
      unit: 'ms',
      target: LATENCY_P99_TARGET_MS,
      passed: p99 < LATENCY_P99_TARGET_MS,
    },
    {
      name: 'P999 延迟',
      value: Math.round(p999 * 100) / 100,
      unit: 'ms',
      target: LATENCY_P99_TARGET_MS * 2,
      passed: p999 < LATENCY_P99_TARGET_MS * 2,
    },
    {
      name: '平均延迟',
      value: Math.round((latencies.reduce((a, b) => a + b, 0) / latencies.length) * 100) / 100,
      unit: 'ms',
      target: LATENCY_P99_TARGET_MS * 0.4,
      passed: (latencies.reduce((a, b) => a + b, 0) / latencies.length) < LATENCY_P99_TARGET_MS * 0.4,
    },
  ];

  const suiteEnd = process.hrtime.bigint();
  const suiteDurationMs = Number(suiteEnd - suiteStart) / 1_000_000;

  return {
    suiteName: '反馈回路延迟测试',
    timestamp: Date.now(),
    metrics,
    overallPassed: p99 < LATENCY_P99_TARGET_MS,
    duration: Math.round(suiteDurationMs * 100) / 100,
  };
}
