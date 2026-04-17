# Plan: VitePress 代码样式对齐 (v2.30.4)

## Context

用户要求参考 https://xinetzone.github.io/DaoMind/examples/hello-world.html（VitePress 官方文档站）的代码样式，优化当前 SPA 文档站 (https://8c107efce1b05ae5bb6ccdf5860fba38.prod.enter.pro)。

### 差异分析（Reference vs Current）

| 元素 | 参考站 (VitePress) | 当前站 |
|------|-------------------|--------|
| 代码块背景 | 深靛蓝 `#1a1b26` (Tokyo Night) | 纯黑 `#0f1117` |
| 代码块顶部 | 右上角显示语言标签 "typescript" / "bash" | 红/黄/绿终端三点（不符合文档风格）|
| 代码字体 | JetBrains Mono / ui-monospace | Courier New |
| 语法高亮主题 | Shiki tokyo-night-dark 风格颜色 | highlight.js github-dark.css |
| 行内代码 | 浅绿/青绿 badge（`Greeter`） | 蓝色 badge |
| h2 左侧 accent bar | 3px indigo 竖条 ✓ | 已有（v2.30.3）✓ |

---

## Implementation

### 文件 1: `src/components/MystRenderer.tsx`

**A. 更换 hljs 主题**
```diff
- import "highlight.js/styles/github-dark.css";
+ import "highlight.js/styles/tokyo-night-dark.css";
```

**B. 修改 `pre` 组件：提取语言名称 → 写入 `data-lang`**
```tsx
pre({ children }) {
  const codeEl = React.Children.toArray(children)[0] as React.ReactElement<{ className?: string }>;
  const className = (codeEl?.props?.className as string) ?? '';
  const langMatch = className.match(/language-(\w+)/);
  const lang = langMatch ? langMatch[1] : '';
  return (
    <div className="doc-pre" data-lang={lang || undefined}>
      {children}
    </div>
  );
},
```

---

### 文件 2: `src/index.css`

**A. 添加 JetBrains Mono 字体到 Google Fonts import**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

**B. 定义 `--code-font` token**
```css
:root {
  /* ... existing ... */
  --code-font: 'JetBrains Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace;
}
```

**C. 替换 `.doc-pre` 样式（移除终端三点，改为 VitePress 风格）**
```css
.doc-pre {
  position: relative;
  background: #1a1b26;           /* Tokyo Night background */
  border-radius: var(--radius);
  overflow: hidden;
  margin: 1.25rem 0;
  border: 1px solid rgba(255, 255, 255, 0.07);
}
/* 移除 .doc-pre::before 终端三点（整段删除） */
/* 语言标签（右上角，通过 data-lang） */
.doc-pre[data-lang]::after {
  content: attr(data-lang);
  position: absolute;
  top: 0.65rem;
  right: 1rem;
  font-size: 0.72rem;
  font-family: var(--code-font);
  color: rgba(180, 190, 220, 0.4);
  letter-spacing: 0.05em;
  pointer-events: none;
  z-index: 1;
}
```

**D. 更新 `.doc-code-block` 字体**
```css
.doc-code-block {
  display: block;
  padding: 1.35rem 1.5rem 1.35rem;
  font-family: var(--code-font);   /* 替换 Courier New */
  font-size: 0.855rem;
  line-height: 1.7;
  overflow-x: auto;
  background: transparent !important;
}
```

**E. 更新 `.doc-inline-code`（浅绿/青绿 VitePress 风格）**
```css
.doc-inline-code {
  font-family: var(--code-font);
  font-size: 0.85em;
  color: #7ee787;                           /* GitHub-style green，清晰可辨 */
  background: rgba(126, 231, 135, 0.1);
  border: 1px solid rgba(126, 231, 135, 0.2);
  padding: 0.15em 0.5em;
  border-radius: 4px;
}
```

---

## Verification

1. `pnpm build` 无 error
2. 截图对比代码块：语言标签显示正确 / 背景为深靛蓝 / 字体为 JetBrains Mono
3. 截图确认行内代码为浅绿色（非蓝色）
4. `git commit + tag v2.30.4 + push`

## Files Modified

- `src/components/MystRenderer.tsx` — 主题切换 + pre 组件语言提取
- `src/index.css` — 字体 / 代码块 / 行内代码三处 CSS 改动
