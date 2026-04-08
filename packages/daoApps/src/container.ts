import type { AppState, DaoAppDefinition, DaoAppInstance } from './types';

const VALID_TRANSITIONS: Record<AppState, readonly AppState[]> = {
  registered: ['starting'],
  starting: ['running', 'error'],
  running: ['stopping', 'error'],
  stopping: ['stopped', 'error'],
  stopped: ['starting'],
  error: ['starting'],
};

class DaoAppContainer {
  private readonly definitions = new Map<string, DaoAppDefinition>();
  private readonly instances = new Map<string, DaoAppInstance>();

  register(definition: DaoAppDefinition): void {
    if (this.definitions.has(definition.id)) {
      throw new Error(`[daoApps] 应用已注册: ${definition.id}`);
    }
    this.definitions.set(definition.id, definition);
    this.instances.set(definition.id, {
      definition,
      state: 'registered',
    });
  }

  unregister(id: string): boolean {
    const instance = this.instances.get(id);
    if (!instance) return false;
    if (instance.state === 'running' || instance.state === 'starting') {
      throw new Error(`[daoApps] 无法卸载运行中的应用: ${id} (当前状态: ${instance.state})`);
    }
    this.definitions.delete(id);
    this.instances.delete(id);
    return true;
  }

  async start(id: string): Promise<void> {
    const instance = this.instances.get(id);
    if (!instance) throw new Error(`[daoApps] 应用未注册: ${id}`);
    this.transition(id, instance.state, 'starting');
    const def = this.definitions.get(id)!;
    if (def.dependencies) {
      for (const depId of def.dependencies) {
        const depInstance = this.instances.get(depId);
        if (!depInstance || depInstance.state !== 'running') {
          this.transition(id, 'starting', 'error');
          throw new Error(
            `[daoApps] 依赖未就绪: ${id} 依赖 ${depId} (状态: ${depInstance?.state ?? '未注册'})`
          );
        }
      }
    }
    this.transition(id, 'starting', 'running');
    const updated = this.instances.get(id)!;
    this.instances.set(id, { ...updated, startedAt: Date.now() });
  }

  async stop(id: string): Promise<void> {
    const instance = this.instances.get(id);
    if (!instance) throw new Error(`[daoApps] 应用未注册: ${id}`);
    if (instance.state !== 'running') {
      throw new Error(`[daoApps] 应用未运行，无法停止: ${id} (当前状态: ${instance.state})`);
    }
    this.transition(id, 'running', 'stopping');
    this.transition(id, 'stopping', 'stopped');
    const updated = this.instances.get(id)!;
    this.instances.set(id, { ...updated, stoppedAt: Date.now() });
  }

  async restart(id: string): Promise<void> {
    await this.stop(id);
    await this.start(id);
  }

  get(id: string): DaoAppInstance | undefined {
    return this.instances.get(id);
  }

  listAll(): ReadonlyArray<DaoAppInstance> {
    return Array.from(this.instances.values());
  }

  listByState(state: AppState): ReadonlyArray<DaoAppInstance> {
    const result: DaoAppInstance[] = [];
    for (const instance of this.instances.values()) {
      if (instance.state === state) result.push(instance);
    }
    return result;
  }

  private transition(id: string, from: AppState, to: AppState): void {
    const allowed = VALID_TRANSITIONS[from];
    if (!allowed.includes(to)) {
      throw new Error(`[daoApps] 非法状态转换: ${id} 从 "${from}" 到 "${to}"`);
    }
    const instance = this.instances.get(id)!;
    this.instances.set(id, { ...instance, state: to });
  }
}

export const daoAppContainer = new DaoAppContainer();
export { DaoAppContainer };
