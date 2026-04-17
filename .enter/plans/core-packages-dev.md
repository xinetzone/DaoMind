# DaoMind 全面复盘审查计划（对照帛书文档）

## 审查依据

飞书文档：《道德经》宇宙生成论——帛书版与通行本的对照解读
核心主张：帛书《老子》乙本·四十二章原文为 **"中气以为和"**（zhōng qì），
而非通行本（王弼）的 **"冲气以为和"**（chōng qì）。

---

## 审查结论：发现 4 类问题

---

### 🔴 P0 — 哲学核心违背（Critical）

#### 问题描述

**全项目系统性引用错误**：所有涉及第四十二章的"帛书依据"注释，
均将通行本用字"冲气以为和"标注为"帛书依据"，与帛书实际文本完全相反。

涉及文件（14+ 处，按包分组）：

| 包 | 文件 | 错误内容 |
|----|------|---------|
| `@modulux/qi` | `channels/chong-qi.ts` | `帛书《道德经》乙本·四十二章："万物负阴而抱阳，冲气以为和"` |
| `@modulux/qi` | `hunyuan.ts` | 同上 |
| `@modulux/qi` | `types/channel.ts` | 同上 |
| `@modulux/qi` | `router.ts` / `signer.ts` | 同上 |
| `@modulux/qi` | `index.ts` | 同上 |
| `@daomind/feedback` | `stage3-harmonize.ts` | `帛书《道德经》乙本·四十二章：冲气以为和` |
| `@daomind/feedback` | `lifecycle.ts` | `Stage 3: 冲和（Chong He）— 万物负阴而抱阳，冲气以为和` |
| `@daomind/verify` | `qi-fluency.ts` / `yin-yang-balance.ts` | 同上 |
| `@daomind/nexus` | `index.ts` / `nexus.ts` | 同上 |
| `@daomind/collective` | `universe-qi.ts` / `universe-nexus.ts` / `qi-bridge.ts` | 同上 |

**哲学影响**：
- 文档标榜"帛书版"设计依据，但核心引文恰恰是通行本字词
- 帛书版"中气"（居间调和，中正平衡）与通行本"冲气"（激荡冲突）哲学意涵相反
- "中气"体现道家"守中"、"无为"精神；"冲气"接近"阴阳相搏"宇宙论

**修复方案**：
```
所有 "冲气以为和" 标注为帛书依据之处，统一修正为：
  旧: 帛书《道德经》乙本·四十二章："万物负阴而抱阳，冲气以为和"
  新: 帛书《道德经》乙本·四十二章："万物负阴而抱阳，中气以为和"
      [注：通行本（王弼）作"冲气以为和"；帛书版（马王堆乙本）作"中气以为和"]
```

---

### 🔴 P1 — 关键命名偏差（重要）

#### 问题 A：`ChongQiRegulator` / `daoFeedback` Stage3 命名与帛书不符

| 位置 | 当前名称 | 帛书对齐名称 |
|------|---------|-------------|
| `@modulux/qi` | `ChongQiRegulator`（冲气调节器） | `ZhongQiRegulator`（中气调节器）|
| `daoFeedback` | Stage 3: `冲和（Chong He）` | `中和（Zhōng Hé）` |
| `daoVerify` | `'冲和（冲气以为和）'` | `'中和（中气以为和）'` |
| `QiChannelType` | `'chong'` | 概念上应为"中" |

**注意**：`ChongQiRegulator` 的**功能**（阴阳居间调和）完全符合帛书"中气"角色；
问题仅在于名称（冲 vs 中）。

**修复方案（渐进式，不破坏 API）**：
1. 在 `ChongQiRegulator` 类注释中增加学术说明：
   "命名采用通行本'冲'字，功能对应帛书'中气'（居间调和）；
    两者字形不同但调和功能一致"
2. 为 `daoFeedback` Stage3 更名为 `中和（Zhōng Hé）`（注释层面，不改接口）
3. `QiChannelType` 中 `'chong'` 保持不变（API 兼容），但注释说明哲学含义对应"中气"

