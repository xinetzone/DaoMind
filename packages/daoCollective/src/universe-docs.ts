/** DaoUniverseDocs — 道宇宙知识图谱 × 哲学文档管理
 * 帛书依据："知常曰明，不知常，妄作凶"（德经·十六章）
 *           "为学日益，为道日损"（乙本·四十八章）
 *
 * 架构：DaoUniverseAudit → DaoUniverseDocs（知识图谱 + 哲学验证门控发布）
 *       文档通过内联哲学验证后方可发布，知识图谱连接语义关系
 *
 *   DaoUniverse
 *      └── DaoUniverseAudit
 *              └── DaoUniverseDocs  ← 知识图谱 × 哲学文档管理
 */

import { DaoDocStore, DaoKnowledgeGraph, DaoVersionTracker, DaoApiDocs } from '@daomind/docs';
import type {
  DaoDocEntry,
  DaoApiDescription,
  DaoVersionRecord,
} from '@daomind/docs';
import type { DaoUniverseAudit } from './universe-audit';

/** 内联哲学验证结果 */
export interface DocAuditResult {
  readonly docId:     string;
  readonly passed:    boolean;
  readonly issues:    readonly string[];
  readonly timestamp: number;
}

/** 文档系统综合快照 */
export interface DocsSnapshot {
  readonly timestamp:       number;
  readonly totalDocs:       number;
  readonly knowledgeNodes:  number;
  readonly currentVersion:  string | null;
  readonly publishedCount:  number;
  readonly recentAudit:     DocAuditResult | null;
}

export class DaoUniverseDocs {
  private readonly _docStore:       DaoDocStore;
  private readonly _knowledgeGraph: DaoKnowledgeGraph;
  private readonly _versionTracker: DaoVersionTracker;
  private readonly _apiDocs:        DaoApiDocs;

  /** 已通过哲学验证并发布的 doc id 集合 */
  private readonly _published = new Set<string>();
  private _lastAuditResult: DocAuditResult | null = null;

  constructor(private readonly _audit: DaoUniverseAudit) {
    // 全新独立实例，不污染 daoDocs 全局单例
    this._docStore       = new DaoDocStore();
    this._knowledgeGraph = new DaoKnowledgeGraph();
    this._versionTracker = new DaoVersionTracker();
    this._apiDocs        = new DaoApiDocs();
  }

  // ── 文档 CRUD ─────────────────────────────────────────────────────────────

  /**
   * addDoc — 添加文档到 docStore 并自动添加为 knowledge graph 节点
   * @returns 生成的 doc id
   */
  addDoc(entry: Omit<DaoDocEntry, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = this._docStore.add(entry);
    // 自动以 doc 为节点加入知识图谱
    this._knowledgeGraph.addNode({ id, label: entry.title, type: entry.type });
    return id;
  }

  /**
   * removeDoc — 从 docStore 和 knowledge graph 同时移除
   */
  removeDoc(id: string): boolean {
    const removed = this._docStore.remove(id);
    if (removed) {
      this._knowledgeGraph.removeNode(id);
      this._published.delete(id);
    }
    return removed;
  }

  /**
   * getDoc — 获取单个文档
   */
  getDoc(id: string): DaoDocEntry | undefined {
    return this._docStore.get(id);
  }

  /**
   * searchDocs — 全文搜索
   */
  searchDocs(query: string): ReadonlyArray<DaoDocEntry> {
    return this._docStore.search(query);
  }

  /**
   * updateDoc — 更新文档内容
   */
  updateDoc(
    id: string,
    partial: Partial<Pick<DaoDocEntry, 'content' | 'title' | 'tags' | 'version'>>,
  ): boolean {
    return this._docStore.update(id, partial);
  }

  // ── 知识图谱 ───────────────────────────────────────────────────────────────

  /**
   * connect — 建立两个文档节点之间的语义连接
   */
  connect(fromId: string, toId: string, relation: string, weight = 1): void {
    this._knowledgeGraph.addConnection(fromId, toId, relation, weight);
  }

  /**
   * knowledgeStats — 知识图谱统计信息
   */
  knowledgeStats(): { nodeCount: number; edgeCount: number } {
    const stats = this._knowledgeGraph.getStats();
    return { nodeCount: stats.nodeCount, edgeCount: stats.edgeCount };
  }

