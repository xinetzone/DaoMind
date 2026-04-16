/**
 * DaoUniverseDocs 测试套件
 * "知常曰明，不知常，妄作凶"（德经·十六章）
 *
 * 验证：构建 / CRUD / 知识图谱 / 版本追踪 / API文档 / verifyDoc / publishDoc / snapshot / E2E
 */

import { daoNothingVoid } from '@daomind/nothing';
import { DaoUniverse } from '../universe';
import { DaoUniverseAudit } from '../universe-audit';
import { DaoUniverseDocs } from '../universe-docs';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeStack() {
  const universe = new DaoUniverse();
  const audit    = new DaoUniverseAudit(universe);
  const docs     = new DaoUniverseDocs(audit);
  return { universe, audit, docs };
}

function sampleEntry(overrides: Partial<{
  type: 'api' | 'guide' | 'reference' | 'changelog';
  title: string;
  content: string;
  version: string;
}> = {}) {
  return {
    type:    (overrides.type    ?? 'guide') as 'guide',
    title:   overrides.title   ?? '快速入门指南',
    content: overrides.content ?? '这是一篇快速入门指南，介绍如何使用 DaoMind 系统。',
    version: overrides.version ?? '1.0.0',
    tags:    ['tutorial'] as readonly string[],
  };
}

// ── setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  daoNothingVoid.void();
});

// ── 1. 构建 ───────────────────────────────────────────────────────────────────

describe('构建', () => {
  test('可构建 DaoUniverseDocs', () => {
    const { docs } = makeStack();
    expect(docs).toBeDefined();
  });

  test('audit getter 返回关联的 DaoUniverseAudit', () => {
    const { docs, audit } = makeStack();
    expect(docs.audit).toBe(audit);
  });

  test('docStore getter 已初始化', () => {
    const { docs } = makeStack();
    expect(docs.docStore).toBeDefined();
  });

  test('knowledgeGraph getter 已初始化', () => {
    const { docs } = makeStack();
    expect(docs.knowledgeGraph).toBeDefined();
  });

  test('versionTracker getter 已初始化', () => {
    const { docs } = makeStack();
    expect(docs.versionTracker).toBeDefined();
  });
});

// ── 2. addDoc / removeDoc / getDoc / searchDocs ───────────────────────────────

