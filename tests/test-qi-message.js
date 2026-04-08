// 测试 DaoQi 消息传递系统
console.log('开始加载 DaoQi 模块...');

import { HunyuanBus, DaoSerializer, DaoRouter, DaoSigner, DaoBackpressure, TianQiChannel, DiQiChannel, RenQiChannel } from './packages/daoQi/dist/index.js';

console.log('DaoQi 模块加载成功');

async function testQiMessageSystem() {
  try {
    console.log('=== 开始测试 DaoQi 消息传递系统 ===\n');

    // 测试 1: 创建混元气总线
    console.log('测试 1: 创建混元气总线');
    const serializer = new DaoSerializer();
    console.log('  - DaoSerializer 创建成功');
    
    const router = new DaoRouter();
    console.log('  - DaoRouter 创建成功');
    
    const signer = new DaoSigner();
    console.log('  - DaoSigner 创建成功');
    
    const backpressure = new DaoBackpressure();
    console.log('  - DaoBackpressure 创建成功');
    
    const secretKey = 'test-secret-key';

    const bus = new HunyuanBus(serializer, router, signer, backpressure, secretKey);
    console.log('混元气总线创建成功');

    // 测试 2: 监听总线消息
    console.log('\n测试 2: 监听总线消息');
    bus.on('message', (message, buffer, targets) => {
      console.log('总线收到消息:', message);
      console.log('目标通道:', targets);
    });
    console.log('总线消息监听器设置成功');

    // 测试 3: 创建四气通道
    console.log('\n测试 3: 创建四气通道');
    const tianQiChannel = new TianQiChannel(bus);
    console.log('  - TianQiChannel 创建成功');
    
    const diQiChannel = new DiQiChannel(bus);
    console.log('  - DiQiChannel 创建成功');
    
    const renQiChannel = new RenQiChannel(bus);
    console.log('  - RenQiChannel 创建成功');
    console.log('四气通道创建成功');

    // 测试 6: 通过总线发送消息
    console.log('\n测试 6: 通过总线发送消息');
    await bus.send({
      header: {
        id: 'bus-message-1',
        source: 'bus-source',
        target: 'chong',
        type: 'test/bus',
        priority: 1,
        ttl: 1000,
        timestamp: Date.now(),
        encoding: 'json'
      },
      body: {
        type: 'test/bus',
        data: {
          message: 'Hello from Hunyuan Bus',
          value: 99
        }
      }
    });
    console.log('总线消息发送成功');

    // 测试 7: 获取总线统计信息
    console.log('\n测试 7: 获取总线统计信息');
    const stats = bus.getStats();
    console.log('总线统计信息:', stats);

    console.log('\n=== 测试完成 ===');
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    console.error('错误堆栈:', error.stack);
  }
}

console.log('开始执行测试...');
testQiMessageSystem().catch(console.error);
console.log('测试函数已调用');

