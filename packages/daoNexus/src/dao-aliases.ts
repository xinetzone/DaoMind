/**
 * dao 前缀类型别名 — 命名规范对齐
 * 帛书依据：「道可道，非常名」— 以道为名，体现自然本性
 */
import type { ConnectionType, ConnectionState, LoadBalanceStrategy } from './types.js';

/** 连接类型 dao 前缀别名 */
export type DaoConnectionType = ConnectionType;
/** 连接状态 dao 前缀别名 */
export type DaoConnectionState = ConnectionState;
/** 负载均衡策略 dao 前缀别名 */
export type DaoLoadBalanceStrategy = LoadBalanceStrategy;
