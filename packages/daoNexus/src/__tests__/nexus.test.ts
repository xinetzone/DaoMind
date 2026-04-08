import { daoNexus, DaoNexus } from '../nexus';
import { daoServiceDiscovery } from '../service-discovery';

interface RequestResult {
  target: string;
  status: string;
  latency?: number;
}

describe('DaoNexus', () => {
  let nexus: DaoNexus;

  beforeEach(() => {
    nexus = new DaoNexus();
    // Reset metrics before each test
    nexus.resetMetrics();
  });

  test('should create instance', () => {
    expect(nexus).toBeDefined();
  });

  test('should get metrics', () => {
    const metrics = nexus.getMetrics();
    expect(metrics).toBeDefined();
    expect(metrics.totalRequests).toBe(0);
    expect(metrics.successCount).toBe(0);
    expect(metrics.failureCount).toBe(0);
    expect(metrics.avgLatencyMs).toBe(0);
  });

  test('should reset metrics', () => {
    // First, make a request to populate metrics
    const request = {
      path: '/test',
      payload: { test: 'data' },
    };

    // We expect this to fail since no service is registered
    expect(nexus.handleRequest(request)).rejects.toThrow(/未找到服务/);

    // Reset metrics
    nexus.resetMetrics();

    // Verify metrics are reset
    const metrics = nexus.getMetrics();
    expect(metrics.totalRequests).toBe(0);
    expect(metrics.successCount).toBe(0);
    expect(metrics.failureCount).toBe(0);
    expect(metrics.avgLatencyMs).toBe(0);
  });

  test('should get connection manager', () => {
    const connectionManager = nexus.connectionManager;
    expect(connectionManager).toBeDefined();
  });

  test('should get router', () => {
    const router = nexus.router;
    expect(router).toBeDefined();
  });

  test('should get load balancer', () => {
    const loadBalancer = nexus.loadBalancer;
    expect(loadBalancer).toBeDefined();
  });

  test('should get service discovery', () => {
    const serviceDiscovery = nexus.serviceDiscovery;
    expect(serviceDiscovery).toBeDefined();
  });
});

describe('daoNexus singleton', () => {
  test('should be defined', () => {
    expect(daoNexus).toBeDefined();
  });

  test('should have consistent instance', () => {
    expect(daoNexus).toBeInstanceOf(DaoNexus);
  });

  test('should handle request with registered service', async () => {
    // Register a test service
    daoServiceDiscovery.register({
      id: 'test-service-1',
      name: 'test',
      version: '1.0.0',
      endpoint: 'http://localhost:3000',
    });

    // We expect this to succeed since connection manager always creates a connection
    const result = await daoNexus.handleRequest({
      path: 'test/path',
      payload: { test: 'data' },
    });

    // Verify the result
    expect(result).toBeDefined();
    expect((result as RequestResult).target).toBe('http://localhost:3000');
    expect((result as RequestResult).status).toBe('sent');

    // Verify metrics were updated
    const metrics = daoNexus.getMetrics();
    expect(metrics.totalRequests).toBe(1);
    expect(metrics.successCount).toBe(1);
  });

  test('should handle empty request', async () => {
    await expect(daoNexus.handleRequest({ path: '', payload: {} })).rejects.toThrow();
  });

  test('should handle request with empty path', async () => {
    await expect(daoNexus.handleRequest({ path: '', payload: {} })).rejects.toThrow(/未找到服务/);
  });

  test('should handle request with null payload', async () => {
    // Register a test service
    daoServiceDiscovery.register({
      id: 'test-service-2',
      name: 'test',
      version: '1.0.0',
      endpoint: 'http://localhost:3000',
    });

    // We expect this to succeed since connection manager can handle null payload
    const result = await daoNexus.handleRequest({ path: 'test/path', payload: null });

    // Verify the result
    expect(result).toBeDefined();
    expect((result as RequestResult).target).toBe('http://localhost:3000');
    expect((result as RequestResult).status).toBe('sent');
  });

  test('should handle request with undefined payload', async () => {
    // Register a test service
    daoServiceDiscovery.register({
      id: 'test-service-3',
      name: 'test',
      version: '1.0.0',
      endpoint: 'http://localhost:3000',
    });

    // We expect this to succeed since connection manager can handle undefined payload
    const result = await daoNexus.handleRequest({ path: 'test/path', payload: undefined });

    // Verify the result
    expect(result).toBeDefined();
    expect((result as RequestResult).target).toBe('http://localhost:3000');
    expect((result as RequestResult).status).toBe('sent');
  });
});
