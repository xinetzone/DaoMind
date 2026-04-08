import { EventEmitter } from 'node:events';

export interface DaoNothingEvent {
  type: string;
  source: string;
  timestamp: number;
  data?: unknown;
  metadata?: Record<string, unknown>;
}

/** 虚空观照者 —— 致虚极，守静笃
 * 帛书依据："致虚极也，守静笃也"（乙本·十六章）
 * 设计原理：纯粹的观察者，映照系统活动而不干涉 */
class DaoNothingVoid extends EventEmitter {
  #eventLog: DaoNothingEvent[] = [];
  readonly #maxLogSize: number;

  constructor(maxLogSize = 10000) {
    super();
    this.#maxLogSize = maxLogSize;
    this.setMaxListeners(Infinity);
  }

  /** 观照 —— 接收事件，静默记录 */
  observe(event: Omit<DaoNothingEvent, 'timestamp'>): void {
    const fullEvent: DaoNothingEvent = { ...event, timestamp: Date.now() };
    this.#eventLog.push(fullEvent);
    if (this.#eventLog.length > this.#maxLogSize) {
      this.#eventLog = this.#eventLog.slice(-Math.floor(this.#maxLogSize / 2));
    }
    this.emit('observed', fullEvent);
  }

  /** 映照 —— 返回系统镜像 */
  reflect(): ReadonlyArray<DaoNothingEvent> {
    return Object.freeze([...this.#eventLog]);
  }

  /** 归虚 —— 清除所有记录，回归空无 */
  void(): void {
    this.#eventLog = [];
    this.removeAllListeners();
  }

  /** 守静 —— 返回当前静默状态 */
  stillness(): { totalObserved: number; listenerCount: (event?: string | symbol) => number; state: 'void' } {
    return {
      totalObserved: this.#eventLog.length,
      listenerCount: (event?: string | symbol) => {
        if (event) {
          return this.listenerCount(event);
        }
        return this.listenerCount('observed');
      },
      state: 'void' as const,
    };
  }
}

const daoNothingVoid = new DaoNothingVoid();

export { daoNothingVoid, DaoNothingVoid };