---

### 🟡 P2 — 文档过时（README + 版本历史）

#### 现状 vs 实际

| 条目 | README 当前 | 实际状态 |
|------|-------------|---------|
| badge | `tests-908%20passed` | 1000 |
| 特性列表 | `908 测试用例（49 套件）` | 1000 测试（52 套件）|
| 版本标题 | `包生态（v2.24.0）` | v2.27.0 |
| 测试命令注释 | `908 个，49 套件` | 1000 个，52 套件 |
| 架构图 | 仅到 DaoUniverseDiagnostic | 缺少消费者层 |
| 版本历史 | 止于 v2.24.0 | 缺少 v2.25.0/2.26.0/2.27.0 |
| 桥接器数量 | "17 个分层桥接器" | 17 个桥接器 + 3 个消费者类 |

#### 需增补的版本历史

| 版本 | 测试数 | 亮点 |
|------|--------|------|
| v2.27.0 | 1000 | DaoUniverseOptimizer — 宇宙优化建议引擎，6条建议规则，1000测试里程碑 |
| v2.26.0 | 971 | DaoUniverseHealthBoard — 宇宙健康仪表盘，纯消费者模式，趋势感知 |
| v2.25.0 | 941 | DaoUniverseFacade — 全栈自动装配门面，一行构建17桥接器 |

#### 需增补的架构图（消费者层）

```
消费者层（Consumer Layer）——不创建子系统，只读取数据：
  DaoUniverseFacade（v2.25.0）    ← 自动装配全部17桥接器
    └──▶ DaoUniverseHealthBoard（v2.26.0）  ← 健康蒸馏 + 趋势
             └──▶ DaoUniverseOptimizer（v2.27.0）← 6条建议规则
```

---

### 🟡 P3 — 哲学宇宙生成论显式映射缺失

#### 文档 vs 代码

帛书 Chapter 42 宇宙生成序列与代码的对应关系目前**仅隐式存在**，从未在任何文档中
显式阐明：

| 帛书层次 | 含义 | 代码对应 | 是否明确文档化 |
|---------|------|---------|--------------|
| 道 | 不可名的本源 | `DaoUniverse`（根节点） | 是（universe.ts 注释） |
| 一 | 混然整体，未分阴阳 | `DaoUniverseFacade`（整体门面） | 部分 |
| 二 | 阴阳分化 | `DaoUniverseMonitor`（阴阳仪表盘）× `DaoUniverseScheduler` | 否 |
| 三 | **中气**（居间调和） | `DaoUniverseQi`（混元气总线） | 否（且引文错误） |
| 万物 | 三者共构生万物 | 所有 17 桥接器运行时实例 | 否 |

**有无相生两层次**（文档第三章）：
- 本体论层：无（`daoNothing` 类型空间）为有（`daoAnything` 运行时）之本源 ✅ 已正确实现
- 现象层：有无相互依存 ✅ 通过 `DaoAgentContainerBridge` 生命周期同步体现

---

## 执行计划（按优先级）

### 阶段一：P0 哲学注释修正（最高优先）

**目标**：将所有错误的"帛书依据：冲气以为和"修正为"帛书依据：中气以为和"，
并在相关位置增加通行本 vs 帛书的学术说明。

