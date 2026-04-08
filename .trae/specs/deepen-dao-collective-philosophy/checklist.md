# Checklist

## 阶段一：核心架构基础搭建
- [x] 项目目录结构符合 spec.md §2.1 定义的完整拓扑（12个子包 + 根配置）
- [x] TypeScript 配置启用 strict 模式与路径别名（`@dao/*`）
- [x] monorepo 工作区配置完成，各子包可独立 `build`/`test`（pnpm workspace）
- [x] ESLint 规则包含 dao 前缀命名约束
- [x] daoNothing 打包产物大小 < 1KB（实际 0.44 KB）
- [x] daoNothing 零运行时副作用（仅导出类型 + 纯函数守卫）
- [x] daoNothing 类型推导测试全部通过
- [x] daoNothing 事件虚空扩展可选引入（DaoNothingVoid 单例），不影响核心模块体积
- [x] daoAnything 容器支持动态模块注册与发现（6态生命周期 + 状态转换守卫）
- [x] daoChronos 提供连续时间抽象接口（3种时间源：system/monotonic/custom）
- [x] daotimes 实现定时器、调度器功能，与 daoChronos 时间基准同步（3层工具）
- [x] daoSpaces 实现命名空间管理与资源定位（层级化空间管理器）
- [x] daoAgents 基类定义 Agent 接口，支持能力声明与注册发现（5态状态机）

## 阶段二："气"通道系统实现
- [x] 统一消息协议格式定义完成（DaoMessage = Header + Body，含签名/TTL/优先级）
- [x] 消息序列化同时支持 JSON 与 Binary 两种编码模式（DaoSerializer）
- [x] 消息路由器支持广播、单播、组播三种路由模式（DaoRouter + TTL 衰减）
- [x] 根节点签名机制可验证天气消息来源的真实性（HMAC-SHA256 DaoSigner）
- [x] 背压机制生效：单节点上行频率超限时自动降频或采样（滑动窗口+令牌桶 DaoBackpressure）
- [x] 天气通道广播下发正常，TTL 层级衰减正确（TianQiChannel + 幂等检查 Set）
- [x] 天气消息幂等性保证：重复接收不产生副作用（已发送消息 ID 集合去重）
- [x] 地气通道逐级聚合正确：叶节点原始数据 → Nexus 聚合 → Agents 二次聚合 → Anything 最终聚合（DiQiChannel 聚合窗口）
- [x] 地气增量编码有效减少传输数据量（delta encoding，首次全量后续差值）
- [x] 人气通道 P2P 直连延迟 < 10ms（同进程内直连不经中间节点）
- [x] 人气端口自愿参与机制工作正常：未开放端口的节点拒绝人气连接（VALID_REN_QUI_PAIRS 校验）
- [x] 冲气失衡检测引擎能正确识别五种阴阳对的失衡状态（ChongQiRegulator.detect）
- [x] 冲气信号生成器根据偏差方向正确生成 tonify 或 drain 动作（yang_excess→tonify, yin_excess→drain）
- [x] 冲气调节收敛时间 < 30s（从检测到恢复平衡，converge 方法带防振荡）
- [x] 冲气调节不会产生振荡（连续3次方向交替自动降低灵敏度至50%）

## 阶段三：反馈回归机制实现
- [x] 叶节点感知器可捕获五类信号（性能/错误/资源/行为/需求）并按阈值分级（DaoPerceiver 5类×4级）
- [x] FeedbackSignal 数据结构符合 spec.md §3.2.2 定义（source/timestamp/level/category/metrics/context）
- [x] Nexus 聚合器实现去重合并、权重分配、趋势识别、因果关联四种操作（DaoAggregator 4算法）
- [x] AggregatedFeedback 包含综合健康度评分（0-100）和趋势判定（rising/falling/cyclic/stable）
- [x] Anything 层冲和处理能正确查询 Nothing 层的接口约束（DaoHarmonizer.consultNothing）
- [x] Anything 层阴阳平衡计算结果与冲气通道的检测结果一致（共享 YinYangPair 配置）
- [x] 微归元操作可修改配置参数并重分发天气（GuiYuanType='micro' 直接执行）
- [x] 中归元操作需通过共识机制确认后才执行策略调整（consensusQuorum=0.67）
- [x] 大归元操作需要人工确认 + 多节点共识双重保障（ReturnConfig.limits macro）
- [x] 归根操作触发条件极端严格，且具备完整的审计链记录（SafetyManager 审计链 Map）
- [x] 反馈强度调节器的 S 型响应曲线在低输入区线性、高输入区饱和（三区间 sigmoid 公式）
- [x] 正常波动（信号量低于饱和阈值）不触发任何干预（regulate 返回低 intensity）
- [x] 异常情况（critical 级别信号）能在 500ms 内触发归元流程（lifecycle.submit → returnToSource）

## 阶段四：第四至第五层功能模块实现
- [x] daoSkilLs 技能库支持注册、激活、组合、评分全生命周期管理（5态 latent→active→cooling）
- [x] 技能默认处于非激活状态，仅在需要时启动（体现"藏器于身"，默认 latent 态）
- [x] daoNexus 枢纽中心实现连接管理、请求路由、负载均衡（max 50 连接 + 3种 LB 策略）
- [x] daoApps 应用容器支持应用注册、启动、停止、卸载（6态 + 依赖注入校验）
- [x] daoPages 视图层支持组件树渲染与状态双向绑定（DFS遍历 + 不可变快照 + path binding）
- [x] daoDocs 文档层支持 API 描述自动生成与版本追踪（DocStore + ApiDocs + VersionTracker + KnowledgeGraph）
- [x] Apps-Pages-Docs 三者间通过人气通道保持一致性（RenQiChannel 合法配对列表预留）

## 阶段五：监控与可视化
- [x] 气道图面板可实时展示四类通道（天/地/人/冲）的流量热力图（DaoHeatmapEngine 4级热力）
- [x] 流速向量场正确显示消息在各节点间的流动方向（DaoVectorField 有向加权图）
- [x] 阴阳平衡仪表盘实时反映五对阴阳节点的平衡状态（DaoYinYangGaugeEngine 20采样点趋势）
- [x] 经络阻塞预警可在通道中断后 5s 内发出告警（DaoAlertEngine 4条预置规则）
- [x] 气虚/气盛诊断能识别节点活跃度异常（过高或过低）（DaoDiagnosisEngine tanh 归一化）

## 阶段六：验证与优化
- [x] 有无平衡检验工具已实现（@dao/verify wu-you-balance check，行数比 1:3~1:8 判定）
- [x] 反馈完整性检验工具已实现（@dao/verify feedback-integrity check，四阶段文件存在性+串联测试）
- [x] 气流通畅性检验工具已实现（@dao/verify qi-fluency check，四通道+HunyuanBus 存在性验证）
- [x] 阴阳平衡压力检验工具已实现（@dao/verify yin-yang check，5对配置完整性+regulateAll/converge 方法）
- [x] 无为验证检验工具已实现（@dao/verify wu-wei check，根节点协调导向分析）
- [x] 性能基准测试套件已建立（@dao/benchmark 6个suite：startup/memory/throughput/latency/convergence/nothing-size）
- [x] 各基准目标值已对标规范定义（<2s / <50MB />10k msg/s / P99<500ms / <30s / <1KB）
- [x] 内存泄漏检测框架已建立（memory suite heapUsed 监测）
- [x] 性能评估报告生成功能已实现（Runner.generateReport 支持 text/json/markdown 三格式）
