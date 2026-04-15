import type { ExistenceContract } from '@daomind/nothing';

/**
 * HelloModule 接口 - 最简单的 DaoMind 模块
 * 
 * 这是"无名"状态的类型定义，仅在编译时存在
 */
export interface HelloModule extends ExistenceContract {
  /** 要显示的消息 */
  readonly message: string;
  
  /** 消息的语言 */
  readonly language: string;
}
