/** DaoUniverseFacade — 道宇宙全栈自动装配门面
 * 帛书依据："道生一，一生二，二生三，三生万物"（乙本·四十二章）
 *           "知常曰明，不知常，妄作，凶"（道经·十六章）
 *           "为无为，则无不治"（道经·三章）
 *
 * 设计原则：
 *   用户无需了解 17 个桥接器的依赖顺序，
 *   只需 new DaoUniverseFacade() 即可获得完整、正确装配的宇宙全栈。
 *
 * 架构：
 *   DaoUniverseFacade（v2.25.0）
 *     └── 自动装配全部 17 个 DaoUniverse* 桥接器
 *         DaoUniverse
 *           ├── DaoUniverseMonitor
 *           │       ├── DaoUniverseClock → DaoUniverseFeedback
 *           │       │       └── DaoUniverseScheduler → DaoUniverseSkills / DaoUniversePages
 *           │       ├── DaoUniverseNexus → DaoUniverseSpaces / DaoUniverseQi
 *           │       ├── DaoUniverseAgents → DaoUniverseApps → DaoUniverseTimes / DaoUniverseModules
 *           │       └── DaoUniverseBenchmark ─╮
 *           └── DaoUniverseAudit ─────────────╯──▶ DaoUniverseDiagnostic
 *                   └── DaoUniverseDocs
 */

import type { MonitorSnapshot } from '@daomind/monitor';
import type { DaoSystemSnapshot } from './universe';
import { DaoUniverse } from './universe';
import { DaoUniverseMonitor } from './universe-monitor';
import { DaoUniverseClock } from './universe-clock';
import { DaoUniverseFeedback } from './universe-feedback';
import { DaoUniverseAudit } from './universe-audit';
import { DaoUniverseScheduler } from './universe-scheduler';
import { DaoUniverseNexus } from './universe-nexus';
import { DaoUniverseDocs } from './universe-docs';
import { DaoUniverseSpaces } from './universe-spaces';
import { DaoUniverseQi } from './universe-qi';
import type { QiSnapshot } from './universe-qi';
import { DaoUniverseSkills } from './universe-skills';
import { DaoUniversePages } from './universe-pages';
import { DaoUniverseAgents } from './universe-agents';
import { DaoUniverseApps } from './universe-apps';
import { DaoUniverseTimes } from './universe-times';
import { DaoUniverseModules } from './universe-modules';
import { DaoUniverseBenchmark } from './universe-benchmark';
import type { BenchmarkSnapshot } from './universe-benchmark';
import { DaoUniverseDiagnostic } from './universe-diagnostic';
import type { DiagnosticRecord, DiagnosticSnapshot } from './universe-diagnostic';

// ── 类型定义 ──────────────────────────────────────────────────────────────────

/**
 * 全栈快照 — 聚合宇宙各维度快照
 *
 * 包含 5 个核心维度：
 *   system      — DaoUniverse 基础层（agents / apps / modules / events）
 *   monitor     — 五感引擎快照（heatmap / vector / gauge / alerts / diagnosis）
 *   bench       — 性能基准历史摘要
 *   qi          — 混元气总线状态
 *   diagnostic  — 综合诊断历史摘要
 */
export interface DaoFacadeSnapshot {
  /** 快照生成时间戳 */
  readonly timestamp:   number;
  /** 基础宇宙层：agents / apps / modules / events 计数 */
  readonly system:      DaoSystemSnapshot;
  /** 监控五感引擎快照 */
  readonly monitor:     MonitorSnapshot;
  /** 性能基准历史摘要 */
  readonly bench:       BenchmarkSnapshot;
  /** 混元气总线快照 */
  readonly qi:          QiSnapshot;
  /** 综合诊断历史摘要 */
  readonly diagnostic:  DiagnosticSnapshot;
}

