# 全面复盘：去冗余 · 保一致 · 促自运转

## Context

本次全面审查的三个目标：
1. **去除冗余** — 删除不再起作用的脚本、历史文档、独立测试文件
2. **逻辑自洽** — 修复 ChatPage footer 写死模型名、verify-results.json 行数过时、App.tsx 导航重复逻辑
3. **系统自运转** — 让所有显示内容与实际运行状态保持动态一致

---

## 问题清单

### A. 逻辑不一致（中优先 → 影响用户感知）

| # | 文件 | 问题 | 修复方式 |
|---|------|------|----------|
| A1 | `src/pages/ChatPage.tsx:375` | footer 写死 "由 GLM 5 驱动"，切换到其他模型后仍显示 GLM 5 | 改为动态 `由 ${model.name} 驱动` |
| A2 | `src/data/verify-results.json` | daoNothing 行数仍显示 366（实际已扩展到 400 行），比值 0.948 过时 | 更新为 400 行、比值 1.036 |
| A3 | `src/App.tsx` | `getInitialPage()` 与 `hashchange` handler 重复了同一套 hash→page 映射逻辑；`navigate()` 使用 5 层嵌套三元 | 提取 `HASH_TO_PAGE`/`PAGE_TO_HASH` 常量，统一复用 |

### B. 重复逻辑（低优先 → 代码整洁）

| # | 文件 | 问题 | 修复方式 |
|---|------|------|----------|
| B1 | `src/pages/ChatPage.tsx:155,163` | `handleSubmit` 和 `handleKeyDown` 各自重复 `if (!currentSessionId) createSession()` + `sendMessage()` + `setInput('')` | 提取 `doSend(text)` 内部函数 |

### C. 冗余文件（高优先 → 项目整洁）

| # | 文件/目录 | 原因 |
|---|-----------|------|
| C1 | `test-event-void.js` (23 行) | 根目录独立脚本，无 Jest 测试结构，功能已被包测试覆盖 |
| C2 | `tests/test-project.js` (76 行) | `.js` 文件 Jest 不收集，仅为开发期手动脚本 |
| C3 | `tests/test-qi-message.js` (89 行) | 同上 |
| C4 | `push-to-github.sh` | sandbox 内无法执行的 shell 脚本 |
| C5 | `docs/task-summary-*.md` (10 个文件) | 开发过程自动生成的执行报告，非用户文档 |
| C6 | `retrospectives/` 目录 (27 个文件) | 每个版本 retrospective，现已有 git tag + commit history 取代其作用 |

### D. tests/test-monitor-system.test.ts（中优先 → 测试健康）

| # | 问题 | 修复 |
|---|------|------|
| D1 | 模块顶层有 `console.log()` 语句，Jest 加载时输出噪声（line 1, 13, 223） | 删除顶层 console.log，仅保留第 224 行的 `test()` 块 |

---

## 执行计划（按依赖顺序）

### Step 1 — 删除冗余文件（C 组）
```
删除: test-event-void.js
删除: tests/test-project.js
删除: tests/test-qi-message.js
删除: push-to-github.sh
删除: docs/task-summary-daomind-p11-20260417.md
删除: docs/task-summary-daomind-p12-20260417.md
删除: docs/task-summary-daomind-p13-20260417.md
删除: docs/task-summary-daomind-p1p2-20260417.md
删除: docs/task-summary-daomind-p3-20260417.md
删除: docs/task-summary-daomind-p4-20260417.md
删除: docs/task-summary-daomind-p5-ui-fix-20260417.md
删除: docs/task-summary-daomind-p6-20260417.md
删除: docs/task-summary-daomind-p7-20260417.md
删除: docs/task-summary-daomind-p8-20260417.md
删除: retrospectives/ (全部 27 个文件)
```

### Step 2 — 修复 verify-results.json (A2)
`wu-you-balance` check 的 details 字段：
- `daoNothing: 366 行` → `daoNothing: 400 行`
- `比值: 0.948` → `比值: 1.036`

### Step 3 — App.tsx 导航重构 (A3)
```typescript
// 提取常量
const HASH_TO_PAGE: Record<string, Page> = {
  '#audit': 'audit', '#monitor': 'monitor',
  '#collective': 'collective', '#stats': 'stats', '#chat': 'chat',
}
const PAGE_TO_HASH: Record<Page, string> = {
  audit: '#audit', monitor: '#monitor',
  collective: '#collective', stats: '#stats', chat: '#chat',
}

// getInitialPage 和 hashchange handler 均使用 HASH_TO_PAGE 查找
// navigate() 使用 PAGE_TO_HASH 查找
```

### Step 4 — ChatPage.tsx 两处修复 (A1 + B1)
A1: footer 改为动态
```tsx
<p className="chat-footer-note">道衍基于帛书《道德经》智慧，由 {model.name} 驱动</p>
```

B1: 提取 doSend 去重
```typescript
const doSend = (text: string): void => {
  if (!currentSessionId) createSession()
  sendMessage(text)
  setInput('')
}
// handleSubmit 和 handleKeyDown 均调用 doSend
```

### Step 5 — 清理 tests/test-monitor-system.test.ts (D1)
删除文件开头和中间的顶层 `console.log()` 行（lines 1, 13, 223）。
保留：import、`testMonitorSystem` 函数体（function 内的 console.log 可保留），以及 line 224 的 `test()` 块。

---

## 受影响文件

| 文件 | 操作 |
|------|------|
| `test-event-void.js` | 删除 |
| `push-to-github.sh` | 删除 |
| `tests/test-project.js` | 删除 |
| `tests/test-qi-message.js` | 删除 |
| `docs/task-summary-*.md` (10 files) | 删除 |
| `retrospectives/*.md` (27 files) | 删除 |
| `src/data/verify-results.json` | 更新 daoNothing 行数 + 比值 |
| `src/App.tsx` | 提取 HASH_TO_PAGE / PAGE_TO_HASH 常量 |
| `src/pages/ChatPage.tsx` | 动态模型名 + doSend 去重 |
| `tests/test-monitor-system.test.ts` | 删除顶层 console.log |

## 不变内容

- 所有 packages/* 源码不变（命名规范工作已完成）
- 所有 supabase/functions/* 不变
- 所有 src/hooks/, src/components/ 不变（除 ChatPage 内提取函数）
- Jest 测试结构不变，1000 个测试继续通过

## 验证方式

1. `pnpm test` → 1000/1000 通过
2. 预览页面：ChatPage footer 显示当前选中模型名
3. 道审页面：有无平衡 card 显示 "daoNothing: 400 行，比值: 1.036"
4. App.tsx 页面导航正常（hash 路由）
