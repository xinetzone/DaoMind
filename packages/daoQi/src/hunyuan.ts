/**
 * 混元气总线核心
 * 帛书《道德经》乙本·四十二章："万物负阴而抱阳，冲气以为和"
 * 混元气为天地人之总汇，是整个系统的生命线与传输介质
 */

import { EventEmitter } from 'node:events';
import type { DaoMessage } from './types/message';
import type { QiChannelType } from './types/channel';
import { DaoSerializer } from './codec/serializer';
import { DaoRouter } from './router';
import { DaoSigner } from './signer';
import { DaoBackpressure } from './backpressure';

export class HunyuanBus extends EventEmitter {
  private serializer: DaoSerializer;
  private router: DaoRouter;
  private signer: DaoSigner;
  private backpressure: DaoBackpressure;
  private secretKey: string;
  private totalEmitted = 0;
  private totalDropped = 0;
  private channelsStats: Record<QiChannelType | string, number> = {
    tian: 0,
    di: 0,
    ren: 0,
    chong: 0,
  };

  constructor(
    serializer: DaoSerializer,
    router: DaoRouter,
    signer: DaoSigner,
    backpressure: DaoBackpressure,
    secretKey: string,
  ) {
    super();
    this.serializer = serializer;
    this.router = router;
    this.signer = signer;
    this.backpressure = backpressure;
    this.secretKey = secretKey;
  }

  async send(message: DaoMessage): Promise<void> {
    // Validate message structure
    if (!message || !message.header) {
      throw new Error('[HunyuanBus] Invalid message: missing header');
    }
    if (!message.header.source) {
      throw new Error('[HunyuanBus] Invalid message: missing source in header');
    }
    // target 可为空（广播语义），router.route() 会将消息发至所有注册节点
    if (!message.header.timestamp) {
      throw new Error('[HunyuanBus] Invalid message: missing timestamp in header');
    }
    if (!message.header.type) {
      throw new Error('[HunyuanBus] Invalid message: missing type in header');
    }
    if (!message.body) {
      throw new Error('[HunyuanBus] Invalid message: missing body');
    }
    // Only check body.type if body is an object
    if (typeof message.body === 'object' && message.body !== null && !('type' in message.body)) {
      throw new Error('[HunyuanBus] Invalid message: missing type in body');
    }
    
    if (message.header.signature) {
      const payload = JSON.stringify(message.header);
      if (!this.signer.verify(payload, message.header.signature, this.secretKey)) {
        this.totalDropped++;
        return;
      }
    }
    if (!this.backpressure.allow(message.header.source)) {
      this.totalDropped++;
      return;
    }
    this.backpressure.record(message.header.source);
    const buffer = this.serializer.serialize(message);
    const targets = this.router.route(message);
    if (targets.length === 0) {
      this.totalDropped++;
      return;
    }
    this.totalEmitted++;
    const channelType = this.inferChannel(message);
    this.channelsStats[channelType] = (this.channelsStats[channelType] ?? 0) + 1;
    super.emit('message', message, buffer, targets);
  }

  subscribe(channelType: QiChannelType, handler: (msg: DaoMessage) => void | Promise<void>): () => void {
    const wrapper = (msg: DaoMessage): void | Promise<void> => handler(msg);
    this.addListener(channelType, wrapper);
    return () => this.removeListener(channelType, wrapper);
  }

  async probe(_target: string): Promise<number> {
    const start = Date.now();
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Date.now() - start);
      }, 0);
    });
  }

  getStats(): {
    totalEmitted: number;
    totalDropped: number;
    channelsStats: Record<string, number>;
  } {
    return {
      totalEmitted: this.totalEmitted,
      totalDropped: this.totalDropped + this.router.getDroppedCount(),
      channelsStats: { ...this.channelsStats },
    };
  }

  private inferChannel(_message: DaoMessage): QiChannelType {
    return 'chong';
  }
}
