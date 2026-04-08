// 帛书依据："万物负阴而抱阳，冲气以为和"（德经·四十二章）
// 设计原则：枢纽中心聚合连接管理、路由、负载均衡、服务发现与 Nexus 核心
// 实现内外贯通的统一协调能力

export type {
  ConnectionType,
  ConnectionState,
  ConnectionHandle,
  DaoConnection,
  DaoRouteRule,
  LoadBalanceStrategy,
  DaoServiceInstance,
  DaoNexusRequest,
  DaoNexusMetrics,
} from './types.js';

export { daoConnectionManager, DaoConnectionManager } from './connection-manager.js';
export { daoNexusRouter, DaoNexusRouter } from './router.js';
export { daoLoadBalancer, DaoLoadBalancer } from './load-balancer.js';
export { daoServiceDiscovery, DaoServiceDiscovery } from './service-discovery.js';
export { daoNexus, DaoNexus as DaoNexusCore } from './nexus.js';

export const daoNexusInfo = {
  name: '@dao/nexus',
  description: '枢纽中心 — 连接与协调的核心',
}
