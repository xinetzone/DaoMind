/**
 * DaoUniverseSpaces 测试套件
 * "知足者富，强行者有志"（德经·三十三章）
 *
 * 验证：构建 / createSpace / removeSpace / getChildren/getRootSpaces /
 *       resolve / routeSpace / snapshot / E2E
 */

import { daoNothingVoid } from '@daomind/nothing';
import { DaoUniverse } from '../universe';
import { DaoUniverseMonitor } from '../universe-monitor';
import { DaoUniverseClock } from '../universe-clock';
import { DaoUniverseNexus } from '../universe-nexus';
import { DaoUniverseSpaces } from '../universe-spaces';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeStack() {
  const universe = new DaoUniverse();
  const monitor  = new DaoUniverseMonitor(universe);
  const clock    = new DaoUniverseClock(monitor);
  const nexus    = new DaoUniverseNexus(monitor, clock);
  const spaces   = new DaoUniverseSpaces(nexus);
  return { universe, monitor, clock, nexus, spaces };
}

// ── setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  daoNothingVoid.void();
});

// ── 1. 构建 ───────────────────────────────────────────────────────────────────

describe('构建', () => {
  test('可构建 DaoUniverseSpaces', () => {
    const { spaces } = makeStack();
    expect(spaces).toBeDefined();
  });

  test('nexus getter 返回传入的 DaoUniverseNexus', () => {
    const { nexus, spaces } = makeStack();
    expect(spaces.nexus).toBe(nexus);
  });

  test('namespace getter 已初始化（独立实例）', () => {
    const { spaces } = makeStack();
    expect(spaces.namespace).toBeDefined();
  });

  test('初始 snapshot().totalSpaces = 0', () => {
    const { spaces } = makeStack();
    expect(spaces.snapshot().totalSpaces).toBe(0);
  });
});

// ── 2. createSpace / removeSpace ──────────────────────────────────────────────

