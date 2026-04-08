import { DaoChronos, daoGetChronos } from '../chronos';

describe('DaoChronos', () => {
  test('should create instance with default config', () => {
    const chronos = new DaoChronos();
    expect(chronos).toBeDefined();
  });

  test('should create instance with custom config', () => {
    const chronos = new DaoChronos({
      source: 'monotonic',
      tickInterval: 100,
    });
    expect(chronos).toBeDefined();
  });

  test('should get current time point', () => {
    const chronos = new DaoChronos();
    const point = chronos.now();
    expect(point).toBeDefined();
    expect(typeof point.value).toBe('number');
    expect(point.source).toBe('system');
    expect(typeof point.epoch).toBe('number');
  });

  test('should calculate time since epoch', () => {
    const chronos = new DaoChronos();
    const epoch = Date.now();
    const since = chronos.since(epoch);
    expect(typeof since).toBe('number');
    expect(since).toBeGreaterThanOrEqual(0);
  });

  test('should calculate elapsed time from point', () => {
    const chronos = new DaoChronos();
    const point = chronos.now();
    const elapsed = chronos.elapsed(point);
    expect(typeof elapsed).toBe('number');
    expect(elapsed).toBeGreaterThanOrEqual(0);
  });

  test('should calculate time between two points', () => {
    const chronos = new DaoChronos();
    const point1 = chronos.now();
    const point2 = chronos.now();
    const between = chronos.between(point1, point2);
    expect(typeof between).toBe('number');
    expect(between).toBeGreaterThanOrEqual(0);
  });

  test('should register and unregister sync listener', () => {
    const chronos = new DaoChronos({ tickInterval: 50 });
    let callCount = 0;
    const listener = jest.fn(() => callCount++);
    
    const unsubscribe = chronos.sync(listener);
    expect(typeof unsubscribe).toBe('function');
    
    // Wait for a few ticks
    return new Promise((resolve) => {
      setTimeout(() => {
        unsubscribe();
        expect(callCount).toBeGreaterThan(0);
        resolve(null);
      }, 100);
    });
  });
});

describe('daoGetChronos', () => {
  test('should return singleton instance', () => {
    const instance1 = daoGetChronos();
    const instance2 = daoGetChronos();
    expect(instance1).toBe(instance2);
  });

  test('should return instance with custom config on first call', () => {
    // Clear singleton instance
    (daoGetChronos as any).instance = null;
    
    const config = {
      tickInterval: 1000,
    };

    const instance = daoGetChronos(config);
    expect(instance).toBeDefined();
  });
});
