/**
 * 地气通道 — 上行通道
 * 帛书《道德经》乙本·四十二章："万物负阴而抱阳，中气以为和"
 * 地之气上升，报告万物之态。承载叶节点的度量数据、异常报告和需求信号。
 */

import { randomUUID } from 'node:crypto';
import type { DaoMessage, DaoMessagePriority } from '../types/message.js';
import type { HunyuanBus } from '../hunyuan.js';

export const DI_MAI = '::di/mai' as const;
export const DI_XIANG = '::di/xiang' as const;
export const DI_YI = '::di/yi' as const;
export const DI_GEN = '::di/gen' as const;

interface AggregationEntry {
  metrics: Record<string, number>;
  lastMetrics?: Record<string, number>;
  timestamp: number;
}

export class DiQiChannel {
  private bus: HunyuanBus;
  private aggregateWindowMs: number;
  private aggregationBuffer = new Map<string, AggregationEntry>();
  private totalReported = 0;
  private totalAggregated = 0;

  constructor(bus: HunyuanBus, aggregateWindowMs: number = 1000) {
    this.bus = bus;
    this.aggregateWindowMs = aggregateWindowMs;
  }

  async report(
    sourceId: string,
    messageType: string,
    metrics: Record<string, number>,
  ): Promise<void> {
    if (!this.bus['backpressure'].allow(sourceId)) return;
    this.totalReported++;

    const key = `${sourceId}::${messageType}`;
    const now = Date.now();
    const entry = this.aggregationBuffer.get(key);

    if (entry && (now - entry.timestamp) < this.aggregateWindowMs) {
      entry.lastMetrics = { ...entry.metrics };
      entry.metrics = { ...metrics };
      entry.timestamp = now;
      return;
    }

    if (entry) {
      await this.flushEntry(key, entry);
    }

    this.aggregationBuffer.set(key, {
      metrics: { ...metrics },
      lastMetrics: undefined,
      timestamp: now,
    });
  }

  async flushAll(): Promise<void> {
    for (const [key, entry] of this.aggregationBuffer) {
      await this.flushEntry(key, entry);
    }
    this.aggregationBuffer.clear();
  }

  private async flushEntry(
    key: string,
    entry: AggregationEntry,
  ): Promise<void> {
    const parts = key.split('::');
    const sourceId = parts[0] ?? '';
    const messageType = parts[1] ?? '';
    let body: Record<string, unknown>;

    if (entry.lastMetrics) {
      const delta: Record<string, number> = {};
      for (const k of Object.keys(entry.metrics)) {
        delta[k] = (entry.metrics[k] ?? 0) - (entry.lastMetrics[k] ?? 0);
      }
      body = { _delta: true, ...delta };
    } else {
      body = { _delta: false, ...entry.metrics };
    }

    this.totalAggregated++;
    const message: DaoMessage = {
      header: {
        id: randomUUID(),
        type: messageType,
        source: sourceId,
        target: 'daoCollective',
        priority: 2 as DaoMessagePriority,
        ttl: 5,
        timestamp: entry.timestamp,
        encoding: 'json',
      },
      body,
    };

    this.bus['backpressure'].record(sourceId);
    await this.bus.send(message);
  }

  getAggregationStats(): {
    totalReported: number;
    totalAggregated: number;
    compressionRatio: number;
  } {
    return {
      totalReported: this.totalReported,
      totalAggregated: this.totalAggregated,
      compressionRatio:
        this.totalReported > 0
          ? +(this.totalAggregated / this.totalReported).toFixed(4)
          : 0,
    };
  }

  getAggregateWindowMs(): number {
    return this.aggregateWindowMs;
  }
}
