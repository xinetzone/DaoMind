/**
 * 统一消息协议格式
 * 帛书《道德经》乙本·四十二章："万物负阴而抱阳，中气以为和"
 * 消息为气之载体，承载阴阳信息于系统各节点之间流转
 */

/** 消息优先级：0=最高, 3=最低 */
export type DaoMessagePriority = 0 | 1 | 2 | 3;

/** 消息编码格式 */
export type DaoEncoding = 'json' | 'binary';

/**
 * 消息头 —— 包含路由与元信息
 * 如同气的"经络穴位"，标记消息的来源、去向与属性
 */
export interface DaoMessageHeader {
  readonly id: string;
  readonly type: string;
  readonly source: string;
  readonly target?: string;
  readonly priority: DaoMessagePriority;
  readonly ttl: number;
  readonly timestamp: number;
  readonly signature?: string;
  readonly encoding: DaoEncoding;
}

/** 消息体 —— 承载实际数据 */
export type DaoMessageBody = Record<string, unknown> | ArrayBuffer;

/**
 * 完整消息 —— 头+体的统一封装
 * 一条消息即一缕"气"，在道宇宙中穿行
 */
export interface DaoMessage {
  readonly header: DaoMessageHeader;
  readonly body: DaoMessageBody;
}
