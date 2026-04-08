// 帛书依据："埏埴以为器，当其无，有器之用"（德经·十一章）
// 设计原则：连接管理器维护节点间的通信管道
// 有之以为利，无之以为用——连接即"器"，消息即"用"

import type { ConnectionType, ConnectionState, ConnectionHandle, DaoConnection } from './types.js';

const DEFAULT_MAX_CONNECTIONS = 50;
const DEFAULT_IDLE_TIMEOUT = 300000;

class DaoConnectionManager {
  private readonly connections = new Map<ConnectionHandle, DaoConnection>();
  private readonly remoteIndex = new Map<string, ConnectionHandle[]>();
  private maxConnections: number;
  private idleTimeout: number;

  constructor(maxConnections?: number, idleTimeout?: number) {
    this.maxConnections = maxConnections ?? DEFAULT_MAX_CONNECTIONS;
    this.idleTimeout = idleTimeout ?? DEFAULT_IDLE_TIMEOUT;
  }

  connect(remoteId: string, type: ConnectionType): ConnectionHandle {
    const activeCount = this.getActiveConnections().length;
    if (activeCount >= this.maxConnections) {
      throw new Error(`[daoNexus] 达到最大连接数限制 (${this.maxConnections})`);
    }

    const handle = Symbol(`conn-${remoteId}`);
    const now = Date.now();
    const connection: DaoConnection = {
      handle,
      type,
      state: 'pending',
      remoteId,
      createdAt: now,
      lastActiveAt: now,
      messageCount: 0,
    };

    this.connections.set(handle, connection);
    const existing = this.remoteIndex.get(remoteId) ?? [];
    existing.push(handle);
    this.remoteIndex.set(remoteId, existing);

    (connection as { state: ConnectionState }).state = 'established';
    return handle;
  }

  disconnect(handle: ConnectionHandle): boolean {
    const conn = this.connections.get(handle);
    if (!conn || conn.state === 'closed') return false;

    (conn as { state: ConnectionState }).state = 'closing';
    this.removeFromRemoteIndex(conn.remoteId, handle);
    (conn as { state: ConnectionState }).state = 'closed';
    return this.connections.delete(handle);
  }

  getConnection(handle: ConnectionHandle): DaoConnection | undefined {
    return this.connections.get(handle);
  }

  getConnectionsByRemote(remoteId: string): ReadonlyArray<DaoConnection> {
    const handles = this.remoteIndex.get(remoteId) ?? [];
    const result: DaoConnection[] = [];
    for (const h of handles) {
      const conn = this.connections.get(h);
      if (conn && conn.state !== 'closed') {
        result.push(conn);
      }
    }
    return result;
  }

  getActiveConnections(): ReadonlyArray<DaoConnection> {
    const result: DaoConnection[] = [];
    for (const conn of this.connections.values()) {
      if (conn.state === 'established') {
        result.push(conn);
      }
    }
    return result;
  }

  async sendMessage(handle: ConnectionHandle, _data: unknown): Promise<void> {
    const conn = this.connections.get(handle);
    if (!conn) {
      throw new Error(`[daoNexus] 连接不存在`);
    }
    if (conn.state !== 'established') {
      throw new Error(`[daoNexus] 连接不可用 (${conn.state})`);
    }

    (conn as { lastActiveAt: number }).lastActiveAt = Date.now();
    (conn as { messageCount: number }).messageCount = conn.messageCount + 1;
  }

  cleanupIdle(): number {
    const now = Date.now();
    let cleaned = 0;
    for (const [handle, conn] of this.connections) {
      if (conn.state === 'established' && now - conn.lastActiveAt > this.idleTimeout) {
        (conn as { state: ConnectionState }).state = 'closing';
        cleaned++;
      }
    }
    return cleaned;
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  getActiveCount(): number {
    return this.getActiveConnections().length;
  }

  private removeFromRemoteIndex(remoteId: string, handle: ConnectionHandle): void {
    const handles = this.remoteIndex.get(remoteId);
    if (handles) {
      const filtered = handles.filter((h) => h !== handle);
      if (filtered.length > 0) {
        this.remoteIndex.set(remoteId, filtered);
      } else {
        this.remoteIndex.delete(remoteId);
      }
    }
  }
}

export const daoConnectionManager = new DaoConnectionManager();
export { DaoConnectionManager };
