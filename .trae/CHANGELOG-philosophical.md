# 哲学概念修正日志

## 2026-04-15 - 帛书版《道德经》概念修正

### 重大哲学澄清 ⚠️

根据马王堆汉墓帛书版《老子》，修正了项目中的核心哲学概念：

**修正前（误解）：**
```
无，名天地之始
有，名万物之母
```

**修正后（正确）：**
```
无名，万物之始也
有名，万物之母也
```

### 核心变更

1. **daoNothing（无名）** - 类型定义层
   - 精简 `ExistenceContract` 为最小契约
   - 移除 `id`、`createdAt` 等具体属性
   - 强调"无名"状态的纯粹性

2. **daoAnything / daoAgents（有名）** - 实例化层
   - 在各自的接口中添加具体属性
   - `DaoModuleMeta` 和 `DaoAgent` 完整实现"有名"状态

### 哲学意义

- "无名" = 未命名的类型空间（Type Space）
- "有名" = 已命名的实例空间（Value Space）
- 完美对应 TypeScript 的类型系统架构

### Breaking Changes

⚠️ `ExistenceContract` 接口已简化，现在只包含 `existentialType` 字段。
如果你的代码依赖 `ExistenceContract` 的 `id` 或 `createdAt` 字段，请改为：
- 使用 `DaoModuleMeta`（来自 @daomind/anything）
- 使用 `DaoAgent`（来自 @daomind/agents）

### 参考

详细说明请参阅：`.trae/specs/philosophical-correction.md`
