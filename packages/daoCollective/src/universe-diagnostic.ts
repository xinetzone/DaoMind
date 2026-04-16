/** DaoUniverseDiagnostic — 道宇宙综合诊断
 * 帛书依据："知人者智，自知者明"（德经·三十三章）
 *           "为学日益，为道日损"（德经·四十八章）
 *           "曲则全，枉则直，洼则盈，弊则新"（道经·二十二章）
 *
 * 架构：DaoUniverseAudit × DaoUniverseBenchmark → DaoUniverseDiagnostic
 *
 * 两轴融合：
 *   哲学轴 — DaoUniverseAudit.audit()：扫描项目源码，输出哲学一致性报告
 *   性能轴 — DaoUniverseBenchmark.runQuick()：运行 3 个快速套件，输出性能报告
 *
 * 核心价值：
 *   单次 diagnose() 调用 = 并行执行两轴审查 → DiagnosticRecord（含完整宇宙健康感知）
 *
 *   DaoUniverseAudit      ──╮
 *                            ├──▶ DaoUniverseDiagnostic (v2.24.0)
 *   DaoUniverseBenchmark  ──╯
 */

import type { DaoVerificationReport } from '@daomind/verify';
import type { DaoUniverseAudit } from './universe-audit';
import type { DaoUniverseBenchmark, BenchmarkRunRecord } from './universe-benchmark';

// ── 类型定义 ──────────────────────────────────────────────────────────────────

/** 单次综合诊断记录 */
export interface DiagnosticRecord {
  /** 记录创建时间戳 */
  readonly timestamp:     number;
  /** 哲学自我审查报告（DaoUniverseAudit.audit()） */
  readonly auditReport:   DaoVerificationReport;
  /** 性能基准运行记录（DaoUniverseBenchmark.runQuick()） */
  readonly benchRecord:   BenchmarkRunRecord;
  /**
   * 运行时宇宙健康分数
   * 取自 benchRecord.healthAfter（benchmark 运行后的 monitor.health()）
   */
  readonly runtimeHealth: number;
}

/** 综合诊断系统快照 */
export interface DiagnosticSnapshot {
  readonly timestamp:        number;
  /** 总诊断次数（每次 diagnose() 计 1） */
  readonly totalDiagnoses:   number;
  /** 最后一次诊断时间戳（从未诊断则为 null） */
  readonly lastDiagnosisAt:  number | null;
  /** 最后一次哲学审查综合得分（从未诊断则为 undefined） */
  readonly lastAuditScore:   number | undefined;
  /** 最后一次诊断后的宇宙健康分数（从未诊断则为 undefined） */
  readonly lastBenchHealth:  number | undefined;
  /** 历史记录长度（等同 totalDiagnoses） */
  readonly historySize:      number;
}

// ── 主类 ─────────────────────────────────────────────────────────────────────

export class DaoUniverseDiagnostic {
  /** 诊断历史（顺序追加，clearHistory 清空） */
  private readonly _history: DiagnosticRecord[] = [];

  constructor(
    private readonly _audit:     DaoUniverseAudit,
    private readonly _benchmark: DaoUniverseBenchmark,
  ) {}

  // ── 核心诊断 ───────────────────────────────────────────────────────────────

  /**
   * diagnose — 并行执行哲学审查 + 性能基准，生成 DiagnosticRecord
   *
   * 实现：Promise.all([audit.audit(), benchmark.runQuick()])
   *   - 两轴并行，最终耗时 = max(audit时间, benchmark时间)
   *   - 结果追加到历史记录
   */
  async diagnose(): Promise<DiagnosticRecord> {
    const [auditReport, benchRecord] = await Promise.all([
      this._audit.audit(),
      this._benchmark.runQuick(),
    ]);
    const record: DiagnosticRecord = {
      timestamp:     Date.now(),
      auditReport,
      benchRecord,
      runtimeHealth: benchRecord.healthAfter,
    };
    this._history.push(record);
    return record;
  }

  // ── 报告生成 ───────────────────────────────────────────────────────────────

  /**
   * generateReport — 生成综合诊断报告
   *
   * @param record    目标 DiagnosticRecord（来自 diagnose() 的返回值）
   * @param format    'text'（默认）| 'json' | 'markdown'
   *
   * text:     单行摘要（audit 分 / bench 健康 / 运行时健康）
   * json:     JSON.stringify(record, null, 2)
   * markdown: 完整 markdown 文档（含哲学审查详情 + 性能报告摘要）
   */
  generateReport(
    record: DiagnosticRecord,
    format: 'text' | 'json' | 'markdown' = 'text',
  ): string {
    if (format === 'json') {
      return JSON.stringify(record, null, 2);
    }

    if (format === 'markdown') {
      return this._buildMarkdown(record);
    }

    // text — 单行摘要
    const auditScore = record.auditReport.overallScore;
    const benchPass  = record.benchRecord.report.summary.passedSuites;
    const benchTotal = record.benchRecord.report.summary.totalSuites;
    const ts         = new Date(record.timestamp).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    return (
      `[道宇宙综合诊断] ${ts} | ` +
      `哲学得分: ${auditScore}/100 | ` +
      `性能套件: ${benchPass}/${benchTotal} 通过 | ` +
      `宇宙健康: ${record.runtimeHealth}`
    );
  }

