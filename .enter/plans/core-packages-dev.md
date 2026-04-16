# DaoMind v2.15.0 开发计划

## 当前状态

- **已完成**：v2.14.0 DaoUniverseNexus（daoNexus × DaoUniverseMonitor）
- **当前 commit**：`9f0cbbf` chore(homepage): update version and test case count
- **测试**：39 suites 中 12 个失败（303/595 tests）← 关键 Bug 需先修复

---

## Step 0：关键 Bug 修复 — tsconfig.base.json 缺少路径映射

### 根因

`tsconfig.base.json` 的 `"paths"` 字段缺少以下包的映射，导致 ts-jest TypeScript 编译阶段找不到模块：

| 缺失映射 | 实际路径 |
|---------|---------|
| `@daomind/anything` | `./packages/daoAnything/src` |
| `@daomind/chronos` | `./packages/daoChronos/src` |
| `@daomind/feedback` | `./packages/daoFeedback/src` |
| `@daomind/skills` | `./packages/daoSkilLs/src` |
| `@daomind/pages` | `./packages/daoPages/src` |
| `@daomind/spaces` | `./packages/daoSpaces/src` |
| `@daomind/docs` | `./packages/daoDocs/src` |
| `@daomind/times` | `./packages/daotimes/src` |
| `@daomind/collective` | `./packages/daoCollective/src` |

### 修复方式

直接编辑 `tsconfig.base.json`，在现有 `"paths"` 对象中追加上述 9 条映射。

**注意**：`@daomind/skills` 的包目录是 `daoSkilLs`（大写 L），`@daomind/times` 的包目录是 `daotimes`（小写 t）。

### 失败的 12 个 suite

- `packages/daoCollective/src/__tests__/universe*.test.ts`（9 个）
- `packages/daoCollective/src/__tests__/qi-bridge.test.ts`（1 个）
- `src/__tests__/integration/agents-apps-integration.test.ts`
- `src/__tests__/e2e/full-system.test.ts`
- `packages/daoAgents/src/__tests__/container-bridge.test.ts`

---

## Step 1：v2.14.0 复盘文档

**文件**：`retrospectives/2026-04-16-daomind-v2.14.0.md`（新建）

**内容要点**：
- DaoUniverseNexus 架构（Monitor + Clock 订阅）
- 三个关键决策：纯路由层 / 独立 Discovery 实例 / syncHealthNow 测试钩子
- 测试 32 条全部通过
- v2.13.0→v2.14.0 指标表
- 下一步：v2.15.0 DaoUniverseDocs

---

## Step 2：v2.15.0 — DaoUniverseDocs（daoDocs × DaoUniverseAudit）

**帛书依据**："知常曰明，不知常，妄作凶"（德经·十六章）
**架构定位**：DaoUniverseAudit 的知识体系层，文档通过哲学验证门控后方可发布

```
DaoUniverse
  ├── DaoUniverseMonitor (v2.8.0)
  │       ├── DaoUniverseClock (v2.9.0)
  │       │       ├── DaoUniverseFeedback (v2.10.0)
  │       │       └── DaoUniverseScheduler (v2.12.0)
  │       │               └── DaoUniverseSkills (v2.13.0)
  │       └── DaoUniverseNexus (v2.14.0)
  └── DaoUniverseAudit (v2.11.0)
          └── DaoUniverseDocs (v2.15.0) ← 知识图谱 × 哲学文档管理
```

### 新类型（universe-docs.ts 顶部）

```typescript
export interface DocAuditResult {
  readonly docId: string;
  readonly passed: boolean;
  readonly issues: readonly string[];
  readonly timestamp: number;
}

export interface DocsSnapshot {
  readonly timestamp:       number;
  readonly totalDocs:       number;
  readonly knowledgeNodes:  number;
  readonly currentVersion:  string | null;
  readonly publishedCount:  number;
  readonly recentAudit:     DocAuditResult | null;
}
```

### DaoUniverseDocs 类

```typescript
export class DaoUniverseDocs {
  private readonly _docStore:       DaoDocStore;
  private readonly _knowledgeGraph: DaoKnowledgeGraph;
  private readonly _versionTracker: DaoVersionTracker;
  private readonly _apiDocs:        DaoApiDocs;
  private readonly _published = new Set<string>();   // 已通过验证发布的 doc id
  private _lastAuditResult: DocAuditResult | null = null;

  constructor(private readonly _audit: DaoUniverseAudit) {
    // 全新独立实例，不污染全局单例
    this._docStore       = new DaoDocStore();
    this._knowledgeGraph = new DaoKnowledgeGraph();
    this._versionTracker = new DaoVersionTracker();
    this._apiDocs        = new DaoApiDocs();
  }
```

### 公开 API

