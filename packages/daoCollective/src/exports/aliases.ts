/**
 * dao 前缀类型别名 — 命名规范对齐
 * 帛书依据：「道可道，非常名」— 以道为名，体现自然本性
 */
import type { AgentsSnapshot } from '../universe-agents';
import type { AppsSnapshot } from '../universe-apps';
import type { AuditSnapshot } from '../universe-audit';
import type { BenchmarkRunRecord, BenchmarkSnapshot } from '../universe-benchmark';
import type { DiagnosticRecord, DiagnosticSnapshot } from '../universe-diagnostic';
import type { DocAuditResult, DocsSnapshot } from '../universe-docs';
import type { FeedbackEntry } from '../universe-feedback';
import type { HealthEntry, HealthTrend, HealthBoardSnapshot } from '../universe-health-board';
import type { ModulesSnapshot } from '../universe-modules';
import type { NexusHealthRecord, NexusDispatchResult, NexusMetrics } from '../universe-nexus';
import type {
  RecommendationLevel,
  RecommendationArea,
  Recommendation,
  OptimizationReport,
  OptimizerSnapshot,
} from '../universe-optimizer';
import type { PagesSnapshot } from '../universe-pages';

// ── 宇宙层快照 dao 前缀别名 ──────────────────────────────────
/** 代理快照 dao 前缀别名 */
export type DaoAgentsSnapshot = AgentsSnapshot;
/** 应用快照 dao 前缀别名 */
export type DaoAppsSnapshot = AppsSnapshot;
/** 审计快照 dao 前缀别名 */
export type DaoAuditSnapshot = AuditSnapshot;
/** 基准测试运行记录 dao 前缀别名 */
export type DaoBenchmarkRunRecord = BenchmarkRunRecord;
/** 基准测试快照 dao 前缀别名 */
export type DaoBenchmarkSnapshot = BenchmarkSnapshot;
/** 诊断记录 dao 前缀别名 */
export type DaoDiagnosticRecord = DiagnosticRecord;
/** 诊断快照 dao 前缀别名 */
export type DaoDiagnosticSnapshot = DiagnosticSnapshot;
/** 文档审计结果 dao 前缀别名 */
export type DaoDocAuditResult = DocAuditResult;
/** 文档快照 dao 前缀别名 */
export type DaoDocsSnapshot = DocsSnapshot;
/** 反馈条目 dao 前缀别名 */
export type DaoFeedbackEntry = FeedbackEntry;
/** 健康条目 dao 前缀别名 */
export type DaoHealthEntry = HealthEntry;
/** 健康趋势 dao 前缀别名 */
export type DaoHealthTrend = HealthTrend;
/** 健康看板快照 dao 前缀别名 */
export type DaoHealthBoardSnapshot = HealthBoardSnapshot;
/** 模块快照 dao 前缀别名 */
export type DaoModulesSnapshot = ModulesSnapshot;
/** 枢纽健康记录 dao 前缀别名 */
export type DaoNexusHealthRecord = NexusHealthRecord;
/** 枢纽分发结果 dao 前缀别名 */
export type DaoNexusDispatchResult = NexusDispatchResult;
/** 枢纽指标 dao 前缀别名（universe-nexus 宇宙层，区别于 @daomind/nexus 的 DaoNexusMetrics） */
export type DaoUniverseNexusMetrics = NexusMetrics;
/** 建议级别 dao 前缀别名 */
export type DaoRecommendationLevel = RecommendationLevel;
/** 建议领域 dao 前缀别名 */
export type DaoRecommendationArea = RecommendationArea;
/** 建议项 dao 前缀别名 */
export type DaoRecommendation = Recommendation;
/** 优化报告 dao 前缀别名 */
export type DaoOptimizationReport = OptimizationReport;
/** 优化器快照 dao 前缀别名 */
export type DaoOptimizerSnapshot = OptimizerSnapshot;
/** 页面快照 dao 前缀别名 */
export type DaoPagesSnapshot = PagesSnapshot;
