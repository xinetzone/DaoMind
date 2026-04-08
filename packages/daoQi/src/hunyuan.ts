/**
 * 混元气总线核心
 * 帛书《道德经》乙本·四十二章："万物负阴而抱阳，冲气以为和"
 * 混元气为天地人之总汇，是整个系统的生命线与传输介质
 */

import { EventEmitter } from 'node:events';
import type { DaoMessage } from './types/message.js';
import type { QiChannelType } from './types/channel.js';
import { DaoSerializer } from './codec/serializer.js';
import { DaoRouter } from './router.js';
import { DaoSigner } from './signer.js';
import { DaoBackpressure } from './backpressure.js';

export class HunyuanBus extends EventEmitter {
  private serializer: DaoSerializer;
  private router: DaoRouter;
  private signer: DaoSigner;
  private backpressure: DaoBackpressure;
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
  ) {
    super();
    this.serializer = serializer;
    this.router = router;
    this.signer = signer;
    this.backpressure = backpressure;
  }

  async send(message: DaoMessage): Promise<void> {
    if (message.header.signature) {
      const payload = JSON.stringify(message.header);
      if (!this.signer.verify(payload, message.header.signature, 'root-secret')) {
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
    const wrapper = (msg: DaoMessage) => handler(msg);
    this.addListener(channelType, wrapper);
    return () => this.removeListener(channelType, wrapper);
  }

  async probe(target: string): Promise<number> {
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
