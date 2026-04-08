/**
 * 人气通道 — 横向通道
 * 帛书《道德经》乙本·四十二章："万物负阴而抱阳，冲气以为和"
 * 人与人之间的气息交流。同级模块间协作通信，不经上级中转。
 */

import { randomUUID } from 'node:crypto';
import type { DaoMessage, DaoMessagePriority } from '../types/message.js';
import type { HunyuanBus } from '../hunyuan.js';

export const REN_YAN = '::ren/yan' as const;
export const REN_XIN = '::ren/xin' as const;
export const REN_YUE = '::ren/yue' as const;

const VALID_REN_QUI_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['daoChronos', 'daotimes'],
  ['daoSpaces', 'daoAgents'],
  ['daoSkilLs', 'daoNexus'],
  ['daoApps', 'daoPages'],
  ['daoApps', 'daoDocs'],
  ['daoPages', 'daoDocs'],
] as const;

function isValidPair(a: string, b: string): boolean {
  return VALID_REN_QUI_PAIRS.some(
    (pair) => (pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a),
  );
}

interface PendingConflict {
  from: string;
  to: string;
  messageType: string;
  payload: unknown;
  timestamp: number;
}

export class RenQiChannel {
  private bus: HunyuanBus;
  private openPorts = new Map<string, Set<string>>();
  private pendingConflicts = new Array<PendingConflict>();

  constructor(bus: HunyuanBus) {
    this.bus = bus;
  }

  open(localNodeId: string, remoteNodeId: string): boolean {
    if (!isValidPair(localNodeId, remoteNodeId)) return false;
    if (!this.openPorts.has(localNodeId)) {
      this.openPorts.set(localNodeId, new Set());
    }
    this.openPorts.get(localNodeId)!.add(remoteNodeId);
    return true;
  }

  close(localNodeId: string, remoteNodeId: string): void {
    this.openPorts.get(localNodeId)?.delete(remoteNodeId);
    this.openPorts.get(remoteNodeId)?.delete(localNodeId);
  }

  async send(
    from: string,
    to: string,
    messageType: string,
    payload: unknown,
  ): Promise<void> {
    if (!this.isOpen(from, to) || !this.isOpen(to, from)) {
      throw new Error(`人气端口未开放: ${from} <-> ${to}`);
    }
    const conflict = this.pendingConflicts.find(
      (c) => c.from === to && c.to === from && Date.now() - c.timestamp < 100,
    );

    if (conflict) {
      await this.arbitrate(conflict, { from, to, messageType, payload, timestamp: Date.now() });
      return;
    }

    const message: DaoMessage = {
      header: {
        id: randomUUID(),
        type: messageType,
        source: from,
        target: to,
        priority: 1 as DaoMessagePriority,
        ttl: 2,
        timestamp: Date.now(),
        encoding: 'json',
      },
      body: typeof payload === 'object' && payload !== null
        ? (payload as Record<string, unknown>)
        : { value: payload },
    };
    await this.bus.send(message);
  }

  isOpen(localNodeId: string, remoteNodeId: string): boolean {
    return this.openPorts.get(localNodeId)?.has(remoteNodeId) ?? false;
  }

  listOpenPorts(localNodeId: string): ReadonlyArray<string> {
    return [...(this.openPorts.get(localNodeId) ?? [])];
  }

  private async arbitrate(
    existing: PendingConflict,
    incoming: { from: string; to: string; messageType: string; payload: unknown; timestamp: number },
  ): Promise<void> {
    const winner = existing.timestamp <= incoming.timestamp ? existing : incoming;

    const message: DaoMessage = {
      header: {
        id: randomUUID(),
        type: winner.messageType,
        source: winner.from,
        target: winner.to,
        priority: 1 as DaoMessagePriority,
        ttl: 2,
        timestamp: winner.timestamp,
        encoding: 'json',
      },
      body: typeof winner.payload === 'object' && winner.payload !== null
        ? (winner.payload as Record<string, unknown>)
        : { value: winner.payload },
    };
    this.pendingConflicts = this.pendingConflicts.filter((c) => c !== existing);
    await this.bus.send(message);
  }
}
