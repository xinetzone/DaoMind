import { EventEmitter } from 'node:events';
/** 虚空观照者 —— 致虚极，守静笃
 * 帛书依据："致虚极也，守静笃也"（乙本·十六章）
 * 设计原理：纯粹的观察者，映照系统活动而不干涉 */
class DaoNothingVoid extends EventEmitter {
    #eventLog = [];
    #maxLogSize;
    constructor(maxLogSize = 10000) {
        super();
        this.#maxLogSize = maxLogSize;
        this.setMaxListeners(Infinity);
    }
    /** 观照 —— 接收事件，静默记录 */
    observe(event) {
        const fullEvent = { ...event, timestamp: Date.now() };
        this.#eventLog.push(fullEvent);
        if (this.#eventLog.length > this.#maxLogSize) {
            this.#eventLog = this.#eventLog.slice(-Math.floor(this.#maxLogSize / 2));
        }
        this.emit('observed', fullEvent);
    }
    /** 映照 —— 返回系统镜像 */
    reflect() {
        return Object.freeze([...this.#eventLog]);
    }
    /** 归虚 —— 清除所有记录，回归空无 */
    void() {
        this.#eventLog = [];
        this.removeAllListeners();
    }
    /** 守静 —— 返回当前静默状态 */
    stillness() {
        return {
            totalObserved: this.#eventLog.length,
            listenerCount: this.listenerCount,
            state: 'void',
        };
    }
}
const daoNothingVoid = new DaoNothingVoid();
export { daoNothingVoid, DaoNothingVoid };
//# sourceMappingURL=event-void.js.map