/** Agent 间消息通信 —— 借道虚空观照者传递
 * 帛书依据："为学者日益，为道者日损，损之又损，以至于无为"（乙本·四十八章）
 * 设计原则：消息经由 daoNothingVoid 静默流转，Agent 彼此感知而不直接耦合 */

import { daoNothingVoid } from '@daomind/nothing';

const AGENT_MESSAGE_EVENT = 'agent:message';

/** Agent 消息结构 */
export interface AgentMessage {
  /** 消息唯一 ID */
  readonly id: string;
  /** 发送者 agentId */
  readonly from: string;
  /** 接收者 agentId 或 '*'（广播） */
  readonly to: string | '*';
  /** 消息类型 */
  readonly action: string;
  /** 消息体 */
  readonly payload?: unknown;
  readonly timestamp: number;
}

export type MessageHandler = (message: AgentMessage) => void | Promise<void>;

/** 消息过滤条件 */
export interface MessageFilter {
  from?: string;
  to?: string;
  action?: string;
}

/** 虚空传信者 —— Agent 间的消息总线
 * 所有消息经由 daoNothingVoid 留痕，支持历史回溯 */
class DaoAgentMessenger {
  private readonly handlers = new Map<string, MessageHandler>();

  /** 发送消息 —— 写入虚空观照，并派发给订阅方 */
  send(from: string, to: string | '*', action: string, payload?: unknown): void {
    const message: AgentMessage = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      from,
      to,
      action,
      payload,
      timestamp: Date.now(),
    };

    // 写入 daoNothingVoid 留存记录
    daoNothingVoid.observe({
      type: AGENT_MESSAGE_EVENT,
      source: from,
      data: message,
    });

    // 派发给目标订阅者
    for (const [agentId, handler] of this.handlers) {
      if (message.to === '*' || message.to === agentId) {
        void Promise.resolve(handler(message));
      }
    }
  }

  /** 订阅发给自己的消息（含广播） */
  subscribe(agentId: string, handler: MessageHandler): void {
    this.handlers.set(agentId, handler);
  }

  /** 取消订阅 */
  unsubscribe(agentId: string): void {
    this.handlers.delete(agentId);
  }

  /** 查询消息历史（从 daoNothingVoid 读取） */
  history(filter?: MessageFilter): ReadonlyArray<AgentMessage> {
    const all = daoNothingVoid
      .reflect()
      .filter((e) => e.type === AGENT_MESSAGE_EVENT)
      .map((e) => e.data as AgentMessage);

    if (!filter) return all;

    return all.filter((msg) => {
      if (filter.from !== undefined && msg.from !== filter.from) return false;
      if (filter.to !== undefined && msg.to !== filter.to) return false;
      if (filter.action !== undefined && msg.action !== filter.action) return false;
      return true;
    });
  }

  /** 当前订阅者数量 */
  subscriberCount(): number {
    return this.handlers.size;
  }
}

export const daoAgentMessenger = new DaoAgentMessenger();
export { DaoAgentMessenger };
