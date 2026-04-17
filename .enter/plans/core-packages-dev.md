# P3 功能实现计划 — 道集 · 宇宙健康板（daoCollective）

## Context
P1（会话/高亮/道审）、P2（五感仪表盘）已完成。  
P3 目标：将 `@daomind/collective` 的 `DaoUniverseFacade` + `DaoUniverseHealthBoard` 
可视化为"宇宙全局健康板"，展示 5 个维度：
- **system**：agents / apps / modules / events 计数
- **monitor**：systemHealth 综合分（0-100）
- **qi**：混元气总线（tian/di/ren/chong 消息量、节点数）
- **bench**：性能基准历次运行摘要
- **diagnostic**：综合诊断历史摘要
- **healthBoard**：trend（improving/stable/degrading/unknown）+ 历史曲线

### 关键约束
同 P2：monorepo 包无法在 Edge Function 导入 → 使用 `Math.floor(Date.now() / 5000)` 
作为种子，内联仿真所有数据。  
调用模式：`fetch(${SUPABASE_URL}/functions/v1/dao-collective, { headers })` 复用 `useAIChat.ts` 的常量（避免 supabase-js 依赖）。

---

## 架构

```
CollectivePage.tsx（新建）
  │  每 10 秒 fetch
  └──► supabase/functions/dao-collective/index.ts（新建）
           returns CollectiveSnapshot（含 system/monitor/qi/bench/diagnostic/healthBoard）
```

App.tsx → 第 4 个 Tab "道集"（Layers 图标，`#collective` 路由）

---

## 一、Edge Function: `dao-collective`

**路径**：`supabase/functions/dao-collective/index.ts`

### 输出类型

```typescript
interface AgentsByState { active: number; dormant: number; error: number }
interface AgentsByType  { [type: string]: number }
interface AppsByState   { running: number; stopped: number; idle: number }
interface ModulesByLifecycle { created: number; initialized: number; disposed: number }

interface SystemSim {
  agents: { total: number; byState: AgentsByState; byType: AgentsByType }
  apps:   { total: number; byState: AppsByState }
  modules:{ total: number; byLifecycle: ModulesByLifecycle }
  events: { total: number; byType: Record<string, number> }
}
interface QiSim {
  totalEmitted: number; totalDropped: number
  channelsStats: { tian: number; di: number; ren: number; chong: number }
  registeredNodes: number
}
interface BenchSim   { totalRuns: number; lastRunAt: number; lastHealth: number }
interface DiagSim    { totalDiagnoses: number; lastAuditScore: number; lastBenchHealth: number }
interface HealthEntry { timestamp: number; monitorScore: number; qiNodes: number }
interface HealthBoard {
  trend: 'improving'|'stable'|'degrading'|'unknown'
  latestScore: number; totalChecks: number
  history: HealthEntry[]   // 最近 5 条
}
interface CollectiveSnapshot {
  timestamp: number
  system:      SystemSim
  monitorHealth: number      // 0-100（复用 P2 仿真公式）
  qi:          QiSim
  bench:       BenchSim
  diagnostic:  DiagSim
  healthBoard: HealthBoard
}
```

### 仿真策略（同 P2 — 5 秒 seed）

```typescript
const seed = Math.floor(Date.now() / 5000)
const rand = makeRand(seed)  // 与 dao-monitor 相同的 makeRand 实现
```

**system 仿真**：
- `activeAgents = 3 + rand(1, 5)`, `dormantAgents = 1 + rand(2, 3)`, `errorAgents = rand(3, 2)`
- `agentsByType = { coordinator: rand(4, 3)+1, observer: rand(5, 2)+1, worker: rand(6, 4)+1 }`
- `runningApps = 2 + rand(7, 4)`, `stoppedApps = rand(8, 2)`, `idleApps = rand(9, 1)`
- `modules.created = 5 + rand(10, 5)`, `modules.initialized = 3 + rand(11, 4)`, `modules.disposed = rand(12, 2)`
- `events.total = 80 + rand(13, 40)`, byType: `{ lifecycle: rand(14, 30)+20, message: rand(15, 25)+15, ... }`

**qi 仿真**：
- `totalEmitted = 200 + rand(20, 80)`, `totalDropped = rand(21, 5)`
- `channelsStats = { tian: 40+rand(22,20), di: 30+rand(23,15), ren: 50+rand(24,25), chong: 20+rand(25,10) }`
- `registeredNodes = 4 + rand(26, 4)`

**bench**：`totalRuns = 5 + rand(30, 10)`, `lastHealth = 60 + rand(31, 30)`

**diagnostic**：`lastAuditScore = 55 + rand(40, 35)`, `lastBenchHealth = bench.lastHealth`

