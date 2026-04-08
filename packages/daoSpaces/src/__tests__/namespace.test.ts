import { daoNamespace, DaoNamespaceManager } from '../namespace';

describe('DaoNamespaceManager', () => {
  let manager: DaoNamespaceManager;

  beforeEach(() => {
    manager = new DaoNamespaceManager();
  });

  test('should create instance', () => {
    expect(manager).toBeDefined();
  });

  test('should create space', () => {
    const spaceId = manager.createSpace('test-space');
    expect(spaceId).toBeDefined();
    const space = manager.getSpace(spaceId);
    expect(space).toBeDefined();
    expect(space?.name).toBe('test-space');
    expect(space?.depth).toBe(0);
  });

  test('should create space with parent', () => {
    const parentId = manager.createSpace('parent-space');
    const childId = manager.createSpace('child-space', parentId);
    expect(childId).toBeDefined();
    const childSpace = manager.getSpace(childId);
    expect(childSpace).toBeDefined();
    expect(childSpace?.name).toBe('child-space');
    expect(childSpace?.parent).toBe(parentId);
    expect(childSpace?.depth).toBe(1);
  });

  test('should remove space', () => {
    const spaceId = manager.createSpace('test-space');
    const removed = manager.removeSpace(spaceId);
    expect(removed).toBe(true);
    expect(manager.getSpace(spaceId)).toBeUndefined();
  });

  test('should throw error when removing space with children', () => {
    const parentId = manager.createSpace('parent-space');
    manager.createSpace('child-space', parentId);
    expect(() => manager.removeSpace(parentId)).toThrow(/无法移除包含子空间的空间/);
  });

  test('should return false when removing non-existent space', () => {
    const removed = manager.removeSpace('non-existent');
    expect(removed).toBe(false);
  });

  test('should get space by id', () => {
    const spaceId = manager.createSpace('test-space');
    const space = manager.getSpace(spaceId);
    expect(space).toBeDefined();
    expect(space?.id).toBe(spaceId);
  });

  test('should get children of space', () => {
    const parentId = manager.createSpace('parent-space');
    manager.createSpace('child1', parentId);
    manager.createSpace('child2', parentId);
    const children = manager.getChildren(parentId);
    expect(children.length).toBe(2);
  });

  test('should return empty array when space has no children', () => {
    const spaceId = manager.createSpace('test-space');
    const children = manager.getChildren(spaceId);
    expect(children.length).toBe(0);
  });

  test('should get root spaces', () => {
    manager.createSpace('root1');
    manager.createSpace('root2');
    const roots = manager.getRootSpaces();
    expect(roots.length).toBe(2);
  });

  test('should resolve path', () => {
    const rootId = manager.createSpace('root');
    const childId = manager.createSpace('child', rootId);
    const grandchildId = manager.createSpace('grandchild', childId);

    const locator = {
      space: grandchildId,
      path: ['resource'],
    };

    const resolvedPath = manager.resolvePath(locator);
    expect(resolvedPath).toEqual(['root', 'child', 'grandchild', 'resource']);
  });

  test('should throw error when resolving path for non-existent space', () => {
    const locator = {
      space: 'non-existent',
      path: ['resource'],
    };

    expect(() => manager.resolvePath(locator)).toThrow(/空间不存在/);
  });
});

describe('daoNamespace singleton', () => {
  test('should be defined', () => {
    expect(daoNamespace).toBeDefined();
  });

  test('should have consistent instance', () => {
    expect(daoNamespace).toBeInstanceOf(DaoNamespaceManager);
  });
});
