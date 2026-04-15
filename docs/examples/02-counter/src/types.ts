import type { DaoModuleMeta } from '@daomind/anything';

/**
 * 计数器模块接口
 * 
 * 继承 DaoModuleMeta 包含完整的模块元数据
 */
export interface CounterModule extends DaoModuleMeta {
  /** 当前计数值 */
  readonly count: number;
  
  /** 每次变化的步长 */
  readonly step: number;
}

/**
 * 计数器事件负载
 */
export interface CounterEventPayload {
  /** 计数器 ID */
  readonly counterId: string;
  
  /** 旧值 */
  readonly oldValue: number;
  
  /** 新值 */
  readonly newValue: number;
}
