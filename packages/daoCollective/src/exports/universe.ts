// 宇宙门面层 — DaoUniverse + 所有 universe-* 桥接器
export type { DaoSystemSnapshot } from '../universe';
export { DaoUniverse, daoUniverse } from '../universe';

export type { AgentsSnapshot } from '../universe-agents';
export { DaoUniverseAgents } from '../universe-agents';

export type { AppsSnapshot } from '../universe-apps';
export { DaoUniverseApps } from '../universe-apps';

export type { ModulesSnapshot } from '../universe-modules';
export { DaoUniverseModules } from '../universe-modules';

export type { QiSnapshot } from '../universe-qi';
export { DaoUniverseQi } from '../universe-qi';

export type { BenchmarkRunRecord, BenchmarkSnapshot } from '../universe-benchmark';
export { DaoUniverseBenchmark } from '../universe-benchmark';

export type { DiagnosticRecord, DiagnosticSnapshot } from '../universe-diagnostic';
export { DaoUniverseDiagnostic } from '../universe-diagnostic';

export type { DaoFacadeSnapshot } from '../universe-facade';
export { DaoUniverseFacade } from '../universe-facade';

export type { HealthEntry, HealthTrend, HealthBoardSnapshot } from '../universe-health-board';
export { DaoUniverseHealthBoard } from '../universe-health-board';

export type { Recommendation, RecommendationLevel, RecommendationArea, OptimizationReport, OptimizerSnapshot } from '../universe-optimizer';
export { DaoUniverseOptimizer } from '../universe-optimizer';
