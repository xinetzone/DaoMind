import { DaoAgentMessenger } from '../messaging';
import { daoNothingVoid } from '@daomind/nothing';

describe('DaoAgentMessenger', () => {
  let messenger: DaoAgentMessenger;

  beforeEach(() => {
    messenger = new DaoAgentMessenger();
    // 清空虚空观照者历史，确保测试隔离
    daoNothingVoid.void();
  });

  // ── 点对点消息 ────────────────────────────────────────────────────────────────

  describe('点对点发送', () => {
    test('订阅者能收到发给自己的消息', (done) => {
      messenger.subscribe('agent-b', (msg) => {
        expect(msg.from).toBe('agent-a');
        expect(msg.to).toBe('agent-b');
        expect(msg.action).toBe('ping');
        expect(msg.payload).toEqual({ data: 'hello' });
        done();
      });

      messenger.send('agent-a', 'agent-b', 'ping', { data: 'hello' });
    });

    test('不相关的 Agent 不会收到消息', () => {
      const received: string[] = [];
      messenger.subscribe('agent-b', () => { received.push('b'); });
      messenger.subscribe('agent-c', () => { received.push('c'); });

      messenger.send('agent-a', 'agent-b', 'ping');

      // 等一个 microtask 周期
      return new Promise<void>((resolve) =>
        setImmediate(() => {
          expect(received).toEqual(['b']);
          resolve();
        })
      );
    });

    test('消息包含唯一 id 和 timestamp', () => {
      let capturedMsg: Parameters<Parameters<DaoAgentMessenger['subscribe']>[1]>[0] | null = null;
      messenger.subscribe('agent-b', (msg) => { capturedMsg = msg; });

      const before = Date.now();
      messenger.send('agent-a', 'agent-b', 'act');
      const after = Date.now();

      expect(capturedMsg).not.toBeNull();
      expect(capturedMsg!.id).toBeTruthy();
      expect(capturedMsg!.timestamp).toBeGreaterThanOrEqual(before);
      expect(capturedMsg!.timestamp).toBeLessThanOrEqual(after);
    });
  });

  // ── 广播 ─────────────────────────────────────────────────────────────────────

  describe('广播消息（to: *）', () => {
    test('所有订阅者都能收到广播', () => {
      const received: string[] = [];
      messenger.subscribe('agent-b', () => { received.push('b'); });
      messenger.subscribe('agent-c', () => { received.push('c'); });
      messenger.subscribe('agent-d', () => { received.push('d'); });

      messenger.send('agent-a', '*', 'broadcast');

      return new Promise<void>((resolve) =>
        setImmediate(() => {
          expect(received.sort()).toEqual(['b', 'c', 'd']);
          resolve();
        })
      );
    });
  });

  // ── 取消订阅 ──────────────────────────────────────────────────────────────────

  describe('unsubscribe', () => {
    test('取消订阅后不再收到消息', () => {
      const received: string[] = [];
      messenger.subscribe('agent-b', () => { received.push('b'); });
      messenger.send('agent-a', 'agent-b', 'first');
      messenger.unsubscribe('agent-b');
      messenger.send('agent-a', 'agent-b', 'second');

      return new Promise<void>((resolve) =>
        setImmediate(() => {
          expect(received).toHaveLength(1);
          resolve();
        })
      );
    });

    test('取消不存在的订阅不报错', () => {
      expect(() => messenger.unsubscribe('ghost')).not.toThrow();
    });
  });

  // ── 消息历史 ──────────────────────────────────────────────────────────────────

  describe('history', () => {
    test('无过滤条件时返回全部消息', () => {
      messenger.send('agent-a', 'agent-b', 'ping');
      messenger.send('agent-b', 'agent-a', 'pong');
      expect(messenger.history()).toHaveLength(2);
    });

    test('按 from 过滤', () => {
      messenger.send('agent-a', 'agent-b', 'ping');
      messenger.send('agent-b', 'agent-a', 'pong');
      const result = messenger.history({ from: 'agent-a' });
      expect(result).toHaveLength(1);
      expect(result[0]?.action).toBe('ping');
    });

    test('按 action 过滤', () => {
      messenger.send('agent-a', 'agent-b', 'ping');
      messenger.send('agent-a', 'agent-b', 'pong');
      messenger.send('agent-a', 'agent-b', 'ping');
      expect(messenger.history({ action: 'ping' })).toHaveLength(2);
    });

    test('按 to 过滤', () => {
      messenger.send('agent-a', 'agent-b', 'ping');
      messenger.send('agent-a', '*', 'broadcast');
      expect(messenger.history({ to: 'agent-b' })).toHaveLength(1);
    });
  });

  // ── subscriberCount ───────────────────────────────────────────────────────────

  test('subscriberCount 返回正确数量', () => {
    expect(messenger.subscriberCount()).toBe(0);
    messenger.subscribe('a', () => {});
    messenger.subscribe('b', () => {});
    expect(messenger.subscriberCount()).toBe(2);
    messenger.unsubscribe('a');
    expect(messenger.subscriberCount()).toBe(1);
  });
});
