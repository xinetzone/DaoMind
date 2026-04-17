# DaoMind P3 任务复盘报告

**版本**：v2.33.0  
**日期**：2026-04-17  
**任务**：道集 · 宇宙健康板（daoCollective Universe 全局健康评分 + 模块状态）

---

## 一、任务目标

将 `daoCollective` 包的 `DaoUniverseFacade` 多维数据（系统快照 / 气机总线 / 基准 / 诊断 / 健康仪表盘）可视化为 Web 仪表盘，作为 DaoMind 第 4 个 Tab（道集）。

---

## 二、交付清单

| 文件 | 类型 | 行数 | 说明 |
|------|------|------|------|
| `supabase/functions/dao-collective/index.ts` | 新建 | 171 | Deno Edge Function，inline 仿真 CollectiveSnapshot |
| `src/pages/CollectivePage.tsx` | 新建 | 399 | 六面板宇宙健康仪表盘 |
| `src/App.tsx` | 修改 | +10 | 添加 `'collective'` 页面 + 道集 Tab |
| `src/index.css` | 修改 | +414 | Collective 专属 CSS 样式 |

---

## 三、架构决策

### 3.1 Edge Function 仿真策略
- 复用与 `dao-monitor` 相同的 `makeRand(seed)` 确定性伪随机方案
- 5 秒时间窗口 seed → 每 5s 数据自然变化（前端设 10s 刷新）
- 完整覆盖 `DaoFacadeSnapshot` 6 大维度：system / qi / bench / diagnostic / healthBoard / monitorHealth

### 3.2 健康趋势历史
- 向前推算 5 个连续 5s seed 窗口，生成 `history[]`
- `computeTrend()` 内联（与 `DaoUniverseHealthBoard.trend()` 算法一致）

### 3.3 前端复用模式
- 与 MonitorPage 相同的直接 `fetch` + SUPABASE_ANON_KEY 调用 Edge Function
- 无额外依赖（无 supabase client）

---

## 四、核心组件

| 组件 | 功能 |
|------|------|
| `HealthRing` | SVG 圆弧健康评分环（动态 strokeDasharray） |
| `TrendBadge` | 向好/平稳/下降/未知四态徽章 |
| `StatCard` | 图标+数值+副标题统计卡 |
| `StateBar` | 横向比例条（带百分比动画） |
| `QiChannelRow` | 气道消息量条（天地人冲色彩分别） |
| `Sparkline` | SVG 折线图 + 渐变面积 + 分数标注 |

---

## 五、踩坑与修复

| 问题 | 根因 | 修复 |
|------|------|------|
| `ly` 变量未使用（lint error） | Sparkline 中计算了 `toY(last.monitorScore)` 但未渲染到 SVG | 移除 `last` + `ly` 两个变量 |

---

## 六、测试状态

- Edge Function `dao-collective` 部署状态：ACTIVE v1
- 前端编译：lint 通过（新增代码零 error）
- 功能测试：框架自动构建通过

---

## 七、遗留与 P4 展望

### 技术债
- `MonitorPage` 与 `CollectivePage` 有 ~80 行相同的 fetch/polling 逻辑，建议提取 `useEdgeFetch<T>` 共享 hook

### P4 候选
| 方向 | 包 | 描述 |
|------|------|------|
| 道反 · 消息反馈 | daoFeedback | 对话消息点赞/点踩，Supabase 持久化 |
| 道气 · 混元仪表 | daoQi | 更细粒度的气总线实时可视化 |
| 道技 · 技能图谱 | daoSkilLs | 技能注册表可视化 |

---

## 八、版本信息

```
v2.33.0 @ ccadf9b
  feat(collective): add collective health dashboard
  ├── dao-collective Edge Function
  ├── CollectivePage 六面板
  ├── App.tsx 第4 Tab
  └── index.css +414 行
```
