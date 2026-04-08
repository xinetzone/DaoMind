import type { QiChannelType, HeatmapPoint } from './types.js';

const DEFAULT_BUFFER_SIZE = 10000;

interface ChannelRecord {
  channelType: QiChannelType;
  sourceNode: string;
  targetNode: string;
  messageRate: number;
  avgLatency: number;
  errorRate: number;
  timestamp: number;
}

export class DaoHeatmapEngine {
  private buffer: ChannelRecord[] = [];
  private head = 0;
  private size = 0;

  constructor(private capacity = DEFAULT_BUFFER_SIZE) {
    this.buffer = new Array(capacity);
  }

  record(
    channelType: QiChannelType,
    source: string,
    target: string,
    metrics: { rate: number; latency: number; errorRate: number },
  ): void {
    const record: ChannelRecord = {
      channelType,
      sourceNode: source,
      targetNode: target,
      messageRate: metrics.rate,
      avgLatency: metrics.latency,
      errorRate: metrics.errorRate,
      timestamp: Date.now(),
    };
    this.buffer[this.head] = record;
    this.head = (this.head + 1) % this.capacity;
    if (this.size < this.capacity) this.size++;
  }

  getHeatmap(windowMs?: number): ReadonlyArray<HeatmapPoint> {
    const cutoff = windowMs ? Date.now() - windowMs : 0;
    const points: HeatmapPoint[] = [];
    for (let i = 0; i < this.size; i++) {
      const r = this.buffer[i];
      if (!r) continue;
      if (r.timestamp >= cutoff) {
        points.push({
          channelType: r.channelType,
          sourceNode: r.sourceNode,
          targetNode: r.targetNode,
          messageRate: r.messageRate,
          avgLatency: r.avgLatency,
          errorRate: r.errorRate,
          timestamp: r.timestamp,
        });
      }
    }
    return points.sort((a, b) => b.messageRate - a.messageRate);
  }

  getChannelSummary(channelType: QiChannelType): {
    totalRate: number;
    avgLatency: number;
    errorRate: number;
    activeFlows: number;
  } {
    let totalRate = 0;
    let totalLatency = 0;
    let totalErrorRate = 0;
    let count = 0;
    for (let i = 0; i < this.size; i++) {
      const r = this.buffer[i];
      if (!r) continue;
      if (r.channelType === channelType) {
        totalRate += r.messageRate;
        totalLatency += r.avgLatency;
        totalErrorRate += r.errorRate;
        count++;
      }
    }
    return {
      totalRate,
      avgLatency: count > 0 ? totalLatency / count : 0,
      errorRate: count > 0 ? totalErrorRate / count : 0,
      activeFlows: count,
    };
  }

  static getHeatLevel(rate: number): 'cold' | 'warm' | 'hot' | 'blazing' {
    if (rate < 10) return 'cold';
    if (rate <= 50) return 'warm';
    if (rate <= 200) return 'hot';
    return 'blazing';
  }
}
