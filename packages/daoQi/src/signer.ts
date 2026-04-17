/**
 * 签名验证机制
 * 帛书《道德经》乙本·四十二章："万物负阴而抱阳，中气以为和"
 * 根节点以私钥签名天气消息，确保气的真实性与完整性
 */

import { createHmac, randomBytes } from 'node:crypto';

export class DaoSigner {
  sign(payload: string, secretKey: string): string {
    return createHmac('sha256', secretKey).update(payload).digest('hex');
  }

  verify(payload: string, signature: string, secretKey: string): boolean {
    const expected = this.sign(payload, secretKey);
    return timingSafeEqual(expected, signature);
  }

  generateKeyPair(): { publicKey: string; privateKey: string } {
    const privateKey = randomBytes(32).toString('hex');
    const publicKey = createHmac('sha256', 'dao-public-derivation')
      .update(privateKey)
      .digest('hex')
      .slice(0, 64);
    return { publicKey, privateKey };
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const ba = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  let result = 0;
  const len = Math.min(ba.length, bb.length);
  for (let i = 0; i < len; i++) {
    result |= (ba[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return result === 0;
}
