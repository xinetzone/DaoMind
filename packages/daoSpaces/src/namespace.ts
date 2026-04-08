import type { DaoSpace, DaoSpaceId, DaoResourceLocator } from './types';

class DaoNamespaceManager {
  private readonly spaces = new Map<DaoSpaceId, DaoSpace>();
  private nextId = 0;

  createSpace(name: string, parent?: DaoSpaceId): DaoSpaceId {
    const id = `space-${++this.nextId}` as DaoSpaceId;
    const depth = parent ? (this.spaces.get(parent)?.depth ?? -1) + 1 : 0;
    const space: DaoSpace = { id, name, parent, depth };
    this.spaces.set(id, space);
    return id;
  }

  removeSpace(id: DaoSpaceId): boolean {
    const children = this.getChildren(id);
    if (children.length > 0) {
      throw new Error(`[daoSpaces] 无法移除包含子空间的空间: ${id}`);
    }
    return this.spaces.delete(id);
  }

  getSpace(id: DaoSpaceId): DaoSpace | undefined {
    return this.spaces.get(id);
  }

  getChildren(parentId: DaoSpaceId): ReadonlyArray<DaoSpace> {
    const result: DaoSpace[] = [];
    for (const space of this.spaces.values()) {
      if (space.parent === parentId) {
        result.push(space);
      }
    }
    return result;
  }

  getRootSpaces(): ReadonlyArray<DaoSpace> {
    const result: DaoSpace[] = [];
    for (const space of this.spaces.values()) {
      if (!space.parent) {
        result.push(space);
      }
    }
    return result;
  }

  resolvePath(locator: DaoResourceLocator): string[] {
    const space = this.spaces.get(locator.space);
    if (!space) {
      throw new Error(`[daoSpaces] 空间不存在: ${locator.space}`);
    }
    const hierarchy: string[] = [];
    let current: DaoSpace | undefined = space;
    while (current) {
      hierarchy.unshift(current.name);
      current = current.parent ? this.spaces.get(current.parent) : undefined;
    }
    return [...hierarchy, ...locator.path];
  }
}

export const daoNamespace = new DaoNamespaceManager();
export { DaoNamespaceManager };
