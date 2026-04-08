import type { BenchmarkMetric, BenchmarkResult } from '../types.js';

const THROUGHPUT_TARGET_MSG_PER_SEC = 10000;

export async function daoMeasureThroughput(messageCount: number = 10000): Promise<BenchmarkResult> {
  const suiteStart = process.hrtime.bigint();
  const channelResults: Array<{ channel: string; throughput: number }> = [];

  const channels = ['天', '地', '人', '冲'];

  for (const channel of channels) {
    const channelStart = process.hrtime.bigint();

    for (let i = 0; i < messageCount; i++) {
      // 模拟消息处理
      JSON.stringify({ id: i, channel, data: `test-message-${i}`, timestamp: Date.now() });
    }

    const channelEnd = process.hrtime.bigint();
    const channelDurationSec = Number(channelEnd - channelStart) / 1_000_000_000;
    const throughput = messageCount / channelDurationSec;

    channelResults.push({ channel, throughput });
  }

  const avgThroughput = channelResults.reduce((sum, r) => sum + r.throughput, 0) / channelResults.length;

  const metrics: BenchmarkMetric[] = [
    {
      name: '平均吞吐量',
      value: Math.round(avgThroughput),
      unit: 'msg/s',
      target: THROUGHPUT_TARGET_MSG_PER_SEC,
      passed: avgThroughput > THROUGHPUT_TARGET_MSG_PER_SEC,
    },
    ...channelResults.map(r => ({
      name: `${r.channel}通道吞吐量`,
      value: Math.round(r.throughput),
      unit: 'msg/s',
      target: THROUGHPUT_TARGET_MSG_PER_SEC,
      passed: r.throughput > THROUGHPUT_TARGET_MSG_PER_SEC,
    })),
  ];

  const suiteEnd = process.hrtime.bigint();
  const suiteDurationMs = Number(suiteEnd - suiteStart) / 1_000_000;

  return {
    suiteName: '消息吞吐量测试',
    timestamp: Date.now(),
    metrics,
    overallPassed: avgThroughput > THROUGHPUT_TARGET_MSG_PER_SEC,
    duration: Math.round(suiteDurationMs * 100) / 100,
  };
}