describe('文档 CRUD', () => {
  test('addDoc 返回生成的 id', () => {
    const { docs } = makeStack();
    const id = docs.addDoc(sampleEntry());
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  test('addDoc 后 getDoc 可取回文档', () => {
    const { docs } = makeStack();
    const id  = docs.addDoc(sampleEntry({ title: '独特标题' }));
    const doc = docs.getDoc(id);
    expect(doc?.title).toBe('独特标题');
  });

  test('addDoc 同时创建 knowledge graph 节点', () => {
    const { docs } = makeStack();
    docs.addDoc(sampleEntry());
    expect(docs.knowledgeStats().nodeCount).toBe(1);
  });

  test('removeDoc 删除文档并同步删除图节点', () => {
    const { docs } = makeStack();
    const id = docs.addDoc(sampleEntry());
    expect(docs.removeDoc(id)).toBe(true);
    expect(docs.getDoc(id)).toBeUndefined();
    expect(docs.knowledgeStats().nodeCount).toBe(0);
  });

  test('searchDocs 全文搜索命中标题', () => {
    const { docs } = makeStack();
    docs.addDoc(sampleEntry({ title: '高级架构设计' }));
    docs.addDoc(sampleEntry({ title: '基础教程入门' }));
    const results = docs.searchDocs('架构');
    expect(results.length).toBe(1);
    expect(results[0]?.title).toBe('高级架构设计');
  });
});

// ── 3. 知识图谱 ───────────────────────────────────────────────────────────────

describe('知识图谱', () => {
  test('connect 建立两个文档节点连接', () => {
    const { docs } = makeStack();
    const id1 = docs.addDoc(sampleEntry({ title: '文档A' }));
    const id2 = docs.addDoc(sampleEntry({ title: '文档B' }));
    expect(() => docs.connect(id1, id2, '参考')).not.toThrow();
    expect(docs.knowledgeStats().edgeCount).toBe(1);
  });

  test('knowledgeStats 返回正确的 nodeCount 和 edgeCount', () => {
    const { docs } = makeStack();
    const id1 = docs.addDoc(sampleEntry({ title: 'N1' }));
    const id2 = docs.addDoc(sampleEntry({ title: 'N2' }));
    const id3 = docs.addDoc(sampleEntry({ title: 'N3' }));
    docs.connect(id1, id2, '依赖');
    docs.connect(id2, id3, '扩展');
    const stats = docs.knowledgeStats();
    expect(stats.nodeCount).toBe(3);
    expect(stats.edgeCount).toBe(2);
  });

  test('removeDoc 同步删除关联的图边', () => {
    const { docs } = makeStack();
    const id1 = docs.addDoc(sampleEntry({ title: 'X1' }));
    const id2 = docs.addDoc(sampleEntry({ title: 'X2' }));
    docs.connect(id1, id2, '引用');
    docs.removeDoc(id1);
    expect(docs.knowledgeStats().edgeCount).toBe(0);
  });
});

// ── 4. 版本追踪 ───────────────────────────────────────────────────────────────

describe('版本追踪', () => {
  test('recordVersion 后 currentVersion 返回最新版本', () => {
    const { docs } = makeStack();
    docs.recordVersion({ version: '1.0.0', changes: [{ type: 'added', description: '初始版本' }] });
    expect(docs.currentVersion()).toBe('1.0.0');
  });

  test('versionHistory 返回所有版本记录', () => {
    const { docs } = makeStack();
    docs.recordVersion({ version: '1.0.0', changes: [] });
    docs.recordVersion({ version: '1.1.0', changes: [] });
    expect(docs.versionHistory().length).toBe(2);
  });

  test('generateChangelog 返回 Markdown 字符串', () => {
    const { docs } = makeStack();
    docs.recordVersion({ version: '1.0.0', changes: [{ type: 'added', description: '首次发布' }] });
    const log = docs.generateChangelog();
    expect(typeof log).toBe('string');
    expect(log.length).toBeGreaterThan(0);
  });
});

// ── 5. API 文档 ───────────────────────────────────────────────────────────────

describe('API 文档', () => {
  const sampleApi = {
    path: '/api/v1/users',
    method: 'GET' as const,
    summary: '获取用户列表',
    responses: [{ status: 200, description: 'OK', type: 'UserList' }],
  };

  test('addApi 后 getApi 可取回', () => {
    const { docs } = makeStack();
    docs.addApi(sampleApi);
    const found = docs.getApi('/api/v1/users', 'GET');
    expect(found?.summary).toBe('获取用户列表');
  });

  test('不存在的 API 返回 undefined', () => {
    const { docs } = makeStack();
    expect(docs.getApi('/non-exist', 'DELETE')).toBeUndefined();
  });
});

// ── 6. verifyDoc ──────────────────────────────────────────────────────────────

describe('verifyDoc()', () => {
  test('合法文档返回 passed: true', () => {
    const { docs } = makeStack();
    const id     = docs.addDoc(sampleEntry());
    const result = docs.verifyDoc(id);
    expect(result.passed).toBe(true);
    expect(result.issues.length).toBe(0);
  });

  test('不存在的 doc id 返回 passed: false', () => {
    const { docs } = makeStack();
    const result = docs.verifyDoc('nonexistent');
    expect(result.passed).toBe(false);
    expect(result.issues).toContain('文档不存在');
  });

  test('内容过短时返回相应 issue', () => {
    const { docs } = makeStack();
    const id     = docs.addDoc(sampleEntry({ content: '太短' }));
    const result = docs.verifyDoc(id);
    expect(result.passed).toBe(false);
    expect(result.issues.some((i) => i.includes('过短'))).toBe(true);
  });

  test('版本号不合法时返回相应 issue', () => {
    const { docs } = makeStack();
    const id     = docs.addDoc(sampleEntry({ version: 'invalid' }));
    const result = docs.verifyDoc(id);
    expect(result.passed).toBe(false);
    expect(result.issues.some((i) => i.includes('版本号'))).toBe(true);
  });
});

// ── 7. publishDoc ─────────────────────────────────────────────────────────────

describe('publishDoc()', () => {
  test('验证通过后文档进入已发布列表', () => {
    const { docs } = makeStack();
    const id = docs.addDoc(sampleEntry());
    docs.publishDoc(id);
    expect(docs.isPublished(id)).toBe(true);
    expect(docs.getPublished()).toContain(id);
  });

  test('验证失败的文档不进入已发布列表', () => {
    const { docs } = makeStack();
    const id = docs.addDoc(sampleEntry({ content: '短' }));
    const result = docs.publishDoc(id);
    expect(result.passed).toBe(false);
    expect(docs.isPublished(id)).toBe(false);
  });

  test('removeDoc 同时清除已发布状态', () => {
    const { docs } = makeStack();
    const id = docs.addDoc(sampleEntry());
    docs.publishDoc(id);
    docs.removeDoc(id);
    expect(docs.isPublished(id)).toBe(false);
  });

  test('getPublished 返回所有已发布 id 列表', () => {
    const { docs } = makeStack();
    const id1 = docs.addDoc(sampleEntry({ title: 'Doc1' }));
    const id2 = docs.addDoc(sampleEntry({ title: 'Doc2' }));
    docs.publishDoc(id1);
    docs.publishDoc(id2);
    const published = docs.getPublished();
    expect(published).toContain(id1);
    expect(published).toContain(id2);
  });
});

// ── 8. snapshot ───────────────────────────────────────────────────────────────

describe('snapshot()', () => {
  test('snapshot 反映当前文档总数', () => {
    const { docs } = makeStack();
    docs.addDoc(sampleEntry());
    docs.addDoc(sampleEntry({ title: '第二篇' }));
    const snap = docs.snapshot();
    expect(snap.totalDocs).toBe(2);
  });

  test('snapshot.publishedCount 反映发布数量', () => {
    const { docs } = makeStack();
    const id = docs.addDoc(sampleEntry());
    docs.publishDoc(id);
    const snap = docs.snapshot();
    expect(snap.publishedCount).toBe(1);
  });

  test('snapshot.recentAudit 包含最近验证结果', () => {
    const { docs } = makeStack();
    const id = docs.addDoc(sampleEntry());
    docs.verifyDoc(id);
    const snap = docs.snapshot();
    expect(snap.recentAudit).not.toBeNull();
    expect(snap.recentAudit?.docId).toBe(id);
  });
});

// ── 9. E2E ────────────────────────────────────────────────────────────────────

describe('E2E', () => {
  test('全栈 Universe→Audit→Docs 完整流程', () => {
    const { docs } = makeStack();
    const id = docs.addDoc(sampleEntry());
    docs.recordVersion({ version: '1.0.0', changes: [{ type: 'added', description: 'init' }] });
    docs.publishDoc(id);
    const snap = docs.snapshot();
    expect(snap.totalDocs).toBe(1);
    expect(snap.publishedCount).toBe(1);
    expect(snap.currentVersion).toBe('1.0.0');
    expect(snap.knowledgeNodes).toBe(1);
  });

  test('DaoUniverseDocs 可从 @daomind/collective 导入', async () => {
    const { DaoUniverseDocs: D } = await import('../index');
    expect(D).toBeDefined();
    expect(typeof D).toBe('function');
  });

  test('与 DaoUniverseAudit 共存，audit getter 正确引用', () => {
    const universe = new DaoUniverse();
    const audit    = new DaoUniverseAudit(universe);
    const docs     = new DaoUniverseDocs(audit);
    expect(docs.audit).toBe(audit);
    expect(docs.audit.universe).toBe(universe);
  });
});
