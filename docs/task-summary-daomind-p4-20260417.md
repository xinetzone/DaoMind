# P4 复盘报告 · 道反 · 消息反馈

> DaoMind v2.34.0 | 2026-04-17

---

## 一、任务概述

**P4 目标**：在道衍 AI 聊天界面中，为每条 AI 助手消息添加点赞/踩反馈按钮，实现：
1. 乐观 UI 更新（localStorage 立即响应）
2. 后端持久化（Supabase `message_feedback` 表 REST API）
3. 与 `daoFeedback.DaoFeedbackSignal` 概念对齐

**交付范围**：1 个数据库迁移 + 2 个新文件 + 2 个文件修改

---

## 二、交付清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `supabase/migrations/migration_20260417_102032000` | SQL | `message_feedback` 表 + RLS 策略 |
| `src/hooks/useFeedback.ts` | 新建 83 行 | localStorage + Supabase REST 双层持久化 |
| `src/components/MessageFeedback.tsx` | 新建 54 行 | ThumbsUp/ThumbsDown 三态按钮组件 |
| `src/pages/ChatPage.tsx` | 修改 +13 行 | 集成 `useFeedback` hook + `MessageFeedback` 组件 |
| `src/index.css` | 修改 +56 行 | `.msg-feedback` / `.msg-fb-btn` / `.msg-fb-thanks` 样式 |

**Commit**: `9a68174` — `feat(feedback): add message feedback to chat`  
**Tag**: `v2.34.0`

---

## 三、架构决策

### 为什么不用 Edge Function？

P4 的核心操作是简单的 CRUD INSERT，没有业务逻辑需要在服务端执行。
直接使用 Supabase REST API（`POST /rest/v1/message_feedback`）可以：
- 零冷启动延迟
- 代码更简洁（无需部署/维护额外的 Edge Function）
- 同 MonitorPage/CollectivePage 的 Edge Function fetch 模式保持一致（均使用 SUPABASE_URL + SUPABASE_ANON_KEY）

### 为什么用 localStorage 做乐观更新？

用户对反馈操作有强烈的「即时感」预期——点击后立即看到按钮变色，而非等待网络请求。
localStorage 充当本地缓存，即使网络请求失败也能保留用户意图，下次打开页面状态仍在。

### 为什么用 `message_index` 而非 `message_id`？

当前 `Message` 接口没有 `id` 字段（`{ role, content, isStreaming? }`），引入 id 需要改动 `useAIChat`、`useSessions`、所有消息创建点。
用 `session_id + message_index` 的复合键（`daomind-feedback-${sessionId}:${index}`）成本最低，与现有架构完全兼容。

---

## 四、daoFeedback 哲学映射

```typescript
// DaoFeedbackSignal 概念映射 (注释于 useFeedback.ts)
// rating='up'   → level='opportunity', category='behavior', metrics={quality:1}
// rating='down' → level='warning',     category='behavior', metrics={quality:0}
```

《道德经》四十章：「反也者，道之动也」——反馈即是系统自我调节的动力。
用户的点赞/踩，正是信息系统最原始、最直接的「道反」信号。

---

## 五、测试验证

### 功能测试
- [x] 流式输出中：反馈按钮不显示（`isStreaming=true` → null）
- [x] 流式完成后：👍 👎 按钮出现，有 appear 动画
- [x] 点击点赞：按钮绿色高亮 + "已标记有帮助" 文字
- [x] 点击踩：按钮红色高亮 + "已反馈改进" 文字
- [x] 刷新页面：localStorage 状态恢复，评分状态持久
- [x] 切换会话：反馈状态按 sessionId 隔离，互不干扰
- [x] Supabase 持久化：`message_feedback` 表有记录写入

### 代码质量
- [x] TypeScript 严格类型（无 `any`，所有函数有明确返回类型）
- [x] Lint 无新增错误（所有警告均为预存的 packages/ 目录问题）
- [x] 组件拆分合理（hook / component / CSS 三层分离）

---

## 六、经验与反思

1. **乐观 UI 模式的权衡**：localStorage 状态与数据库状态可能短暂不一致（网络失败时）。
   对于反馈这类低风险操作，用户体验优先于严格一致性，静默失败是合理选择。

2. **`message_index` 的脆弱性**：如果用户在某条消息之前插入消息（理论上可能），
   index 会偏移导致 localStorage key 失配。未来若需要精确映射，应给 Message 类型添加 uuid。

3. **RLS 策略**：`with check (true)` + `using (true)` 允许匿名访问，适合当前无认证的原型阶段。
   生产环境应改为基于 `auth.uid()` 的行级隔离。

---

## 七、当前项目状态

```
v2.34.0 (2026-04-17)
├── P1: 多会话侧边栏 + 语法高亮 + 道审 Tab           ← v2.32.0
├── P2: 道监 · 实时监控看板 (dao-monitor Edge Fn)    ← v2.32.0
├── P3: 道集 · 宇宙健康板 (dao-collective Edge Fn)   ← v2.33.0
│   └── 优化: useEdgeFetch<T> 共享轮询 Hook
└── P4: 道反 · 消息反馈 (message_feedback + localStorage) ← v2.34.0
```

**4 Tab 架构**：问道 / 道审 / 道监 / 道集
