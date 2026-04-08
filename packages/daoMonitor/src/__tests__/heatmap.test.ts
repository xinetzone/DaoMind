import { DaoHeatmapEngine } from '../heatmap';

describe('DaoHeatmapEngine', () => {
  let engine: DaoHeatmapEngine;

  beforeEach(() => {
    engine = new DaoHeatmapEngine(10); // Small capacity for testing
  });

  test('should create instance with default capacity', () => {
    const defaultEngine = new DaoHeatmapEngine();
    expect(defaultEngine).toBeDefined();
  });

  test('should create instance with custom capacity', () => {
    const customEngine = new DaoHeatmapEngine(5);
    expect(customEngine).toBeDefined();
  });

  test('should record channel data', () => {
    engine.record('tian', 'node1', 'node2', {
      rate: 100,
      latency: 10,
      errorRate: 0.5,
    });

    const heatmap = engine.getHeatmap();
    expect(heatmap.length).toBe(1);
    expect(heatmap[0]?.channelType).toBe('tian');
    expect(heatmap[0]?.sourceNode).toBe('node1');
    expect(heatmap[0]?.targetNode).toBe('node2');
    expect(heatmap[0]?.messageRate).toBe(100);
    expect(heatmap[0]?.avgLatency).toBe(10);
    expect(heatmap[0]?.errorRate).toBe(0.5);
  });

  test('should handle buffer overflow', () => {
    // Fill the buffer
    for (let i = 0; i < 10; i++) {
      engine.record('tian', `node${i}`, `node${i + 1}`, {
        rate: i * 10,
        latency: 10,
        errorRate: 0.5,
      });
    }

    // Add one more to cause overflow
    engine.record('tian', 'node10', 'node11', {
      rate: 100,
      latency: 10,
      errorRate: 0.5,
    });

    const heatmap = engine.getHeatmap();
    expect(heatmap.length).toBe(10); // Should still have 10 items
  });

  test('should get heatmap with time window', async () => {
    // Record some data
    engine.record('tian', 'node1', 'node2', {
      rate: 100,
      latency: 10,
      errorRate: 0.5,
    });

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    // Record more data
    engine.record('di', 'node3', 'node4', {
      rate: 50,
      latency: 20,
      errorRate: 1.0,
    });

    const heatmap = engine.getHeatmap(50); // Only data from last 50ms
    expect(heatmap.length).toBe(1);
    expect(heatmap[0]?.channelType).toBe('di');
  });

  test('should get channel summary', () => {
    // Record data for different channels
    engine.record('tian', 'node1', 'node2', {
      rate: 100,
      latency: 10,
      errorRate: 0.5,
    });

    engine.record('tian', 'node3', 'node4', {
      rate: 200,
      latency: 20,
      errorRate: 1.0,
    });

    engine.record('di', 'node5', 'node6', {
      rate: 50,
      latency: 15,
      errorRate: 0.25,
    });

    const tianSummary = engine.getChannelSummary('tian');
    expect(tianSummary.totalRate).toBe(300);
    expect(tianSummary.avgLatency).toBe(15);
    expect(tianSummary.errorRate).toBe(0.75);
    expect(tianSummary.activeFlows).toBe(2);

    const diSummary = engine.getChannelSummary('di');
    expect(diSummary.totalRate).toBe(50);
    expect(diSummary.avgLatency).toBe(15);
    expect(diSummary.errorRate).toBe(0.25);
    expect(diSummary.activeFlows).toBe(1);
  });

  test('should get heat level', () => {
    expect(DaoHeatmapEngine.getHeatLevel(5)).toBe('cold');
    expect(DaoHeatmapEngine.getHeatLevel(30)).toBe('warm');
    expect(DaoHeatmapEngine.getHeatLevel(150)).toBe('hot');
    expect(DaoHeatmapEngine.getHeatLevel(250)).toBe('blazing');
  });

  test('should return empty heatmap when no data', () => {
    const heatmap = engine.getHeatmap();
    expect(heatmap.length).toBe(0);
  });

  test('should return empty summary when no data for channel', () => {
    const summary = engine.getChannelSummary('tian');
    expect(summary.totalRate).toBe(0);
    expect(summary.avgLatency).toBe(0);
    expect(summary.errorRate).toBe(0);
    expect(summary.activeFlows).toBe(0);
  });
});
