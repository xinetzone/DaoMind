/**
 * DaoUniversePages 测试套件
 * "致虚极，守静笃；万物并作，吾以观复"（道经·十六章）
 *
 * 验证：构建 / mount-unmount / update / bind-notify / scheduleRefresh / snapshot / E2E
 */

import { daoNothingVoid } from '@daomind/nothing';
import { DaoUniverse } from '../universe';
import { DaoUniverseMonitor } from '../universe-monitor';
import { DaoUniverseClock } from '../universe-clock';
import { DaoUniverseScheduler } from '../universe-scheduler';
import { DaoUniversePages } from '../universe-pages';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeStack() {
  const universe  = new DaoUniverse();
  const monitor   = new DaoUniverseMonitor(universe);
  const clock     = new DaoUniverseClock(monitor);
  const scheduler = new DaoUniverseScheduler(clock);
  const pages     = new DaoUniversePages(scheduler);
  return { universe, monitor, clock, scheduler, pages };
}

function sampleComponent(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    type:  'View',
    props: { title: '测试组件', ...overrides },
  };
}

// ── setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  daoNothingVoid.void();
});

// ── 1. 构建 ───────────────────────────────────────────────────────────────────

describe('构建', () => {
  test('可构建 DaoUniversePages', () => {
    const { pages } = makeStack();
    expect(pages).toBeDefined();
  });

  test('scheduler getter 返回传入的 DaoUniverseScheduler', () => {
    const { scheduler, pages } = makeStack();
    expect(pages.scheduler).toBe(scheduler);
  });

  test('tree getter 已初始化（独立实例）', () => {
    const { pages } = makeStack();
    expect(pages.tree).toBeDefined();
  });

  test('binding getter 已初始化（独立实例）', () => {
    const { pages } = makeStack();
    expect(pages.binding).toBeDefined();
  });
});

// ── 2. mount / unmount ────────────────────────────────────────────────────────

describe('mount / unmount', () => {
  test('mount 返回组件 id', () => {
    const { pages } = makeStack();
    const id = pages.mount(sampleComponent('c1'));
    expect(id).toBe('c1');
  });

  test('mount 后 getComponent 可取回', () => {
    const { pages } = makeStack();
    pages.mount(sampleComponent('c2'));
    expect(pages.getComponent('c2')?.type).toBe('View');
  });

  test('mount 后 viewSnapshot 有内容', () => {
    const { pages } = makeStack();
    pages.mount(sampleComponent('root'));
    expect(pages.viewSnapshot()).not.toBeNull();
  });

  test('重复 mount 同一 id 抛出异常', () => {
    const { pages } = makeStack();
    pages.mount(sampleComponent('dup'));
    expect(() => pages.mount(sampleComponent('dup'))).toThrow();
  });

  test('unmount 返回 true，getComponent 返回 undefined', () => {
    const { pages } = makeStack();
    pages.mount(sampleComponent('c3'));
    expect(pages.unmount('c3')).toBe(true);
    expect(pages.getComponent('c3')).toBeUndefined();
  });

  test('unmount 不存在的组件返回 false', () => {
    const { pages } = makeStack();
    expect(pages.unmount('nonexistent')).toBe(false);
  });
});

// ── 3. update ─────────────────────────────────────────────────────────────────

describe('update()', () => {
  test('update 后 getComponent 返回新 props', () => {
    const { pages } = makeStack();
    pages.mount(sampleComponent('u1'));
    pages.update('u1', { title: '更新后' });
    expect(pages.getComponent('u1')?.props.title).toBe('更新后');
  });

  test('不存在的组件 update 返回 false', () => {
    const { pages } = makeStack();
    expect(pages.update('ghost', { x: 1 })).toBe(false);
  });

  test('update 使 viewSnapshot version 递增', () => {
    const { pages } = makeStack();
    pages.mount(sampleComponent('v1'));
    const v1 = pages.viewSnapshot()!.version;
    pages.update('v1', { count: 1 });
    expect(pages.viewSnapshot()!.version).toBe(v1 + 1);
  });
});

// ── 4. bind / unbind / notify ─────────────────────────────────────────────────

