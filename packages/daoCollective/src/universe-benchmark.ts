/** DaoUniverseBenchmark — 道宇宙性能基准测试 × 宇宙健康感知
 * 帛书依据："为学日益，为道日损"（德经·四十八章）
 *           "知人者智，自知者明"（德经·三十三章）
 *
 * 架构：DaoUniverseMonitor → DaoUniverseBenchmark
 *       独立 DaoBenchmarkRunner（不污染全局单例），
 *       每次 runQuick()/runAll() 前后各采集一次 monitor.health()，
 *       将性能指标与宇宙健康分数关联存入历史记录。
 *
 *   DaoUniverse
 *      └── DaoUniverseMonitor
 *              └── DaoUniverseBenchmark ← 性能基准 × 宇宙健康感知
 */

import { DaoBenchmarkRunner } from '@daomind/benchmark';
import type { DaoBenchmarkResult, DaoPerformanceReport } from '@daomind/benchmark';
import type { DaoUniverseMonitor } from './universe-monitor';

/** 单次基准测试运行记录（含 Universe 健康感知） */
export interface BenchmarkRunRecord {
  /** 记录创建时间戳 */
  readonly timestamp:    number;
  /** 运行前 DaoUniverseMonitor.health() */
  readonly healthBefore: number;
  /** 运行后 DaoUniverseMonitor.health() */
  readonly healthAfter:  number;
  /** 完整性能报告 */
  readonly report:       DaoPerformanceReport;
}

/** 基准测试系统快照 */
export interface BenchmarkSnapshot {
  readonly timestamp:   number;
  /** 总运行次数（runQuick/runAll 各计 1 次） */
  readonly totalRuns:   number;
  /** 最后一次运行的时间戳（从未运行则为 null） */
  readonly lastRunAt:   number | null;
  /** 最后一次运行后的健康分数（从未运行则为 undefined） */
  readonly lastHealth:  number | undefined;
  /** 历史记录长度（等同 totalRuns） */
  readonly historySize: number;
}

export class DaoUniverseBenchmark {
  /** 独立基准测试运行器，不污染全局单例 */
  private readonly _runner: DaoBenchmarkRunner;
  /** 运行历史（顺序追加，clearHistory 清空） */
  private readonly _history: BenchmarkRunRecord[] = [];

  constructor(private readonly _monitor: DaoUniverseMonitor) {
    this._runner = new DaoBenchmarkRunner();
  }

  // ── 执行基准测试 ──────────────────────────────────────────────────────────

  /**
   * runQuick — 运行 3 个快速套件（启动时间 / 内存占用 / 消息吞吐量）
   *
   * 前后各采集 monitor.health()，追加 BenchmarkRunRecord 到历史。
   */
  async runQuick(): Promise<BenchmarkRunRecord> {
    const healthBefore = this._monitor.health();
    const report       = await this._runner.daoRunQuick();
    const healthAfter  = this._monitor.health();
    const record: BenchmarkRunRecord = {
      timestamp: Date.now(),
      healthBefore,
      healthAfter,
      report,
    };
    this._history.push(record);
    return record;
  }

  /**
   * runAll — 运行全部 6 个套件
   *
   * 前后各采集 monitor.health()，追加 BenchmarkRunRecord 到历史。
   */
  async runAll(): Promise<BenchmarkRunRecord> {
    const healthBefore = this._monitor.health();
    const report       = await this._runner.daoRunAll();
    const healthAfter  = this._monitor.health();
    const record: BenchmarkRunRecord = {
      timestamp: Date.now(),
      healthBefore,
      healthAfter,
      report,
    };
    this._history.push(record);
    return record;
  }

  /**
   * runSuite — 运行单个套件
   *
   * 不追加到 history（单套件无完整 report）。
   * @throws 若套件名不存在
   */
  async runSuite(name: string): Promise<DaoBenchmarkResult> {
    return this._runner.daoRunSuite(name);
  }

  // ── 报告生成 ─────────────────────────────────────────────────────────────

  /**
   * generateReport — 生成当前 runner 内部结果的文本/JSON/Markdown 报告
   *
   * 注：runner.results 由最近一次 runAll/runQuick/runSuite 填充。
   * 若从未运行任何套件，返回空字符串。
   */
  generateReport(format: 'text' | 'json' | 'markdown' = 'text'): string {
    return this._runner.daoGenerateReport(format);
  }

  // ── 历史管理 ─────────────────────────────────────────────────────────────

  /**
   * history — 返回只读历史记录数组（顺序：最早 → 最近）
   */
  history(): ReadonlyArray<BenchmarkRunRecord> {
    return this._history as ReadonlyArray<BenchmarkRunRecord>;
  }

  /**
   * clearHistory — 清空所有历史记录
   */
  clearHistory(): void {
    this._history.length = 0;
  }

  // ── 快照 ─────────────────────────────────────────────────────────────────

  /**
   * snapshot — 返回基准测试系统的运行时快照
   */
  snapshot(): BenchmarkSnapshot {
    const last = this._history[this._history.length - 1];
    return {
      timestamp:   Date.now(),
      totalRuns:   this._history.length,
      lastRunAt:   last ? last.timestamp : null,
      lastHealth:  last ? last.healthAfter : undefined,
      historySize: this._history.length,
    };
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  /** 上层 DaoUniverseMonitor */
  get monitor(): DaoUniverseMonitor {
    return this._monitor;
  }

  /** 底层 DaoBenchmarkRunner */
  get runner(): DaoBenchmarkRunner {
    return this._runner;
  }
}