修正文件清单：
```
packages/daoQi/src/channels/chong-qi.ts      ← 添加 [乙本"中气"注]
packages/daoQi/src/channels/tian-qi.ts        ← 同上
packages/daoQi/src/channels/di-qi.ts          ← 同上
packages/daoQi/src/channels/ren-qi.ts         ← 同上
packages/daoQi/src/hunyuan.ts                 ← 同上
packages/daoQi/src/types/channel.ts           ← 同上
packages/daoQi/src/types/message.ts           ← 同上
packages/daoQi/src/router.ts                  ← 同上
packages/daoQi/src/signer.ts                  ← 同上
packages/daoQi/src/backpressure.ts            ← 同上
packages/daoQi/src/index.ts                   ← 同上
packages/daoFeedback/src/stage3-harmonize.ts  ← 修正 + 重命名 冲和→中和
packages/daoFeedback/src/lifecycle.ts         ← Stage3 注释修正
packages/daoFeedback/src/index.ts             ← 同上
packages/daoVerify/src/checks/qi-fluency.ts   ← 引文修正
packages/daoVerify/src/checks/yin-yang-balance.ts ← 引文修正
packages/daoVerify/src/checks/feedback-integrity.ts ← '冲和'→'中和'
packages/daoNexus/src/index.ts                ← 引文修正
packages/daoNexus/src/nexus.ts                ← 引文修正
packages/daoNexus/src/types.ts                ← 引文修正
packages/daoCollective/src/universe-qi.ts     ← 引文修正
packages/daoCollective/src/universe-nexus.ts  ← 引文修正
packages/daoCollective/src/qi-bridge.ts       ← 引文修正
```

**标准修正模板**（用于所有无 ChongQiRegulator 提及的文件）：
```typescript
// 旧：帛书《道德经》乙本·四十二章："万物负阴而抱阳，冲气以为和"
// 新：帛书《道德经》乙本·四十二章："万物负阴而抱阳，中气以为和"
//     [帛书（马王堆乙本）作"中气"；通行本（王弼）作"冲气"，一字之差，义理有别]
```

### 阶段二：P1 命名说明修正

1. `packages/daoQi/src/channels/chong-qi.ts`：
   - 在类注释中增加：
     "冲气（Chōng Qì）为通行本用字；帛书版作'中气'（Zhōng Qì，居间调和之气）。
      本类功能对应帛书'中气'之调和职能，命名保留通行本'冲'字以区分通道识别符。"
   
2. `packages/daoFeedback/src/stage3-harmonize.ts`、`lifecycle.ts`、`index.ts`：
   - 将"冲和（Chong He）"改为"中和（Zhōng Hé）"（注释及字符串）
   - 注：这是 daoFeedback 的内部阶段名称，对外 API 无影响

3. `packages/daoVerify/src/checks/feedback-integrity.ts`：
   - `'冲和（冲气以为和）'` → `'中和（中气以为和）'`

### 阶段三：P2 README 更新

文件：`README.md`

1. 修改 badge：`tests-908%20passed` → `tests-1000%20passed`
2. 修改特性：`908 测试用例（49 套件）` → `1000 测试用例（52 套件）`
3. 修改标题：`包生态（v2.24.0）` → `包生态（v2.27.0）`
4. 修改测试命令注释：`908 个，49 套件` → `1000 个，52 套件`
5. 增加消费者层说明（桥接器表格之后）
6. 更新架构图（增加消费者层）
7. 增补版本历史（v2.25.0/2.26.0/2.27.0）

### 阶段四：P3 哲学映射文档（新增章节）

在 README.md 中新增"道家宇宙生成论映射"章节，显式说明：
- 道 → DaoUniverse
- 一 → DaoUniverseFacade（整体门面，未分化的"一"）
- 二 → Monitor × Scheduler（阴阳对偶）
- 三（中气）→ DaoUniverseQi（混元气总线，居间调和）
- 万物 → 17 个桥接器 + 消费者层

### 阶段五：Git commit + tag

```bash
git commit -m "fix(philosophy): v2.27.1 — 帛书引文勘误（冲气→中气）+ README v2.27.0 全面更新"
git tag v2.27.1
git push origin main --tags
```

---

## 验证清单

- [ ] `grep -rn '冲气以为和' packages/ --include='*.ts' | grep -v 'dist/'` 输出为空
- [ ] README badge 显示 1000
- [ ] README 版本历史包含 v2.25.0/2.26.0/2.27.0
- [ ] `npx jest --no-coverage` 仍然 1000/52（引文修正不影响功能）
- [ ] `pnpm -r run build` 全部 Done
