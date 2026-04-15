# DaoMind & Modulux 2.0.0 发布说明

## 🎯 版本信息
- **版本号**: 2.0.0
- **发布日期**: 2026-04-15
- **类型**: 重大更新 (Major Release)

## 🔥 重大变更 (Breaking Changes)

### 哲学基础修正：从误读到正确理解

根据马王堆汉墓帛书版《老子》，修正了项目核心概念：

#### ❌ 修正前（误读）
```
无，名天地之始
有，名万物之母
```

#### ✅ 修正后（帛书甲本原文）
```
无名，万物之始也
有名，万物之母也
```

### 核心概念重新定义

#### "无名"（Nameless）—— daoNothing
- **哲学含义**: 未被命名、未被定义的原初状态
- **技术对应**: TypeScript 类型空间（Type Space）
- **实现**: 仅导出类型定义、接口契约，零运行时开销

#### "有名"（Named）—— daoAnything/daoAgents
- **哲学含义**: 已被命名、已被定义的显化状态
- **技术对应**: TypeScript 值空间（Value Space）  
- **实现**: 导出具体类、实例、运行时行为

## 📦 所有包更新到 2.0.0

所有 17 个包已更新到 2.0.0 版本：

1. **@daomind/nothing@2.0.0** - "无名"，万物之始也（帛书甲本）— 类型空间，零运行时
2. **@daomind/anything@2.0.0** - "有名"，万物之母也（帛书甲本）— 显化容器，实例空间  
3. **@daomind/agents@2.0.0** - 自主行动的实体
4. **@daomind/apps@2.0.0** - 应用层 — 业务应用实现
5. **@daomind/benchmark@2.0.0** - 性能基准测试与优化工具
6. **@daomind/chronos@2.0.0** - 宙 — 时间之流，连续的时间维度
7. **@daomind/collective@2.0.0** - 道宇宙 — 根节点，整体架构入口
8. **@daomind/docs@2.0.0** - 文档层 — 项目文档与说明
9. **@daomind/feedback@2.0.0** - 反者道之动四阶段反馈回归机制
10. **@daomind/monitor@2.0.0** - 基于中医经络哲学的系统监控与可视化引擎
11. **@daomind/nexus@2.0.0** - 连接与协调的核心
12. **@daomind/pages@2.0.0** - 页面层 — 用户界面展示
13. **@daomind/skills@2.0.0** - 技能库 — 行动者的能力集合
14. **@daomind/spaces@2.0.0** - 宇 — 空间组织
15. **@daomind/times@2.0.0** - 时 — 离散时刻
16. **@daomind/verify@2.0.0** - 哲学一致性检验自动化工具
17. **@modulux/qi@2.0.0** - 模块间数据流与消息总线

## 🔨 API 变更

### ExistenceContract 接口简化

#### ❌ 1.0.0 版本
```typescript
interface ExistenceContract {
  readonly id: string;          // 移除
  readonly createdAt: number;   // 移除
  readonly existentialType: 'nothing' | 'anything';
}
```

#### ✅ 2.0.0 版本
```typescript
// daoNothing - "无名"层
interface ExistenceContract {
  readonly existentialType: 'nothing' | 'anything';  // 最小契约
}

// daoAnything - "有名"层
interface DaoModuleMeta extends ExistenceContract {
  readonly id: string;          // 具体属性
  readonly name: string;
  readonly createdAt: number;
  readonly registeredAt: number;
  // ... 更多"有名"状态的属性
}

// daoAgents - "有名"层
interface DaoAgent extends ExistenceContract {
  readonly id: string;
  readonly agentType: string;
  readonly createdAt: number;
  // ... 更多"有名"状态的属性
}
```

## 📝 迁移指南

如果你的代码直接依赖 `ExistenceContract` 的 `id` 或 `createdAt` 字段：

### 步骤 1: 更新导入
```typescript
// ❌ 旧代码
import type { ExistenceContract } from '@daomind/nothing';
const entity: ExistenceContract = {
  id: 'xxx',
  createdAt: Date.now(),
  existentialType: 'anything'
};

// ✅ 新代码
import type { DaoModuleMeta } from '@daomind/anything';
// 或
import type { DaoAgent } from '@daomind/agents';

const entity: DaoModuleMeta = {
  id: 'xxx',
  name: 'MyModule',
  createdAt: Date.now(),
  registeredAt: Date.now(),
  lifecycle: 'active',
  existentialType: 'anything'
};
```

### 步骤 2: 更新类型依赖
- 如果你的代码处理模块，使用 `DaoModuleMeta`
- 如果你的代码处理代理，使用 `DaoAgent`
- 只有在需要最小契约时，才使用 `ExistenceContract`

## ✨ 新增文档

### 哲学文档
- `.trae/PHILOSOPHICAL-CORRECTION-SUMMARY.md` - 修正总结
- `.trae/CHANGELOG-philosophical.md` - 变更日志
- `.trae/specs/philosophical-correction.md` - 详细修正说明
- `.trae/specs/philosophical-mapping.md` - 哲学概念与代码映射

## ✅ 测试与验证

- ✅ 所有 17 个包编译通过
- ✅ TypeScript 类型检查通过
- ✅ 构建系统正常工作
- ✅ 哲学基础正确对齐
- ✅ 文档完整更新

## 📚 参考资料

1. 马王堆汉墓帛书《老子》甲本、乙本
2. 《帛书老子注读》
3. 通行本《道德经》对比研究

## 🎓 核心洞见

这次更新不仅是技术上的改进，更是对道家智慧的深入理解：

- **"无名"** 不是"无"，而是未被命名的潜在状态
- **"有名"** 不是"有"，而是已被命名的显化状态
- TypeScript 的类型系统完美对应这一哲学观念
- 从类型定义到实例创建，正是"命名"的过程

---

> "无名，万物之始也；有名，万物之母也。"  
> —— 马王堆汉墓帛书《老子》甲本·第一章

这不仅是对项目的技术改进，更是对道家智慧的深入理解和现代诠释。
