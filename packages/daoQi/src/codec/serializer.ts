/**
 * 序列化引擎
 * 帛书《道德经》乙本·四十二章："万物负阴而抱阳，冲气以为和"
 * 气在传输过程中需要凝聚成形（序列化）与散开还原（反序列化）
 */

import type { DaoMessage, DaoMessageBody, DaoEncoding } from '../types/message.js';

const BINARY_MAGIC = 0xD401;

export class DaoSerializer {
  serialize(message: DaoMessage): Buffer {
    if (message.header.encoding === 'json') {
      return this.serializeJson(message);
    }
    return this.serializeBinary(message);
  }

  deserialize(buffer: Buffer): DaoMessage {
    const firstWord = buffer.readUInt16BE(0);
    if (firstWord === BINARY_MAGIC) {
      return this.deserializeBinary(buffer);
    }
    return this.deserializeJson(buffer);
  }

  private serializeJson(message: DaoMessage): Buffer {
    const json = JSON.stringify({
      header: message.header,
      body: message.body instanceof ArrayBuffer
        ? { _binary: Buffer.from(message.body).toString('base64') }
        : message.body,
    });
    return Buffer.from(json, 'utf-8');
  }

  private serializeBinary(message: DaoMessage): Buffer {
    const headerJson = JSON.stringify(message.header);
    const headerBuf = Buffer.from(headerJson, 'utf-8');
    const bodyBuf = message.body instanceof ArrayBuffer
      ? Buffer.from(message.body)
      : Buffer.from(JSON.stringify(message.body), 'utf-8');

    const result = Buffer.alloc(4 + headerBuf.length + bodyBuf.length);
    let offset = 0;
    result.writeUInt16BE(BINARY_MAGIC, offset); offset += 2;
    result.writeUInt16BE(headerBuf.length, offset); offset += 2;
    headerBuf.copy(result, offset); offset += headerBuf.length;
    bodyBuf.copy(result, offset);
    return result;
  }

  private deserializeJson(buffer: Buffer): DaoMessage {
    const obj = JSON.parse(buffer.toString('utf-8'));
    let body: DaoMessageBody = obj.body;
    if (obj.body && typeof obj.body === 'object' && '_binary' in obj.body) {
      body = Buffer.from(obj.body._binary as string, 'base64').buffer;
    }
    return { header: obj.header, body };
  }

  private deserializeBinary(buffer: Buffer): DaoMessage {
    let offset = 2;
    const headerLen = buffer.readUInt16BE(offset); offset += 2;
    const headerJson = buffer.subarray(offset, offset + headerLen).toString('utf-8');
    offset += headerLen;
    const header = JSON.parse(headerJson) as DaoMessage['header'];
    const bodyBuf = buffer.subarray(offset);
    const body: DaoMessageBody = header.encoding === 'binary'
      ? bodyBuf.buffer
      : JSON.parse(bodyBuf.toString('utf-8'));
    return { header, body };
  }
}