describe('createSpace / removeSpace', () => {
  test('createSpace 返回 DaoSpaceId 字符串', () => {
    const { spaces } = makeStack();
    const id = spaces.createSpace('用户空间');
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  test('createSpace 后 getSpace 可取回', () => {
    const { spaces } = makeStack();
    const id    = spaces.createSpace('知识空间');
    const space = spaces.getSpace(id);
    expect(space?.name).toBe('知识空间');
  });

  test('createSpace 自动在 nexus 注册对应服务', () => {
    const { nexus, spaces } = makeStack();
    const beforeCount = nexus.healthCheck().length;
    spaces.createSpace('工具空间');
    expect(nexus.healthCheck().length).toBe(beforeCount + 1);
  });

  test('removeSpace 返回 true，getSpace 返回 undefined', () => {
    const { spaces } = makeStack();
    const id = spaces.createSpace('临时空间');
    expect(spaces.removeSpace(id)).toBe(true);
    expect(spaces.getSpace(id)).toBeUndefined();
  });

  test('removeSpace 同步从 nexus 注销服务', () => {
    const { nexus, spaces } = makeStack();
    const id = spaces.createSpace('可删空间');
    const countAfterCreate = nexus.healthCheck().length;
    spaces.removeSpace(id);
    expect(nexus.healthCheck().length).toBe(countAfterCreate - 1);
  });
});

// ── 3. getChildren / getRootSpaces ────────────────────────────────────────────

describe('getChildren / getRootSpaces', () => {
  test('createSpace 无 parent → 出现在 getRootSpaces()', () => {
    const { spaces } = makeStack();
    const id = spaces.createSpace('根空间');
    const roots = spaces.getRootSpaces();
    expect(roots.some((s) => s.id === id)).toBe(true);
  });

  test('createSpace 有 parent → 出现在 getChildren()', () => {
    const { spaces } = makeStack();
    const rootId  = spaces.createSpace('根');
    const childId = spaces.createSpace('子', rootId);
    const children = spaces.getChildren(rootId);
    expect(children.some((s) => s.id === childId)).toBe(true);
  });

  test('子空间不出现在 getRootSpaces()', () => {
    const { spaces } = makeStack();
    const rootId  = spaces.createSpace('根A');
    const childId = spaces.createSpace('子A', rootId);
    const roots = spaces.getRootSpaces();
    expect(roots.some((s) => s.id === childId)).toBe(false);
  });

  test('removeSpace 有子空间时抛出异常', () => {
    const { spaces } = makeStack();
    const rootId = spaces.createSpace('父');
    spaces.createSpace('子', rootId);
    expect(() => spaces.removeSpace(rootId)).toThrow();
  });
});

// ── 4. resolve ────────────────────────────────────────────────────────────────

describe('resolve()', () => {
  test('单层空间 resolve 返回 [spaceName, ...path]', () => {
    const { spaces } = makeStack();
    const id   = spaces.createSpace('api');
    const path = spaces.resolve({ space: id, path: ['v1', 'users'] });
    expect(path).toEqual(['api', 'v1', 'users']);
  });

  test('嵌套空间 resolve 返回完整层级路径', () => {
    const { spaces } = makeStack();
    const rootId  = spaces.createSpace('root');
    const childId = spaces.createSpace('child', rootId);
    const path    = spaces.resolve({ space: childId, path: ['data'] });
    expect(path).toEqual(['root', 'child', 'data']);
  });

  test('resolve 不存在的 space 抛出异常', () => {
    const { spaces } = makeStack();
    expect(() => spaces.resolve({ space: 'nonexistent', path: [] })).toThrow();
  });
});

// ── 5. routeSpace ─────────────────────────────────────────────────────────────

describe('routeSpace()', () => {
  test('routeSpace 后 nexus.dispatch 可路由到 space 服务', async () => {
    const { spaces } = makeStack();
    const spaceId = spaces.createSpace('tasks');
    spaces.routeSpace('/tasks/*', spaceId);
    // path.split('/')[0] = 'tasks'，discover('tasks') 命中注册的 space 服务
    const result = await spaces.nexus.dispatch({ path: 'tasks/42', payload: null });
    expect(result.status).toBe('dispatched');
  });

  test('routeSpace 对未创建的 spaceId 不抛出（nexus addRoute 只记录规则）', () => {
    const { spaces } = makeStack();
    expect(() => spaces.routeSpace('/ghost/*', 'space-999')).not.toThrow();
  });

  test('未 routeSpace 的路径 dispatch 返回 no-service', async () => {
    const { spaces } = makeStack();
    // 未注册任何名为 'unknown' 的服务
    const result = await spaces.nexus.dispatch({ path: 'unknown/path', payload: null });
    expect(result.status).toBe('no-service');
  });
});

// ── 6. snapshot ───────────────────────────────────────────────────────────────

describe('snapshot()', () => {
  test('totalSpaces 随 createSpace 增长', () => {
    const { spaces } = makeStack();
    spaces.createSpace('S1');
    spaces.createSpace('S2');
    expect(spaces.snapshot().totalSpaces).toBe(2);
  });

  test('rootCount 只统计根空间', () => {
    const { spaces } = makeStack();
    const rootId = spaces.createSpace('Root');
    spaces.createSpace('Child', rootId);  // 子空间不计入 rootCount
    expect(spaces.snapshot().rootCount).toBe(1);
  });

  test('removeSpace 后 totalSpaces 减少', () => {
    const { spaces } = makeStack();
    const id = spaces.createSpace('可删');
    expect(spaces.snapshot().totalSpaces).toBe(1);
    spaces.removeSpace(id);
    expect(spaces.snapshot().totalSpaces).toBe(0);
  });

  test('nexusServiceCount 包含 space 注册的服务', () => {
    const { spaces } = makeStack();
    spaces.createSpace('A');
    spaces.createSpace('B');
    expect(spaces.snapshot().nexusServiceCount).toBeGreaterThanOrEqual(2);
  });
});

// ── 7. E2E ────────────────────────────────────────────────────────────────────

describe('E2E', () => {
  test('完整 Universe→Monitor→Nexus→Spaces 流程', async () => {
    const { spaces } = makeStack();
    const rootId  = spaces.createSpace('domain');
    const childId = spaces.createSpace('service', rootId);
    spaces.routeSpace('/domain/service/*', childId);

    const result = await spaces.nexus.dispatch({
      path: 'service/health',
      payload: null,
    });
    expect(result.status).toBe('dispatched');

    const snap = spaces.snapshot();
    expect(snap.totalSpaces).toBe(2);
    expect(snap.rootCount).toBe(1);
    expect(snap.nexusServiceCount).toBe(2);
  });

  test('DaoUniverseSpaces 可从 @daomind/collective 导入', async () => {
    const { DaoUniverseSpaces: S } = await import('../index');
    expect(S).toBeDefined();
    expect(typeof S).toBe('function');
  });

  test('三层嵌套 resolve 返回完整路径', () => {
    const { spaces } = makeStack();
    const l1 = spaces.createSpace('level1');
    const l2 = spaces.createSpace('level2', l1);
    const l3 = spaces.createSpace('level3', l2);
    const path = spaces.resolve({ space: l3, path: ['resource'] });
    expect(path).toEqual(['level1', 'level2', 'level3', 'resource']);
  });

  test('space 注册的 nexus 服务可被 healthCheck() 检测到', () => {
    const { nexus, spaces } = makeStack();
    const id = spaces.createSpace('可观测');
    const check = nexus.healthCheck();
    expect(check.some((s) => s.id === id)).toBe(true);
    expect(check.find((s) => s.id === id)?.healthy).toBe(true);
  });
});
