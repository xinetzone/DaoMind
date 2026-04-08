import { daoComponentTree, DaoComponentTree } from '../component-tree';
import { ComponentState } from '../types';

describe('DaoComponentTree', () => {
  let tree: DaoComponentTree;

  beforeEach(() => {
    tree = new DaoComponentTree();
  });

  test('should create instance', () => {
    expect(tree).toBeDefined();
  });

  test('should mount component', () => {
    const component = {
      id: 'test-component',
      type: 'div',
      props: { className: 'test' },
    };

    const id = tree.mount(component);
    expect(id).toBe('test-component');
    const mountedComponent = tree.get(id);
    expect(mountedComponent).toBeDefined();
    expect(mountedComponent?.state).toBe('mounted');
  });

  test('should throw error when mounting existing component', () => {
    const component = {
      id: 'test-component',
      type: 'div',
      props: { className: 'test' },
    };

    tree.mount(component);
    expect(() => tree.mount(component)).toThrow(/组件已挂载/);
  });

  test('should unmount component', () => {
    const component = {
      id: 'test-component',
      type: 'div',
      props: { className: 'test' },
    };

    const id = tree.mount(component);
    const unmounted = tree.unmount(id);
    expect(unmounted).toBe(true);
    expect(tree.get(id)).toBeUndefined();
  });

  test('should return false when unmounting non-existent component', () => {
    const unmounted = tree.unmount('non-existent');
    expect(unmounted).toBe(false);
  });

  test('should update component', () => {
    const component = {
      id: 'test-component',
      type: 'div',
      props: { className: 'test' },
    };

    const id = tree.mount(component);
    const updated = tree.update(id, { className: 'updated' });
    expect(updated).toBe(true);
    const updatedComponent = tree.get(id);
    expect(updatedComponent?.props.className).toBe('updated');
  });

  test('should return false when updating non-existent component', () => {
    const updated = tree.update('non-existent', { className: 'updated' });
    expect(updated).toBe(false);
  });

  test('should get component by id', () => {
    const component = {
      id: 'test-component',
      type: 'div',
      props: { className: 'test' },
    };

    const id = tree.mount(component);
    const retrieved = tree.get(id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(id);
  });

  test('should get children of component', () => {
    const parent = {
      id: 'parent',
      type: 'div',
      props: {},
      children: [
        { id: 'child1', type: 'span', props: {}, state: 'mounted' as ComponentState },
        { id: 'child2', type: 'span', props: {}, state: 'mounted' as ComponentState },
      ],
    };

    tree.mount(parent);
    const children = tree.childrenOf('parent');
    expect(children.length).toBe(2);
  });

  test('should return empty array when component has no children', () => {
    const component = {
      id: 'test-component',
      type: 'div',
      props: {},
    };

    tree.mount(component);
    const children = tree.childrenOf('test-component');
    expect(children.length).toBe(0);
  });

  test('should traverse component tree', () => {
    const parent = {
      id: 'parent',
      type: 'div',
      props: {},
      children: [
        { id: 'child1', type: 'span', props: {}, state: 'mounted' as ComponentState },
        { id: 'child2', type: 'span', props: {}, state: 'mounted' as ComponentState },
      ],
    };

    tree.mount(parent);
    const visited: string[] = [];
    tree.traverse((component, depth) => {
      visited.push(`${'  '.repeat(depth)}${component.id}`);
    });

    expect(visited.length).toBe(3); // parent, child1, child2
    expect(visited[0]).toBe('parent');
    expect(visited[1]).toBe('  child1');
    expect(visited[2]).toBe('  child2');
  });

  test('should get snapshot', () => {
    const component = {
      id: 'test-component',
      type: 'div',
      props: { className: 'test' },
    };

    tree.mount(component);
    const snapshot = tree.getSnapshot();
    expect(snapshot).toBeDefined();
    expect(snapshot?.root.id).toBe('test-component');
    expect(snapshot?.version).toBe(1);
  });

  test('should unmount recursively', () => {
    const parent = {
      id: 'parent',
      type: 'div',
      props: {},
      children: [
        { id: 'child1', type: 'span', props: {}, state: 'mounted' as ComponentState },
        { id: 'child2', type: 'span', props: {}, state: 'mounted' as ComponentState },
      ],
    };

    tree.mount(parent);
    tree.unmount('parent');
    expect(tree.get('parent')).toBeUndefined();
    expect(tree.get('child1')).toBeUndefined();
    expect(tree.get('child2')).toBeUndefined();
  });
});

describe('daoComponentTree singleton', () => {
  test('should be defined', () => {
    expect(daoComponentTree).toBeDefined();
  });

  test('should have consistent instance', () => {
    expect(daoComponentTree).toBeInstanceOf(DaoComponentTree);
  });
});
