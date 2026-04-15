import { HunyuanBus } from '../hunyuan';
import { DaoSerializer } from '../codec/serializer';
import { DaoRouter } from '../router';
import { DaoSigner } from '../signer';
import { DaoBackpressure } from '../backpressure';
import { DaoMessagePriority, DaoEncoding } from '../types/message';

describe('HunyuanBus', () => {
  let bus: HunyuanBus;
  let serializer: DaoSerializer;
  let router: DaoRouter;
  let signer: DaoSigner;
  let backpressure: DaoBackpressure;

  beforeEach(() => {
    serializer = new DaoSerializer();
    router = new DaoRouter();
    signer = new DaoSigner();
    backpressure = new DaoBackpressure({});
    bus = new HunyuanBus(serializer, router, signer, backpressure, 'test-secret');
  });

  test('should create instance', () => {
    expect(bus).toBeDefined();
  });

  test('should send message', async () => {
    const message = {
      header: {
        id: 'test-message',
        type: 'test',
        source: 'test-source',
        target: 'test-target',
        timestamp: Date.now(),
        priority: 1 as DaoMessagePriority,
        encoding: 'json' as DaoEncoding,
        ttl: 60,
      },
      body: {
        type: 'test',
        data: { test: 'data' },
      },
    };

    // Mock router.route to return some targets
    jest.spyOn(router, 'route').mockReturnValue(['test-target']);

    // Mock backpressure.allow to return true
    jest.spyOn(backpressure, 'allow').mockReturnValue(true);

    // Mock backpressure.record
    jest.spyOn(backpressure, 'record').mockImplementation();

    // Mock serializer.serialize
    jest.spyOn(serializer, 'serialize').mockReturnValue(Buffer.from(JSON.stringify(message)));

    await bus.send(message);

    // Verify the message was sent
    const stats = bus.getStats();
    expect(stats.totalEmitted).toBe(1);
    expect(stats.totalDropped).toBe(0);
  });

  test('should drop message with invalid signature', async () => {
    const message = {
      header: {
        id: 'test-message',
        type: 'test',
        source: 'test-source',
        target: 'test-target',
        timestamp: Date.now(),
        priority: 1 as DaoMessagePriority,
        encoding: 'json' as DaoEncoding,
        ttl: 60,
        signature: 'invalid-signature',
      },
      body: {
        type: 'test',
        data: { test: 'data' },
      },
    };

    // Mock signer.verify to return false
    jest.spyOn(signer, 'verify').mockReturnValue(false);

    await bus.send(message);

    // Verify the message was dropped
    const stats = bus.getStats();
    expect(stats.totalEmitted).toBe(0);
    expect(stats.totalDropped).toBe(1);
  });

  test('should drop message when backpressure not allowed', async () => {
    const message = {
      header: {
        id: 'test-message',
        type: 'test',
        source: 'test-source',
        target: 'test-target',
        timestamp: Date.now(),
        priority: 1 as DaoMessagePriority,
        encoding: 'json' as DaoEncoding,
        ttl: 60,
      },
      body: {
        type: 'test',
        data: { test: 'data' },
      },
    };

    // Mock backpressure.allow to return false
    jest.spyOn(backpressure, 'allow').mockReturnValue(false);

    await bus.send(message);

    // Verify the message was dropped
    const stats = bus.getStats();
    expect(stats.totalEmitted).toBe(0);
    expect(stats.totalDropped).toBe(1);
  });

  test('should drop message when no targets', async () => {
    const message = {
      header: {
        id: 'test-message',
        type: 'test',
        source: 'test-source',
        target: 'test-target',
        timestamp: Date.now(),
        priority: 1 as DaoMessagePriority,
        encoding: 'json' as DaoEncoding,
        ttl: 60,
      },
      body: {
        type: 'test',
        data: { test: 'data' },
      },
    };

    // Mock router.route to return empty array
    jest.spyOn(router, 'route').mockReturnValue([]);

    // Mock backpressure.allow to return true
    jest.spyOn(backpressure, 'allow').mockReturnValue(true);

    // Mock backpressure.record
    jest.spyOn(backpressure, 'record').mockImplementation();

    await bus.send(message);

    // Verify the message was dropped
    const stats = bus.getStats();
    expect(stats.totalEmitted).toBe(0);
    expect(stats.totalDropped).toBe(1);
  });

  test('should subscribe to channel', () => {
    const handler = jest.fn();
    const unsubscribe = bus.subscribe('chong', handler);

    expect(typeof unsubscribe).toBe('function');

    // Test unsubscribe
    unsubscribe();
    // No error should be thrown
  });

  test('should probe target', async () => {
    const latency = await bus.probe('test-target');
    expect(typeof latency).toBe('number');
    expect(latency).toBeGreaterThanOrEqual(0);
  });

  test('should get stats', () => {
    const stats = bus.getStats();
    expect(stats).toBeDefined();
    expect(stats.totalEmitted).toBe(0);
    expect(stats.totalDropped).toBe(0);
    expect(stats.channelsStats).toBeDefined();
  });

  test('should handle empty message', async () => {
    await expect(bus.send({} as unknown as import('../types/message').DaoMessage)).rejects.toThrow();
  });

  test('should handle message without header', async () => {
    const message = {
      body: {
        type: 'test',
        data: { test: 'data' },
      },
    };

    await expect(bus.send(message as unknown as import('../types/message').DaoMessage)).rejects.toThrow();
  });

  test('should handle message without body', async () => {
    const message = {
      header: {
        id: 'test-message',
        type: 'test',
        source: 'test-source',
        target: 'test-target',
        timestamp: Date.now(),
        priority: 1 as DaoMessagePriority,
        encoding: 'json' as DaoEncoding,
        ttl: 60,
      },
    };

    await expect(bus.send(message as unknown as import('../types/message').DaoMessage)).rejects.toThrow();
  });

  test('should handle message with incomplete header', async () => {
    const message = {
      header: {
        id: 'test-message',
        source: 'test-source',
        // Missing target, timestamp, priority, encoding
      },
      body: {
        type: 'test',
        data: { test: 'data' },
      },
    };

    await expect(bus.send(message as unknown as import('../types/message').DaoMessage)).rejects.toThrow();
  });

  test('should handle message with incomplete body', async () => {
    const message = {
      header: {
        id: 'test-message',
        type: 'test',
        source: 'test-source',
        target: 'test-target',
        timestamp: Date.now(),
        priority: 1 as DaoMessagePriority,
        encoding: 'json' as DaoEncoding,
        ttl: 60,
      },
      body: {
        // Missing type
        data: { test: 'data' },
      },
    };

    await expect(bus.send(message as unknown as import('../types/message').DaoMessage)).rejects.toThrow();
  });

  test('should handle subscribe to empty channel', () => {
    const handler = jest.fn();
    const unsubscribe = bus.subscribe('chong', handler);

    expect(typeof unsubscribe).toBe('function');

    // Test unsubscribe
    unsubscribe();
  });

  test('should handle probe empty target', async () => {
    const latency = await bus.probe('');
    expect(typeof latency).toBe('number');
    expect(latency).toBeGreaterThanOrEqual(0);
  });
});
