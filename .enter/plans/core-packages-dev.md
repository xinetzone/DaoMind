# DaoMind v2.30.0 — 复盘 + Bug 修复 + 聊天 Markdown 渲染

## Context（为什么做这件事）

v2.29.x 交付了统一 SPA（道衍 AI 聊天 + MyST markdown 文档）。现在通过代码审查发现了 3 个 Bug + 1 个体验短板，需要在 v2.30.0 修复。

---

## Bug 清单（代码审查发现）

| # | 文件 | 问题 | 影响 |
|---|------|------|------|
| B1 | `MystRenderer.tsx` | `rehype-raw` 未安装，`preprocessDirectives()` 输出的 `<div class="admonition">` HTML 被 react-markdown 转义为纯文本 | `docs/site/videos/index.md` 的 `:::info` 块显示为 HTML 源码文字 |
| B2 | `ChatPage.tsx` | AI 响应用 `{msg.content}` 纯文本渲染，不解析 markdown | 代码块、列表、粗体等直接显示星号/反引号原始字符 |
| B3 | `useAIChat.ts` | `fetchEventSource` 缺少 `openWhenHidden: true` | 用户切换浏览器标签时 SSE 流暂停/重启 |
| B4 | `DocsPage.tsx` | 切换文档页面后 `.docs-content` 保留上一页滚动位置 | 跳转新页时不从顶部开始阅读 |

---

## v2.30.0 实施计划

### 步骤 0：复盘文档
**新文件：** `retrospectives/2026-04-17-daomind-v2.29.x.md`
- 覆盖 v2.29.0（MyST 统一 SPA）和 v2.29.1（perf 优化）
- 记录架构决策、遇到的错误及修复方法

**git 操作：** 
- commit: `"retrospective: v2.29.x — MyST markdown SPA + AI 响应速度优化"`
- 暂不打 tag（v2.29.x 里程碑已完结，复盘是附属文档）

---

### 步骤 1：安装依赖
```
pnpm add rehype-raw -w
```

---

### 步骤 2：修复 B1 — `MystRenderer.tsx`（rehype-raw）

**文件：** `src/components/MystRenderer.tsx`

```diff
+ import rehypeRaw from "rehype-raw";
...
  rehypePlugins={[rehypeRaw, rehypeHighlight]}
  // rehypeRaw 必须在 rehypeHighlight 之前，先把 HTML 节点解析出来再做语法高亮
```

---

### 步骤 3：修复 B2 — `ChatPage.tsx`（聊天 Markdown 渲染）

**文件：** `src/pages/ChatPage.tsx`

```diff
+ import ReactMarkdown from "react-markdown";
+ import remarkGfm from "remark-gfm";
...
- <div className="chat-bubble-text">{msg.content}</div>
+ <div className="chat-md">
+   <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
+ </div>
  {msg.isStreaming && <span className="chat-cursor" />}
```

---

### 步骤 4：修复 B3 — `useAIChat.ts`（openWhenHidden）

**文件：** `src/hooks/useAIChat.ts`

```diff
  await fetchEventSource(..., {
+   openWhenHidden: true,
    ...
  })
```

---

### 步骤 5：修复 B4 — `DocsPage.tsx`（滚动到顶部）

**文件：** `src/pages/DocsPage.tsx`

```diff
+ import { useRef, useEffect } from "react";
...
+ const scrollRef = useRef<HTMLElement>(null);
+
+ useEffect(() => {
+   scrollRef.current?.scrollTo(0, 0);
+ }, [docPath]);
...
- <main className="docs-content">
+ <main className="docs-content" ref={scrollRef}>
```

---

### 步骤 6：聊天 Markdown 样式 — `index.css`

新增 `.chat-md` 下的 markdown 元素样式（紧凑风格，与气泡背景色协调）：
```
.chat-md p                — 段落间距
.chat-md code             — 内联代码（圆角背景色）
.chat-md pre              — 代码块（深色背景）
.chat-md pre code         — 代码块内 code 重置
.chat-md ul / ol          — 列表缩进
.chat-md li               — 列表项
.chat-md strong           — 粗体
.chat-md em               — 斜体
.chat-md blockquote       — 引用块左边线
.chat-md a                — 链接颜色
.chat-md h1/h2/h3         — 标题（较小字号，适合气泡内）
```
所有颜色使用语义化 token（`hsl(var(--*))`)，不写死颜色。

---

### 步骤 7：git commit + tag v2.30.0 + push

```
git add -A
git commit -m "fix(v2.30.0): rehype-raw + 聊天 MD 渲染 + SSE 稳定性 + 文档滚动复位

  B1: MystRenderer — 添加 rehype-raw，修复 admonition HTML 被转义显示的问题
  B2: ChatPage — 使用 react-markdown 渲染 AI 响应（支持代码/列表/粗体等）
  B3: useAIChat — fetchEventSource 添加 openWhenHidden: true，避免切换标签中断流
  B4: DocsPage — docPath 变化时 scrollRef.scrollTo(0,0)，新页面从顶部开始

  依赖：pnpm add rehype-raw"

git tag -a v2.30.0 -m "v2.30.0 — 聊天 Markdown 渲染 + 文档 Bug 修复"
git push origin main --tags
```

---

## 关键文件

| 文件 | 操作 |
|------|------|
| `retrospectives/2026-04-17-daomind-v2.29.x.md` | 新建 |
| `src/components/MystRenderer.tsx` | 修改（B1） |
| `src/pages/ChatPage.tsx` | 修改（B2） |
| `src/hooks/useAIChat.ts` | 修改（B3） |
| `src/pages/DocsPage.tsx` | 修改（B4） |
| `src/index.css` | 追加 `.chat-md` 样式 |

---

## 验证方法

1. `docs/site/videos/index.md` 的 `:::info` 块显示为蓝色信息框（非 HTML 源码）  
2. 道衍回复中的 `` `代码` ``、`**粗体**`、列表 正确渲染  
3. 切换浏览器标签后回来，流式输出继续而不重新请求  
4. 点击文档侧边栏切换页面，内容区滚动到顶部  
5. `pnpm build` 零 TS 错误
