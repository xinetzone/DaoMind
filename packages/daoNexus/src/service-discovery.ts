// 帛书依据："知人者智，自知者明"（德经·三十三章）
// 设计原则：服务发现器注册与定位可用服务
// 知人所以智，自知所以明——发现他人亦需自知其健康状态

import type { DaoServiceInstance } from './types.js';

class DaoServiceDiscovery {
  private readonly services = new Map<string, DaoServiceInstance>();

  register(service: { id: string; name: string; version: string; endpoint: string }): void {
    if (this.services.has(service.id)) {
      throw new Error(`[daoNexus] 服务已注册: ${service.id}`);
    }
    const instance: DaoServiceInstance = {
      ...service,
      registeredAt: Date.now(),
      healthy: true,
    };
    this.services.set(service.id, instance);
  }

  deregister(id: string): boolean {
    return this.services.delete(id);
  }

  discover(name: string): ReadonlyArray<{ id: string; version: string; endpoint: string }> {
    const result: { id: string; version: string; endpoint: string }[] = [];
    for (const svc of this.services.values()) {
      if (svc.name === name && svc.healthy) {
        result.push({
          id: svc.id,
          version: svc.version,
          endpoint: svc.endpoint,
        });
      }
    }
    return result;
  }

  healthCheck(): ReadonlyArray<{ id: string; healthy: boolean }> {
    const result: { id: string; healthy: boolean }[] = [];
    for (const [id, svc] of this.services) {
      result.push({ id, healthy: svc.healthy });
    }
    return result;
  }

  markHealthy(id: string, healthy: boolean): boolean {
    const svc = this.services.get(id);
    if (!svc) return false;
    (svc as { healthy: boolean }).healthy = healthy;
    return true;
  }

  getById(id: string): DaoServiceInstance | undefined {
    return this.services.get(id);
  }

  listAll(): ReadonlyArray<DaoServiceInstance> {
    return Array.from(this.services.values());
  }
}

export const daoServiceDiscovery = new DaoServiceDiscovery();
export { DaoServiceDiscovery };