  // ── 历史管理 ───────────────────────────────────────────────────────────────

  /** history — 只读历史记录（顺序：最早 → 最近） */
  history(): ReadonlyArray<DiagnosticRecord> {
    return this._history as ReadonlyArray<DiagnosticRecord>;
  }

  /** clearHistory — 清空全部诊断历史 */
  clearHistory(): void {
    this._history.length = 0;
  }

  // ── 快照 ──────────────────────────────────────────────────────────────────

  /**
   * snapshot — 诊断系统当前运行时快照
   */
  snapshot(): DiagnosticSnapshot {
    const last = this._history[this._history.length - 1];
    return {
      timestamp:       Date.now(),
      totalDiagnoses:  this._history.length,
      lastDiagnosisAt: last ? last.timestamp        : null,
      lastAuditScore:  last ? last.auditReport.overallScore : undefined,
      lastBenchHealth: last ? last.runtimeHealth    : undefined,
      historySize:     this._history.length,
    };
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  /** audit — 关联的 DaoUniverseAudit */
  get audit(): DaoUniverseAudit {
    return this._audit;
  }

  /** benchmark — 关联的 DaoUniverseBenchmark */
  get benchmark(): DaoUniverseBenchmark {
    return this._benchmark;
  }

  // ── 私有：Markdown 报告构建 ────────────────────────────────────────────────

  private _buildMarkdown(record: DiagnosticRecord): string {
    const lines: string[] = [];
    const ts = new Date(record.timestamp).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

    lines.push('# 道宇宙综合诊断报告');
    lines.push('');
    lines.push(`> **诊断时间**: ${ts}`);
    lines.push(`> **宇宙健康分数**: **${record.runtimeHealth}**`);
    lines.push('');

    // ── 摘要卡片 ──
    const auditScore = record.auditReport.overallScore;
    const { passedSuites, totalSuites, failedSuites } = record.benchRecord.report.summary;
    lines.push('## 诊断摘要');
    lines.push('');
    lines.push('| 维度 | 结果 |');
    lines.push('|------|------|');
    lines.push(`| 哲学审查综合得分 | **${auditScore}** / 100 |`);
    lines.push(`| 哲学检验 通过/失败 | ✅ ${record.auditReport.passedCount} / ❌ ${record.auditReport.failedCount} |`);
    lines.push(`| 性能套件 通过/总计 | ${passedSuites} / ${totalSuites} |`);
    lines.push(`| 性能套件 失败数 | ${failedSuites} |`);
    lines.push(`| 运行时健康分数 | **${record.runtimeHealth}** |`);
    lines.push(`| 性能健康前 | ${record.benchRecord.healthBefore} |`);
    lines.push(`| 性能健康后 | ${record.benchRecord.healthAfter} |`);
    lines.push('');

    // ── 哲学审查（精简） ──
    lines.push('## 哲学审查结果');
    lines.push('');
    const pd = record.auditReport.philosophyDepth;
    lines.push('| 维度 | 得分 |');
    lines.push('|------|------|');
    lines.push(`| 本体论一致性 | ${pd.ontologyScore} |`);
    lines.push(`| 认识论完备性 | ${pd.epistemologyScore} |`);
    lines.push(`| 方法论有效性 | ${pd.methodologyScore} |`);
    lines.push(`| 伦理学正当性 | ${pd.ethicsScore} |`);
    lines.push(`| 美学价值 | ${pd.aestheticsScore} |`);
    lines.push(`| 文化传承 | ${pd.culturalScore} |`);
    lines.push(`| **加权总分** | **${pd.weightedTotal}** |`);
    lines.push('');

    // ── 性能基准（精简） ──
    lines.push('## 性能基准结果');
    lines.push('');
    lines.push('| 套件 | 通过 | 耗时(ms) |');
    lines.push('|------|------|---------|');
    for (const b of record.benchRecord.report.benchmarks) {
      const passed = b.overallPassed ? '✅' : '❌';
      lines.push(`| ${b.suiteName} | ${passed} | ${b.duration} |`);
    }
    lines.push('');

    // ── 建议 ──
    const recs = record.benchRecord.report.summary.recommendations;
    const warns = record.auditReport.warnings;
    if (recs.length > 0 || warns.length > 0) {
      lines.push('## 建议');
      lines.push('');
      for (const w of warns) {
        lines.push(`- [哲学] ${w}`);
      }
      for (const r of recs) {
        lines.push(`- [性能] ${r}`);
      }
      lines.push('');
    }

    lines.push('---');
    lines.push('*报告由 DaoUniverseDiagnostic 自动生成 — DaoUniverseAudit × DaoUniverseBenchmark*');

    return lines.join('\n');
  }
}
