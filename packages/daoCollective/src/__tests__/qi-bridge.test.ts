/**
 * DaoQiAgentBridge 测试
 * 验证 HunyuanBus（三才路由 × 中气调和 四维通道）与 daoAgentMessenger（Agent 虚空通信）的桥接行为
 */

import { daoNothingVoid } from '@daomind/nothing';
import { daoAgentMessenger, TaskAgent } from '@daomind/agents';
import { DaoQiAgentBridge } from '../qi-bridge';
import { HunyuanBus, TianQiChannel, DiQiChannel, RenQiChannel } from '@modulux/qi';

// ──────────────────────────────────────────────
// 测试工具
// ──────────────────────────────────────────────

let bridge: DaoQiAgentBridge;
const TEST_SUBSCRIBER = 'test-agent';

beforeEach(() => {
  daoNothingVoid.void();          // 清空虚空事件总线
  daoAgentMessenger.unsubscribe(TEST_SUBSCRIBER);
  bridge = new DaoQiAgentBridge();
});

afterEach(() => {
  bridge.unmount();
  daoAgentMessenger.unsubscribe(TEST_SUBSCRIBER);
});

// ──────────────────────────────────────────────
// 构建
// ──────────────────────────────────────────────

describe('构建', () => {
  test('无参数构建成功', () => {
    expect(bridge).toBeDefined();
  });

  test('自定义 secretKey 构建成功', () => {
    const b = new DaoQiAgentBridge('my-secret');
    expect(b).toBeDefined();
    b.unmount();
  });

  test('初始状态 isMounted = false', () => {
    expect(bridge.isMounted).toBe(false);
  });

  test('bus getter 返回 HunyuanBus 实例', () => {
    expect(bridge.bus).toBeInstanceOf(HunyuanBus);
  });

  test('tian getter 返回 TianQiChannel 实例', () => {
    expect(bridge.tian).toBeInstanceOf(TianQiChannel);
  });

  test('di getter 返回 DiQiChannel 实例', () => {
    expect(bridge.di).toBeInstanceOf(DiQiChannel);
  });

  test('ren getter 返回 RenQiChannel 实例', () => {
    expect(bridge.ren).toBeInstanceOf(RenQiChannel);
  });
});

// ──────────────────────────────────────────────
// mount / unmount 生命周期
// ──────────────────────────────────────────────

describe('mount / unmount', () => {
  test('mount() 后 isMounted = true', () => {
    bridge.mount();
    expect(bridge.isMounted).toBe(true);
  });

  test('unmount() 后 isMounted = false', () => {
    bridge.mount();
    bridge.unmount();
    expect(bridge.isMounted).toBe(false);
  });

  test('mount() 幂等 — 重复调用不改变状态', () => {
    bridge.mount();
    bridge.mount();
    expect(bridge.isMounted).toBe(true);
    // 卸载一次即可完全卸载
    bridge.unmount();
    expect(bridge.isMounted).toBe(false);
  });

  test('unmount() 在未挂载时为 no-op', () => {
    expect(() => bridge.unmount()).not.toThrow();
    expect(bridge.isMounted).toBe(false);
  });
});

// ──────────────────────────────────────────────
// HunyuanBus 广播修复验证
// ──────────────────────────────────────────────

describe('HunyuanBus 广播修复', () => {
  test('broadcast（无 target）不再抛出错误', async () => {
    // TianQiChannel.broadcast() 创建 target=undefined 的消息
    // 修复前会抛出 "missing target"，修复后应正常走路由
    await expect(bridge.sendDown('test:broadcast', 'ping')).resolves.toBeUndefined();
  });
});

// ──────────────────────────────────────────────
// sendDown — 天气下行广播
// ──────────────────────────────────────────────