  // ── 版本追踪 ───────────────────────────────────────────────────────────────

  /**
   * recordVersion — 记录版本变更历史
   */
  recordVersion(record: Omit<DaoVersionRecord, 'date'>): void {
    this._versionTracker.record(record);
  }

  /**
   * currentVersion — 当前版本字符串（无记录时返回 null）
   */
  currentVersion(): string | null {
    return this._versionTracker.getCurrentVersion();
  }

  /**
   * versionHistory — 版本历史列表
   */
  versionHistory(limit?: number): ReadonlyArray<DaoVersionRecord> {
    return this._versionTracker.getHistory(limit);
  }

  /**
   * generateChangelog — 生成变更日志 Markdown 字符串
   */
  generateChangelog(sinceVersion?: string): string {
    return this._versionTracker.generateChangelog(sinceVersion);
  }

  // ── API 文档 ───────────────────────────────────────────────────────────────

  /**
   * addApi — 添加 API 文档描述（注册到 @daomind/docs DaoApiDocs）
   * @returns API path（唯一标识）
   */
  addApi(api: Omit<DaoApiDescription, 'version'>): string {
    this._apiDocs.registerApi(api);
    return api.path;
  }

  /**
   * getApi — 按 path + method 获取 API 描述
   */
  getApi(path: string, method: DaoApiDescription['method']): DaoApiDescription | undefined {
    return this._apiDocs.getApi(path, method);
  }

  // ── 哲学验证 & 发布门控 ───────────────────────────────────────────────────

  /**
   * verifyDoc — 内联哲学验证（不触发文件系统扫描）
   *
   * 检查规则：
   * 1. 文档必须存在
   * 2. 标题不能为空
   * 3. 内容不能为空
   * 4. 内容长度 ≥ 10 字符
   * 5. 版本号必须符合语义版本规范（x.y.z）
   */
  verifyDoc(id: string): DocAuditResult {
    const doc       = this._docStore.get(id);
    const timestamp = Date.now();

    if (!doc) {
      this._lastAuditResult = { docId: id, passed: false, issues: ['文档不存在'], timestamp };
      return this._lastAuditResult;
    }

    const issues: string[] = [];
    if (!doc.title.trim())                    issues.push('标题不能为空');
    if (!doc.content.trim())                  issues.push('内容不能为空');
    if (doc.content.length < 10)              issues.push('内容过短（< 10 字符）');
    if (!/^\d+\.\d+\.\d+/.test(doc.version)) issues.push('版本号不符合语义版本规范');

    this._lastAuditResult = { docId: id, passed: issues.length === 0, issues, timestamp };
    return this._lastAuditResult;
  }

  /**
   * publishDoc — 哲学验证通过后发布文档
   *
   * 通过：加入 _published 集合，返回 passed: true 的 DocAuditResult
   * 不通过：不发布，返回 passed: false 及 issues
   */
  publishDoc(id: string): DocAuditResult {
    const result = this.verifyDoc(id);
    if (result.passed) this._published.add(id);
    return result;
  }

  /**
   * getPublished — 已发布的 doc id 列表
   */
  getPublished(): ReadonlyArray<string> {
    return [...this._published];
  }

  /**
   * isPublished — 检查文档是否已通过验证并发布
   */
  isPublished(id: string): boolean {
    return this._published.has(id);
  }

  // ── 快照 ──────────────────────────────────────────────────────────────────

  /**
   * snapshot — 文档系统综合快照（同步，无文件系统扫描）
   */
  snapshot(): DocsSnapshot {
    const stats = this.knowledgeStats();
    return {
      timestamp:      Date.now(),
      totalDocs:      this._docStore.listAll().length,
      knowledgeNodes: stats.nodeCount,
      currentVersion: this.currentVersion(),
      publishedCount: this._published.size,
      recentAudit:    this._lastAuditResult,
    };
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get audit():           DaoUniverseAudit   { return this._audit;           }
  get docStore():        DaoDocStore        { return this._docStore;        }
  get knowledgeGraph():  DaoKnowledgeGraph  { return this._knowledgeGraph;  }
  get versionTracker():  DaoVersionTracker  { return this._versionTracker;  }
}
