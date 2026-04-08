import { DaoPerceiver, PerceiveConfig } from '../stage1-perceive';

describe('DaoPerceiver', () => {
  let perceiver: DaoPerceiver;

  beforeEach(() => {
    perceiver = new DaoPerceiver();
  });

  test('should create instance with default config', () => {
    expect(perceiver).toBeDefined();
  });

  test('should create instance with custom config', () => {
    const customConfig: Partial<PerceiveConfig> = {
      thresholds: {
        performance: { responseTimeMultiplier: 1.5 },
        error: { ratePercent: 10, durationMs: 30000 },
        resource: { usagePercent: 80 },
        behavior: { distributionShift: 0.5 },
        demand: { uncoveredTriggersPerHour: 10 },
      },
    };

    const customPerceiver = new DaoPerceiver(customConfig);
    expect(customPerceiver).toBeDefined();
    expect(customPerceiver.getConfig().thresholds.performance.responseTimeMultiplier).toBe(1.5);
  });

  test('should capture feedback signal', () => {
    const signal = perceiver.capture(
      'daoApps',
      'performance',
      { responseTime: 100, baseline: 50 },
      'Test context'
    );

    expect(signal).toBeDefined();
    expect(signal.source).toBe('daoApps');
    expect(signal.category).toBe('performance');
    expect(signal.metrics.responseTime).toBe(100);
    expect(signal.metrics.baseline).toBe(50);
    expect(signal.context).toBe('Test context');
  });

  test('should evaluate performance signal level', () => {
    // Test critical level
    let level = perceiver.evaluateLevel('performance', {
      responseTime: 1200,
      baseline: 200,
    });
    expect(level).toBe('critical');

    // Test warning level
    level = perceiver.evaluateLevel('performance', {
      responseTime: 800,
      baseline: 200,
    });
    expect(level).toBe('warning');

    // Test info level
    level = perceiver.evaluateLevel('performance', {
      responseTime: 400,
      baseline: 200,
    });
    expect(level).toBe('info');

    // Test opportunity level
    level = perceiver.evaluateLevel('performance', {
      responseTime: 100,
      baseline: 200,
    });
    expect(level).toBe('opportunity');
  });

  test('should evaluate error signal level', () => {
    // Test critical level
    let level = perceiver.evaluateLevel('error', {
      errorRate: 15,
      errorDurationMs: 60000,
    });
    expect(level).toBe('critical');

    // Test warning level
    level = perceiver.evaluateLevel('error', {
      errorRate: 10,
      errorDurationMs: 60000,
    });
    expect(level).toBe('warning');

    // Test info level
    level = perceiver.evaluateLevel('error', {
      errorRate: 5,
      errorDurationMs: 60000,
    });
    expect(level).toBe('info');

    // Test opportunity level
    level = perceiver.evaluateLevel('error', {
      errorRate: 2,
      errorDurationMs: 30000,
    });
    expect(level).toBe('opportunity');
  });

  test('should evaluate resource signal level', () => {
    // Test critical level
    let level = perceiver.evaluateLevel('resource', {
      usagePercent: 99,
    });
    expect(level).toBe('critical');

    // Test warning level
    level = perceiver.evaluateLevel('resource', {
      usagePercent: 95,
    });
    expect(level).toBe('warning');

    // Test info level
    level = perceiver.evaluateLevel('resource', {
      usagePercent: 85,
    });
    expect(level).toBe('info');

    // Test opportunity level
    level = perceiver.evaluateLevel('resource', {
      usagePercent: 50,
    });
    expect(level).toBe('opportunity');
  });

  test('should evaluate behavior signal level', () => {
    // Test critical level
    let level = perceiver.evaluateLevel('behavior', {
      distributionShift: 60,
    });
    expect(level).toBe('critical');

    // Test warning level
    level = perceiver.evaluateLevel('behavior', {
      distributionShift: 45,
    });
    expect(level).toBe('warning');

    // Test info level
    level = perceiver.evaluateLevel('behavior', {
      distributionShift: 30,
    });
    expect(level).toBe('info');

    // Test opportunity level
    level = perceiver.evaluateLevel('behavior', {
      distributionShift: 15,
    });
    expect(level).toBe('opportunity');
  });

  test('should evaluate demand signal level', () => {
    // Test critical level
    let level = perceiver.evaluateLevel('demand', {
      uncoveredTriggersPerHour: 50,
    });
    expect(level).toBe('critical');

    // Test warning level
    level = perceiver.evaluateLevel('demand', {
      uncoveredTriggersPerHour: 30,
    });
    expect(level).toBe('warning');

    // Test info level
    level = perceiver.evaluateLevel('demand', {
      uncoveredTriggersPerHour: 10,
    });
    expect(level).toBe('info');

    // Test opportunity level
    level = perceiver.evaluateLevel('demand', {
      uncoveredTriggersPerHour: 5,
    });
    expect(level).toBe('opportunity');
  });

  test('should return opportunity level for default case', () => {
    const level = perceiver.evaluateLevel('performance', {});
    expect(level).toBe('opportunity');
  });

  test('should update config', () => {
    const newConfig: Partial<PerceiveConfig> = {
      thresholds: {
        performance: { responseTimeMultiplier: 3 },
        error: { ratePercent: 5, durationMs: 60000 },
        resource: { usagePercent: 80 },
        behavior: { distributionShift: 0.5 },
        demand: { uncoveredTriggersPerHour: 10 },
      },
    };

    perceiver.setConfig(newConfig);
    expect(perceiver.getConfig().thresholds.performance.responseTimeMultiplier).toBe(3);
  });

  test('should get current config', () => {
    const config = perceiver.getConfig();
    expect(config).toBeDefined();
    expect(config.thresholds).toBeDefined();
  });
});