/** 内部全栈实例集合（只读） */
interface DaoUniverseStack {
  readonly universe:   DaoUniverse;
  readonly monitor:    DaoUniverseMonitor;
  readonly clock:      DaoUniverseClock;
  readonly feedback:   DaoUniverseFeedback;
  readonly audit:      DaoUniverseAudit;
  readonly scheduler:  DaoUniverseScheduler;
  readonly nexus:      DaoUniverseNexus;
  readonly docs:       DaoUniverseDocs;
  readonly spaces:     DaoUniverseSpaces;
  readonly qi:         DaoUniverseQi;
  readonly skills:     DaoUniverseSkills;
  readonly pages:      DaoUniversePages;
  readonly agents:     DaoUniverseAgents;
  readonly apps:       DaoUniverseApps;
  readonly times:      DaoUniverseTimes;
  readonly modules:    DaoUniverseModules;
  readonly benchmark:  DaoUniverseBenchmark;
  readonly diagnostic: DaoUniverseDiagnostic;
}

// ── 主类 ─────────────────────────────────────────────────────────────────────

/**
 * DaoUniverseFacade — 一行代码构建完整 DaoUniverse* 层次体系
 *
 * @example
 * // 最简用法
 * const dao = new DaoUniverseFacade();
 * dao.monitor.feed();
 * await dao.diagnostic.diagnose();
 *
 * // 工厂方法（语义更清晰）
 * const dao = DaoUniverseFacade.create('/path/to/project');
 * const record = await dao.diagnose();
 *
 * // 访问任意桥接器
 * dao.qi.broadcast('天气', { type: 'system:ready' });
 * dao.apps.register({ id: 'worker', name: 'Worker', version: '1.0.0', entry: './w' });
 * await dao.apps.start('worker');
 *
 * // 全栈快照
 * const snap = dao.snapshot();
 */
export class DaoUniverseFacade {
  private readonly _stack: DaoUniverseStack;

  /**
   * 构造函数 — 按依赖顺序自动装配全部 17 个 DaoUniverse* 桥接器
   *
   * @param projectRoot 哲学审查根目录，默认 process.cwd()
   */
  constructor(projectRoot: string = process.cwd()) {
    const universe   = new DaoUniverse();
    const monitor    = new DaoUniverseMonitor(universe);
    const clock      = new DaoUniverseClock(monitor);
    const feedback   = new DaoUniverseFeedback(clock);
    const audit      = new DaoUniverseAudit(universe, projectRoot);
    const scheduler  = new DaoUniverseScheduler(clock);
    const nexus      = new DaoUniverseNexus(monitor, clock);
    const docs       = new DaoUniverseDocs(audit);
    const spaces     = new DaoUniverseSpaces(nexus);
    const qi         = new DaoUniverseQi(nexus);
    const skills     = new DaoUniverseSkills(scheduler);
    const pages      = new DaoUniversePages(scheduler);
    const agents     = new DaoUniverseAgents(monitor);
    const apps       = new DaoUniverseApps(agents);
    const times      = new DaoUniverseTimes(apps);
    const modules    = new DaoUniverseModules(apps);
    const benchmark  = new DaoUniverseBenchmark(monitor);
    const diagnostic = new DaoUniverseDiagnostic(audit, benchmark);

    this._stack = Object.freeze({
      universe, monitor, clock, feedback, audit,
      scheduler, nexus, docs, spaces, qi,
      skills, pages, agents, apps, times,
      modules, benchmark, diagnostic,
    } satisfies DaoUniverseStack);
  }

  /**
   * 静态工厂方法 — new DaoUniverseFacade(projectRoot) 的语义糖
   *
   * @example
   * const dao = DaoUniverseFacade.create('/workspace/myproject');
   */
  static create(projectRoot?: string): DaoUniverseFacade {
    return new DaoUniverseFacade(projectRoot);
  }

  // ── Getters — 全部 17 个桥接器 + 根节点 ──────────────────────────────────

