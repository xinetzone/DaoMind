# P2 功能实现计划 — DaoMonitor 五感仪表盘

## Context
P1 已完成：多会话历史、代码高亮、道审 Tab。  
P2 目标：将 `@daomind/monitor` 五大引擎（热力图 / 向量场 / 阴阳仪表 / 告警 / 诊断）
通过 Supabase Edge Function 暴露为 API，前端实现实时可视化仪表盘（新增"道监" Tab）。

### 关键技术约束
| 包 | Node.js 依赖 | 可在 Edge Function 运行 |
|---|---|---|
| `@daomind/monitor` | 无 `node:` import | ✅ 可直接跑 |
| `@daomind/nothing` | `node:events` (EventEmitter) | ✅ Deno 支持 `node:events` |
| `@daomind/collective/universe-monitor` | 无 `node:` import | ✅ 可运行 |
| `@daomind/qi/hunyuan` | `node:events` + `node:crypto` | ✅ Deno 均支持 |

但 Edge Function 无法 import 本地 monorepo 包（无打包步骤）。  
**方案：Edge Function 内联模拟逻辑**——使用与 `MonitorSnapshot` 同结构的 TypeScript，
基于 `Math.floor(Date.now() / 5000)` 作为种子生成稳定但会随时间变化的仿真数据，
展示完整的 5 维监控能力。

---

## 架构设计

```
┌───────────────────────────┐
│  MonitorPage.tsx          │   每 5 秒 fetch
│   SystemHealth Ring       │──────────────────────►  supabase/functions/dao-monitor
│   HeatmapPanel            │◄────── MonitorSnapshot ──  (Deno, 纯 TS, 无包依赖)
│   FlowVectorPanel         │
│   YinYangPanel            │
│   AlertsPanel             │
│   DiagnosisPanel          │
└───────────────────────────┘
         ↑ 新 Tab"道监"
   App.tsx (#monitor)
```

---

## 一、Edge Function: `dao-monitor`

**路径：** `supabase/functions/dao-monitor/index.ts`

### 仿真数据策略
```typescript
const seed = Math.floor(Date.now() / 5000)   // 每 5 秒换一次基准值
const jitter = (n: number, range: number) => n + ((seed * 7919 + n * 31) % range)
```

### 输出结构（与 MonitorSnapshot 完全一致）
```typescript
interface SimSnapshot {
  timestamp: number
  systemHealth: number                // 0-100
  heatmaps: HeatmapPoint[]           // 4 条：tian/ren/di/chong × 各 1 节点对
  flowVectors: FlowVector[]          // 5 条：daoCollective ↔ daoAgents/daoApps/daoNexus
  gauges: YinYangGauge[]             // 3 对：agent-active-dormant / app-running-stopped / tian-di-balance
  alerts: MeridianAlert[]            // 0-2 条（seed 奇偶触发）
  diagnoses: QiDiagnosis[]           // 5 节点：daoCollective/daoAgents/daoApps/daoNexus/daoVerify
}
```

### 节点映射（对应真实 DaoMind 架构）
| 通道 | sourceNode | targetNode | 含义 |
|---|---|---|---|
| tian（天） | daoNexus | daoCollective | 枢纽→宇宙 |
| ren（人） | daoAgents | daoCollective | 智能体→宇宙 |
| di（地） | daoApps | daoCollective | 应用→宇宙 |
| chong（中气） | daoMonitor | daoCollective | 监控→宇宙 |

阴阳对偶：
- `agent-active-dormant`（阴=休眠+错误 / 阳=活跃），idealRatio=1.0
- `app-running-stopped`（阴=停止 / 阳=运行），idealRatio=0.5
- `tian-di-balance`（阴=地气 / 阳=天气），idealRatio=2.0

---

## 二、MonitorPage.tsx（新建）

**路径：** `src/pages/MonitorPage.tsx`

### 面板布局
```
monitor-layout
  ├── monitor-header          系统健康环 + 标题 + 刷新按钮 + 自动刷新开关
  └── monitor-grid (2col)
       ├── HeatmapPanel        热力图 — 通道流量热度表格
       ├── FlowVectorPanel     向量场 — 方向 + 强度条
       ├── YinYangPanel        阴阳仪表 — 双色条 + 状态徽章
       ├── AlertsPanel         告警列表
       └── DiagnosisPanel      节点诊断 (span 2 col)
```