**healthBoard.history**（近 5 条，时间间隔 5 秒）：
```typescript
for (let i = 4; i >= 0; i--) {
  const pastSeed = seed - i
  const pastRand = makeRand(pastSeed)
  history.push({
    timestamp:    now - i * 5000,
    monitorScore: 60 + pastRand(50, 30),
    qiNodes:      4 + pastRand(51, 4),
  })
}
```
**healthBoard.trend** — 比较 history 最后 3 条 monitorScore 增减判断。

---

## 二、CollectivePage.tsx（新建）

**路径**：`src/pages/CollectivePage.tsx`

### 面板布局

```
collective-layout
  ├── collective-header
  │     ├── 健康总环（SVG）+ trend badge
  │     └── 4 stat cards（活跃体 / 运行应用 / 气机节点 / 总诊断）
  └── collective-body (grid 2col)
       ├── QiPanel        — 混元气总线（4 通道条 + 丢包率）
       ├── AgentsPanel    — 智能体状态（active/dormant/error 横条）+ 类型分布
       ├── AppsModules    — 应用 + 模块双合并面板
       ├── HealthHistory  — 健康趋势迷你折线（5 点 SVG path）
       ├── BenchDiag      — 基准 & 诊断上次评分 + 运行次数
       └── EventsPanel    — 事件总线类型分布（span 无；适中小卡片）
```

### 关键视觉

- **健康总环**：与 MonitorPage 相同的 SVG 圆弧组件（复用 CSS 变量）
- **Trend badge**：`improving`=绿色↑，`stable`=蓝色→，`degrading`=红色↓，`unknown`=灰色?
- **迷你折线**：纯 SVG `<polyline>`，5 个时间点，无第三方库
- **通道条**：与 P2 monitor 类似的横向 progress bar，颜色映射天(blue)/地(green)/人(amber)/冲(purple)

### 数据拉取

```typescript
const res = await fetch(`${SUPABASE_URL}/functions/v1/dao-collective`, {
  headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
})
const data: CollectiveSnapshot = await res.json()
```

自动刷新间隔：**10 秒**（宇宙层变化较慢）。

---

## 三、App.tsx（修改）

```diff
- import { MessageCircle, FlaskConical, Activity } from 'lucide-react'
+ import { MessageCircle, FlaskConical, Activity, Layers } from 'lucide-react'
+ import { CollectivePage } from './pages/CollectivePage'

- type Page = 'chat' | 'audit' | 'monitor'
+ type Page = 'chat' | 'audit' | 'monitor' | 'collective'

  // getInitialPage：+ 'collective' → '#collective'
  // navigate：+ '#collective'
  // handler：+ '#collective' → setPage('collective')

  // 新 Tab：
  <Layers size={14} /> <span>道集</span>

  // 渲染：
  page === 'collective' ? <CollectivePage /> : <MonitorPage />
```

---

## 四、index.css（追加）

```css
/* Collective Layout */
.collective-layout        /* flex col, scroll */
.collective-header        /* health ring + 4 stat cards */
.collective-stat-card     /* 单个指标卡 */
.collective-body          /* grid 2-col */
.collective-panel         /* card：bg-card border radius */
.collective-panel-title   /* 面板标题 */

/* Trend badge */
.trend-improving / .trend-stable / .trend-degrading / .trend-unknown

/* Qi channels */
.qi-channel-row           /* 通道行 */
.qi-tian/.qi-di/.qi-ren/.qi-chong  /* 颜色条 */

/* Agents / Apps */
.coll-state-bar-active/.coll-state-bar-dormant/.coll-state-bar-error
.coll-state-bar-running/.coll-state-bar-stopped

/* Health History sparkline */
.sparkline-wrap           /* SVG 容器 */
```

---

## 文件变更清单

| 文件 | 操作 |
|---|---|
| `supabase/functions/dao-collective/index.ts` | **新建** — Edge Function |
| `src/pages/CollectivePage.tsx` | **新建** — 宇宙健康板 |
| `src/App.tsx` | **修改** — 加第 4 Tab + collective 路由 |
| `src/index.css` | **修改** — collective 样式追加 |

---

## 验证

1. 顶栏出现"道集" Tab，点击跳转到宇宙健康板
2. 健康总环显示 0-100 分数，trend badge 有合理值
3. 4 个 stat card 展示智能体数、应用数、节点数、诊断次数
4. 气机总线 4 通道（天/地/人/冲）显示消息量横条
5. 智能体状态（活跃/休眠/出错）横条及类型分布
6. 健康趋势 5 点 SVG 折线正常渲染
7. 自动刷新 10 秒（可暂停），手动刷新按钮有效
8. Edge Function 返回正确 JSON（200 status）