| 方法 | 说明 |
|------|------|
| `addDoc(entry)` | 存入 docStore + 自动添加到 knowledge graph 节点 |
| `removeDoc(id)` | 从 docStore 和 knowledge graph 同时移除 |
| `getDoc(id)` | 读取文档 |
| `searchDocs(query)` | 全文搜索 |
| `connect(fromId, toId, relation, weight?)` | 建立知识图谱连接 |
| `knowledgeStats()` | `{ nodeCount, edgeCount }` |
| `recordVersion(record)` | 版本历史追踪 |
| `currentVersion()` | 当前版本字符串 |
| `versionHistory(limit?)` | 版本历史列表 |
| `generateChangelog(sinceVersion?)` | 生成变更日志字符串 |
| `addApi(api)` | 添加 API 文档 |
| `getApi(path)` | 获取 API 描述 |
| `verifyDoc(id)` | 内联哲学验证（标题/内容/版本/长度检查） |
| `publishDoc(id)` | verifyDoc → 若通过则加入 _published，返回 DocAuditResult |
| `getPublished()` | 已发布的 doc id 列表 |
| `isPublished(id)` | 检查是否已发布 |
| `snapshot()` | DocsSnapshot（无需文件系统扫描） |
| `get audit` | DaoUniverseAudit 引用 |
| `get docStore` | DaoDocStore 引用 |
| `get knowledgeGraph` | DaoKnowledgeGraph 引用 |
| `get versionTracker` | DaoVersionTracker 引用 |

### verifyDoc 内联检查逻辑

```typescript
verifyDoc(id: string): DocAuditResult {
  const doc = this._docStore.get(id);
  const timestamp = Date.now();
  if (!doc) return { docId: id, passed: false, issues: ['文档不存在'], timestamp };

  const issues: string[] = [];
  if (!doc.title.trim())                       issues.push('标题不能为空');
  if (!doc.content.trim())                     issues.push('内容不能为空');
  if (doc.content.length < 10)                 issues.push('内容过短（< 10 字符）');
  if (!/^\d+\.\d+\.\d+/.test(doc.version))    issues.push('版本号不符合语义版本规范');

  this._lastAuditResult = { docId: id, passed: issues.length === 0, issues, timestamp };
  return this._lastAuditResult;
}
```

### publishDoc 逻辑

```typescript
publishDoc(id: string): DocAuditResult {
  const result = this.verifyDoc(id);
  if (result.passed) this._published.add(id);
  return result;
}
```

---

## 需要修改的文件

| 文件 | 操作 |
|------|------|
| `tsconfig.base.json` | 追加 9 条缺失路径映射（edit_file） |
| `retrospectives/2026-04-16-daomind-v2.14.0.md` | 新建 |
| `packages/daoCollective/src/universe-docs.ts` | 新建 |
| `packages/daoCollective/package.json` | 追加 `"@daomind/docs": "workspace:^"` |
| `packages/daoCollective/tsconfig.json` | 追加 `{ "path": "../daoDocs" }` 到 references |
| `packages/daoCollective/src/index.ts` | 追加 DaoUniverseDocs + @daomind/docs 再导出 |
| `packages/daoCollective/src/__tests__/universe-docs.test.ts` | 新建（~30 tests） |

---

## 测试计划（~30 tests）

| 分组 | 数量 | 覆盖点 |
|------|------|--------|
| 构建 | 5 | construct / getters / audit 引用 |
| addDoc / removeDoc / searchDocs | 5 | CRUD / 自动 graph 节点 |
| knowledge graph | 3 | connect / knowledgeStats / removeDoc 同步删图节点 |
| version tracking | 3 | recordVersion / currentVersion / generateChangelog |
| addApi / getApi | 2 | API 文档管理 |
| verifyDoc | 4 | passed / 空标题 / 内容过短 / 版本号格式 |
| publishDoc | 4 | 发布成功 / 验证失败不发布 / getPublished / isPublished |
| snapshot | 2 | totalDocs / publishedCount |
| E2E | 3 | 全栈 / @daomind/collective 导入 / 与 DaoUniverseAudit 共存 |

---

## 执行顺序

1. 修复 `tsconfig.base.json`（立即验证 595 tests 全通过）
2. 写 `retrospectives/2026-04-16-daomind-v2.14.0.md`
3. 写 `universe-docs.ts`
4. 更新 package.json + tsconfig.json + index.ts
5. 写 `universe-docs.test.ts`
6. `pnpm install && pnpm -r run build && npx jest --no-coverage`（目标 625+ tests）
7. Git commit + tag v2.15.0 + push origin + push github

---

## 验证标准

- `npx jest --no-coverage`：39+1=40 suites，全部通过，Tests ≥ 625（595 + ~30 new）
- `pnpm -r run build`：全部 Done
- `git tag v2.15.0` 推送成功