### 关键视觉设计

**热力图 (HeatmapPanel)**
- 每行：通道色标 + sourceNode→targetNode + 流量/延迟/错误率
- 热度等级颜色：cold=var(--text-muted), warm=var(--secondary), hot=orange, blazing=red

**向量场 (FlowVectorPanel)**
- from → to（箭头图标），magnitude 数字条，direction 文字标签（下行/上行/平衡/侧流）
- `Activity` / `ArrowDownRight` / `ArrowUpLeft` 图标（lucide-react）

**阴阳仪表 (YinYangPanel)**
- 每对：两侧并排横条（阴-蓝 / 阳-red-warm），中间显示比值 + 状态徽章
- 状态颜色：balanced=green, yin_excess=blue, yang_excess=amber, critical=red

**告警 (AlertsPanel)**
- critical=深红 badge，warning=amber，info=灰
- 图标：`AlertCircle` / `AlertTriangle` / `Info`

**诊断 (DiagnosisPanel)**
- 每节点一行：nodeId + condition + trend箭头 + activityScore 条 + recommendation 省略文字
- 条件颜色：balanced=green, deficient=blue, excess=amber

### 数据拉取
```tsx
// 初次加载 + 每 5s 自动刷新（可暂停）
const [snapshot, setSnapshot] = useState<SimSnapshot | null>(null)
const [autoRefresh, setAutoRefresh] = useState(true)
const [loading, setLoading] = useState(false)

useEffect(() => {
  fetchSnapshot()
  if (!autoRefresh) return
  const id = setInterval(fetchSnapshot, 5000)
  return () => clearInterval(id)
}, [autoRefresh])

async function fetchSnapshot() {
  setLoading(true)
  const { data } = await supabase.functions.invoke('dao-monitor')
  setSnapshot(data)
  setLoading(false)
}
```

---

## 三、App.tsx（修改）

- `Page` 类型：`'chat' | 'audit' | 'monitor'`
- hash routing：`#monitor`
- 顶部导航增加第三 Tab：
  ```tsx
  <Activity size={14} /> <span>道监</span>
  ```
- `app-content` 路由：三路条件渲染

---

## 四、index.css（修改）

新增样式：
```css
/* Monitor Layout */
.monitor-layout           /* flex col, scroll, padding */
.monitor-header           /* 顶部 health + 标题 + 控件 */
.monitor-grid             /* 2 col grid */
.monitor-panel            /* card: bg-card, border, radius */
.monitor-panel-title      /* 面板标题 */
.monitor-panel.span-2     /* 跨 2 列 */

/* Heatmap */
.heat-cold/warm/hot/blazing  /* 热度标签颜色 */
.heatmap-row              /* 每条热力记录行 */

/* Flow */
.flow-row                 /* 向量行 */
.flow-dir-downstream/upstream/lateral/balancing  /* 方向颜色 */

/* Gauge */
.gauge-row                /* 阴阳行 */
.gauge-bar-wrap           /* 双条容器 */
.gauge-bar-yin/yang       /* 颜色条 */
.gauge-status-*           /* 状态徽章 */

/* Alert / Diagnosis */
.alert-critical/warning/info
.diag-balanced/deficient/excess
```

---

## 文件变更清单

| 文件 | 操作 |
|---|---|
| `supabase/functions/dao-monitor/index.ts` | **新建** — Edge Function |
| `src/pages/MonitorPage.tsx` | **新建** — 仪表盘页面 |
| `src/App.tsx` | **修改** — 加第三 Tab |
| `src/index.css` | **修改** — monitor 样式 |

---

## 验证
1. 顶栏出现"道监" Tab，点击跳转到仪表盘
2. 仪表盘展示系统健康分 + 5 个面板数据
3. 每 5 秒自动刷新，数据略有变化（jitter 机制）
4. 暂停自动刷新按钮可切换
5. 手动点刷新按钮立即拉取最新数据
6. Edge Function 正常响应（200 + JSON）
7. `npx jest --no-coverage` 全部通过（不影响现有 1000 tests）
