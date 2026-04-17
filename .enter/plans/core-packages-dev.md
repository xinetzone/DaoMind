# P16 · 道存 · 数据导出/导入

## Context

会话数据存在 localStorage `daomind-sessions`，用户需要能备份和还原数据：
- **导出**：一键下载 JSON 文件
- **导入**：选择 JSON 文件，支持「覆盖」和「合并」两种模式

## 架构决策

纯客户端方案，不依赖后端：
- 导出：`URL.createObjectURL(new Blob([json]))` 触发下载
- 导入：`<input type="file" accept=".json">` + FileReader 读取
- UI 放在 **StatsPage 底部**（数据管理 = 统计数据同属「道数」页）

## 文件变更

### 1. `src/hooks/useSessions.ts` — 增加两个方法

```typescript
/** 用导入数据覆盖所有会话 */
const replaceAllSessions = useCallback((incoming: Session[]) => {
  saveSessions(incoming)
  setSessions(incoming)
  const firstId = incoming[0]?.id ?? null
  setCurrentSessionId(firstId)
  if (firstId) localStorage.setItem(CURRENT_KEY, firstId)
  else localStorage.removeItem(CURRENT_KEY)
}, [])

/** 与现有会话合并（按 id 去重，incoming 优先） */
const mergeSessions = useCallback((incoming: Session[]) => {
  setSessions(prev => {
    const existingIds = new Set(prev.map(s => s.id))
    const newOnes = incoming.filter(s => !existingIds.has(s.id))
    const next = [...newOnes, ...prev]
    saveSessions(next)
    return next
  })
}, [])
```

返回：`{ ...existing, replaceAllSessions, mergeSessions }`

### 2. `src/hooks/useDataIO.ts` — NEW

```typescript
// 导出：生成 JSON Blob，触发浏览器下载
export function exportSessions(sessions: Session[]): void {
  const payload = { version: 1, exportedAt: Date.now(), sessions }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `daomind-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 解析：读取文件内容，返回 Session[]
export async function parseImportFile(file: File): Promise<Session[]>
```

### 3. `src/components/DataIOPanel.tsx` — NEW

UI 组件，包含：
- **导出区**：导出按钮 + 当前会话数量提示
- **导入区**：
  - 模式选择：「合并（保留现有）」| 「覆盖（替换所有）」Radio 切换
  - 文件选择按钮（hidden input + label trigger）
  - 导入结果反馈：「成功导入 X 条会话」或错误提示（3秒自动消失）

Props:
```typescript
{
  sessions: Session[]
  onReplace: (s: Session[]) => void
  onMerge: (s: Session[]) => void
}
```

### 4. `src/pages/StatsPage.tsx` — 引入 DataIOPanel

在页面底部追加：
```tsx
const { replaceAllSessions, mergeSessions } = useSessions()
// ...
<DataIOPanel
  sessions={sessions}
  onReplace={replaceAllSessions}
  onMerge={mergeSessions}
/>
```

注意：StatsPage 已经调用了 `useSessions()`，需要把新方法从同一个 hook 调用中解构出来。

### 5. `src/index.css` — 追加样式

- `.data-io-panel` — 容器，与 `.stats-chart-card` 同风格
- `.data-io-section` — 导出/导入两区的分割布局
- `.data-io-mode-toggle` — 模式切换按钮组
- `.data-io-feedback` — 成功/错误提示（slide-in 动画）
- `.data-io-file-btn` — 文件选择触发按钮样式

## 数据格式

```json
{
  "version": 1,
  "exportedAt": 1713340000000,
  "sessions": [
    {
      "id": "s-xxx",
      "title": "...",
      "summary": "...",
      "createdAt": 123,
      "updatedAt": 456,
      "messages": [{ "role": "user", "content": "..." }]
    }
  ]
}
```

## 验证

1. 有若干会话时点击导出 → 浏览器下载 `daomind-backup-YYYY-MM-DD.json`
2. 打开文件验证 JSON 格式正确
3. 清空会话后导入刚才的文件（覆盖模式）→ 会话恢复
4. 已有会话时导入另一个备份（合并模式）→ 新旧会话都存在，无重复
5. 导入格式错误文件 → 显示错误提示
