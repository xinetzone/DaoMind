# P1 功能实现计划

## Context
基于全面分析，前端存在三项影响用户体验的关键缺口：
1. 聊天记录刷新即失（无持久化）
2. AI 回答中的代码块无语法高亮
3. DaoVerify 哲学审查能力（18 个包已实现）无任何 UI 入口

用户确认：多会话 + 历史侧栏（localStorage），道审为独立 Tab。

---

## 一、聊天记录多会话持久化

### 数据模型
```typescript
// src/hooks/useSessions.ts
interface Session {
  id: string           // nanoid / Date.now().toString()
  title: string        // 取第一条 user message 前 22 字符
  createdAt: number
  updatedAt: number
  messages: Message[]
}
localStorage key: 'daomind-sessions'
```

### 架构分离
- **`src/hooks/useSessions.ts`（新建）**
  - `sessions` / `currentSessionId` 存 localStorage
  - `createSession()` — 建新会话并设为当前
  - `switchSession(id)` — 切换
  - `updateCurrentMessages(messages)` — 保存最新消息
  - `deleteSession(id)`
  - 返回 `{ sessions, currentSession, createSession, switchSession, updateCurrentMessages, deleteSession }`

- **`src/hooks/useAIChat.ts`（修改）**
  - 新增参数 `initialMessages?: Message[]` —— 初始化时载入历史
  - 新增回调 `onMessagesChange?: (msgs: Message[]) => void` —— 每次消息变化时通知外层持久化

- **`src/components/SessionSidebar.tsx`（新建）**
  - Props: `{ sessions, currentSessionId, onSelect, onCreate, onDelete, isOpen, onClose }`
  - 按日期分组（今天 / 昨天 / 更早）
  - 每条显示 title + 相对时间

- **`src/pages/ChatPage.tsx`（修改）**
  - 引入 `useSessions` + 修改后的 `useAIChat`
  - 侧栏切换按钮（`Clock` 图标）在 chat-subheader 右侧
  - 布局：`flex-row`，侧栏 240px + 主区域 flex:1
  - "新对话" 按钮调用 `createSession()`，清空并切换

### 布局结构
```
.chat-with-sidebar            (flex-row, height:100%)
  .session-sidebar            (240px, 可折叠, transition width)
  .chat-layout                (flex:1)
```

---

## 二、代码块语法高亮

### 方案
安装 `react-syntax-highlighter` + `@types/react-syntax-highlighter`  
在 `ChatPage.tsx` 中为 `ReactMarkdown` 的 `code` 组件注入 Prism + oneDark 主题。

```tsx
// 核心变更（ChatPage.tsx）
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

// ReactMarkdown components:
code({ inline, className, children }) {
  const match = /language-(\w+)/.exec(className || '')
  return !inline && match ? (
    <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div">
      {String(children).replace(/\n$/, '')}
    </SyntaxHighlighter>
  ) : (
    <code className={className}>{children}</code>
  )
}
```

同步修复 `index.css` 中 `chat-md` 的破损 CSS 变量：
- `hsl(var(--background) / 0.6)` → `var(--bg-muted)` 
- `hsl(var(--primary))` → `var(--primary)`
- `hsl(var(--border))` → `var(--border)`
- `hsl(var(--surface))` → `var(--surface)`
- `hsl(var(--text-muted))` → `var(--text-muted)`

---

## 三、道审（DaoVerify）哲学审查面板

### DaoVerify 的运行方式
`DaoVerificationReporter.runAllChecks(root)` 使用 `node:fs` 扫描源码，**无法在浏览器运行**。

### 方案：构建时预生成 + 静态数据嵌入
```bash
# 实现阶段执行（生成静态快照）
npx tsx packages/daoVerify/src/reporter.ts > src/data/verify-results.json
# 或通过 ts-node / 临时脚本生成
```

生成文件：`src/data/verify-results.json`（`DaoVerificationReport` 类型）

### 新建文件
**`src/pages/AuditPage.tsx`**
- 顶部：总分环形进度 + `overallScore` / `passedCount` / `failedCount`
- 主区：6 个检验项卡片（分类名、分数、passed/failed 徽章、details、recommendation）
- 侧栏：`philosophyDepth` 六维雷达数据（文字展示）
- 底部：`warnings` 列表

### App.tsx 路由
```tsx
// hash routing: #chat（默认）| #audit
const page = hash === '#audit' ? 'audit' : 'chat'
// 顶栏增加两个 Tab 按钮（问道 | 道审）
```

---

## 文件变更清单

| 文件 | 操作 |
|------|------|
| `src/hooks/useSessions.ts` | 新建 |
| `src/components/SessionSidebar.tsx` | 新建 |
| `src/data/verify-results.json` | 新建（脚本生成） |
| `src/pages/AuditPage.tsx` | 新建 |
| `src/hooks/useAIChat.ts` | 修改：`initialMessages` + `onMessagesChange` |
| `src/pages/ChatPage.tsx` | 修改：集成侧栏 + 多会话 + 语法高亮 |
| `src/App.tsx` | 修改：Tab 导航 + hash 路由 |
| `src/index.css` | 修改：侧栏样式 + 审查页样式 + 修复 chat-md 变量 |

**新依赖：**
- `react-syntax-highlighter`
- `@types/react-syntax-highlighter`

---

## 验证
1. `npx jest --no-coverage` → 1000 tests 全部通过
2. 聊天 → 刷新 → 消息仍在
3. 新对话 → 切换侧栏 → 恢复旧对话
4. AI 返回代码块 → 有语法高亮（Prism oneDark 主题）
5. 顶栏点"道审" → 显示 6 项哲学检查结果及总分
6. `pnpm format && pnpm lint` 通过