  /** 根节点 — DaoUniverse 统一门面 */
  get universe(): DaoUniverse         { return this._stack.universe; }
  /** 监控层 — DaoUniverseMonitor（五感引擎 + 健康快照） */
  get monitor(): DaoUniverseMonitor   { return this._stack.monitor; }
  /** 时钟层 — DaoUniverseClock（时序心跳） */
  get clock(): DaoUniverseClock       { return this._stack.clock; }
  /** 反馈层 — DaoUniverseFeedback（闭环调节） */
  get feedback(): DaoUniverseFeedback { return this._stack.feedback; }
  /** 审查层 — DaoUniverseAudit（哲学一致性检查） */
  get audit(): DaoUniverseAudit       { return this._stack.audit; }
  /** 调度层 — DaoUniverseScheduler（时序驱动任务调度） */
  get scheduler(): DaoUniverseScheduler { return this._stack.scheduler; }
  /** 枢纽层 — DaoUniverseNexus（服务网格 + 路由） */
  get nexus(): DaoUniverseNexus       { return this._stack.nexus; }
  /** 文档层 — DaoUniverseDocs（知识图谱 + 哲学文档） */
  get docs(): DaoUniverseDocs         { return this._stack.docs; }
  /** 空间层 — DaoUniverseSpaces（命名空间管理） */
  get spaces(): DaoUniverseSpaces     { return this._stack.spaces; }
  /** 气层 — DaoUniverseQi（混元气总线 × 服务网格） */
  get qi(): DaoUniverseQi             { return this._stack.qi; }
  /** 技能层 — DaoUniverseSkills（技能生命周期） */
  get skills(): DaoUniverseSkills     { return this._stack.skills; }
  /** 页面层 — DaoUniversePages（组件树 × 刷新调度） */
  get pages(): DaoUniversePages       { return this._stack.pages; }
  /** Agent 层 — DaoUniverseAgents（Agent 生命周期 × 监控） */
  get agents(): DaoUniverseAgents     { return this._stack.agents; }
  /** 应用层 — DaoUniverseApps（应用状态机 × Agent 广播） */
  get apps(): DaoUniverseApps         { return this._stack.apps; }
  /** 时序层 — DaoUniverseTimes（per-app 定时器追踪） */
  get times(): DaoUniverseTimes       { return this._stack.times; }
  /** 模块层 — DaoUniverseModules（IoC 容器 × Agent 广播） */
  get modules(): DaoUniverseModules   { return this._stack.modules; }
  /** 基准层 — DaoUniverseBenchmark（性能基准 × 宇宙健康感知） */
  get benchmark(): DaoUniverseBenchmark { return this._stack.benchmark; }
  /** 诊断层 — DaoUniverseDiagnostic（哲学审查 × 性能基准 综合诊断） */
  get diagnostic(): DaoUniverseDiagnostic { return this._stack.diagnostic; }

  // ── 快照与诊断 ───────────────────────────────────────────────────────────

  /**
   * snapshot — 聚合全栈五维快照
   *
   * 不触发新的 audit/benchmark 运行，仅读取各层当前状态。
   *
   * @returns DaoFacadeSnapshot
   */
  snapshot(): DaoFacadeSnapshot {
    this._stack.monitor.feed();
    return {
      timestamp:  Date.now(),
      system:     this._stack.universe.snapshot(),
      monitor:    this._stack.monitor.capture(),
      bench:      this._stack.benchmark.snapshot(),
      qi:         this._stack.qi.snapshot(),
      diagnostic: this._stack.diagnostic.snapshot(),
    };
  }

  /**
   * diagnose — 宇宙综合诊断快捷方法
   *
   * 等同于 facade.diagnostic.diagnose()。
   * 并行运行哲学审查（DaoUniverseAudit）+ 性能基准（DaoUniverseBenchmark.runQuick()）。
   *
   * @returns Promise<DiagnosticRecord>
   */
  async diagnose(): Promise<DiagnosticRecord> {
    return this._stack.diagnostic.diagnose();
  }
}
