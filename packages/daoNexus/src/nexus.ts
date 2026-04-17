// 帛书依据："万物负阴而抱阳，中气以为和"（德经·四十二章）
// 设计原则：Nexus 核心聚合连接管理、路由、负载均衡与服务发现
// 为枢纽中心提供统一的请求处理能力

import type { DaoNexusRequest, DaoNexusMetrics, DaoRouteRule } from './types';
import { daoConnectionManager, DaoConnectionManager } from './connection-manager';
import { daoNexusRouter, DaoNexusRouter } from './router';
import { daoLoadBalancer, DaoLoadBalancer } from './load-balancer';
import { daoServiceDiscovery, DaoServiceDiscovery } from './service-discovery';

class DaoNexus {
  private totalRequests = 0;
  private successCount = 0;
  private failureCount = 0;
  private totalLatency = 0;

  async handleRequest(request: DaoNexusRequest): Promise<unknown> {
    const startTime = Date.now();
    this.totalRequests++;

    try {
      const serviceName = request.path.split('/')[0] ?? '';
      const candidates = daoServiceDiscovery.discover(serviceName);

      if (candidates.length === 0) {
        this.failureCount++;
        throw new Error(`[daoNexus] 未找到服务: ${serviceName}`);
      }

      const rules: DaoRouteRule[] = candidates.map((c) => ({
        pattern: request.path,
        target: c.endpoint,
        weight: 1,
        priority: 1,
      }));

      const resolved = daoNexusRouter.resolve(request.path);
      const effectiveRules = resolved.length > 0 ? resolved : rules;

      const selected = daoLoadBalancer.select(effectiveRules);
      if (!selected) {
        this.failureCount++;
        throw new Error(`[daoNexus] 无可用目标`);
      }

      const connections = daoConnectionManager.getConnectionsByRemote(selected.target);
      let handle = connections[0]?.handle;

      if (!handle) {
        handle = daoConnectionManager.connect(selected.target, 'outbound');
      }

      await daoConnectionManager.sendMessage(handle, request.payload);

      const latency = Date.now() - startTime;
      this.totalLatency += latency;
      this.successCount++;

      return { target: selected.target, status: 'sent', latency };
    } catch (error) {
      const latency = Date.now() - startTime;
      this.totalLatency += latency;
      this.failureCount++;
      throw error;
    }
  }

  getMetrics(): DaoNexusMetrics {
    return {
      totalRequests: this.totalRequests,
      successCount: this.successCount,
      failureCount: this.failureCount,
      avgLatencyMs: this.totalRequests > 0 ? this.totalLatency / this.totalRequests : 0,
    };
  }

  resetMetrics(): void {
    this.totalRequests = 0;
    this.successCount = 0;
    this.failureCount = 0;
    this.totalLatency = 0;
  }

  get connectionManager(): DaoConnectionManager {
    return daoConnectionManager;
  }

  get router(): DaoNexusRouter {
    return daoNexusRouter;
  }

  get loadBalancer(): DaoLoadBalancer {
    return daoLoadBalancer;
  }

  get serviceDiscovery(): DaoServiceDiscovery {
    return daoServiceDiscovery;
  }
}

export const daoNexus = new DaoNexus();
export { DaoNexus };
