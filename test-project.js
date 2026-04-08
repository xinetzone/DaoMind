// 测试 DaoMind 项目的核心功能
import { DaoBaseAgent } from './packages/daoAgents/src/base.js';
import { daoContainer } from './packages/daoAnything/src/container.js';

// 测试 1: 创建一个简单的代理类
class TestAgent extends DaoBaseAgent {
  agentType = 'test';
  capabilities = [
    {
      name: 'test-capability',
      version: '1.0.0',
      description: '测试能力'
    }
  ];

  async execute(action, payload) {
    console.log(`执行动作: ${action}`, payload);
    return { success: true, result: '测试执行成功' };
  }
}

// 测试 2: 注册一个模块
const testModule = {
  name: 'test-module',
  version: '1.0.0',
  path: './packages/daoAgents/dist/index.js'
};

async function runTests() {
  console.log('=== 开始测试 DaoMind 项目 ===\n');

  // 测试 1: 创建并使用代理
  console.log('测试 1: 创建并使用代理');
  const agent = new TestAgent('test-agent-1');
  console.log('代理创建成功:', agent.id);
  console.log('代理类型:', agent.agentType);
  console.log('代理状态:', agent.state);
  
  await agent.initialize();
  console.log('代理初始化后状态:', agent.state);
  
  await agent.activate();
  console.log('代理激活后状态:', agent.state);
  
  const result = await agent.execute('test-action', { message: 'Hello DaoMind' });
  console.log('执行动作结果:', result);
  
  await agent.rest();
  console.log('代理休息后状态:', agent.state);
  
  await agent.terminate();
  console.log('代理终止后状态:', agent.state);
  console.log();

  // 测试 2: 注册和管理模块
  console.log('测试 2: 注册和管理模块');
  daoContainer.register(testModule);
  console.log('模块注册成功:', testModule.name);
  
  const moduleInfo = daoContainer.getModule(testModule.name);
  console.log('模块信息:', moduleInfo);
  
  await daoContainer.initialize(testModule.name);
  console.log('模块初始化成功');
  
  await daoContainer.activate(testModule.name);
  console.log('模块激活成功');
  
  const modules = daoContainer.listModules();
  console.log('所有模块:', modules);
  console.log();

  console.log('=== 测试完成 ===');
}

runTests().catch(console.error);