describe('sendDown', () => {
  test('发送后 bus.stats.totalEmitted 增加', async () => {
    await bridge.sendDown('agent:cmd', 'run');
    const { totalEmitted } = bridge.stats();
    expect(totalEmitted).toBe(1);
  });

  test('多次发送后 totalEmitted 累计正确', async () => {
    await bridge.sendDown('cmd', 'run');
    await bridge.sendDown('cmd', 'pause');
    await bridge.sendDown('cmd', 'stop');
    expect(bridge.stats().totalEmitted).toBe(3);
  });

  test('挂载后 sendDown 触发 daoAgentMessenger → 订阅者收到消息', async () => {
    bridge.mount();
    const received: string[] = [];
    daoAgentMessenger.subscribe(TEST_SUBSCRIBER, (msg) => { received.push(msg.action); });

    await bridge.sendDown('agent:cmd', 'shutdown');

    // 等待异步事件传播
    await new Promise(r => setTimeout(r, 0));
    expect(received).toContain('shutdown');
  });

  test('挂载后 sendDown payload 正确传递', async () => {
    bridge.mount();
    let receivedPayload: unknown;
    daoAgentMessenger.subscribe(TEST_SUBSCRIBER, (msg) => { receivedPayload = msg.payload; });

    await bridge.sendDown('agent:cmd', 'configure', { timeout: 5000 });
    await new Promise(r => setTimeout(r, 0));

    expect(receivedPayload).toEqual({ timeout: 5000 });
  });

  test('未挂载时 sendDown 不触发 daoAgentMessenger', async () => {
    const received: string[] = [];
    daoAgentMessenger.subscribe(TEST_SUBSCRIBER, (msg) => { received.push(msg.action); });

    await bridge.sendDown('agent:cmd', 'run');
    await new Promise(r => setTimeout(r, 0));

    expect(received).toHaveLength(0);
  });

  test('卸载后 sendDown 不再触发订阅者', async () => {
    bridge.mount();
    const received: string[] = [];
    daoAgentMessenger.subscribe(TEST_SUBSCRIBER, (msg) => { received.push(msg.action); });

    bridge.unmount();
    await bridge.sendDown('agent:cmd', 'run');
    await new Promise(r => setTimeout(r, 0));

    expect(received).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────
// sendDirect — 点对点定向消息
// ──────────────────────────────────────────────

describe('sendDirect', () => {
  test('发送后 bus.stats.totalEmitted 增加', async () => {
    await bridge.sendDirect('node-a', 'node-b', 'execute');
    expect(bridge.stats().totalEmitted).toBe(1);
  });

  test('挂载后 sendDirect 触发目标订阅者', async () => {
    bridge.mount();
    const received: string[] = [];
    daoAgentMessenger.subscribe(TEST_SUBSCRIBER, (msg) => { received.push(msg.action); });

    await bridge.sendDirect('daoCollective', TEST_SUBSCRIBER, 'process-task');
    await new Promise(r => setTimeout(r, 0));

    expect(received).toContain('process-task');
  });

  test('sendDirect from/to/action/payload 正确', async () => {
    bridge.mount();
    let capture: { from: string; to: string; action: string; payload: unknown } | null = null;
    daoAgentMessenger.subscribe(TEST_SUBSCRIBER, (msg) => {
      capture = { from: msg.from, to: msg.to, action: msg.action, payload: msg.payload };
    });

    await bridge.sendDirect('sender-node', TEST_SUBSCRIBER, 'do-work', 42);
    await new Promise(r => setTimeout(r, 0));

    expect(capture).not.toBeNull();
    expect(capture!.from).toBe('sender-node');
    expect(capture!.to).toBe(TEST_SUBSCRIBER);
    expect(capture!.action).toBe('do-work');
    expect(capture!.payload).toBe(42);
  });

  test('连续发送多条 sendDirect 到不同目标', async () => {
    await bridge.sendDirect('root', 'agent-1', 'cmd-1');
    await bridge.sendDirect('root', 'agent-2', 'cmd-2');
    await bridge.sendDirect('root', 'agent-3', 'cmd-3');
    expect(bridge.stats().totalEmitted).toBe(3);
  });
});

// ──────────────────────────────────────────────
// reportUp — 地气上行指标
// ──────────────────────────────────────────────

describe('reportUp', () => {
  test('上报不抛出错误', async () => {
    await expect(
      bridge.reportUp('agent-1', 'agent:metrics', { cpu: 42, mem: 128 }),
    ).resolves.toBeUndefined();
  });

  test('多次上报指标不抛出', async () => {
    for (let i = 0; i < 5; i++) {
      await bridge.reportUp('agent-1', 'perf', { latency: i * 10 });
    }
  });
});

// ──────────────────────────────────────────────
// openPort — 人气横向端口
// ──────────────────────────────────────────────

describe('openPort', () => {
  test('有效节点对 (daoSpaces ↔ daoAgents) 返回 true', () => {
    expect(bridge.openPort('daoSpaces', 'daoAgents')).toBe(true);
  });

  test('无效节点对返回 false', () => {
    expect(bridge.openPort('random-node-a', 'random-node-b')).toBe(false);
  });

  test('反向有效对也返回 true', () => {
    expect(bridge.openPort('daoAgents', 'daoSpaces')).toBe(true);
  });
});

// ──────────────────────────────────────────────
// stats — 统计
// ──────────────────────────────────────────────

describe('stats', () => {
  test('初始状态统计全为 0', () => {
    const s = bridge.stats();
    expect(s.totalEmitted).toBe(0);
    expect(s.totalDropped).toBe(0);
  });

  test('发送后 totalEmitted 正确累计', async () => {
    await bridge.sendDown('cmd', 'a');
    await bridge.sendDirect('x', 'y', 'b');
    expect(bridge.stats().totalEmitted).toBe(2);
  });

  test('stats 包含 channelsStats 字段', () => {
    const s = bridge.stats();
    expect(s.channelsStats).toBeDefined();
  });
});

// ──────────────────────────────────────────────
// E2E — TaskAgent 通过 QiBridge 接收并执行任务
// ──────────────────────────────────────────────

describe('E2E: TaskAgent 集成', () => {
  test('sendDown 触发 TaskAgent 通过 onMessage 收到命令', async () => {
    const agent = new TaskAgent('qi-task-agent');
    await agent.initialize();
    await agent.activate();

    bridge.mount();
    const received: string[] = [];
    agent.onMessage((msg) => { received.push(msg.action); });

    // 广播一条命令
    await bridge.sendDown('agent:cmd', 'enqueue');
    await new Promise(r => setTimeout(r, 0));

    expect(received).toContain('enqueue');

    await agent.terminate();
    bridge.unmount();
  });

  test('sendDirect 点对点投递给特定 Agent', async () => {
    const agent = new TaskAgent('direct-target-agent');
    await agent.initialize();
    await agent.activate();

    bridge.mount();
    daoAgentMessenger.subscribe('direct-target-agent', (msg) => {
      void agent['execute'](msg.action, msg.payload);
    });

    const received: string[] = [];
    agent.onMessage((msg) => { received.push(msg.action); });

    await bridge.sendDirect('coordinator', 'direct-target-agent', 'run-all');
    await new Promise(r => setTimeout(r, 0));

    expect(received).toContain('run-all');

    daoAgentMessenger.unsubscribe('direct-target-agent');
    await agent.terminate();
    bridge.unmount();
  });
});
