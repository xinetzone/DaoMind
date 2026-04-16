# v2.16.0 开发计划 — DaoUniverseSpaces（daoSpaces × DaoUniverseNexus）

## 当前状态

- v2.15.0 已发布：627 tests / 40 suites，全绿
- 未集成包：`@daomind/spaces`、`@daomind/pages`
- `tsconfig.base.json` 路径映射已完整（v2.15.0 修复）

---

## 帛书依据

"知足者富，强行者有志"（德经·三十三章）  
空间是资源归属的容器；服务网格是调度的枢纽。  
让每个空间拥有自己的服务标识，通过网格路由归位，是"知足"的架构表达。

---

## Step 1 — 写 v2.15.0 复盘

文件：`retrospectives/2026-04-16-daomind-v2.15.0.md`

内容：
- 目标：daoDocs × DaoUniverseAudit
- 核心设计决策（addDoc 双写 / publishDoc 哲学门控 / 纯同步 snapshot）
- tsconfig.base.json 路径修复（根因 + 影响 + 经验）
- 新类型：DocAuditResult / DocsSnapshot
- 指标：595 → 627 tests（+32），40 suites

---

## Step 2 — 实现 DaoUniverseSpaces（v2.16.0）

### 新文件：`packages/daoCollective/src/universe-spaces.ts`

```typescript
// 帛书依据："知足者富"（德经·三十三章）
// 架构：DaoUniverseNexus → DaoUniverseSpaces（命名空间 × 服务网格路由归位）

import { DaoNamespaceManager } from '@daomind/spaces';
import type { DaoSpace, DaoSpaceId, DaoResourceLocator } from '@daomind/spaces';
import type { DaoUniverseNexus } from './universe-nexus';

export interface SpacesSnapshot {
  readonly timestamp:         number;
  readonly totalSpaces:       number;
  readonly rootCount:         number;
  readonly nexusServiceCount: number;  // 来自 nexus.healthCheck().length
}

export class DaoUniverseSpaces {
  private readonly _namespace: DaoNamespaceManager;

  constructor(private readonly _nexus: DaoUniverseNexus)
  // 全新独立 DaoNamespaceManager，不污染全局 daoNamespace 单例

  // 空间管理（namespace + 同步注册 nexus 服务）
  createSpace(name: string, parent?: DaoSpaceId): DaoSpaceId
  // → 创建 namespace 空间 + nexus.register({ id: spaceId, name, version: '1.0.0', endpoint: `space://${spaceId}` })
  // → 自动 nexus.markHealthy(spaceId, true)

  removeSpace(id: DaoSpaceId): boolean
  // → namespace.removeSpace(id)（如有子空间自动抛出） + nexus.deregister(id)

  getSpace(id: DaoSpaceId): DaoSpace | undefined
  getChildren(parentId: DaoSpaceId): ReadonlyArray<DaoSpace>
  getRootSpaces(): ReadonlyArray<DaoSpace>

  // 路径解析（纯 namespace 操作）
  resolve(locator: DaoResourceLocator): string[]
  // 委托 namespace.resolvePath(locator)

  // 空间路由（将 pattern 路由到 spaceId 对应的服务 endpoint）
  routeSpace(pattern: string, spaceId: DaoSpaceId): void
  // → nexus.addRoute({ pattern, target: `space://${spaceId}`, priority: 1 })

  // 快照
  snapshot(): SpacesSnapshot
  // { timestamp, totalSpaces: getAllSpaces().length, rootCount: getRootSpaces().length, nexusServiceCount: nexus.healthCheck().length }

  // Getters
  get nexus(): DaoUniverseNexus
  get namespace(): DaoNamespaceManager
}
```

**关键设计决策：**
- `createSpace()` 同步注册 nexus 服务：每个 space 有唯一 endpoint `space://${id}`，可被路由层寻址
- `removeSpace()` 双清：先调用 namespace（可能抛异常），再 nexus.deregister()
- `routeSpace()` 建立 pattern → space 的路由映射，dispatch 请求即可找到对应 space 的 endpoint
- `snapshot()` 中 nexusServiceCount 来自 `nexus.healthCheck().length`（所有服务，含 space 外注册的）

