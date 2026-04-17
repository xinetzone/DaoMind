# v2.30.5 — 代码缩进格式统一

## Context

项目根目录存在 `.prettierrc`（`semi:false, singleQuote:true, tabWidth:2`），但：
- `prettier` **未列入** `package.json` devDependencies（导致格式化工具未固定）
- `prettier --check` 发现 **17 个文件** 格式不符（15 src/ + 2 supabase/functions/）
- 主要差异：源文件用双引号 + 分号，而 Prettier 要求单引号 + 无分号 + 2 空格缩进
- `docs/site/**/*.md` 内的代码块也有少量格式不一致（分号、表格对齐等）

## 根本原因

`prettier` 没有作为项目依赖安装，导致每次手写代码时没有自动化格式化约束。

---

## 实施步骤

### Step 1 — 安装 prettier 为 devDependency

```bash
pnpm add -D prettier@latest -w
```

### Step 2 — 添加 format 脚本到 package.json

在 `scripts` 中添加：
```json
"format": "prettier --write \"src/**/*.{ts,tsx,css}\" \"supabase/functions/**/*.ts\" \"docs/site/**/*.md\""
```

### Step 3 — 运行 prettier --write 修复全部文件

```bash
pnpm prettier --write "src/**/*.{ts,tsx,css}" "supabase/functions/**/*.ts" "docs/site/**/*.md"
```

涉及文件（17+ 个）：
- `src/App.tsx`
- `src/components/DaoLogo.tsx`
- `src/components/DocSidebar.tsx`
- `src/components/MystRenderer.tsx`
- `src/data/navigation.ts`
- `src/hooks/useAIChat.ts`
- `src/index.css`
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- `src/main.tsx`
- `src/pages/ChatPage.tsx`
- `src/pages/DocsPage.tsx`
- `src/__tests__/` 下 3 个测试文件
- `supabase/functions/ai-chat-8c107efce1b0/index.ts`
- `supabase/functions/get-secrets/index.ts`
- `docs/site/**/*.md`（内部代码块格式化）

### Step 4 — 验证构建

```bash
pnpm build
```

确认 2244 modules 构建成功，无错误。

### Step 5 — git commit + tag + push

```
style(v2.30.5): prettier 格式化 — 统一全量代码缩进与引号风格

  · 安装 prettier@latest 为 devDependency
  · 添加 package.json format 脚本
  · src/**/*.{ts,tsx,css}：双引号→单引号，移除分号，2 空格缩进
  · supabase/functions/**/*.ts：同上
  · docs/site/**/*.md：代码块内统一格式（移除多余分号）
```

tag: `v2.30.5`

---

## 风险说明

- `.md` 文件中的表格 Prettier 会重新对齐列宽（去除多余空格）——渲染结果不变，纯格式变化
- 不改变任何业务逻辑，仅格式化
