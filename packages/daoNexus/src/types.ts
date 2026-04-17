// 帛书依据："万物负阴而抱阳，中气以为和"（德经·四十二章）
// 设计原则：枢纽中心定义连接、路由与负载均衡的类型契约
// 气之贯通，使内外相通、上下相得

/** 连接类型 */
export type ConnectionType = 'inbound' | 'outbound' | 'bidirectional';

/** 连接状态 */
export type ConnectionState = 'pending' | 'established' | 'closing' | 'closed';

/** 连接句柄 */
export type ConnectionHandle = symbol;

/** 连接信息 */
export interface DaoConnection {
  readonly handle: ConnectionHandle;
  readonly type: ConnectionType;
  readonly state: ConnectionState;
  readonly remoteId: string;
  readonly createdAt: number;
  readonly lastActiveAt: number;
  readonly messageCount: number;
}

/** 路由规则 */
export interface DaoRouteRule {
  readonly pattern: string;         // 路径匹配模式
  readonly target: string;          // 目标节点 ID
  readonly weight: number;          // 权重（负载均衡用）
  readonly priority: number;        // 优先级
}

/** 负载均衡策略 */
export type LoadBalanceStrategy = 'round-robin' | 'least-connections' | 'weighted';

/** 服务实例 */
export interface DaoServiceInstance {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly endpoint: string;
  readonly registeredAt: number;
  readonly healthy: boolean;
}

/** Nexus 请求 */
export interface DaoNexusRequest {
  readonly path: string;
  readonly payload: unknown;
}

/** Nexus 指标 */
export interface DaoNexusMetrics {
  readonly totalRequests: number;
  readonly successCount: number;
  readonly failureCount: number;
  readonly avgLatencyMs: number;
}
