import type { DaoComponent, DaoViewSnapshot } from './types';

class DaoComponentTree {
  private components = new Map<string, DaoComponent>();
  private rootId: string | null = null;
  private version = 0;
  private latestSnapshot: DaoViewSnapshot | null = null;

  mount(component: Omit<DaoComponent, 'state'> & { children?: readonly (Omit<DaoComponent, 'state'>)[] }): string {
    const id = component.id;
    if (this.components.has(id)) {
      throw new Error(`[daoPages] 组件已挂载: ${id}`);
    }
    
    // Process children recursively
    let processedChildren: readonly DaoComponent[] | undefined;
    if (component.children) {
      processedChildren = component.children.map(child => {
        const fullChild: DaoComponent = { ...child, state: 'mounted' };
        this.components.set(child.id, fullChild);
        return fullChild;
      });
    }
    
    const fullComponent: DaoComponent = { 
      ...component, 
      state: 'mounted',
      children: processedChildren
    };
    this.components.set(id, fullComponent);
    if (!this.rootId) this.rootId = id;
    this.version++;
    this.takeSnapshot();
    return id;
  }

  unmount(componentId: string): boolean {
    const component = this.components.get(componentId);
    if (!component || component.state === 'unmounted') return false;
    this.unmountRecursive(componentId);
    if (this.rootId === componentId) this.rootId = null;
    this.version++;
    this.takeSnapshot();
    return true;
  }

  update(componentId: string, props: Partial<Record<string, unknown>>): boolean {
    const component = this.components.get(componentId);
    if (!component || component.state !== 'mounted') return false;
    const updated: DaoComponent = { ...component, props: { ...component.props, ...props }, state: 'updating' };
    this.components.set(componentId, updated);
    this.components.set(componentId, { ...updated, state: 'mounted' });
    this.version++;
    this.takeSnapshot();
    return true;
  }

  get(componentId: string): DaoComponent | undefined {
    return this.components.get(componentId);
  }

  childrenOf(parentId: string): ReadonlyArray<DaoComponent> {
    const parent = this.components.get(parentId);
    if (!parent?.children) return [];
    return parent.children;
  }

  traverse(visitor: (component: DaoComponent, depth: number) => void): void {
    if (!this.rootId) return;
    const root = this.components.get(this.rootId);
    if (!root) return;
    const visit = (comp: DaoComponent, depth: number): void => {
      visitor(comp, depth);
      if (comp.children) {
        for (const child of comp.children) {
          const fullChild = this.components.get(child.id);
          if (fullChild) visit(fullChild, depth + 1);
        }
      }
    };
    visit(root, 0);
  }

  getSnapshot(): DaoViewSnapshot | null {
    return this.latestSnapshot;
  }

  private unmountRecursive(id: string): void {
    const comp = this.components.get(id);
    if (comp?.children) {
      for (const child of comp.children) {
        this.unmountRecursive(child.id);
      }
    }
    this.components.delete(id);
  }

  private takeSnapshot(): void {
    if (this.rootId) {
      const root = this.components.get(this.rootId);
      if (root) {
        this.latestSnapshot = {
          root: JSON.parse(JSON.stringify(root)),
          timestamp: Date.now(),
          version: this.version,
        };
      }
    }
  }
}

export const daoComponentTree = new DaoComponentTree();
export { DaoComponentTree };
