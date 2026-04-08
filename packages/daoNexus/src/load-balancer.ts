// 帛书依据："天之道，损有余而补不足"（德经·七十七章）
// 设计原则：负载均衡器分配请求至最优目标
// 损有余补不足，使系统趋于均衡

import type { LoadBalanceStrategy, DaoRouteRule } from './types.js';

class DaoLoadBalancer {
  private strategy: LoadBalanceStrategy = 'round-robin';
  private roundRobinIndex = 0;

  setStrategy(strategy: LoadBalanceStrategy): void {
    this.strategy = strategy;
    this.roundRobinIndex = 0;
  }

  select(targets: ReadonlyArray<DaoRouteRule>): DaoRouteRule | null {
    if (targets.length === 0) return null;
    if (targets.length === 1) return targets[0] ?? null;

    switch (this.strategy) {
      case 'round-robin':
        return this.selectRoundRobin(targets);
      case 'least-connections':
        return this.selectLeastConnections(targets);
      case 'weighted':
        return this.selectWeighted(targets);
      default:
        return targets[0] ?? null;
    }
  }

  getStrategy(): LoadBalanceStrategy {
    return this.strategy;
  }

  private selectRoundRobin(targets: ReadonlyArray<DaoRouteRule>): DaoRouteRule | null {
    const idx = this.roundRobinIndex % targets.length;
    this.roundRobinIndex++;
    return targets[idx] ?? null;
  }

  private selectLeastConnections(targets: ReadonlyArray<DaoRouteRule>): DaoRouteRule | null {
    let selected: DaoRouteRule | undefined;
    let minWeight: number | undefined;
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      if (target == null) continue;
      if (minWeight == null || target.weight < minWeight) {
        minWeight = target.weight;
        selected = target;
      }
    }
    return selected ?? null;
  }

  private selectWeighted(targets: ReadonlyArray<DaoRouteRule>): DaoRouteRule | null {
    const totalWeight = targets.reduce((sum, t) => sum + (t != null ? Math.max(t.weight, 1) : 0), 0);
    if (totalWeight <= 0) return targets[targets.length - 1] ?? null;
    let random = Math.random() * totalWeight;
    for (const target of targets) {
      if (target == null) continue;
      random -= Math.max(target.weight, 1);
      if (random <= 0) return target;
    }
    return targets[targets.length - 1] ?? null;
  }
}

export const daoLoadBalancer = new DaoLoadBalancer();
export { DaoLoadBalancer };
