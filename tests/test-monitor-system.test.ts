// 测试 DaoMonitor 监控系统
import { 
  DaoHeatmapEngine, 
  DaoVectorField, 
  DaoYinYangGaugeEngine, 
  DaoAlertEngine, 
  DaoDiagnosisEngine, 
  DaoSnapshotAggregator 
} from '@daomind/monitor';

async function testMonitorSystem() {
  try {
    console.log('=== 开始测试 DaoMonitor 监控系统 ===\n');

    // 测试 1: 创建阴阳仪表盘引擎
    console.log('测试 1: 创建阴阳仪表盘引擎');
    const gaugeEngine = new DaoYinYangGaugeEngine();
    console.log('阴阳仪表盘引擎创建成功');

    // 测试 2: 创建热力图引擎
    console.log('\n测试 2: 创建热力图引擎');
    const heatmapEngine = new DaoHeatmapEngine();
    console.log('热力图引擎创建成功');

    // 测试 3: 创建向量场
    console.log('\n测试 3: 创建向量场');
    const vectorField = new DaoVectorField();
    console.log('向量场创建成功');

    // 测试 4: 创建告警引擎
    console.log('\n测试 4: 创建告警引擎');
    const alertEngine = new DaoAlertEngine();
    console.log('告警引擎创建成功');

    // 测试 5: 创建诊断引擎
    console.log('\n测试 5: 创建诊断引擎');
    const diagnosisEngine = new DaoDiagnosisEngine();
    console.log('诊断引擎创建成功');

    // 测试 6: 创建快照聚合器
    console.log('\n测试 6: 创建快照聚合器');
    const snapshotAggregator = new DaoSnapshotAggregator(
      heatmapEngine,
      vectorField,
      gaugeEngine,
      alertEngine,
      diagnosisEngine
    );
    console.log('快照聚合器创建成功');

    // 测试 7: 使用阴阳仪表盘引擎
    console.log('\n测试 7: 使用阴阳仪表盘引擎');
    // 模拟系统健康状态数据
    let gaugeStatus;
    for (let i = 0; i < 10; i++) {
      const yinValue = Math.random() * 100;
      const yangValue = Math.random() * 100;
      const idealRatio = 1.0; // 理想比例为 1:1
      gaugeStatus = gaugeEngine.updatePair('system_health', yinValue, yangValue, idealRatio);
    }
    
    console.log('系统健康状态:', gaugeStatus);
    
    // 测试 7.1: 获取所有仪表盘
    console.log('\n测试 7.1: 获取所有仪表盘');
    const allGauges = gaugeEngine.getAllGauges();
    console.log('所有仪表盘:', allGauges);
    
    // 测试 7.2: 获取不平衡的仪表盘
    console.log('\n测试 7.2: 获取不平衡的仪表盘');
    const imbalancedPairs = gaugeEngine.getImbalancedPairs();
    console.log('不平衡的仪表盘:', imbalancedPairs);

    // 测试 8: 使用热力图引擎
    console.log('\n测试 8: 使用热力图引擎');
    // 模拟系统热点数据
    const channelTypes = ['tian', 'di', 'ren', 'chong'];
    for (let i = 0; i < 10; i++) {
      const channelType = channelTypes[Math.floor(Math.random() * channelTypes.length)];
      const source = `source-${Math.floor(Math.random() * 5)}`;
      const target = `target-${Math.floor(Math.random() * 5)}`;
      const metrics = {
        rate: Math.random() * 300, // 消息速率
        latency: Math.random() * 100, // 延迟
        errorRate: Math.random() * 0.1 // 错误率
      };
      heatmapEngine.record(channelType as 'tian' | 'di' | 'ren' | 'chong', source, target, metrics);
    }
    
    const heatmapData = heatmapEngine.getHeatmap();
    console.log('系统热力图数据:', heatmapData);
    
    // 测试 8.1: 获取通道摘要
    console.log('\n测试 8.1: 获取通道摘要');
    const chongSummary = heatmapEngine.getChannelSummary('chong');
    console.log('冲气通道摘要:', chongSummary);

    // 测试 9: 使用向量场
    console.log('\n测试 9: 使用向量场');
    // 模拟系统流量数据
    for (let i = 0; i < 10; i++) {
      const from = `node-${Math.floor(Math.random() * 5)}`;
      const to = `node-${Math.floor(Math.random() * 5)}`;
      if (from !== to) { // 避免自己到自己的流量
      const directions = ['downstream', 'upstream', 'lateral', 'balancing'] as const;
        const magnitude = Math.random() * 100;
        const direction = directions[Math.floor(Math.random() * directions.length)]!;
        vectorField.recordFlow(from, to, magnitude, direction);
      }
    }
    
    const vectorData = vectorField.getVectors();
    console.log('系统流量向量场数据:', vectorData);
    
    // 测试 9.1: 获取节点入站流量
    console.log('\n测试 9.1: 获取节点入站流量');
    const inboundFlow = vectorField.getNodeInbound('node-0');
    console.log('node-0 的入站流量:', inboundFlow);
    
    // 测试 9.2: 获取节点出站流量
    console.log('\n测试 9.2: 获取节点出站流量');
    const outboundFlow = vectorField.getNodeOutbound('node-0');
    console.log('node-0 的出站流量:', outboundFlow);
    
    // 测试 9.3: 获取热点
    console.log('\n测试 9.3: 获取热点');
    const hotspots = vectorField.getHotspots(5);
    console.log('系统热点:', hotspots);

    // 测试 10: 使用告警引擎
    console.log('\n测试 10: 使用告警引擎');
    // 设置告警规则
    const customRules = [
      {
        condition: (metrics: { rate: number; latency: number; errorRate: number }) => metrics.rate > 200,
        severity: 'critical' as const,
        reason: 'congestion' as const,
        messageTemplate: '系统负载过高：消息速率 {rate} msg/s 超过阈值 200'
      },
      {
        condition: (metrics: { rate: number; latency: number; errorRate: number }) => metrics.latency > 50,
        severity: 'warning' as const,
        reason: 'latency_spike' as const,
        messageTemplate: '系统延迟过高：延迟 {latency}ms 超过阈值 50'
      }
    ];
    alertEngine.setRules(customRules);
    console.log('告警规则设置成功');

    // 模拟高负载情况
    console.log('\n测试 10.1: 检查高负载情况');
    const highLoadAlert = alertEngine.check('chong', 'source-0', 'target-0', {
      rate: 250,
      latency: 30,
      errorRate: 0.01
    });
    console.log('高负载告警检查结果:', highLoadAlert);

    // 模拟高延迟情况
    console.log('\n测试 10.2: 检查高延迟情况');
    const highLatencyAlert = alertEngine.check('chong', 'source-1', 'target-1', {
      rate: 100,
      latency: 60,
      errorRate: 0.01
    });
    console.log('高延迟告警检查结果:', highLatencyAlert);

    // 测试 10.3: 获取活跃告警
    console.log('\n测试 10.3: 获取活跃告警');
    const activeAlerts = alertEngine.getActiveAlerts();
    console.log('活跃告警:', activeAlerts);

    // 测试 11: 使用诊断引擎
    console.log('\n测试 11: 使用诊断引擎');
    // 模拟系统诊断数据
    const diagnosisData = {
      system: {
        cpu: 75,
        memory: 60,
        disk: 45
      },
      network: {
        latency: 15,
        throughput: 100
      },
      services: {
        api: 'healthy',
        database: 'healthy',
        cache: 'warning'
      }
    };
    
    const diagnosis = diagnosisEngine.diagnose('test-node', 150, 120);
    console.log('系统诊断结果:', diagnosis);

    // 测试 12: 使用快照聚合器
    console.log('\n测试 12: 使用快照聚合器');
    // 生成系统快照
    const snapshot = snapshotAggregator.capture();
    console.log('系统快照生成成功:', snapshot);

    // 测试 13: 获取快照历史
    console.log('\n测试 13: 获取快照历史');
    const snapshotHistory = snapshotAggregator.getHistory(5);
    console.log('快照历史数量:', snapshotHistory.length);

    // 测试 14: 获取最后一个快照
    console.log('\n测试 14: 获取最后一个快照');
    const lastSnapshot = snapshotAggregator.getLastSnapshot();
    console.log('最后一个快照:', lastSnapshot);

    console.log('\n=== 测试完成 ===');
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    console.error('错误堆栈:', (error as Error).stack);
  }
}

test('DaoMonitor 监控系统集成测试', async () => {
  await testMonitorSystem();
}, 30000);
