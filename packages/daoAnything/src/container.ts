import type { DaoModuleMeta, DaoModuleRegistration, ModuleLifecycle } from '@daomind/nothing';

type ModuleInstance = unknown;

const VALID_TRANSITIONS: Record<ModuleLifecycle, readonly ModuleLifecycle[]> = {
  registered: ['initialized', 'terminated'],
  initialized: ['active', 'terminated'],
  active: ['suspending', 'terminated'],
  suspending: ['active', 'terminated'],
  terminated: [],
};

class DaoAnythingContainer {
  private readonly registrations = new Map<string, DaoModuleRegistration>();
  private readonly modules = new Map<string, DaoModuleMeta>();
  private readonly instances = new Map<string, ModuleInstance>();

  register(module: DaoModuleRegistration): void {
    if (this.registrations.has(module.name)) {
      throw new Error(`[daoAnything] 模块已注册: ${module.name}`);
    }
    this.registrations.set(module.name, module);
    this.modules.set(module.name, {
      id: module.name,
      createdAt: Date.now(),
      existentialType: 'anything' as const,
      name: module.name,
      lifecycle: 'registered',
      registeredAt: Date.now(),
    });
  }

  async initialize(name: string): Promise<void> {
    const meta = this.modules.get(name);
    if (!meta) throw new Error(`[daoAnything] 模块未注册: ${name}`);
    this.transition(name, meta.lifecycle, 'initialized');
  }

  async activate(name: string): Promise<void> {
    const meta = this.modules.get(name);
    if (!meta) throw new Error(`[daoAnything] 模块未注册: ${name}`);
    this.transition(name, meta.lifecycle, 'active');
    const updated = this.modules.get(name)!;
    this.modules.set(name, { ...updated, activatedAt: Date.now() });
  }

  async deactivate(name: string): Promise<void> {
    const meta = this.modules.get(name);
    if (!meta) throw new Error(`[daoAnything] 模块未注册: ${name}`);
    this.transition(name, meta.lifecycle, 'suspending');
  }

  async terminate(name: string): Promise<void> {
    const meta = this.modules.get(name);
    if (!meta) throw new Error(`[daoAnything] 模块未注册: ${name}`);
    this.transition(name, meta.lifecycle, 'terminated');
    this.instances.delete(name);
  }

  getModule(name: string): DaoModuleMeta | undefined {
    return this.modules.get(name);
  }

  listModules(): ReadonlyArray<DaoModuleMeta> {
    return Array.from(this.modules.values());
  }

  async resolve<T>(name: string): Promise<T> {
    const meta = this.modules.get(name);
    if (!meta) throw new Error(`[daoAnything] 模块未注册: ${name}`);
    if (meta.lifecycle !== 'active') {
      throw new Error(`[daoAnything] 模块未激活: ${name} (当前状态: ${meta.lifecycle})`);
    }
    let instance = this.instances.get(name);
    if (!instance) {
      const registration = this.registrations.get(name);
      if (!registration) throw new Error(`[daoAnything] 模块注册信息缺失: ${name}`);
      const mod = await import(registration.path);
      instance = mod.default ?? mod;
      this.instances.set(name, instance);
    }
    return instance as T;
  }

  private transition(name: string, from: ModuleLifecycle, to: ModuleLifecycle): void {
    const allowed = VALID_TRANSITIONS[from];
    if (!allowed.includes(to)) {
      throw new Error(
        `[daoAnything] 非法状态转换: ${name} 从 "${from}" 到 "${to}"`
      );
    }
    const meta = this.modules.get(name)!;
    this.modules.set(name, { ...meta, lifecycle: to });
  }
}

export const daoContainer = new DaoAnythingContainer();
export { DaoAnythingContainer };
