// 运营层 — monitor + chronos + feedback + verify + 对应 universe-*
export type {
  HeatmapPoint, FlowVector, YinYangGauge,
  MeridianAlert, QiDiagnosis, MonitorSnapshot,
} from '@daomind/monitor';
export {
  DaoHeatmapEngine, DaoVectorField, DaoYinYangGaugeEngine,
  DaoAlertEngine, DaoDiagnosisEngine, DaoSnapshotAggregator,
} from '@daomind/monitor';
export { DaoUniverseMonitor } from '../universe-monitor';

export type { DaoChronosPoint, DaoChronosConfig, TimeSource } from '@daomind/chronos';
export { DaoChronos, daoGetChronos } from '@daomind/chronos';
export type { ClockTickCallback } from '../universe-clock';
export { DaoUniverseClock } from '../universe-clock';

export type { FeedbackRegulatorConfig, RegulationResult } from '@daomind/feedback';
export type { LifecycleStatus } from '@daomind/feedback';
export { DaoFeedbackRegulator, DaoFeedbackLifecycle } from '@daomind/feedback';
export type { FeedbackEntry } from '../universe-feedback';
export { DaoUniverseFeedback } from '../universe-feedback';

export type {
  DaoVerificationResult, DaoVerificationCategory,
  DaoVerificationReport, DaoPhilosophyAssessment,
} from '@daomind/verify';
export { DaoVerificationReporter, DAO_VERIFICATION_CATEGORY_LABELS } from '@daomind/verify';
export type { AuditSnapshot } from '../universe-audit';
export { DaoUniverseAudit } from '../universe-audit';
