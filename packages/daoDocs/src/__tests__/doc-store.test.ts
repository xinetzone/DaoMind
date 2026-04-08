import { daoDocStore, DaoDocStore } from '../doc-store';

describe('DaoDocStore', () => {
  let store: DaoDocStore;

  beforeEach(() => {
    store = new DaoDocStore();
  });

  test('should add document entry', () => {
    const docData = {
      type: 'api' as const,
      title: 'Test API',
      content: 'Test content',
      version: '1.0.0',
      tags: ['test', 'api'],
    };

    const id = store.add(docData);
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
  });

  test('should get document entry by id', () => {
    const docData = {
      type: 'guide' as const,
      title: 'Test Guide',
      content: 'Test content',
      version: '1.0.0',
    };

    const id = store.add(docData);
    const doc = store.get(id);
    expect(doc).toBeDefined();
    expect(doc?.id).toBe(id);
    expect(doc?.title).toBe('Test Guide');
  });

  test('should update document entry', () => {
    const docData = {
      type: 'reference' as const,
      title: 'Old Title',
      content: 'Old content',
      version: '1.0.0',
    };

    const id = store.add(docData);
    const updated = store.update(id, {
      title: 'New Title',
      content: 'New content',
    });

    expect(updated).toBe(true);
    const doc = store.get(id);
    expect(doc?.title).toBe('New Title');
    expect(doc?.content).toBe('New content');
  });

  test('should return false when updating non-existent document', () => {
    const updated = store.update('non-existent-id', {
      title: 'New Title',
    });
    expect(updated).toBe(false);
  });

  test('should remove document entry', () => {
    const docData = {
      type: 'changelog' as const,
      title: 'Test Changelog',
      content: 'Test content',
      version: '1.0.0',
    };

    const id = store.add(docData);
    const removed = store.remove(id);
    expect(removed).toBe(true);
    expect(store.get(id)).toBeUndefined();
  });

  test('should return false when removing non-existent document', () => {
    const removed = store.remove('non-existent-id');
    expect(removed).toBe(false);
  });

  test('should search documents by query', () => {
    store.add({
      type: 'api' as const,
      title: 'Test API',
      content: 'This is a test API document',
      version: '1.0.0',
    });

    store.add({
      type: 'guide' as const,
      title: 'Guide',
      content: 'This is a guide document',
      version: '1.0.0',
    });

    const results = store.search('test');
    expect(results.length).toBe(1);
    expect(results[0]?.title).toBe('Test API');
  });

  test('should find documents by type', () => {
    store.add({
      type: 'api' as const,
      title: 'API Doc',
      content: 'API content',
      version: '1.0.0',
    });

    store.add({
      type: 'guide' as const,
      title: 'Guide Doc',
      content: 'Guide content',
      version: '1.0.0',
    });

    const apiDocs = store.findByType('api');
    expect(apiDocs.length).toBe(1);
    expect(apiDocs[0]?.type).toBe('api');

    const guideDocs = store.findByType('guide');
    expect(guideDocs.length).toBe(1);
    expect(guideDocs[0]?.type).toBe('guide');
  });

  test('should find documents by tag', () => {
    store.add({
      type: 'api' as const,
      title: 'API Doc',
      content: 'API content',
      version: '1.0.0',
      tags: ['api', 'test'],
    });

    store.add({
      type: 'guide' as const,
      title: 'Guide Doc',
      content: 'Guide content',
      version: '1.0.0',
      tags: ['guide'],
    });

    const testDocs = store.findByTag('test');
    expect(testDocs.length).toBe(1);
    expect(testDocs[0]?.tags?.includes('test')).toBe(true);
  });

  test('should list all documents', () => {
    store.add({
      type: 'api' as const,
      title: 'API Doc',
      content: 'API content',
      version: '1.0.0',
    });

    store.add({
      type: 'guide' as const,
      title: 'Guide Doc',
      content: 'Guide content',
      version: '1.0.0',
    });

    const allDocs = store.listAll();
    expect(allDocs.length).toBe(2);
  });
});

describe('daoDocStore singleton', () => {
  test('should be defined', () => {
    expect(daoDocStore).toBeDefined();
  });

  test('should add and get document', () => {
    const docData = {
      type: 'api' as const,
      title: 'Singleton Test',
      content: 'Test content',
      version: '1.0.0',
    };

    const id = daoDocStore.add(docData);
    expect(id).toBeDefined();
    const doc = daoDocStore.get(id);
    expect(doc).toBeDefined();
  });
});
