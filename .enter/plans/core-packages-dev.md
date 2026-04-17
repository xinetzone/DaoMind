# P5 · 道统 · 全局主题切换

> 目标：浅色 / 深色 / 水墨 三套主题，统一 CSS 变量系统，用户手动切换并持久化。

---

## 背景

当前状态：
- 颜色 token 定义在 `:root { }` (浅色)
- 深色仅通过 `@media (prefers-color-scheme: dark)` 自动响应，无手动切换
- `--col-good/warn/crit` 定义在 P3 区块的第二个 `:root` 中
- 无主题切换 UI

---

## 方案

### 1. CSS 重构 (`src/index.css`)

**移除** `@media (prefers-color-scheme: dark)` 块  
**改为** `[data-theme="dark"]` attribute selector  
**新增** `[data-theme="ink"]` 水墨主题（宣纸米白 + 墨汁黑棕 + 哑光配色）  
**合并** `--col-good/warn/crit` 到每个主题的变量块中（ink 主题用静雅配色）

三套主题色：

```
浅色 (light) — 已有，迁移到 :root
  --bg: #ffffff  --primary: #3b4eac  --text: #1a1f3c

深色 (dark) — 迁移自 media query  
  --bg: #0f1023  --primary: #5468c8  --text: #e8eaf6

水墨 (ink) — 全新
  --bg: #f5f0e8       (宣纸米白)
  --bg-muted: #ede8de
  --bg-card: #f8f4ec
  --surface: #e4dfd5
  --text: #1c1814     (墨汁黑棕)
  --text-muted: #4a4540
  --text-light: #7a7570
  --border: #d0cdc5
  --border-strong: #b0ada5
  --primary: #3a3630  (墨黑)
  --primary-light: #5a5550
  --primary-glow: rgba(58,54,48,0.15)
  --secondary: #8a7a65 (赭色)
  --col-good: #4a7c59  (苔绿)
  --col-warn: #b5810a  (赭黄)
  --col-crit: #8b2e2e  (朱砂暗红)
```

### 2. 新文件：`src/hooks/useTheme.ts` (≈50 行)

```typescript
export type Theme = 'light' | 'dark' | 'ink'
const KEY = 'daomind-theme'

export function useTheme(): { theme: Theme; setTheme: (t: Theme) => void } {
  // 初始化：localStorage → prefers-color-scheme → 'light'
  // setTheme：更新 document.documentElement.dataset.theme + localStorage
  // useEffect：应用初始主题到 <html data-theme>
}
```

### 3. 新文件：`src/components/ThemeToggle.tsx` (≈45 行)

三按钮循环切换，图标：`Sun` / `Moon` / `Feather`（lucide-react）  
当前主题按钮高亮显示，tooltip 显示主题名（浅色/深色/水墨）

### 4. 修改 `src/App.tsx`

在 nav 右侧添加 `<ThemeToggle />` 组件：
```tsx
import { useTheme } from './hooks/useTheme'
import { ThemeToggle } from './components/ThemeToggle'
// nav 右侧：
<div className="app-nav-right">
  <ThemeToggle theme={theme} setTheme={setTheme} />
</div>
```

---

## 文件清单

| 文件 | 操作 | 估计行数 |
|------|------|---------|
| `src/index.css` | 修改 — 重构主题变量块 | 改 ~70 行 |
| `src/hooks/useTheme.ts` | 新建 | ~50 行 |
| `src/components/ThemeToggle.tsx` | 新建 | ~45 行 |
| `src/App.tsx` | 修改 | +8 行 |

---

## 验证

1. 默认打开 → 自动识别系统偏好（浅色/深色）
2. 点击切换按钮 → 主题立即切换，所有页面颜色同步变化
3. 刷新页面 → localStorage 记忆上次主题
4. 水墨主题 → 宣纸米白背景 + 墨黑文字，道监/道集/道审页面配色和谐
5. 无新 lint 错误
