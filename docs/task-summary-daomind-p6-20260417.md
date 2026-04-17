# DaoMind P6 复盘报告 · 道问 · 对话导出
> Tag: v2.36.0 · 2026-04-17 · Commit: c3bc152

## 1. 交付内容

| 文件 | 类型 | 行数 |
|------|------|------|
| `src/utils/exportChat.ts` | NEW | 75 |
| `src/pages/ChatPage.tsx` | MODIFY | +18 |

## 2. 功能说明

- 有消息时，子标题栏出现「导出」按钮（`Download` lucide 图标）
- 点击触发纯客户端下载，无需后端，文件名：`daomind-{会话标题}-{日期}.md`
- Markdown 内容含完整对话 + 反馈评分标注 `[有帮助]` / `[待改善]`
- 导出读取 localStorage 中的本地 feedback rating，即时可用

## 3. 架构决策

- **纯客户端**：`URL.createObjectURL(Blob)` + `<a>.click()` — 无需 Edge Function
- **`exportChat.ts` 纯函数**：`buildMarkdown()` 可单独测试；`downloadMarkdown()` 仅负责 DOM 副作用
- **反馈标注文字**：使用 `[有帮助]` / `[待改善]` 内联文字而非 emoji，符合项目规范
- **过滤 `isStreaming`**：跳过未完成的流式消息，避免导出半截内容

## 4. 技术亮点

```typescript
// buildMarkdown 纯函数设计 — 可复用、可测试
export function buildMarkdown(opts: ExportOptions): string

// downloadMarkdown 副作用隔离
export function downloadMarkdown(opts: ExportOptions): void {
  const md = buildMarkdown(opts) // 纯计算
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  // 浏览器下载触发...
}
```

## 5. 导出格式示例

```markdown
# 道衍 · 对话导出
**会话标题：** 帛书版核心差异
**导出时间：** 2026-04-17 10:44:00
**消息数量：** 用户 2 条 · 道衍 2 条
---
### 用户
帛书版与通行本《道德经》有哪些核心差异？
---
### 道衍 AI `[有帮助]`
帛书版（马王堆汉墓出土）...
---
*由 DaoMind 道衍 AI 生成 · 基于帛书《道德经》智慧*
```

## 6. 版本历史（本会话）

| 版本 | 功能 |
|------|------|
| v2.32.0 | P1 多会话侧边栏 + 语法高亮 + 道审 Tab |
| v2.33.0 | P3 道集宇宙健康板 |
| v2.34.0 | P4 道反消息反馈 |
| v2.35.0 | P5 道统三套主题 |
| v2.35.1 | UI fix 英雄 logo/标题缩小 |
| v2.36.0 | P6 道问对话导出 Markdown |
