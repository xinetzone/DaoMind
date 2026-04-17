/**
 * 天气通道 — 下行通道
 * 帛书《道德经》乙本·四十二章："万物负阴而抱阳，中气以为和"
 * 天之气下降，滋养万物。承载来自根节点的全局性指令、配置变更和元数据更新。
 */

import { randomUUID } from 'node:crypto';
import type { DaoMessage, DaoMessagePriority } from '../types/message.js';
import type { HunyuanBus } from '../hunyuan.js';

export const DAO_ZHI = '::dao/zhi' as const;
export const TIAN_MING = '::tian/ming' as const;
export const TIAN_SHI = '::tian/shi' as const;
export const TIAN_JI = '::tian/ji' as const;

interface BroadcastOptions {
  priority?: number;
  ttl?: number;
}

export class TianQiChannel {
  private bus: HunyuanBus;
  private defaultTtl: number = 3;
  private sentMessageIds = new Set<string>();

  constructor(bus: HunyuanBus) {
    this.bus = bus;
  }

  async broadcast(
    messageType: string,
    body: Record<string, unknown>,
    options?: BroadcastOptions,
  ): Promise<void> {
    const id = randomUUID();
    if (this.sentMessageIds.has(id)) return;
    this.sentMessageIds.add(id);

    const headerPayload = JSON.stringify({
      id, type: messageType, source: 'daoCollective', target: undefined,
      priority: (options?.priority ?? 1) as DaoMessagePriority,
      ttl: options?.ttl ?? this.defaultTtl,
      timestamp: Date.now(),
    });
    const signature = this.bus['signer'].sign(headerPayload, 'root-secret');

    const message: DaoMessage = {
      header: {
        id,
        type: messageType,
        source: 'daoCollective',
        target: undefined,
        priority: (options?.priority ?? 1) as DaoMessagePriority,
        ttl: options?.ttl ?? this.defaultTtl,
        timestamp: Date.now(),
        signature,
        encoding: 'json',
      },
      body,
    };
    await this.bus.send(message);
  }

  async sendToNode(
    nodeId: string,
    messageType: string,
    body: Record<string, unknown>,
  ): Promise<void> {
    const id = randomUUID();
    if (this.sentMessageIds.has(id)) return;
    this.sentMessageIds.add(id);

    const headerPayload = JSON.stringify({
      id, type: messageType, source: 'daoCollective', target: nodeId,
      priority: 1 as DaoMessagePriority, ttl: this.defaultTtl,
      timestamp: Date.now(),
    });
    const signature = this.bus['signer'].sign(headerPayload, 'root-secret');

    const message: DaoMessage = {
      header: {
        id,
        type: messageType,
        source: 'daoCollective',
        target: nodeId,
        priority: 1,
        ttl: this.defaultTtl,
        timestamp: Date.now(),
        signature,
        encoding: 'json',
      },
      body,
    };
    await this.bus.send(message);
  }

  setTtl(defaultTtl: number): void {
    this.defaultTtl = Math.max(0, defaultTtl);
  }

  getSentCount(): number {
    return this.sentMessageIds.size;
  }
}
