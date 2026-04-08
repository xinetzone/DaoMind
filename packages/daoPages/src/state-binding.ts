import type { BindingPath, DaoBinding } from './types.js';

class DaoStateBinding {
  private bindings: DaoBinding[] = [];
  private updater: ((componentId: string, property: string, value: unknown) => void) | null = null;

  setUpdater(fn: (componentId: string, property: string, value: unknown) => void): void {
    this.updater = fn;
  }

  bind(path: BindingPath, componentId: string, property: string, transform?: (value: unknown) => unknown): void {
    const existingIdx = this.bindings.findIndex(
      (b) => b.path.join('.') === path.join('.') && b.componentId === componentId && b.property === property
    );
    if (existingIdx !== -1) {
      this.bindings[existingIdx] = { path, componentId, property, transform };
    } else {
      this.bindings.push({ path, componentId, property, transform });
    }
  }

  unbind(path: BindingPath, componentId: string): boolean {
    const beforeLen = this.bindings.length;
    const pathStr = path.join('.');
    this.bindings = this.bindings.filter(
      (b) => !(b.path.join('.') === pathStr && b.componentId === componentId)
    );
    return this.bindings.length < beforeLen;
  }

  notify(path: BindingPath, value: unknown): void {
    const pathStr = path.join('.');
    for (const binding of this.bindings) {
      if (binding.path.join('.').startsWith(pathStr) || pathStr.startsWith(binding.path.join('.'))) {
        const finalValue = binding.transform ? binding.transform(value) : value;
        if (this.updater) {
          try {
            this.updater(binding.componentId, binding.property, finalValue);
          } catch {}
        }
      }
    }
  }

  getBindings(): ReadonlyArray<DaoBinding> {
    return [...this.bindings];
  }
}

export const daoStateBinding = new DaoStateBinding();
export { DaoStateBinding };
