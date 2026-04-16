/** DaoUniverseAgents — 道宇宙 Agent 生命周期 × 监控健康反馈
 * 帛书依据："知人者智，自知者明；胜人者有力，自胜者强"（道经·三十三章）
 *           "为而不争"（乙本·八十一章）
 *
 * 架构：DaoUniverseMonitor → DaoUniverseAgents
 *       独立 DaoAgentRegistry（不污染全局）+ 全局 daoAgentMessenger 代理，
 *       每次 spawn/terminate 向 monitor.heatmapEngine 注入 agent 分布数据，
 *       实现 Agent 自主行动与宇宙健康监控的双向感知。
 *
 *   DaoUniverse
 *      └── DaoUniverseMonitor
 *              └── DaoUniverseAgents  ← agent 生命周期 × 监控反馈
 */

import { daoAgentMessenger } from '@daomind/agents';
import { DaoAgentRegistry, DaoBaseAgent } from '@daomind/agents';
import type { DaoAgent, AgentState } from '@daomind/agents';
import type { AgentMessage, MessageFilter } from '@daomind/agents';
import type { DaoUniverseMonitor } from './universe-monitor';

/** Agent 系统快照 */
export interface AgentsSnapshot {
  readonly timestamp:   number;
  /** 已注册 Agent 总数 */
  readonly total:       number;
  /** active 状态 Agent 数量 */
  readonly active:      number;
  /** dormant 状态 Agent 数量 */
  readonly dormant:     number;
  /** 各类型 Agent 数量 */
  readonly byType:      Record<string, number>;
  /** 全局 messenger 当前订阅者数量 */
  readonly subscribers: number;
}

export class DaoUniverseAgents {
  /** 独立注册表，不污染全局 daoAgentRegistry 单例 */
  private readonly _registry: DaoAgentRegistry;

  constructor(private readonly _monitor: DaoUniverseMonitor) {
    this._registry = new DaoAgentRegistry();
  }

  // ── 生命周期 ──────────────────────────────────────────────────────────────

  /**
   * spawn — 创建 Agent 并注册到本 universe
   *
   * - 使用 `new AgentClass(id)` 实例化
   * - 注册到独立 `_registry`（不影响全局 `daoAgentRegistry`）
   * - 向 `monitor.heatmapEngine` 记录 agent 类型分布（ren 通道）
   * @throws 若 id 已注册
   */
  spawn<T extends DaoBaseAgent>(AgentClass: new (id: string) => T, id: string): T {
    const agent = new AgentClass(id);
    this._registry.register(agent);
    // 向 monitor 热力图注入 agent 类型分布
    this._monitor.heatmapEngine.record('ren', agent.agentType, 'daoAgents', {
      rate: this._registry.findByType(agent.agentType).length,
      latency: 0,
      errorRate: 0,
    });
    return agent;
  }

  /**
   * terminate — 终止 Agent 生命周期并从注册表移除
   *
   * @returns true（已终止），false（Agent 不存在）
   */
  async terminate(id: string): Promise<boolean> {
    const agent = this._registry.get(id);
    if (!agent) return false;
    try {
      await agent.terminate();
    } catch {
      // Agent 可能已是 deceased 状态，忽略状态机异常
    }
    return this._registry.unregister(id);
  }

  /**
   * activate — 激活 Agent（dormant/resting → active）
   *
   * @returns true（已激活），false（Agent 不存在）
   * @throws 若状态不允许转换（非法状态机跃迁）
   */
  async activate(id: string): Promise<boolean> {
    const agent = this._registry.get(id);
    if (!agent) return false;
    await agent.activate();
    return true;
  }

  /**
   * rest — 令 Agent 进入休眠（active → resting）
   *
   * @returns true（已休眠），false（Agent 不存在）
   */
  async rest(id: string): Promise<boolean> {
    const agent = this._registry.get(id);
    if (!agent) return false;
    await agent.rest();
    return true;
  }

  // ── 查询 ──────────────────────────────────────────────────────────────────

  /**
   * getAgent — 获取已注册的 Agent
   */
  getAgent(id: string): DaoAgent | undefined {
    return this._registry.get(id);
  }

  /**
   * listAll — 列出所有已注册 Agent
   */
  listAll(): ReadonlyArray<DaoAgent> {
    return this._registry.listAll();
  }

  /**
   * findByCapability — 按能力名称查找 Agent
   */
  findByCapability(capability: string): ReadonlyArray<DaoAgent> {
    return this._registry.findByCapability(capability);
  }

  /**
   * findByType — 按 agentType 查找 Agent
   */
  findByType(type: string): ReadonlyArray<DaoAgent> {
    return this._registry.findByType(type);
  }

  // ── 消息（代理全局 daoAgentMessenger）────────────────────────────────────

  /**
   * send — 通过全局 daoAgentMessenger 发送消息
   *
   * 注意：DaoBaseAgent 内部硬绑定全局 daoAgentMessenger，
   * 本方法代理同一全局实例，确保与 Agent 自身 send() 共享消息总线。
   */
  send(from: string, to: string | '*', action: string, payload?: unknown): void {
    daoAgentMessenger.send(from, to, action, payload);
  }

  /**
   * history — 从全局虚空观照者读取消息历史
   */
  history(filter?: MessageFilter): ReadonlyArray<AgentMessage> {
    return daoAgentMessenger.history(filter);
  }

  // ── 快照 ──────────────────────────────────────────────────────────────────

  /**
   * snapshot — Agent 系统快照（同步，同时向 monitor.heatmapEngine 注入当前分布）
   */
  snapshot(): AgentsSnapshot {
    const agents = this._registry.listAll();
    const byType: Record<string, number> = {};
    let active  = 0;
    let dormant = 0;

    for (const a of agents) {
      byType[a.agentType] = (byType[a.agentType] ?? 0) + 1;
      if (a.state === 'active')  active++;
      if (a.state === 'dormant') dormant++;
    }

    // 向 monitor 热力图注入当前分布（供跨层监控使用）
    const errorRate = agents.length > 0
      ? agents.filter(a => a.state === 'deceased').length / agents.length
      : 0;
    for (const [type, count] of Object.entries(byType)) {
      this._monitor.heatmapEngine.record('ren', type, 'daoAgents', {
        rate: count,
        latency: 0,
        errorRate,
      });
    }

    return {
      timestamp:   Date.now(),
      total:       agents.length,
      active,
      dormant,
      byType,
      subscribers: daoAgentMessenger.subscriberCount(),
    };
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get monitor():  DaoUniverseMonitor { return this._monitor;  }
  get registry(): DaoAgentRegistry   { return this._registry; }
}
