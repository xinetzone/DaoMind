# Plan: 复盘 + 测试 + Commit/Tag/Push + Claude Opus 4.7 & GPT 5.4 支持

## Context

当前 git 状态：工作区干净，最新提交为 `ffe614f`（命名规范别名重构）。
需要：① 确认 1000/1000 测试通过；② 添加两个新 AI 模型；③ commit + tag v2.46.5 + push github。

---

## 变更范围

### 1. `src/data/models.ts` — 新增两条模型记录

```ts
{
  id: 'anthropic/claude-opus-4.7',
  name: 'Claude Opus 4.7',
  vendor: 'Anthropic',
  desc: '最强推理与复杂任务处理，适合深度道德哲学分析',
  badge: 'New',
},
{
  id: 'openai/gpt-5.4',
  name: 'GPT 5.4',
  vendor: 'OpenAI',
  desc: '前沿综合能力，复杂推理与高质量输出',
},
```

### 2. `supabase/functions/ai-chat-8c107efce1b0/index.ts` — 扩展白名单

在 `ALLOWED_MODELS` 集合中添加：
- `'anthropic/claude-opus-4.7'`
- `'openai/gpt-5.4'`

然后通过 `supabase_deploy_edge_function` 重新部署该函数。

---

## 执行步骤

1. **pnpm test** — 确认 1000/1000（只读验证，无需改动）
2. **编辑 `src/data/models.ts`** — 追加两条模型
3. **编辑 + 部署 Edge Function** — 更新 ALLOWED_MODELS 并 deploy
4. **pnpm test** — 再次确认测试不受影响（模型变更不影响单元测试）
5. **git commit** — `feat(models): add Claude Opus 4.7 and GPT 5.4 support`
6. **git tag** — `v2.46.5`
7. **git push github main --tags** — 推送到 GitHub

---

## 关键文件

| 文件 | 操作 |
|------|------|
| `src/data/models.ts` | edit — 追加 2 条 AIModel |
| `supabase/functions/ai-chat-8c107efce1b0/index.ts` | edit + deploy — 添加 2 个 model ID 到白名单 |

---

## Model IDs（来自 enter_llm_integration skill）

| 显示名 | API model ID |
|--------|-------------|
| Claude Opus 4.7 | `anthropic/claude-opus-4.7` |
| GPT 5.4 | `openai/gpt-5.4` |

---

## 验证

- `pnpm test` → 1000/1000 ✅
- ModelSelector UI 中出现两个新选项
- Edge Function ALLOWED_MODELS 包含新 ID
- `git log --oneline -3` 显示新 commit
- `git tag | grep v2.46.5` 存在
- `git push github` 成功