### 更新 `packages/daoCollective/package.json`
```diff
+ "@daomind/spaces":  "workspace:^"
```

### 更新 `packages/daoCollective/tsconfig.json`
```diff
+ { "path": "../daoSpaces" }
```

### 更新 `packages/daoCollective/src/index.ts`
新增末尾：
```typescript
// @daomind/spaces — 空间层
export type { DaoSpaceId, DaoSpace, DaoResourceLocator, PartitionStrategy } from '@daomind/spaces';
export { daoNamespace, DaoNamespaceManager } from '@daomind/spaces';

// DaoUniverseSpaces — 命名空间 × 服务网格（daoSpaces × DaoUniverseNexus）
export type { SpacesSnapshot } from './universe-spaces';
export { DaoUniverseSpaces } from './universe-spaces';
```

---

## Step 3 — 测试文件

文件：`packages/daoCollective/src/__tests__/universe-spaces.test.ts`  
目标：**30 个测试**

```
构建（4）：
  - 可构建 DaoUniverseSpaces
  - nexus getter 返回传入的 DaoUniverseNexus
  - namespace getter 已初始化（独立实例）
  - 初始 snapshot().totalSpaces = 0

createSpace / removeSpace（5）：
  - createSpace 返回 DaoSpaceId 字符串
  - createSpace 后 getSpace 可取回
  - createSpace 自动在 nexus 注册对应服务
  - removeSpace 返回 true，getSpace 返回 undefined
  - removeSpace 同步从 nexus 注销服务

getChildren / getRootSpaces（4）：
  - createSpace 无 parent → 出现在 getRootSpaces()
  - createSpace 有 parent → 出现在 getChildren()
  - 子空间不出现在 getRootSpaces()
  - removeSpace 有子空间时抛出异常

resolve（3）：
  - 单层空间 resolve 返回 [spaceName, ...path]
  - 嵌套空间 resolve 返回完整层级路径
  - resolve 不存在的 space 抛出异常

routeSpace（3）：
  - routeSpace 添加 nexus 路由规则
  - dispatch 到已路由 space 返回 dispatched
  - dispatch 到未路由 space 返回 no-service（nexus 无对应服务名）

snapshot（4）：
  - totalSpaces 随 createSpace 增长
  - rootCount 只统计根空间
  - removeSpace 后 totalSpaces 减少
  - nexusServiceCount 包含 space 注册的服务

E2E（4）：
  - 完整 Universe→Monitor→Nexus→Spaces 流程
  - DaoUniverseSpaces 可从 @daomind/collective 导入
  - 多层嵌套空间（3层深度）路径解析正确
  - space 注册的 nexus 服务可被 healthCheck() 检测到
```

---

## Step 4 — 更新 src/App.tsx

- 版本：v2.14.0 → v2.16.0
- 测试数：595 → 657（估算：627 + 30）

---

## Step 5 — 验证

```bash
pnpm -r run build          # 全部 Done
npx jest --no-coverage     # 657 tests, 41 suites
```

---

## Step 6 — 提交 + 打标签 + 推送

```bash
git add -A
git commit -m "feat(spaces): v2.16.0 — DaoUniverseSpaces..."
git tag -a v2.16.0 -m "release: v2.16.0 — DaoUniverseSpaces"
git push github main:main && git push github v2.16.0
git push origin main && git push origin v2.16.0
```

---

## 架构（v2.16.0 后完整）

```
DaoUniverse
  ├── DaoUniverseMonitor (v2.8.0)
  │       ├── DaoUniverseClock (v2.9.0)
  │       │       ├── DaoUniverseFeedback (v2.10.0)
  │       │       └── DaoUniverseScheduler (v2.12.0)
  │       │               └── DaoUniverseSkills (v2.13.0)
  │       └── DaoUniverseNexus (v2.14.0)
  │               └── DaoUniverseSpaces (v2.16.0) ← 命名空间 × 服务网格路由归位
  └── DaoUniverseAudit (v2.11.0)
          └── DaoUniverseDocs (v2.15.0)
```

## 剩余包（v2.17.0 预留）

`@daomind/pages`（DaoComponentTree + DaoStateBinding）→ 计划挂在 DaoUniverseScheduler 下  
→ `DaoUniversePages`：时序驱动组件生命周期 × 状态绑定
