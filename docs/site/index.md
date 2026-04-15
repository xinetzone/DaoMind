---
layout: home

hero:
  name: DaoMind & Modulux
  text: 道家哲学遇见现代 TypeScript
  tagline: 基于"无名，万物之始；有名，万物之母"的模块化框架
  image:
    src: /logo.png
    alt: DaoMind
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看示例
      link: /examples/
    - theme: alt
      text: GitHub
      link: https://github.com/xinetzone/DaoMind

features:
  - icon: 🧠
    title: 哲学驱动
    details: 基于帛书《道德经》的"无名"与"有名"概念，将类型系统与值系统进行清晰的哲学映射
    
  - icon: ⚡
    title: 零运行时
    details: 类型定义在编译后完全消失，享受类型检查的好处却没有任何运行时开销
    
  - icon: 🏗️
    title: 模块化架构
    details: 从基础契约到完整生态，包含模块管理、Agent 系统、消息总线等完整工具链
    
  - icon: 🔒
    title: 类型安全
    details: 利用 TypeScript 的强大类型系统，在编译时捕获错误，提供优秀的开发体验
    
  - icon: 📦
    title: 开箱即用
    details: 提供脚手架工具和丰富的示例模板，快速创建项目并开始开发
    
  - icon: 📚
    title: 完整文档
    details: 详尽的 API 文档、交互式教程、视频课程和最佳实践指南
---

## 快速体验

使用脚手架工具创建第一个项目：

```bash
# 使用 pnpm（推荐）
pnpm create daomind my-project

# 或使用 npm
npm create daomind@latest my-project
```

## 核心概念

### "无名"与"有名"

DaoMind 将道家哲学中的"无名"与"有名"映射到 TypeScript：

```typescript
// "无名"层 - 类型定义
import type { ExistenceContract } from '@daomind/nothing';

interface User extends ExistenceContract {
  readonly name: string;
  readonly email: string;
}

// "有名"层 - 实例创建
const user: User = {
  existentialType: 'anything',  // 从"无名"到"有名"
  name: 'Alice',
  email: 'alice@example.com',
};
```

### 零运行时设计

使用 `type` 导入确保类型定义在编译后完全消失：

```typescript
// 编译前
import type { User } from './types';

// 编译后 - 类型导入完全消失
// 只剩下实际的业务逻辑
```

## 为什么选择 DaoMind？

<div class="vp-doc">

| 特性 | 传统框架 | DaoMind |
|------|---------|---------|
| 哲学基础 | ❌ 缺乏 | ✅ 道家思想 |
| 运行时开销 | ⚠️ 有额外开销 | ✅ 零开销 |
| 类型安全 | ✅ 支持 | ✅ 完整支持 |
| 学习曲线 | ⚠️ 陡峭 | ✅ 渐进式 |
| 文档质量 | ⚠️ 一般 | ✅ 优秀 |

</div>

## 项目统计

- ✅ **17** 个核心包
- ✅ **9** 个完整示例
- ✅ **46+** 份文档
- ✅ **12** 集视频教程
- ✅ **100%** 代码质量

## 社区与支持

- 💬 [GitHub Discussions](https://github.com/xinetzone/DaoMind/discussions)
- 🐛 [问题反馈](https://github.com/xinetzone/DaoMind/issues)
- 📺 [视频教程](/videos/)
- 📖 [完整文档](/guide/)

## 开源协议

DaoMind 基于 [MIT 协议](https://github.com/xinetzone/DaoMind/blob/main/LICENSE) 开源，可免费用于商业和个人项目。
