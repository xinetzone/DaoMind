# P5-hotfix · UI 图标尺寸优化

## 问题
用户反馈"图标太大了"。截图分析：
- `chat-welcome-logo` 68px — 英雄区 DaoLogo 过大
- `chat-welcome-title` 2.75rem (~44px) — "道衍"标题过大

其余图标（nav logo 24px、avatar logo 18px、tab icon 14px）尺寸合理，无需改动。

## 修改范围（仅 src/index.css）

| 选择器 | 旧值 | 新值 |
|--------|------|------|
| `.chat-welcome-logo` width/height | 68px | 44px |
| `.chat-welcome-title` font-size | 2.75rem | 2rem |
| `.chat-welcome-logo` (mobile `@media ≤640px`) | 56px | 36px |
| `.chat-welcome-title` (mobile) | 2.25rem | 1.75rem |

## 文件
- `src/index.css` (lines ~335-348, ~678-685)

## 验证
刷新页面，英雄区 logo 更紧凑，整体层级感更佳。
