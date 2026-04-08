import { daoTimer, DaoTimer } from '../timer';

describe('DaoTimer', () => {
  let timer: DaoTimer;

  beforeEach(() => {
    timer = new DaoTimer();
  });

  test('should create instance', () => {
    expect(timer).toBeDefined();
  });

  test('should set and clear interval', (done) => {
    let count = 0;
    const handle = timer.setInterval(() => {
      count++;
      if (count === 2) {
        timer.clearInterval(handle);
        done();
      }
    }, {
      interval: 10,
    });

    expect(handle).toBeDefined();
  });

  test('should set interval with immediate execution', (done) => {
    let count = 0;
    const handle = timer.setInterval(() => {
      count++;
      if (count === 2) {
        timer.clearInterval(handle);
        done();
      }
    }, {
      interval: 100,
      immediate: true,
    });

    expect(handle).toBeDefined();
  });

  test('should set interval with max fires', (done) => {
    let count = 0;
    timer.setInterval(() => {
      count++;
      if (count === 3) {
        // Should stop after 3 fires
        setTimeout(() => {
          expect(count).toBe(3);
          done();
        }, 50);
      }
    }, {
      interval: 10,
      maxFires: 3,
    });
  });

  test('should handle callback errors silently', (done) => {
    let count = 0;
    const handle = timer.setInterval(() => {
      count++;
      if (count === 2) {
        timer.clearInterval(handle);
        done();
      }
      throw new Error('Test error');
    }, {
      interval: 10,
    });

    expect(handle).toBeDefined();
  });

  test('should set and clear timeout', (done) => {
    let called = false;
    const handle = timer.setTimeout(() => {
      called = true;
      done();
    }, 10);

    expect(handle).toBeDefined();
  });

  test('should clear timeout before execution', (done) => {
    let called = false;
    const handle = timer.setTimeout(() => {
      called = true;
    }, 50);

    timer.clearTimeout(handle);

    setTimeout(() => {
      expect(called).toBe(false);
      done();
    }, 100);
  });

  test('should handle timeout callback errors silently', (done) => {
    const handle = timer.setTimeout(() => {
      throw new Error('Test error');
    }, 10);

    setTimeout(() => {
      done();
    }, 50);
  });
});

describe('daoTimer singleton', () => {
  test('should be defined', () => {
    expect(daoTimer).toBeDefined();
  });

  test('should have consistent instance', () => {
    expect(daoTimer).toBeInstanceOf(DaoTimer);
  });
});
