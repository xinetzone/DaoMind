/** Agent-Container 桥接 —— 生命周期双向同步
 * 帛书依据："知常曰明，不知常，妄作，凶"（乙本·十六章）
 * 设计原则：Agent 状态变更通过 daoNothingVoid 事件传播，
 *           桥接器订阅这些事件并同步到 daoAnything 容器，
 *           实现"无名→有名→行动"三层的生命周期闭环 */

import type { DaoNothingEvent } from '@daomind/nothing';
import { daoNothingVoid } from '@daomind/nothing';
import type { DaoAgent } from './types';
import { AGENT_LIFECYCLE_EVENT } from './base';
import type { DaoAnythingContainer } from '@daomind/anything';

interface LifecycleEventData {
  agentId: string;
  from: string;
  to: string;
}

/** Agent 状态 → 容器生命周期 映射表 */
const STATE_TO_CONTAINER_ACTION = {
  awakening: 'initialize',
  active: 'activate',
  resting: 'deactivate',
  deceased: 'terminate',
} as const;

type ContainerAction = keyof typeof STATE_TO_CONTAINER_ACTION;

/** DaoAgentContainerBridge —— Agent 与 daoAnything 容器的生命周期桥接器
 *
 * 工作流程：
 *   1. mount(agent, container)：将 agent 注册进容器（状态: registered）
 *   2. agent 状态变更时，DaoBaseAgent.setState 发布 agent:lifecycle 事件
 *   3. 本桥接器监听该事件，自动调用容器对应的生命周期方法
 *   4. unmount(agentId)：解除绑定，后续事件不再同步
 *   5. dispose()：清理 daoNothingVoid 监听器，释放资源 */
class DaoAgentContainerBridge {
  private readonly bridges = new Map<string, DaoAnythingContainer>();
  private readonly lifecycleListener: (event: DaoNothingEvent) => void;

  constructor() {
    this.lifecycleListener = (event: DaoNothingEvent) => {
      if (event.type !== AGENT_LIFECYCLE_EVENT) return;
      const { agentId, to } = event.data as LifecycleEventData;
      const container = this.bridges.get(agentId);
      if (!container) return;

      if (to in STATE_TO_CONTAINER_ACTION) {
        const action = STATE_TO_CONTAINER_ACTION[to as ContainerAction];
        void (container[action] as (name: string) => Promise<void>)(agentId);
      }
    };

    daoNothingVoid.on('observed', this.lifecycleListener);
  }

  /** 挂载：将 agent 注册进容器，开始生命周期同步 */
  mount(agent: DaoAgent, container: DaoAnythingContainer): void {
    if (this.bridges.has(agent.id)) {
      throw new Error(`[DaoAgentContainerBridge] Agent "${agent.id}" 已挂载到容器`);
    }

    // 在容器中注册此 agent 对应的模块条目
    container.register({
      name: agent.id,
      version: '1.0.0',
      path: `agent:${agent.id}`,  // 占位路径，agent 由实例直接持有，不走 resolve
      dependencies: [],
    });

    this.bridges.set(agent.id, container);
  }

  /** 卸载：解除绑定，后续状态变更不再同步到容器 */
  unmount(agentId: string): boolean {
    return this.bridges.delete(agentId);
  }

  /** 查询已挂载的 Agent ID 列表 */
  mountedAgentIds(): ReadonlyArray<string> {
    return Array.from(this.bridges.keys());
  }

  /** 是否已挂载 */
  isMounted(agentId: string): boolean {
    return this.bridges.has(agentId);
  }

  /** 释放资源：移除 daoNothingVoid 监听器 */
  dispose(): void {
    daoNothingVoid.removeListener('observed', this.lifecycleListener);
    this.bridges.clear();
  }
}

export const daoAgentContainerBridge = new DaoAgentContainerBridge();
export { DaoAgentContainerBridge };
