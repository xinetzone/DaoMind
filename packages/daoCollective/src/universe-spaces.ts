/** DaoUniverseSpaces — 道宇宙命名空间 × 服务网格路由归位
 * 帛书依据："知足者富，强行者有志"（德经·三十三章）
 *           "为而不争"（德经·八十一章）
 *
 * 架构：DaoUniverseNexus → DaoUniverseSpaces
 *       每个 space 自动注册为 nexus 服务（endpoint: space://<id>），
 *       路由层可按命名空间层级寻址，实现"知足"的资源归位。
 *
 *   DaoUniverse
 *      └── DaoUniverseMonitor
 *              └── DaoUniverseNexus
 *                      └── DaoUniverseSpaces  ← 命名空间 × 服务网格路由归位
 */

import { DaoNamespaceManager } from '@daomind/spaces';
import type { DaoSpace, DaoSpaceId, DaoResourceLocator } from '@daomind/spaces';
import type { DaoUniverseNexus } from './universe-nexus';

/** 空间系统综合快照 */
export interface SpacesSnapshot {
  readonly timestamp:         number;
  readonly totalSpaces:       number;
  readonly rootCount:         number;
  /** nexus.healthCheck() 返回的服务总数（含 space 外注册的服务） */
  readonly nexusServiceCount: number;
}

export class DaoUniverseSpaces {
  /** 独立命名空间管理器，不污染全局 daoNamespace 单例 */
  private readonly _namespace: DaoNamespaceManager;

  constructor(private readonly _nexus: DaoUniverseNexus) {
    this._namespace = new DaoNamespaceManager();
  }

  // ── 空间管理 ──────────────────────────────────────────────────────────────

  /**
   * createSpace — 创建命名空间并同步注册到 nexus 服务网格
   *
   * - 在 DaoNamespaceManager 中创建空间
   * - 自动向 nexus 注册服务：{ id: spaceId, name, version:'1.0.0', endpoint:`space://${spaceId}` }
   * - 标记服务为健康
   * @returns 生成的 DaoSpaceId
   */
  createSpace(name: string, parent?: DaoSpaceId): DaoSpaceId {
    const spaceId = this._namespace.createSpace(name, parent);
    this._nexus.register({
      id:       spaceId,
      name,
      version:  '1.0.0',
      endpoint: `space://${spaceId}`,
    });
    this._nexus.markHealthy(spaceId, true);
    return spaceId;
  }

  /**
   * removeSpace — 移除空间并同步从 nexus 注销服务
   *
   * 注意：若该空间仍有子空间，DaoNamespaceManager 会抛出异常
   * @returns true（成功移除），false（空间不存在）
   */
  removeSpace(id: DaoSpaceId): boolean {
    const removed = this._namespace.removeSpace(id);
    if (removed) this._nexus.deregister(id);
    return removed;
  }

  /**
   * getSpace — 获取单个空间信息
   */
  getSpace(id: DaoSpaceId): DaoSpace | undefined {
    return this._namespace.getSpace(id);
  }

  /**
   * getChildren — 获取指定空间的直接子空间列表
   */
  getChildren(parentId: DaoSpaceId): ReadonlyArray<DaoSpace> {
    return this._namespace.getChildren(parentId);
  }

  /**
   * getRootSpaces — 获取所有根空间（无父节点）
   */
  getRootSpaces(): ReadonlyArray<DaoSpace> {
    return this._namespace.getRootSpaces();
  }

  // ── 路径解析 ──────────────────────────────────────────────────────────────

  /**
   * resolve — 按命名空间层级解析资源定位器为完整路径数组
   *
   * 例：空间层级 root > child，locator { space: childId, path: ['api','v1'] }
   *     → ['root', 'child', 'api', 'v1']
   *
   * @throws 若 spaceId 不存在
   */
  resolve(locator: DaoResourceLocator): string[] {
    return this._namespace.resolvePath(locator);
  }

  // ── 空间路由 ──────────────────────────────────────────────────────────────

  /**
   * routeSpace — 将 URL pattern 路由到指定 space 的 nexus 服务 endpoint
   *
   * 使 nexus.dispatch({ path: pattern, ... }) 可找到对应 space 的服务
   * @param pattern  URL 路由匹配模式（如 '/space/users/*'）
   * @param spaceId  目标空间 ID
   */
  routeSpace(pattern: string, spaceId: DaoSpaceId): void {
    this._nexus.addRoute({ pattern, target: `space://${spaceId}`, priority: 1, weight: 1 });
  }

  // ── 快照 ──────────────────────────────────────────────────────────────────

  /**
   * snapshot — 空间系统综合快照（同步）
   */
  snapshot(): SpacesSnapshot {
    return {
      timestamp:         Date.now(),
      totalSpaces:       this._countAllSpaces(),
      rootCount:         this._namespace.getRootSpaces().length,
      nexusServiceCount: this._nexus.healthCheck().length,
    };
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get nexus():     DaoUniverseNexus  { return this._nexus;     }
  get namespace(): DaoNamespaceManager { return this._namespace; }

  // ── Private ───────────────────────────────────────────────────────────────

  private _countAllSpaces(): number {
    const roots = this._namespace.getRootSpaces();
    let total = 0;
    const count = (spaces: ReadonlyArray<DaoSpace>): void => {
      for (const space of spaces) {
        total++;
        count(this._namespace.getChildren(space.id));
      }
    };
    count(roots);
    return total;
  }
}
