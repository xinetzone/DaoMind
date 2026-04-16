/** DaoBaseAgent —— 自主行动的基础实体
 * 帛书依据："为而不争"（乙本·八十一章）
 * 设计原则：Agent 通过虚空事件总线与外界沟通，不直接持有外部引用 */

import { daoNothingVoid } from '@daomind/nothing';
import type { DaoAgent, AgentState, DaoAgentCapability } from './types';
import { daoAgentMessenger } from './messaging';
import type { AgentMessage, MessageHandler } from './messaging';

export const AGENT_LIFECYCLE_EVENT = 'agent:lifecycle';

const VALID_STATE_TRANSITIONS: Record<AgentState, readonly AgentState[]> = {
  dormant: ['awakening', 'deceased'],
  awakening: ['active', 'dormant', 'deceased'],
  active: ['resting', 'deceased'],
  resting: ['active', 'dormant', 'deceased'],
  deceased: [],
};

abstract class DaoBaseAgent implements DaoAgent {
  abstract readonly agentType: string;
  abstract readonly capabilities: ReadonlyArray<DaoAgentCapability>;

  readonly id: string;
  readonly createdAt: number;
  readonly existentialType: 'nothing' | 'anything' = 'anything';
  private _state: AgentState = 'dormant';

  constructor(id: string) {
    this.id = id;
    this.createdAt = Date.now();
  }

  get state(): AgentState {
    return this._state;
  }

  protected setState(next: AgentState): void {
    const allowed = VALID_STATE_TRANSITIONS[this._state];
    if (!allowed.includes(next)) {
      throw new Error(
        `[daoAgents] 非法状态转换: ${this.id} 从 "${this._state}" 到 "${next}"`
      );
    }
    const from = this._state;
    this._state = next;

    // 向虚空观照者发布生命周期事件（供 ContainerBridge 等订阅者感知）
    daoNothingVoid.observe({
      type: AGENT_LIFECYCLE_EVENT,
      source: this.id,
      data: { agentId: this.id, from, to: next },
    });
  }

  async initialize(): Promise<void> {
    this.setState('awakening');
  }

  async activate(): Promise<void> {
    this.setState('active');
  }

  async rest(): Promise<void> {
    this.setState('resting');
  }

  /** 终止 Agent，同时从消息总线中注销 */
  async terminate(): Promise<void> {
    this.setState('deceased');
    daoAgentMessenger.unsubscribe(this.id);
  }

  /** 向目标 Agent（或广播）发送消息 */
  send(to: string | '*', action: string, payload?: unknown): void {
    daoAgentMessenger.send(this.id, to, action, payload);
  }

  /** 注册消息接收处理器 */
  onMessage(handler: MessageHandler): void {
    daoAgentMessenger.subscribe(this.id, handler);
  }

  abstract execute<T>(action: string, payload?: unknown): Promise<T>;
}

export { DaoBaseAgent };
export type { AgentMessage, MessageHandler };
