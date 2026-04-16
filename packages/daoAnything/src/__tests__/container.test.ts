import { DaoAnythingContainer } from '../container';

describe('DaoAnythingContainer', () => {
  let container: DaoAnythingContainer;

  const mockModule = {
    name: 'test-module',
    version: '1.0.0',
    path: './test-module.js',
    dependencies: [] as string[],
  };

  beforeEach(() => {
    container = new DaoAnythingContainer();
  });

  // ── register ────────────────────────────────────────────────────────────────

  describe('register', () => {
    test('正常注册模块', () => {
      container.register(mockModule);
      const mod = container.getModule('test-module');
      expect(mod).toBeDefined();
      expect(mod?.id).toBe('test-module');
      expect(mod?.name).toBe('test-module');
      expect(mod?.lifecycle).toBe('registered');
      expect(mod?.existentialType).toBe('anything');
    });

    test('重复注册同名模块应抛错', () => {
      container.register(mockModule);
      expect(() => container.register(mockModule)).toThrow(/模块已注册/);
    });

    test('注册后 listModules 能查到', () => {
      container.register(mockModule);
      container.register({ ...mockModule, name: 'second-module' });
      const list = container.listModules();
      expect(list).toHaveLength(2);
      expect(list.map((m) => m.name)).toContain('test-module');
      expect(list.map((m) => m.name)).toContain('second-module');
    });
  });

  // ── lifecycle ────────────────────────────────────────────────────────────────

  describe('lifecycle 正常流转', () => {
    beforeEach(() => container.register(mockModule));

    test('registered → initialized', async () => {
      await container.initialize('test-module');
      expect(container.getModule('test-module')?.lifecycle).toBe('initialized');
    });

    test('initialized → active', async () => {
      await container.initialize('test-module');
      await container.activate('test-module');
      expect(container.getModule('test-module')?.lifecycle).toBe('active');
    });

    test('active → suspending', async () => {
      await container.initialize('test-module');
      await container.activate('test-module');
      await container.deactivate('test-module');
      expect(container.getModule('test-module')?.lifecycle).toBe('suspending');
    });

    test('suspending → active（恢复）', async () => {
      await container.initialize('test-module');
      await container.activate('test-module');
      await container.deactivate('test-module');
      await container.activate('test-module');
      expect(container.getModule('test-module')?.lifecycle).toBe('active');
    });

    test('任意状态 → terminated', async () => {
      await container.initialize('test-module');
      await container.activate('test-module');
      await container.terminate('test-module');
      expect(container.getModule('test-module')?.lifecycle).toBe('terminated');
    });

    test('activate 时记录 activatedAt 时间戳', async () => {
      const before = Date.now();
      await container.initialize('test-module');
      await container.activate('test-module');
      const after = Date.now();
      const activatedAt = container.getModule('test-module')?.activatedAt;
      expect(activatedAt).toBeGreaterThanOrEqual(before);
      expect(activatedAt).toBeLessThanOrEqual(after);
    });
  });

  // ── 非法状态转换 ─────────────────────────────────────────────────────────────

  describe('非法状态转换应抛错', () => {
    beforeEach(() => container.register(mockModule));

    test('registered → active（跳过 initialized）', async () => {
      await expect(container.activate('test-module')).rejects.toThrow(/非法状态转换/);
    });

    test('terminated → 任何状态', async () => {
      await container.terminate('test-module');
      await expect(container.initialize('test-module')).rejects.toThrow(/非法状态转换/);
    });
  });

  // ── 未注册模块操作 ────────────────────────────────────────────────────────────

  describe('操作未注册模块', () => {
    test('initialize 未注册模块应抛错', async () => {
      await expect(container.initialize('ghost')).rejects.toThrow(/模块未注册/);
    });

    test('activate 未注册模块应抛错', async () => {
      await expect(container.activate('ghost')).rejects.toThrow(/模块未注册/);
    });

    test('getModule 返回 undefined', () => {
      expect(container.getModule('ghost')).toBeUndefined();
    });
  });

  // ── resolve ──────────────────────────────────────────────────────────────────

  describe('resolve', () => {
    test('未激活模块调用 resolve 应抛错', async () => {
      container.register(mockModule);
      await container.initialize('test-module');
      // 仅 initialized，未 active
      await expect(container.resolve('test-module')).rejects.toThrow(/模块未激活/);
    });

    test('未注册模块调用 resolve 应抛错', async () => {
      await expect(container.resolve('ghost')).rejects.toThrow(/模块未注册/);
    });
  });

  // ── listModules ──────────────────────────────────────────────────────────────

  describe('listModules', () => {
    test('空容器返回空数组', () => {
      expect(container.listModules()).toHaveLength(0);
    });

    test('已注册模块的 existentialType 均为 anything', () => {
      container.register(mockModule);
      container.register({ ...mockModule, name: 'mod-b' });
      const all = container.listModules();
      expect(all.every((m) => m.existentialType === 'anything')).toBe(true);
    });
  });
});
