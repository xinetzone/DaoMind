/** DaoUniverseNexus — 道宇宙服务网格 × 健康监控
 * 帛书依据："万物负阴而抱阳，冲气以为和"（德经·四十二章）
 *           "知人者智，自知者明"（德经·三十三章）
 *
 * 架构：DaoUniverseMonitor.health() + DaoUniverseClock.onTick() → Nexus 健康快照
 *       服务注册 / 路由 / 负载均衡 / 健康状态 均由 Universe 监控层感知
 *
 *   DaoUniverse
 *      └── DaoUniverseMonitor
 *              ├── DaoUniverseClock
 *              │       └── ...
 *              └── DaoUniverseNexus  ← 服务网格 × 宇宙健康双向可观测
 */

import { DaoServiceDiscovery, DaoNexusRouter, DaoLoadBalancer } from '@daomind/nexus';
import type { DaoNexusRequest, DaoRouteRule } from '@daomind/nexus';
import type { DaoUniverseMonitor } from './universe-monitor';
import type { DaoUniverseClock } from './universe-clock';

const MAX_HEALTH_RECORDS = 100;

/** 服务网格健康快照 */
export interface NexusHealthRecord {
  readonly timestamp:       number;
  readonly systemHealth:    number;   // 来自 DaoUniverseMonitor.health()
  readonly totalServices:   number;
  readonly healthyServices: number;
  readonly totalRequests:   number;
  readonly successRate:     number;
}

/** 请求调度结果 */
export interface NexusDispatchResult {
  readonly status:    'dispatched' | 'no-service' | 'no-target';
  readonly target:    string | null;
  readonly latencyMs: number;
}

/** Nexus 运行时指标 */
export interface NexusMetrics {
  readonly totalRequests: number;
  readonly successCount:  number;
  readonly failureCount:  number;
  readonly successRate:   number;
}

export class DaoUniverseNexus {
  private readonly _discovery:    DaoServiceDiscovery;
  private readonly _router:       DaoNexusRouter;
  private readonly _loadBalancer: DaoLoadBalancer;

  private _unsubscribe?: () => void;
  private readonly _healthHistory: NexusHealthRecord[] = [];

  private _totalRequests = 0;
  private _successCount  = 0;
  private _failCount     = 0;

  constructor(
    private readonly _monitor: DaoUniverseMonitor,
    private readonly _clock:   DaoUniverseClock,
  ) {
    this._discovery    = new DaoServiceDiscovery();
    this._router       = new DaoNexusRouter();
    this._loadBalancer = new DaoLoadBalancer();
  }

  // ── 生命周期订阅 ──────────────────────────────────────────────────────────

  /**
   * attach — 订阅 Clock.onTick() → _syncHealth()（幂等）
   * 每次心跳录制 Universe 健康 + 服务网格状态快照
   */
  attach(): void {
    if (this._unsubscribe) return;
    this._unsubscribe = this._clock.onTick(() => {
      this._syncHealth();
    });
  }

  /**
   * detach — 取消订阅（幂等）
   */
  detach(): void {
    if (!this._unsubscribe) return;
    this._unsubscribe();
    this._unsubscribe = undefined;
  }

  // ── 服务管理 ──────────────────────────────────────────────────────────────

  /**
   * register — 注册服务实例
   */
  register(service: { id: string; name: string; version: string; endpoint: string }): void {
    this._discovery.register(service);
  }

  /**
   * deregister — 注销服务
   */
  deregister(id: string): boolean {
    return this._discovery.deregister(id);
  }

  /**
   * discover — 发现指定名称的所有健康服务
   */
  discover(name: string): ReadonlyArray<{ id: string; version: string; endpoint: string }> {
    return this._discovery.discover(name);
  }

  /**
   * markHealthy — 手动设置服务健康状态
   */
  markHealthy(id: string, healthy: boolean): boolean {
    return this._discovery.markHealthy(id, healthy);
  }

