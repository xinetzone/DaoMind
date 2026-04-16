/** DaoUniverseHealthBoard — 道宇宙健康仪表盘
 * 帛书依据："知常容，容乃公，公乃王，王乃天，天乃道，道乃久"（道经·十六章）
 *           "致虚极，守静笃，万物并作，吾以观其复"（道经·十六章）
 *           "知人者智，自知者明"（德经·三十三章）
 *
 * 设计原则：
 *   HealthBoard 是**纯消费者**——不创建任何子系统实例，
 *   只从传入的 DaoUniverseFacade 读取数据，蒸馏出聚焦的健康视图。
 *
 * 架构（消费者模式）：
 *   DaoUniverseFacade ──▶ DaoUniverseHealthBoard（v2.26.0）
 *                          └── check()：facade.snapshot() → HealthEntry
 *                          └── trend()：分析历史 monitorScore 走势
 *
 * 核心价值：
 *   facade.snapshot() 返回 5 维原始数据，HealthBoard 蒸馏为单一 HealthEntry，
 *   并通过 trend() 提供随时间演进的健康趋势感知。
 */

import type { DaoUniverseFacade } from './universe-facade';

// ── 类型定义 ──────────────────────────────────────────────────────────────────

/**
 * 单次健康检查记录（从 DaoFacadeSnapshot 蒸馏）
 *
 * 字段来源：
 *   monitorScore — facade.snapshot().monitor.systemHealth（五感引擎综合评分，0–100）
 *   qiNodes      — facade.snapshot().qi.registeredNodes（混元气总线注册节点数）
 *   appsRunning  — facade.apps.snapshot().running（处于 running 状态的应用数）
 *   benchRuns    — facade.snapshot().bench.totalRuns（累计基准测试次数）
 *   diagCount    — facade.snapshot().diagnostic.totalDiagnoses（累计综合诊断次数）
 */
export interface HealthEntry {
  /** 检查时间戳 */
  readonly timestamp:    number;
  /** 监控五感综合健康评分（0–100） */
  readonly monitorScore: number;
  /** 混元气总线注册节点数 */
  readonly qiNodes:      number;
  /** 处于 running 状态的应用数 */
  readonly appsRunning:  number;
  /** 累计基准测试运行次数 */
  readonly benchRuns:    number;
  /** 累计综合诊断次数 */
  readonly diagCount:    number;
}

/**
 * 健康趋势枚举
 *
 * - `improving`  — 最近 monitorScore 持续上升（每步 > TREND_THRESHOLD）
 * - `stable`     — 最近 monitorScore 波动在阈值内
 * - `degrading`  — 最近 monitorScore 持续下降（每步 > TREND_THRESHOLD）
 * - `unknown`    — 历史记录不足 2 条，无法判断
 */
export type HealthTrend = 'improving' | 'stable' | 'degrading' | 'unknown';

/** 健康仪表盘快照 */
export interface HealthBoardSnapshot {
  /** 快照生成时间戳 */
  readonly timestamp:    number;
  /** 累计检查次数（每次 check() 计 1） */
  readonly totalChecks:  number;
  /** 最后一次检查时间戳（从未检查则为 null） */
  readonly lastCheckAt:  number | null;
  /** 基于最近历史的健康趋势 */
  readonly trend:        HealthTrend;
  /** 最后一次检查的 monitorScore（从未检查则为 undefined） */
  readonly latestScore:  number | undefined;
  /** 历史记录长度（等于 totalChecks） */
  readonly historySize:  number;
}

// ── 内部常量 ──────────────────────────────────────────────────────────────────

/**
 * 趋势判断窗口：取最近 N 条记录参与分析
 * 至少需要 2 条记录才能判断趋势
 */
const TREND_WINDOW = 3;

/**
 * 趋势变化阈值：相邻两次 monitorScore 差值超过此值才视为"有方向性变化"
 * 小于此值视为噪声（stable）
 */
const TREND_THRESHOLD = 0.5;

// ── 主类 ─────────────────────────────────────────────────────────────────────

