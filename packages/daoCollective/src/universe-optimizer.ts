/** DaoUniverseOptimizer — 道宇宙优化建议引擎
 * 帛书依据："为学日益，为道日损，损之又损，以至于无为"（德经·四十八章）
 *           "知常容，容乃公"（道经·十六章）
 *           "自知者明，自胜者强"（德经·三十三章）
 *
 * 设计原则：
 *   Optimizer 是**二级消费者**——以 DaoUniverseHealthBoard 为输入，
 *   分析 HealthEntry[] 历史，提炼行动建议（OptimizationReport）。
 *   不创建任何子系统实例，不产生副作用。
 *
 * 消费者链：
 *   DaoUniverseFacade
 *     └──▶ DaoUniverseHealthBoard（蒸馏 HealthEntry + 趋势）
 *              └──▶ DaoUniverseOptimizer（分析 HealthEntry[]，输出建议）
 *
 * 建议规则（6 条，按优先级）：
 *   1. trend === 'degrading'   → critical / monitor  "宇宙健康持续下降"
 *   2. trend === 'unknown'     → info    / system    "健康数据不足"
 *   3. averageScore < 30       → warn    / monitor   "平均分偏低"
 *   4. scoreRange > 30         → warn    / monitor   "健康分波动较大"
 *   5. latest.diagCount === 0  → info    / diag      "建议运行 diagnose()"
 *   6. latest.qiNodes === 0    → info    / qi        "混元气总线无节点"
 */

import type { HealthEntry, HealthTrend } from './universe-health-board';
import type { DaoUniverseHealthBoard } from './universe-health-board';

// ── 类型定义 ──────────────────────────────────────────────────────────────────

/** 建议严重等级 */
export type RecommendationLevel = 'info' | 'warn' | 'critical';

/** 建议所属功能区域 */
export type RecommendationArea = 'monitor' | 'qi' | 'apps' | 'bench' | 'diag' | 'system';

/**
 * 单条优化建议
 */
export interface Recommendation {
  /** 严重等级：info（提示）/ warn（警告）/ critical（紧急） */
  readonly level:   RecommendationLevel;
  /** 功能区域 */
  readonly area:    RecommendationArea;
  /** 建议文本（中文） */
  readonly message: string;
}

/**
 * 一次分析的完整优化报告
 */
export interface OptimizationReport {
  /** 报告生成时间戳 */
  readonly timestamp:       number;
  /** 健康趋势（来自 board.trend()） */
  readonly trend:           HealthTrend;
  /** 参与分析的样本数量（board.history().length） */
  readonly sampleCount:     number;
  /** monitorScore 均值（样本为空时为 0） */
  readonly averageScore:    number;
  /** monitorScore 最小值（样本为空时为 0） */
  readonly minScore:        number;
  /** monitorScore 最大值（样本为空时为 0） */
  readonly maxScore:        number;
  /** maxScore - minScore（样本为空时为 0） */
  readonly scoreRange:      number;
  /** 建议列表（至少 1 条） */
  readonly recommendations: readonly Recommendation[];
}

/** 优化引擎快照 */
export interface OptimizerSnapshot {
  /** 快照生成时间戳 */
  readonly timestamp:      number;
  /** 累计分析次数（每次 analyze() 计 1） */
  readonly totalAnalyses:  number;
  /** 最后一次分析时间戳（从未分析则为 null） */
  readonly lastAnalysisAt: number | null;
  /** 最后一次分析的趋势（从未分析则为 undefined） */
  readonly lastTrend:      HealthTrend | undefined;
  /** 历史记录长度（等于 totalAnalyses） */
  readonly historySize:    number;
}

// ── 内部常量 ──────────────────────────────────────────────────────────────────

/** 平均分低阈值：低于此值发出 warn */
const LOW_SCORE_THRESHOLD = 30;

/** 波动阈值：scoreRange 超过此值发出 warn */
const HIGH_RANGE_THRESHOLD = 30;

// ── 主类 ─────────────────────────────────────────────────────────────────────

/**
 * DaoUniverseOptimizer — 宇宙优化建议引擎
 *
 * @example
 * const dao      = DaoUniverseFacade.create();
 * const board    = new DaoUniverseHealthBoard(dao);
 * const optimizer = new DaoUniverseOptimizer(board);
 *
 * // 先填充健康数据
 * board.check();
 * board.check();
 *
 * // 分析并获取建议
 * const report = optimizer.analyze();
 * console.log(report.trend, report.recommendations);
 *
 * // 快捷方式
 * const recs = optimizer.recommend();
 */
export class DaoUniverseOptimizer {
  /** 分析历史（顺序追加，clearHistory 清空） */
  private readonly _history: OptimizationReport[] = [];

  /**
   * @param _board 已填充数据的 DaoUniverseHealthBoard 实例
   */
  constructor(private readonly _board: DaoUniverseHealthBoard) {}

  // ── 核心操作 ─────────────────────────────────────────────────────────────