describe('bind / unbind / notify', () => {
  test('bind 后 getBindings() 包含该绑定', () => {
    const { pages } = makeStack();
    pages.mount(sampleComponent('b1'));
    pages.bind(['state', 'count'], 'b1', 'count');
    expect(pages.binding.getBindings().length).toBe(1);
  });

  test('notify 触发组件 prop 更新（通过 binding updater）', () => {
    const { pages } = makeStack();
    pages.mount(sampleComponent('b2'));
    pages.bind(['store', 'name'], 'b2', 'title');
    pages.notify(['store', 'name'], '道宇宙');
    expect(pages.getComponent('b2')?.props.title).toBe('道宇宙');
  });

  test('notify 支持 transform 函数', () => {
    const { pages } = makeStack();
    pages.mount(sampleComponent('b3'));
    pages.bind(['store', 'count'], 'b3', 'display', (v) => `${v as number} 次`);
    pages.notify(['store', 'count'], 42);
    expect(pages.getComponent('b3')?.props.display).toBe('42 次');
  });

  test('unbind 返回 true，之后 notify 不再更新', () => {
    const { pages } = makeStack();
    pages.mount(sampleComponent('b4'));
    pages.bind(['path'], 'b4', 'title');
    expect(pages.unbind(['path'], 'b4')).toBe(true);
    pages.notify(['path'], '不应更新');
    expect(pages.getComponent('b4')?.props.title).toBe('测试组件'); // 原值
  });

  test('unbind 不存在的绑定返回 false', () => {
    const { pages } = makeStack();
    expect(pages.unbind(['no', 'path'], 'nocomp')).toBe(false);
  });
});

// ── 5. scheduleRefresh / cancelRefresh ────────────────────────────────────────

describe('scheduleRefresh / cancelRefresh', () => {
  test('scheduleRefresh 返回有效 taskId', () => {
    const { pages } = makeStack();
    pages.mount(sampleComponent('r1'));
    const taskId = pages.scheduleRefresh('r1', 0, () => ({ title: '刷新后' }));
    expect(typeof taskId).toBe('string');
    expect(taskId.length).toBeGreaterThan(0);
  });

  test('flush 后 scheduleRefresh 的 propsFactory 已应用到组件', async () => {
    const { scheduler, pages } = makeStack();
    pages.mount(sampleComponent('r2'));
    pages.scheduleRefresh('r2', 0, () => ({ title: '时序刷新' }));
    await scheduler.flush();
    expect(pages.getComponent('r2')?.props.title).toBe('时序刷新');
  });

  test('flush 后 pendingRefreshes 减少', async () => {
    const { scheduler, pages } = makeStack();
    pages.mount(sampleComponent('r3'));
    pages.scheduleRefresh('r3', 0, () => ({}));
    expect(pages.snapshot().pendingRefreshes).toBe(1);
    await scheduler.flush();
    expect(pages.snapshot().pendingRefreshes).toBe(0);
  });

  test('cancelRefresh 返回 true，task 不再执行', async () => {
    const { scheduler, pages } = makeStack();
    pages.mount(sampleComponent('r4'));
    pages.scheduleRefresh('r4', 0, () => ({ title: '不应执行' }));
    expect(pages.cancelRefresh('r4')).toBe(true);
    await scheduler.flush();
    expect(pages.getComponent('r4')?.props.title).toBe('测试组件'); // 原值不变
  });

  test('重复 scheduleRefresh 自动取消旧任务', async () => {
    const { scheduler, pages } = makeStack();
    pages.mount(sampleComponent('r5'));
    pages.scheduleRefresh('r5', 0, () => ({ title: '旧' }));
    pages.scheduleRefresh('r5', 0, () => ({ title: '新' })); // 覆盖旧任务
    await scheduler.flush();
    expect(pages.getComponent('r5')?.props.title).toBe('新');
  });

  test('cancelRefresh 无任务时返回 false', () => {
    const { pages } = makeStack();
    expect(pages.cancelRefresh('nocomp')).toBe(false);
  });

  test('unmount 同步取消该组件的刷新任务', async () => {
    const { scheduler, pages } = makeStack();
    pages.mount(sampleComponent('r6'));
    pages.scheduleRefresh('r6', 0, () => ({ title: '不应执行' }));
    pages.unmount('r6');
    expect(pages.snapshot().pendingRefreshes).toBe(0);
    await scheduler.flush();   // 任务已被取消，不会更新
  });
});

// ── 6. viewSnapshot ───────────────────────────────────────────────────────────

