import { DaoAggregator } from '../stage2-aggregate';
import { SignalLevel, SignalCategory, TrendDirection, FeedbackSource } from '../types';

describe('DaoAggregator', () => {
  let aggregator: DaoAggregator;

  beforeEach(() => {
    aggregator = new DaoAggregator();
  });

  test('should create instance with default window', () => {
    expect(aggregator).toBeDefined();
  });

  test('should create instance with custom window', () => {
    const customAggregator = new DaoAggregator(60000); // 1 minute
    expect(customAggregator).toBeDefined();
  });

  test('should get causal rules', () => {
    const rules = aggregator.getCausalRules();
    expect(rules).toBeDefined();
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);
  });

  test('should set window ms', () => {
    aggregator.setWindowMs(60000); // 1 minute
    // We can't directly check the private property, but we can test the behavior
    const signals = [
      {
        source: 'daoApps' as FeedbackSource,
        timestamp: Date.now() - 30000, // 30 seconds ago
        level: 'info' as SignalLevel,
        category: 'performance' as SignalCategory,
        metrics: { responseTime: 100, baseline: 50 },
        context: 'Test context'
      }
    ];
    const result = aggregator.aggregate(signals, 60000);
    expect(result.signals.length).toBe(1);
  });

  test('should add causal rule', () => {
    const initialRules = aggregator.getCausalRules().length;
    aggregator.addCausalRule({
      pattern: ['performance', 'error'] as [SignalCategory, SignalCategory],
      result: {
        cause: 'performance',
        effect: 'error',
        confidence: 0.6,
        description: '性能问题导致错误'
      }
    });
    const updatedRules = aggregator.getCausalRules().length;
    expect(updatedRules).toBe(initialRules + 1);
  });

  test('should aggregate signals', () => {
    const signal1 = {
      source: 'daoApps' as FeedbackSource,
      timestamp: Date.now() - 10000, // 10 seconds ago
      level: 'info' as SignalLevel,
      category: 'performance' as SignalCategory,
      metrics: { responseTime: 100, baseline: 50 },
      context: 'Test context 1'
    };
    const signal2 = {
      source: 'daoApps' as FeedbackSource,
      timestamp: Date.now() - 5000, // 5 seconds ago
      level: 'warning' as SignalLevel,
      category: 'error' as SignalCategory,
      metrics: { errorRate: 5, errorDurationMs: 30000 },
      context: 'Test context 2'
    };
    const signals = [signal1, signal2];

    const result = aggregator.aggregate(signals);
    expect(result).toBeDefined();
    expect(result.signals).toBeDefined();
    expect(result.aggregateScore).toBeDefined();
    expect(result.trends).toBeDefined();
    expect(result.causalChains).toBeDefined();
    expect(result.recommendedAction).toBeDefined();
  });

  test('should deduplicate signals', () => {
    const now = Date.now();
    const signals = [
      {
        source: 'daoApps' as FeedbackSource,
        timestamp: now - 10000, // 10 seconds ago
        level: 'info' as SignalLevel,
        category: 'performance' as SignalCategory,
        metrics: { responseTime: 100, baseline: 50 },
        context: 'Test context 1'
      },
      {
        source: 'daoApps' as FeedbackSource,
        timestamp: now - 5000, // 5 seconds ago (newer)
        level: 'warning' as SignalLevel,
        category: 'performance' as SignalCategory, // Same source and category
        metrics: { responseTime: 200, baseline: 50 },
        context: 'Test context 2'
      }
    ];

    const result = aggregator.aggregate(signals);
    expect(result.signals.length).toBe(1); // Should only have the newer one
    expect(result.signals[0]).toBeDefined();
    if (result.signals[0]) {
      expect(result.signals[0].context).toBe('Test context 2');
    }
  });

  test('should identify trends', () => {
    const now = Date.now();
    const signal1 = {
      source: 'daoApps' as FeedbackSource,
      timestamp: now - 20000, // 20 seconds ago
      level: 'info' as SignalLevel,
      category: 'performance' as SignalCategory,
      metrics: { responseTime: 100, baseline: 50 },
      context: 'Test context 1'
    };
    const signal2 = {
      source: 'daoPages' as FeedbackSource, // Different source to avoid deduplication
      timestamp: now - 10000, // 10 seconds ago
      level: 'warning' as SignalLevel,
      category: 'performance' as SignalCategory,
      metrics: { responseTime: 150, baseline: 50 },
      context: 'Test context 2'
    };
    const signal3 = {
      source: 'daoDocs' as FeedbackSource, // Different source to avoid deduplication
      timestamp: now, // Now
      level: 'critical' as SignalLevel,
      category: 'performance' as SignalCategory,
      metrics: { responseTime: 200, baseline: 50 },
      context: 'Test context 3'
    };
    const signals = [signal1, signal2, signal3];

    const result = aggregator.aggregate(signals);
    expect(result.trends).toBeDefined();
    expect(result.trends.performance).toBe('rising' as TrendDirection);
  });

  test('should match causal chains', () => {
    const signal1 = {
      source: 'daoApps' as FeedbackSource,
      timestamp: Date.now() - 10000, // 10 seconds ago
      level: 'info' as SignalLevel,
      category: 'error' as SignalCategory,
      metrics: { errorRate: 5, errorDurationMs: 30000 },
      context: 'Test context 1'
    };
    const signal2 = {
      source: 'daoApps' as FeedbackSource,
      timestamp: Date.now() - 5000, // 5 seconds ago
      level: 'warning' as SignalLevel,
      category: 'resource' as SignalCategory,
      metrics: { usagePercent: 85 },
      context: 'Test context 2'
    };
    const signals = [signal1, signal2];

    const result = aggregator.aggregate(signals);
    expect(result.causalChains).toBeDefined();
    expect(result.causalChains.length).toBeGreaterThan(0);
  });

  test('should generate recommendation', () => {
    const signal1 = {
      source: 'daoApps' as FeedbackSource,
      timestamp: Date.now() - 10000, // 10 seconds ago
      level: 'critical' as SignalLevel,
      category: 'error' as SignalCategory,
      metrics: { errorRate: 20, errorDurationMs: 60000 },
      context: 'Test context 1'
    };
    const signal2 = {
      source: 'daoApps' as FeedbackSource,
      timestamp: Date.now() - 5000, // 5 seconds ago
      level: 'critical' as SignalLevel,
      category: 'resource' as SignalCategory,
      metrics: { usagePercent: 95 },
      context: 'Test context 2'
    };
    const signals = [signal1, signal2];

    const result = aggregator.aggregate(signals);
    expect(result.recommendedAction).toBeDefined();
    expect(typeof result.recommendedAction).toBe('string');
  });

  test('should return undefined recommendation for high score', () => {
    const signal = {
      source: 'daoApps' as FeedbackSource,
      timestamp: Date.now() - 10000, // 10 seconds ago
      level: 'opportunity' as SignalLevel,
      category: 'performance' as SignalCategory,
      metrics: { responseTime: 50, baseline: 100 },
      context: 'Test context 1'
    };
    const signals = [signal];

    const result = aggregator.aggregate(signals);
    expect(result.recommendedAction).toBeUndefined();
  });

  test('should handle empty signals', () => {
    const result = aggregator.aggregate([]);
    expect(result).toBeDefined();
    expect(result.signals.length).toBe(0);
    expect(result.aggregateScore).toBe(100);
  });

  test('should handle signals outside window', () => {
    const signal = {
      source: 'daoApps' as FeedbackSource,
      timestamp: Date.now() - 600000, // 10 minutes ago (outside default window)
      level: 'info' as SignalLevel,
      category: 'performance' as SignalCategory,
      metrics: { responseTime: 100, baseline: 50 },
      context: 'Test context 1'
    };
    const signals = [signal];

    const result = aggregator.aggregate(signals);
    expect(result.signals.length).toBe(0);
    expect(result.aggregateScore).toBe(100);
  });
});