/**
 * DaoUniverseHealthBoard — 宇宙健康仪表盘
 *
 * @example
 * const dao   = DaoUniverseFacade.create();
 * const board = new DaoUniverseHealthBoard(dao);
 *
 * // 同步健康检查
 * const entry = board.check();
 * console.log(entry.monitorScore, entry.qiNodes);
 *
 * // 多次检查后分析趋势
 * board.check();
 * board.check();
 * console.log(board.trend()); // 'stable' | 'improving' | 'degrading' | 'unknown'
 *
 * // 全量快照
 * const snap = board.snapshot();
 */
export class DaoUniverseHealthBoard {
  /** 健康检查历史（顺序追加，clearHistory 清空） */
  private readonly _history: HealthEntry[] = [];

  /**
   * @param _facade 已装配好的 DaoUniverseFacade 实例
   */
  constructor(private readonly _facade: DaoUniverseFacade) {}

  // ── 核心操作 ─────────────────────────────────────────────────────────────

  /**
   * check — 同步健康检查
   *
   * 调用 facade.snapshot() 并蒸馏出 HealthEntry，追加到历史记录。
   *
   * 注意：facade.snapshot() 内部会调用 monitor.feed() 更新监控数据。
   *
   * @returns HealthEntry
   */
  check(): HealthEntry {
    const snap  = this._facade.snapshot();
    const entry: HealthEntry = {
      timestamp:    Date.now(),
      monitorScore: snap.monitor.systemHealth,
      qiNodes:      snap.qi.registeredNodes,
      appsRunning:  this._facade.apps.snapshot().running,
      benchRuns:    snap.bench.totalRuns,
      diagCount:    snap.diagnostic.totalDiagnoses,
    };
    this._history.push(entry);
    return entry;
  }

  /**
   * trend — 基于最近历史分析健康趋势
   *
   * 取最近 TREND_WINDOW（3）条记录，逐步比较 monitorScore 差值：
   * - 所有步骤均 > +TREND_THRESHOLD → 'improving'
   * - 所有步骤均 < -TREND_THRESHOLD → 'degrading'
   * - 否则（混合或差值在阈值内）→ 'stable'
   * - 历史记录 < 2 条 → 'unknown'
   *
   * @returns HealthTrend
   */
  trend(): HealthTrend {
    if (this._history.length < 2) return 'unknown';

    const recent = this._history.slice(-TREND_WINDOW);
    const deltas: number[] = [];
    for (let i = 1; i < recent.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      deltas.push(recent[i]!.monitorScore - recent[i - 1]!.monitorScore);
    }

    const allUp   = deltas.every(d => d >  TREND_THRESHOLD);
    const allDown = deltas.every(d => d < -TREND_THRESHOLD);

    if (allUp)   return 'improving';
    if (allDown) return 'degrading';
    return 'stable';
  }

  // ── 历史管理 ─────────────────────────────────────────────────────────────

  /**
   * history — 只读健康检查历史
   *
   * @returns ReadonlyArray<HealthEntry>
   */
  history(): ReadonlyArray<HealthEntry> {
    return this._history;
  }

  /**
   * clearHistory — 清空健康检查历史
   */
  clearHistory(): void {
    this._history.length = 0;
  }

  // ── 快照 ─────────────────────────────────────────────────────────────────

  /**
   * snapshot — 仪表盘摘要快照
   *
   * 不触发新的 check()，仅汇报当前历史状态。
   *
   * @returns HealthBoardSnapshot
   */
  snapshot(): HealthBoardSnapshot {
    const last = this._history[this._history.length - 1];
    return {
      timestamp:   Date.now(),
      totalChecks: this._history.length,
      lastCheckAt: last ? last.timestamp : null,
      trend:       this.trend(),
      latestScore: last ? last.monitorScore : undefined,
      historySize: this._history.length,
    };
  }

  // ── Getter ───────────────────────────────────────────────────────────────

  /** facade — 底层 DaoUniverseFacade 引用 */
  get facade(): DaoUniverseFacade { return this._facade; }
}