describe('viewSnapshot()', () => {
  test('未 mount 前 viewSnapshot 返回 null', () => {
    const { pages } = makeStack();
    expect(pages.viewSnapshot()).toBeNull();
  });

  test('mount 后 viewSnapshot 包含 root 组件', () => {
    const { pages } = makeStack();
    pages.mount(sampleComponent('root'));
    expect(pages.viewSnapshot()?.root.id).toBe('root');
  });

  test('update 后 viewSnapshot.version 递增', () => {
    const { pages } = makeStack();
    pages.mount(sampleComponent('vs1'));
    const v1 = pages.viewSnapshot()!.version;
    pages.update('vs1', { x: 1 });
    expect(pages.viewSnapshot()!.version).toBeGreaterThan(v1);
  });
});

// ── 7. snapshot() ─────────────────────────────────────────────────────────────

describe('snapshot()', () => {
  test('初始快照：所有计数为 0，viewVersion 为 null', () => {
    const { pages } = makeStack();
    const snap = pages.snapshot();
    expect(snap.totalMounted).toBe(0);
    expect(snap.totalBindings).toBe(0);
    expect(snap.pendingRefreshes).toBe(0);
    expect(snap.viewVersion).toBeNull();
  });

  test('mount 后 totalMounted 正确计数', () => {
    const { pages } = makeStack();
    pages.mount(sampleComponent('s1'));
    expect(pages.snapshot().totalMounted).toBe(1);
    // 同 tree 实例再 mount 一棵子树：traverse 从 rootId 开始，仅访问第一棵树的节点
    // 此处验证单棵树计数正确
  });

  test('bind 后 totalBindings 递增', () => {
    const { pages } = makeStack();
    pages.mount(sampleComponent('s3'));
    pages.bind(['a'], 's3', 'x');
    pages.bind(['b'], 's3', 'y');
    expect(pages.snapshot().totalBindings).toBe(2);
  });

  test('scheduleRefresh 后 pendingRefreshes 递增', () => {
    const { pages } = makeStack();
    pages.mount(sampleComponent('s4'));
    pages.scheduleRefresh('s4', 100, () => ({}));
    expect(pages.snapshot().pendingRefreshes).toBe(1);
  });

  test('mount 后 viewVersion 非 null', () => {
    const { pages } = makeStack();
    pages.mount(sampleComponent('s5'));
    expect(pages.snapshot().viewVersion).not.toBeNull();
  });
});

// ── 8. E2E ────────────────────────────────────────────────────────────────────

describe('E2E', () => {
  test('完整 Universe→Scheduler→Pages 流程', async () => {
    const { pages, scheduler } = makeStack();
    pages.mount(sampleComponent('e1'));
    pages.bind(['data', 'title'], 'e1', 'title');
    pages.notify(['data', 'title'], '宇宙标题');
    expect(pages.getComponent('e1')?.props.title).toBe('宇宙标题');

    pages.scheduleRefresh('e1', 0, () => ({ title: '调度刷新' }));
    await scheduler.flush();
    expect(pages.getComponent('e1')?.props.title).toBe('调度刷新');

    const snap = pages.snapshot();
    expect(snap.totalMounted).toBe(1);
    expect(snap.totalBindings).toBe(1);
    expect(snap.pendingRefreshes).toBe(0);
  });

  test('DaoUniversePages 可从 @daomind/collective 导入', async () => {
    const { DaoUniversePages: P } = await import('../index');
    expect(P).toBeDefined();
    expect(typeof P).toBe('function');
  });

  test('scheduler.executions 记录 scheduleRefresh 执行历史', async () => {
    const { scheduler, pages } = makeStack();
    pages.mount(sampleComponent('e2'));
    pages.scheduleRefresh('e2', 0, () => ({ count: 1 }));
    await scheduler.flush();
    const execs = scheduler.executions();
    expect(execs.length).toBeGreaterThan(0);
    expect(execs[execs.length - 1]?.status).toBe('success');
  });

  test('多组件 × 多绑定 × 多刷新完整验证', async () => {
    const { scheduler, pages } = makeStack();
    pages.mount(sampleComponent('ea'));
    pages.mount(sampleComponent('eb'));
    pages.bind(['store', 'x'], 'ea', 'x');
    pages.bind(['store', 'y'], 'eb', 'y');
    pages.scheduleRefresh('ea', 0, () => ({ x: 100 }));
    pages.scheduleRefresh('eb', 0, () => ({ y: 200 }));
    pages.notify(['store', 'x'], 'hello');
    pages.notify(['store', 'y'], 'world');
    await scheduler.flush();
    expect(pages.getComponent('ea')?.props.x).toBe(100);
    expect(pages.getComponent('eb')?.props.y).toBe(200);
    expect(pages.snapshot().pendingRefreshes).toBe(0);
  });
});
