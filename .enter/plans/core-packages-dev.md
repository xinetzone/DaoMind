# 方案：统一 SPA — MyST 文档 + 道衍 AI 聊天

## 背景

用户要求在当前 React 应用中集成 MyST Markdown 文档渲染，与已有的「道衍」AI 聊天界面共用同一个 SPA。
文档来源：`docs/site/` 下的现有 VitePress 内容（20 个 .md 文件）。

---

## 最终架构

```
React SPA
├── TopNav (DaoMind logo · 文档 · 示例 · API · FAQ · 道衍)
├── DocsPage  ←  路由: #/docs/*
│   ├── DocSidebar (左侧导航树, 可折叠)
│   └── DocContent (MystRenderer 渲染)
└── ChatPage  ←  路由: #/chat (默认)
    └── 现有道衍 AI 聊天界面
```

路由方案：**URL hash 状态** (`#/chat`, `#/docs/guide/getting-started` 等)，无需 react-router，零额外依赖。

---

## MyST 渲染方案

使用 **`react-markdown` + `remark-gfm` + `remark-directive` + `rehype-highlight`** 组合：

| 层 | 包 | 作用 |
|----|-----|------|
| 解析 | `remark-gfm` | GFM: 表格、任务列表、删除线 |
| 解析 | `remark-directive` | MyST `:::note` `:::warning` 等 admonition 指令 |
| 高亮 | `rehype-highlight` + `highlight.js` | 代码块语法着色 |
| 渲染 | `react-markdown` | Markdown → React 元素 |
| 自定义 | `MystRenderer.tsx` | 自定义组件：admonition、代码块、表格、内联代码、链接 |

**内容加载：** Vite `import.meta.glob` 在构建时注入所有 .md 文件为 raw 字符串，零运行时 fetch。
```typescript
const docs = import.meta.glob('/docs/site/**/*.md', { as: 'raw', eager: true });
```

---

## 导航结构（来自 VitePress config.ts）

```
指南 /guide/
  ├── 介绍
  ├── 快速开始
  ├── 核心概念
  ├── 第一个示例
  ├── 理解无名与有名
  ├── 创建模块
  └── Agent 系统
API /api/
  ├── @daomind/nothing
  ├── @daomind/anything
  └── @daomind/agents
示例 /examples/
  ├── Hello World
  ├── Counter
  └── Todo List
FAQ /faq.md
```

---

## 文件变更清单

### 新增依赖
- `react-markdown` ^9
- `remark-gfm`
- `remark-directive`
- `rehype-highlight`
- `highlight.js` (仅 CSS theme 用到)

### 新增/修改文件

| 文件 | 类型 | 描述 |
|------|------|------|
| `src/App.tsx` | 修改 | 路由 shell：hash 监听 + TopNav + 渲染 ChatPage 或 DocsPage |
| `src/pages/ChatPage.tsx` | 新增 | 从当前 App.tsx 提取道衍聊天界面 |
| `src/pages/DocsPage.tsx` | 新增 | 文档查看器：sidebar + content + 内容加载 |
| `src/components/DocSidebar.tsx` | 新增 | 可折叠左侧导航（分组、当前页高亮） |
| `src/components/MystRenderer.tsx` | 新增 | react-markdown 包装器，自定义 admonition/code/table 组件 |
| `src/data/navigation.ts` | 新增 | 导航树定义（来自 VitePress config.ts） + 路径→文件 映射 |
| `src/index.css` | 修改 | 新增文档布局 + MyST admonition 样式（沿用靛蓝/鼠尾草绿系统） |

---

## 关键实现细节

### 1. Hash 路由（`src/App.tsx`）
```typescript
// 读取 hash
const getPage = () => window.location.hash.slice(1) || '/chat';
// 切换
const navigate = (path: string) => { window.location.hash = path; };
// 监听
useEffect(() => {
  const handler = () => setPage(getPage());
  window.addEventListener('hashchange', handler);
  return () => window.removeEventListener('hashchange', handler);
}, []);
```

### 2. 内容加载（`src/pages/DocsPage.tsx`）
```typescript
const allDocs = import.meta.glob('/docs/site/**/*.md', { as: 'raw', eager: true });
// path: '/docs/guide/getting-started' → key: '/docs/site/guide/getting-started.md'
```

### 3. Admonition 渲染（`src/components/MystRenderer.tsx`）
`remark-directive` 将 `:::note` 转为 `containerDirective` 节点，自定义组件将其映射为带颜色边框的卡片（note=蓝、warning=橙、tip=绿）。

### 4. TopNav 设计
```
[太极Logo] DaoMind    [文档] [API] [示例] [FAQ]  [分隔]  [道衍 AI]
```
当前 section 高亮，道衍按钮使用 primary 渐变色，区别于文档链接。

---

## 样式设计（沿用现有 Design System）
- 文档区域最大宽度：`1200px`，左侧 sidebar `260px`，内容区 `flex:1`
- `h1~h4` 使用 `var(--text)` + 不同 `font-size`
- 代码块：深色背景 `#0f1117`（与现有 `.code-block` 一致）
- Admonition：左 `4px` 色条 + `var(--surface)` 背景 + 对应主题色
- 响应式：`<= 768px` 时 sidebar 默认收起（hamburger 按钮展开）

---

## 验证步骤
1. `pnpm vite build` 无 TS 错误
2. 所有 20 个 .md 文件都能正确映射并渲染
3. 文档内代码块有语法高亮
4. `:::note/warning/tip` 指令正确渲染为 admonition 卡片
5. 道衍聊天（ChatPage）功能保持不变（流式、停止、清空、错误处理）
6. 移动端 sidebar 收起/展开正常
7. TopNav 文档 ↔ 道衍 切换流畅