  /**
   * analyze — 分析 board.history()，生成 OptimizationReport
   *
   * 步骤：
   *   1. 读取 board.history() 快照（只读，不触发 check()）
   *   2. 计算统计指标（均值、极值、波动范围）
   *   3. 执行 6 条建议规则
   *   4. 追加报告到 _history
   *
   * @returns OptimizationReport
   */
  analyze(): OptimizationReport {
    const entries = this._board.history();
    const trend   = this._board.trend();

    // 空样本处理
    if (entries.length === 0) {
      const report: OptimizationReport = {
        timestamp:       Date.now(),
        trend:           'unknown',
        sampleCount:     0,
        averageScore:    0,
        minScore:        0,
        maxScore:        0,
        scoreRange:      0,
        recommendations: [
          {
            level:   'info',
            area:    'system',
            message: '健康数据不足（需 ≥2 次 check()），暂无趋势分析',
          },
        ],
      };
      this._history.push(report);
      return report;
    }

    // 统计指标
    const scores      = entries.map(e => e.monitorScore);
    const averageScore = scores.reduce((s, v) => s + v, 0) / scores.length;
    const minScore    = Math.min(...scores);
    const maxScore    = Math.max(...scores);
    const scoreRange  = maxScore - minScore;

    // 最新条目
    const latest: HealthEntry | undefined = entries[entries.length - 1];

    // 建议规则
    const recs: Recommendation[] = [];

    // 规则 1：趋势持续下降
    if (trend === 'degrading') {
      recs.push({
        level:   'critical',
        area:    'monitor',
        message: '宇宙健康持续下降，建议立即运行 diagnose() 进行深度诊断',
      });
    }

    // 规则 2：数据不足（有数据但不足 2 条，trend = unknown）
    if (trend === 'unknown' && entries.length > 0 && entries.length < 2) {
      recs.push({
        level:   'info',
        area:    'system',
        message: '健康数据不足（需 ≥2 次 check()），暂无趋势分析',
      });
    }

    // 规则 3：平均分偏低
    if (averageScore < LOW_SCORE_THRESHOLD) {
      recs.push({
        level:   'warn',
        area:    'monitor',
        message: `平均健康分 ${averageScore.toFixed(1)} 偏低，建议检查 Agent 与 Module 激活状态`,
      });
    }

    // 规则 4：波动过大
    if (scoreRange > HIGH_RANGE_THRESHOLD) {
      recs.push({
        level:   'warn',
        area:    'monitor',
        message: `健康分波动 ${scoreRange.toFixed(1)} 较大，系统状态不稳定`,
      });
    }

    // 规则 5：尚未运行综合诊断
    if (latest && latest.diagCount === 0) {
      recs.push({
        level:   'info',
        area:    'diag',
        message: '尚未运行综合诊断，建议调用 diagnose() 获取哲学与性能报告',
      });
    }

    // 规则 6：混元气总线无节点
    if (latest && latest.qiNodes === 0) {
      recs.push({
        level:   'info',
        area:    'qi',
        message: '混元气总线无注册节点，建议配置服务网格节点',
      });
    }

    // 兜底：至少 1 条建议
    if (recs.length === 0) {
      recs.push({
        level:   'info',
        area:    'system',
        message: '宇宙状态良好，继续保持。"损之又损，以至于无为"',
      });
    }

    const report: OptimizationReport = {
      timestamp:       Date.now(),
      trend,
      sampleCount:     entries.length,
      averageScore,
      minScore,
      maxScore,
      scoreRange,
      recommendations: recs,
    };
    this._history.push(report);
    return report;
  }

  /**
   * recommend — 快捷方式：analyze().recommendations
   *
   * 注意：每次调用 recommend() 都会执行 analyze() 并追加历史记录。
   *
   * @returns readonly Recommendation[]
   */
  recommend(): readonly Recommendation[] {
    return this.analyze().recommendations;
  }

  // ── 历史管理 ─────────────────────────────────────────────────────────────

  /**
   * history — 只读分析历史
   *
   * @returns ReadonlyArray<OptimizationReport>
   */
  history(): ReadonlyArray<OptimizationReport> {
    return this._history;
  }

  /**
   * clearHistory — 清空分析历史
   */
  clearHistory(): void {
    this._history.length = 0;
  }

  // ── 快照 ─────────────────────────────────────────────────────────────────

  /**
   * snapshot — 优化引擎摘要快照
   *
   * 不触发新的 analyze()，仅汇报当前历史状态。
   *
   * @returns OptimizerSnapshot
   */
  snapshot(): OptimizerSnapshot {
    const last = this._history[this._history.length - 1];
    return {
      timestamp:      Date.now(),
      totalAnalyses:  this._history.length,
      lastAnalysisAt: last ? last.timestamp : null,
      lastTrend:      last ? last.trend : undefined,
      historySize:    this._history.length,
    };
  }

  // ── Getter ───────────────────────────────────────────────────────────────

  /** board — 底层 DaoUniverseHealthBoard 引用 */
  get board(): DaoUniverseHealthBoard { return this._board; }
}
