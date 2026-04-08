/**
 * 消息路由器
 * 帛书《道德经》乙本·四十二章："万物负阴而抱阳，冲气以为和"
 * 路由器如"经络节点"，决定气流向何方
 */

import type { DaoMessage } from './types/message.js';

export class DaoRouter {
  private routes = new Map<string, Set<string>>();
  private droppedCount = 0;

  addRoute(target: string, nodeId: string): void {
    if (!this.routes.has(target)) {
      this.routes.set(target, new Set());
    }
    this.routes.get(target)!.add(nodeId);
  }

  removeRoute(target: string, nodeId: string): void {
    this.routes.get(target)?.delete(nodeId);
  }

  getSubscribers(target: string): ReadonlySet<string> {
    return this.routes.get(target) ?? new Set();
  }

  route(message: DaoMessage): ReadonlyArray<string> {
    if (message.header.ttl <= 0) {
      this.droppedCount++;
      return [];
    }
    if (!message.header.target) {
      const allNodes = new Set<string>();
    for (const nodes of this.routes.values()) {
      for (const n of nodes) allNodes.add(n);
    }
      return [...allNodes];
    }
    const subscribers = this.routes.get(message.header.target);
    return subscribers ? [...subscribers] : [];
  }

  getDroppedCount(): number {
    return this.droppedCount;
  }
}
