/** DaoUniverse —— 道宇宙根节点
 * 帛书依据："道生一，一生二，二生三，三生万物"（乙本·四十二章）
 * 设计原则：DaoUniverse 是整个系统的门面，将 nothing/anything/agents/apps 统一管理，
 *           让调用方只需面向一个入口即可驱动整个 DaoMind 体系 */

import { daoNothingVoid } from '@daomind/nothing';
import { DaoAnythingContainer } from '@daomind/anything';
import {
  DaoAgentRegistry,
  DaoBaseAgent,
  DaoAgentContainerBridge,
} from '@daomind/agents';
import { DaoAppContainer } from '@daomind/apps';
import type { DaoAppDefinition, DaoAppInstance } from '@daomind/apps';

/** 系统全局快照 */
export interface DaoSystemSnapshot {
  /** 快照时间戳 */
  readonly timestamp: number;
  /** 模块容器（daoAnything）统计 */
  readonly modules: {
    readonly total: number;
    readonly byLifecycle: Record<string, number>;
  };
  /** Agent 注册表（daoAgents）统计 */
  readonly agents: {
    readonly total: number;
    readonly byState: Record<string, number>;
    readonly byType: Record<string, number>;
  };
  /** 应用容器（daoApps）统计 */
  readonly apps: {
    readonly total: number;
    readonly byState: Record<string, number>;
  };
  /** 虚空事件总线（daoNothingVoid）统计 */
  readonly events: {
    readonly total: number;
    readonly byType: Record<string, number>;
  };
}

/**
 * DaoUniverse —— 整个 DaoMind 系统的统一门面
 *
 * - `.container`      → DaoAnythingContainer（模块注册与生命周期）
 * - `.agentRegistry`  → DaoAgentRegistry（Agent 全局注册中心）
 * - `.appContainer`   → DaoAppContainer（应用注册与状态机）
 * - `.bridge`         → DaoAgentContainerBridge（Agent↔容器生命周期同步）
 * - `.void`           → daoNothingVoid（全局事件总线只读引用）
 *
 * 工厂方法：
 * - `createAgent(Class, id)` → 创建 Agent 并自动注册到 agentRegistry
 * - `createApp(definition)`  → 注册应用，返回初始实例
 *
 * 快照：
 * - `snapshot()` → 返回全系统各层统计数据
 */
class DaoUniverse {
  /** 模块容器 —— 有名层的注册中心 */
  readonly container = new DaoAnythingContainer();
  /** Agent 注册中心 */
  readonly agentRegistry = new DaoAgentRegistry();
  /** 应用容器 */
  readonly appContainer = new DaoAppContainer();
  /** Agent↔容器生命周期桥接 */
  readonly bridge = new DaoAgentContainerBridge();

  /** 全局虚空事件总线（只读引用） */
  get void() {
    return daoNothingVoid;
  }

  /**
   * 工厂：创建 Agent 并自动注册到 agentRegistry
   *
   * @example
   * const agent = universe.createAgent(TaskAgent, 'worker-1');
   * await agent.initialize();
   * await agent.activate();
   */
  createAgent<T extends DaoBaseAgent>(
    AgentClass: new (id: string) => T,
    id: string,
  ): T {
    const agent = new AgentClass(id);
    this.agentRegistry.register(agent);
    return agent;
  }

  /**
   * 工厂：注册应用到 appContainer，返回初始实例
   *
   * @example
   * const app = universe.createApp({ id: 'my-app', name: '我的应用', version: '1.0.0', entry: './app' });
   * await universe.appContainer.start('my-app');
   */
  createApp(definition: DaoAppDefinition): DaoAppInstance {
    this.appContainer.register(definition);
    return this.appContainer.get(definition.id)!;
  }

  /**
   * 系统全局快照 —— 聚合各层统计数据
   *
   * @returns DaoSystemSnapshot，包含 modules / agents / apps / events 各维度计数
   */
  snapshot(): DaoSystemSnapshot {
    const modules = this.container.listModules();
    const agents  = this.agentRegistry.listAll();
    const apps    = this.appContainer.listAll();
    const events  = daoNothingVoid.reflect();

    // 模块生命周期分布
    const byLifecycle: Record<string, number> = {};
    for (const m of modules) {
      byLifecycle[m.lifecycle] = (byLifecycle[m.lifecycle] ?? 0) + 1;
    }

    // Agent 状态和类型分布
    const byAgentState: Record<string, number> = {};
    const byAgentType:  Record<string, number> = {};
    for (const a of agents) {
      byAgentState[a.state]     = (byAgentState[a.state] ?? 0) + 1;
      byAgentType[a.agentType]  = (byAgentType[a.agentType] ?? 0) + 1;
    }

    // 应用状态分布
    const byAppState: Record<string, number> = {};
    for (const app of apps) {
      byAppState[app.state] = (byAppState[app.state] ?? 0) + 1;
    }

    // 事件类型分布
    const byEventType: Record<string, number> = {};
    for (const e of events) {
      byEventType[e.type] = (byEventType[e.type] ?? 0) + 1;
    }

    return {
      timestamp: Date.now(),
      modules: { total: modules.length, byLifecycle },
      agents:  { total: agents.length,  byState: byAgentState, byType: byAgentType },
      apps:    { total: apps.length,    byState: byAppState },
      events:  { total: events.length,  byType: byEventType },
    };
  }
}

/** 全局 DaoUniverse 单例 */
export const daoUniverse = new DaoUniverse();
export { DaoUniverse };