  /**
   * healthCheck — 所有服务健康状态列表
   */
  healthCheck(): ReadonlyArray<{ id: string; healthy: boolean }> {
    return this._discovery.healthCheck();
  }

  // ── 路由管理 ──────────────────────────────────────────────────────────────

  /**
   * addRoute — 添加路由规则
   */
  addRoute(rule: DaoRouteRule): void {
    this._router.addRule(rule);
  }

  /**
   * removeRoute — 删除路由规则
   */
  removeRoute(pattern: string): boolean {
    return this._router.removeRule(pattern);
  }

  // ── 请求调度 ──────────────────────────────────────────────────────────────

  /**
   * dispatch — 服务发现 → 路由 → 负载均衡 → NexusDispatchResult
   * 纯路由层（不维护实际连接），适合任务分发/服务寻址场景
   */
  async dispatch(request: DaoNexusRequest): Promise<NexusDispatchResult> {
    const start = Date.now();
    this._totalRequests++;

    const svcName    = request.path.split('/')[0] ?? '';
    const candidates = this._discovery.discover(svcName);

    if (candidates.length === 0) {
      this._failCount++;
      return { status: 'no-service', target: null, latencyMs: Date.now() - start };
    }

    // 构建候选路由规则（从 discovery 动态生成）
    const dynamicRules: DaoRouteRule[] = candidates.map((c) => ({
      pattern:  request.path,
      target:   c.endpoint,
      weight:   1,
      priority: 1,
    }));

    // 优先使用已注册路由规则
    const resolved      = this._router.resolve(request.path);
    const effectiveRules = resolved.length > 0 ? resolved : dynamicRules;

    const selected = this._loadBalancer.select(effectiveRules);
    if (!selected) {
      this._failCount++;
      return { status: 'no-target', target: null, latencyMs: Date.now() - start };
    }

    this._successCount++;
    return { status: 'dispatched', target: selected.target, latencyMs: Date.now() - start };
  }

  // ── 指标 & 健康 ──────────────────────────────────────────────────────────

  /**
   * metrics — Nexus 请求统计
   */
  metrics(): NexusMetrics {
    return {
      totalRequests: this._totalRequests,
      successCount:  this._successCount,
      failureCount:  this._failCount,
      successRate:   this._totalRequests > 0 ? this._successCount / this._totalRequests : 1,
    };
  }

  /**
   * healthHistory — 历史健康快照（最多 MAX_HEALTH_RECORDS 条）
   */
  healthHistory(limit?: number): ReadonlyArray<NexusHealthRecord> {
    if (!limit) return [...this._healthHistory];
    return this._healthHistory.slice(-limit);
  }

  /**
   * syncHealthNow — 手动触发一次健康快照录制（可在测试中直接调用）
   */
  syncHealthNow(): void {
    this._syncHealth();
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get isAttached():   boolean              { return !!this._unsubscribe;  }
  get monitor():      DaoUniverseMonitor   { return this._monitor;        }
  get clock():        DaoUniverseClock     { return this._clock;          }
  get discovery():    DaoServiceDiscovery  { return this._discovery;      }
  get router():       DaoNexusRouter       { return this._router;         }
  get loadBalancer(): DaoLoadBalancer      { return this._loadBalancer;   }

  // ── Private ───────────────────────────────────────────────────────────────

  private _syncHealth(): void {
    const systemHealth    = this._monitor.health();
    const checks          = this._discovery.healthCheck();
    const totalServices   = checks.length;
    const healthyServices = checks.filter((c) => c.healthy).length;
    const m               = this.metrics();

    this._healthHistory.push({
      timestamp: Date.now(),
      systemHealth,
      totalServices,
      healthyServices,
      totalRequests: m.totalRequests,
      successRate:   m.successRate,
    });

    if (this._healthHistory.length > MAX_HEALTH_RECORDS) {
      this._healthHistory.shift();
    }
  }
}
