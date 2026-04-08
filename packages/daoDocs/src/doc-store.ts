import type { DocType, DaoDocEntry } from './types.js';

class DaoDocStore {
  private docs = new Map<string, DaoDocEntry>();
  private counter = 0;

  add(entry: Omit<DaoDocEntry, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = `doc_${++this.counter}`;
    const now = Date.now();
    const fullEntry: DaoDocEntry = { ...entry, id, createdAt: now, updatedAt: now };
    this.docs.set(id, fullEntry);
    return id;
  }

  remove(id: string): boolean {
    return this.docs.delete(id);
  }

  get(id: string): DaoDocEntry | undefined {
    return this.docs.get(id);
  }

  update(
    id: string,
    partial: Partial<Pick<DaoDocEntry, 'content' | 'title' | 'tags' | 'version'>>
  ): boolean {
    const existing = this.docs.get(id);
    if (!existing) return false;
    const updated: DaoDocEntry = { ...existing, ...partial, updatedAt: Date.now() };
    this.docs.set(id, updated);
    return true;
  }

  search(query: string): ReadonlyArray<DaoDocEntry> {
    const lowerQuery = query.toLowerCase();
    const result: DaoDocEntry[] = [];
    for (const doc of this.docs.values()) {
      if (
        doc.title.toLowerCase().includes(lowerQuery) ||
        doc.content.toLowerCase().includes(lowerQuery)
      ) {
        result.push(doc);
      }
    }
    return result;
  }

  findByType(type: DocType): ReadonlyArray<DaoDocEntry> {
    const result: DaoDocEntry[] = [];
    for (const doc of this.docs.values()) {
      if (doc.type === type) result.push(doc);
    }
    return result;
  }

  findByTag(tag: string): ReadonlyArray<DaoDocEntry> {
    const result: DaoDocEntry[] = [];
    for (const doc of this.docs.values()) {
      if (doc.tags?.includes(tag)) result.push(doc);
    }
    return result;
  }

  listAll(): ReadonlyArray<DaoDocEntry> {
    return Array.from(this.docs.values());
  }
}

export const daoDocStore = new DaoDocStore();
export { DaoDocStore };
