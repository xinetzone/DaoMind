# P11 · 道响 · 移动端适配 — 抽屉式侧边栏

## 背景

当前侧边栏采用 inline 推挤式（`.session-sidebar` 从 `width:0` 展开到 `240px`），在手机屏幕上会把主聊天区压得极窄。子标题栏的文字按钮（新对话/导出/导图）也容易在窄屏溢出。

## 目标

- 手机端侧边栏改为 **fixed overlay 抽屉**，不压缩聊天区域
- 抽屉打开时显示半透明遮罩，点击遮罩关闭
- 窄屏时子标题按钮只显示图标（隐藏文字）
- 桌面端（>640px）保持现有 inline 推挤行为不变

---

## 实现方案（纯 CSS + 极少 JSX）

### 1. `src/index.css` — 新增 mobile media query

在现有 `@media (max-width: 640px)` 块中追加，或新建一个块：

```css
@media (max-width: 640px) {
  /* Drawer overlay mode */
  .session-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100%;
    width: 0;              /* 同 desktop 初始值 */
    z-index: 150;
    border-right: none;
    box-shadow: none;
  }
  .session-sidebar.open {
    width: 280px;
    min-width: 280px;
    box-shadow: 4px 0 24px rgba(0,0,0,0.25);
    border-right: 1px solid var(--border);
  }

  /* Backdrop */
  .sidebar-backdrop {
    display: block;         /* hidden on desktop via display:none */
  }

  /* Hide button text labels in subheader */
  .chat-icon-btn span {
    display: none;
  }
}

/* Backdrop base (hidden on desktop) */
.sidebar-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 149;
  animation: fb-appear 0.2s ease;
}
```

### 2. `src/pages/ChatPage.tsx` — 添加 backdrop div

在 `<SessionSidebar>` 之后，`<div className="chat-layout">` 之前，插入：

```tsx
{sidebarOpen && (
  <div
    className="sidebar-backdrop"
    onClick={() => setSidebarOpen(false)}
  />
)}
```

---

## 文件清单

| 文件 | 改动 |
|------|------|
| `src/index.css` | 追加 mobile drawer CSS (~25行) |
| `src/pages/ChatPage.tsx` | 插入 backdrop div (~4行) |

---

## 验证

- 桌面端：侧边栏仍为 inline 推挤，行为不变
- 移动端（≤640px）：
  - 点 History 按钮 → 侧边栏从左滑入，遮罩出现
  - 点遮罩 → 侧边栏收起
  - 选择会话 → 侧边栏收起（已有 `setSidebarOpen(false)` 逻辑）
  - 子标题只显示图标
