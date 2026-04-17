# DaoMind 核心包开发计划

---

## P4 · 道反 · 消息反馈（当前任务）

### Context
连接 `daoFeedback` 包的"反也者，道之动"理念，让用户对 AI 回复进行点赞/踩评分，持久化到 Supabase，形成可追溯的反馈信号流。

### 数据模型

**Supabase 新表 `message_feedback`**
```sql
create table message_feedback (
  id            uuid        primary key default gen_random_uuid(),
  session_id    text        not null,
  message_index integer     not null,
  message_content text      not null,
  rating        text        not null check (rating in ('up','down')),
  created_at    timestamptz default now()
);
alter table message_feedback enable row level security;
create policy "anon_insert" on message_feedback for insert with check (true);
create policy "anon_select" on message_feedback for select using (true);
```

### 架构：4 个文件变更

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/hooks/useFeedback.ts` | 新建 | 提交反馈 + localStorage 乐观更新 |
| `src/components/MessageFeedback.tsx` | 新建 | 点赞/踩按钮组件（ThumbsUp/ThumbsDown） |
| `src/pages/ChatPage.tsx` | 修改 | 在 assistant 消息末尾挂载 MessageFeedback |
| `src/index.css` | 修改 | `.msg-feedback*` 按钮样式 |

### useFeedback.ts 设计

```typescript
// localStorage key: `daomind-feedback`
// feedbackMap: Record<string, 'up'|'down'>  // key = `${sessionId}:${messageIndex}`

export function useFeedback(sessionId: string | null): {
  getFeedback(index: number): 'up' | 'down' | null
  submitFeedback(index: number, content: string, rating: 'up'|'down'): Promise<void>
}
```

提交流程：
1. 乐观更新 localStorage → 触发 React 状态刷新
2. `fetch POST ${SUPABASE_URL}/rest/v1/message_feedback`（与现有代码同 anon-key 方式）
3. 失败静默（不阻塞 UI）

daoFeedback 概念映射（代码注释体现）：
- `rating='up'` → `SignalLevel='opportunity'`, `category='behavior'`
- `rating='down'` → `SignalLevel='warning'`, `category='behavior'`

### MessageFeedback.tsx 设计

```tsx
// Props: sessionId, messageIndex, content, isStreaming
// 仅在 !isStreaming && content.length > 0 时显示
// 图标: ThumbsUp / ThumbsDown (lucide-react, size=13)
// 状态: null | 'up' | 'down'
// 点击已评分 → 切换（重新提交新 rating）
```

### ChatPage.tsx 修改

```tsx
// 在 assistant bubble 的 ReactMarkdown 下方追加：
{!msg.isStreaming && msg.role === 'assistant' && msg.content && (
  <MessageFeedback
    sessionId={currentSessionId}
    messageIndex={i}
    content={msg.content}
  />
)}
```

以及在 ChatPage 引入 `useFeedback` hook，传入 `currentSessionId`。

### CSS 设计

```css
.msg-feedback { display: flex; gap: 0.3rem; margin-top: 0.4rem; }
.msg-fb-btn   { 圆角小按钮, 默认 muted 色 }
.msg-fb-btn.up.active   { color: var(--col-good) }
.msg-fb-btn.down.active { color: var(--col-crit) }
/* hover: 轻微放大 scale(1.15) */
```

### Supabase 迁移步骤

1. 执行 `supabase_migration` 创建 `message_feedback` 表 + RLS
2. 确认 `supabase_configure_auth` auto_confirm = true（已有）

### 验证

- 发送 AI 消息 → 流结束后出现点赞/踩按钮
- 点击按钮 → 按钮变色、localStorage 更新
- 切换会话再回来 → 评分状态保留（从 localStorage 恢复）
- 刷新页面 → 评分状态保留
- Supabase 表中可见 `message_feedback` 记录

---

## 已完成

### P1 · 多会话 + 代码高亮 + 道审 Tab（v2.32.0）
### P2 · 道监 · 五感仪表盘（v2.32.0）
### P3 · 道集 · 宇宙健康板（v2.33.0）
### 优化 · useEdgeFetch 共享 hook（v2.33.0+）
