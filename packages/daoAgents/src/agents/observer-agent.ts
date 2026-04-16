/** ObserverAgent —— 系统观照者
 * 帛书依据："致虚极也，守静笃也。万物并作，吾以观复"（乙本·十六章）
 * 设计原则：无为而观，静默收集系统活动，提供快照和历史查询 */

import { daoNothingVoid } from '@daomind/nothing';
import type { DaoNothingEvent } from '@daomind/nothing';
import { DaoBaseAgent, AGENT_LIFECYCLE_EVENT } from '../base';
import type { DaoAgentCapability } from '../types';

const AGENT_MESSAGE_EVENT = 'agent:message';

/** 单条观察记录 */
export interface Observation {
  readonly type: string;
  readonly data: unknown;
  readonly timestamp: number;
}

/** 系统快照 */
export interface SystemSnapshot {
  readonly totalObservations: number;
  readonly lifecycleEvents: number;
  readonly messageEvents: number;
  readonly otherEvents: number;
  readonly lastObservedAt?: number;
  readonly observerId: string;
}

/**
 * ObserverAgent —— 系统观察者 Agent
 *
 * 支持的 actions:
 *   get-snapshot  {}                    → 返回 SystemSnapshot
 *   get-history   { limit?: number }    → 返回最近 N 条观察记录（默认 20）
 *   get-by-type   { type: string }      → 按事件类型过滤
 *   clear         {}                    → 清空本地观察记录
 */
export class ObserverAgent extends DaoBaseAgent {
  readonly agentType = 'observer';
  readonly capabilities: ReadonlyArray<DaoAgentCapability> = [
    { name: 'observe-system', version: '1.0.0', description: '系统状态观察与快照' },
  ];

  private readonly observations: Observation[] = [];

  /** 保留绑定引用，用于 terminate() 时移除监听 */
  private readonly boundHandler: (event: DaoNothingEvent) => void;

  constructor(id: string) {
    super(id);
    this.boundHandler = (event: DaoNothingEvent) => {
      this.observations.push({
        type: event.type,
        data: event.data,
        timestamp: event.timestamp,
      });
    };
  }

  /** 初始化时开始监听虚空事件 */
  override async initialize(): Promise<void> {
    await super.initialize();
    daoNothingVoid.on('observed', this.boundHandler);
  }

  /** 终止时停止监听，再调用 super.terminate() */
  override async terminate(): Promise<void> {
    daoNothingVoid.removeListener('observed', this.boundHandler);
    await super.terminate();
  }

  async execute<T>(action: string, payload?: unknown): Promise<T> {
    switch (action) {
      case 'get-snapshot': {
        const lifecycleCount = this.observations.filter(
          (o) => o.type === AGENT_LIFECYCLE_EVENT,
        ).length;
        const messageCount = this.observations.filter(
          (o) => o.type === AGENT_MESSAGE_EVENT,
        ).length;
        const snapshot: SystemSnapshot = {
          totalObservations: this.observations.length,
          lifecycleEvents: lifecycleCount,
          messageEvents: messageCount,
          otherEvents: this.observations.length - lifecycleCount - messageCount,
          lastObservedAt: this.observations.at(-1)?.timestamp,
          observerId: this.id,
        };
        return snapshot as T;
      }

      case 'get-history': {
        const limit = (payload as { limit?: number } | undefined)?.limit ?? 20;
        return this.observations.slice(-limit) as T;
      }

      case 'get-by-type': {
        const { type } = payload as { type: string };
        return this.observations.filter((o) => o.type === type) as T;
      }

      case 'clear': {
        const cleared = this.observations.length;
        this.observations.length = 0;
        return { cleared, observerId: this.id } as T;
      }

      default:
        throw new Error(`[ObserverAgent] 未知操作: ${action}`);
    }
  }
}
