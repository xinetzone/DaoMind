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
declare class DaoNothingVoid extends EventEmitter {
    #private;
    constructor(maxLogSize?: number);
    /** 观照 —— 接收事件，静默记录 */
    observe(event: Omit<DaoNothingEvent, 'timestamp'>): void;
    /** 映照 —— 返回系统镜像 */
    reflect(): ReadonlyArray<DaoNothingEvent>;
    /** 归虚 —— 清除所有记录，回归空无 */
    void(): void;
    /** 守静 —— 返回当前静默状态 */
    stillness(): {
        totalObserved: number;
        listenerCount: <E extends string | symbol>(eventName: string | symbol, listener?: ((...args: any[]) => void) | undefined) => number;
        state: "void";
    };
}
declare const daoNothingVoid: DaoNothingVoid;
export { daoNothingVoid, DaoNothingVoid };
//# sourceMappingURL=event-void.d.ts.map