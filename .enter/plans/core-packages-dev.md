# P23+1 · 有无平衡 · 类型迁移至 daoNothing

## Context

道审系统给出"有无平衡"审计警告：
> 建议将部分纯类型定义迁移至 daoNothing，确保 daoAnything 聚焦于实际容器与模块注册功能

**原则：**
- `daoNothing` = 无名 = 纯类型空间，零运行时
- `daoAnything` = 有名 = 运行时容器 / 实例空间

**问题：** `daoAnything/src/types.ts` 包含 3 个纯类型定义，均无运行时代码，应属于"无名"空间：
1. `DaoModuleRegistration` — 纯接口，描述模块注册结构
2. `ModuleLifecycle` — 纯字符串联合类型，描述生命周期状态
3. `DaoModuleMeta` — 纯接口，扩展自 `ExistenceContract`，描述模块元数据快照

## 方案：迁移 + 向后兼容

### 步骤 1 — 新建 `daoNothing/src/module-types.ts`
将 3 个类型从 `daoAnything/src/types.ts` 移入，保留帛书注释，导入 `ExistenceContract` 来自本包 `./contracts`。

### 步骤 2 — 更新 `daoNothing/src/index.ts`
新增 3 行 `export type` 导出新文件的类型。

### 步骤 3 — 更新 `daoAnything/src/container.ts`
将 `import type { ... } from './types'` 改为 `import type { ... } from '@daomind/nothing'`。

### 步骤 4 — 更新 `daoAnything/src/index.ts`
将 `export type { DaoModuleRegistration, ModuleLifecycle, DaoModuleMeta } from './types'` 改为从 `@daomind/nothing` 转出口，**保持 API 不变**，下游无需修改。

### 步骤 5 — 删除 `daoAnything/src/types.ts`
文件内容已全部迁移，可安全删除。

## 受影响文件

| 文件 | 操作 |
|------|------|
| `packages/daoNothing/src/module-types.ts` | NEW |
| `packages/daoNothing/src/index.ts` | 新增 3 个 export type |
| `packages/daoAnything/src/container.ts` | import 来源改为 `@daomind/nothing` |
| `packages/daoAnything/src/index.ts` | re-export 来源改为 `@daomind/nothing` |
| `packages/daoAnything/src/types.ts` | DELETE |

**不需要改动：**
- `packages/daoCollective/src/universe-modules.ts` — 仍从 `@daomind/anything` 导入（转出口保持不变）
- `packages/daoCollective/src/index.ts` — 同上
- 所有 templates / docs 文件 — 同上

## 验证

1. `daoNothing/src/module-types.ts` 存在且包含 3 个类型
2. `daoAnything/src/types.ts` 不存在
3. `daoAnything` 的 `index.ts` 仍导出 3 个类型（向后兼容）
4. `daoCollective/src/universe-modules.ts` 无需修改且 TS 编译通过
5. lint 无新增 errors
