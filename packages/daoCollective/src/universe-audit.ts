/** DaoUniverseAudit — 道宇宙哲学自我审查
 * 帛书依据："知人者智，自知者明"（乙本·三十三章）
 *           "为学日益，为道日损"（乙本·四十八章）
 *
 * 架构：DaoUniverse + DaoVerificationReporter → AuditSnapshot
 *
 *   DaoUniverse
 *      └── DaoUniverseMonitor
 *      └── DaoUniverseAudit  ← 哲学完整性自我审查（daoVerify 驱动）
 *
 * 两层融合：
 *   静态层 — DaoVerificationReporter.runAllChecks() 扫描项目源码
 *   运行时 — DaoUniverseMonitor.health() 提供实时健康分数
 */

import { DaoVerificationReporter } from '@daomind/verify';
import type { DaoVerificationCategory, DaoVerificationReport } from '@daomind/verify';
import type { DaoUniverse } from './universe';
import type { DaoUniverseMonitor } from './universe-monitor';

/** 综合审查快照：静态哲学分析 + 可选运行时健康 */
export interface AuditSnapshot {
  /** daoVerify 静态哲学审查报告 */
  readonly report: DaoVerificationReport;
  /** DaoUniverseMonitor.health() 运行时健康分数（未传入 monitor 时为 undefined）*/
  readonly runtimeHealth: number | undefined;
  /** 快照生成时间戳 */
  readonly timestamp: number;
}

export class DaoUniverseAudit {
  private readonly _reporter: DaoVerificationReporter;

  constructor(
    private readonly _universe: DaoUniverse,
    private readonly _projectRoot: string = process.cwd(),
  ) {
    this._reporter = new DaoVerificationReporter();
  }

  /**
   * audit — 运行全部 6 项哲学检查
   * 覆盖：有无平衡 / 反馈完整性 / 气流通畅 / 阴阳平衡 / 无为验证 / 命名规范
   * @returns DaoVerificationReport（含 overallScore, philosophyDepth 等）
   */
  async audit(): Promise<DaoVerificationReport> {
    return this._reporter.runAllChecks(this._projectRoot);
  }

  /**
   * auditCategory — 单类别哲学检查
   * @param category DaoVerificationCategory
   * @returns DaoVerificationReport（仅含该类别结果）
   */
  async auditCategory(category: DaoVerificationCategory): Promise<DaoVerificationReport> {
    return this._reporter.runCategory(category, this._projectRoot);
  }

  /**
   * snapshot — 综合快照：静态审查 + 可选运行时健康
   * @param monitor 若传入，附带 monitor.health() 运行时分数（触发一次 capture()）
   * @returns AuditSnapshot
   */
  async snapshot(monitor?: DaoUniverseMonitor): Promise<AuditSnapshot> {
    const report = await this.audit();
    const runtimeHealth = monitor ? monitor.health() : undefined;
    return { report, runtimeHealth, timestamp: Date.now() };
  }

  /** reporter — 底层 DaoVerificationReporter 实例 */
  get reporter(): DaoVerificationReporter { return this._reporter; }

  /** projectRoot — 审查的项目根目录 */
  get projectRoot(): string { return this._projectRoot; }

  /** universe — 关联的 DaoUniverse */
  get universe(): DaoUniverse { return this._universe; }
}
