// 帛书依据："为学日益，为道日损"（乙本·四十八章）
// 设计原则：DaoModuleGraph 是"有名"层的依赖图引擎。
//   它接收模块的依赖声明（无名类型），
//   通过拓扑排序给出初始化顺序，通过环检测保证系统无循环依赖。
//   "无为而无不为"——图本身不创建模块，仅揭示天然顺序。

import type { DaoModuleRegistration, DaoModuleGraphNode, DaoModuleGraphSnapshot } from '@daomind/nothing';

/** 内部可变节点（仅在构建过程中使用） */
interface MutableNode {
  name: string;
  dependencies: string[];
  dependents: string[];
  depth: number;
}

/**
 * DaoModuleGraph —— 模块依赖图
 *
 * 负责：
 * - 接收模块注册信息，构建有向无环图（DAG）
 * - 通过拓扑排序给出确定性的初始化顺序
 * - 检测循环依赖，防止系统陷入死锁
 * - 计算每个模块的依赖深度
 *
 * @example
 * ```ts
 * const graph = new DaoModuleGraph();
 * graph.addModule('core', []);
 * graph.addModule('auth', ['core']);
 * graph.addModule('api', ['auth', 'core']);
 * const order = graph.topologicalOrder(); // ['core', 'auth', 'api']
 * ```
 */
export class DaoModuleGraph {
  private readonly nodes = new Map<string, MutableNode>();

  /** 从 DaoModuleRegistration 批量添加模块 */
  addFromRegistrations(registrations: ReadonlyArray<DaoModuleRegistration>): void {
    for (const reg of registrations) {
      this.addModule(reg.name, reg.dependencies ? [...reg.dependencies] : []);
    }
  }

  /**
   * 添加单个模块到依赖图
   * @param name  模块名称（唯一标识）
   * @param deps  该模块依赖的其他模块名称列表
   */
  addModule(name: string, deps: readonly string[] = []): void {
    if (!this.nodes.has(name)) {
      this.nodes.set(name, { name, dependencies: [], dependents: [], depth: 0 });
    }
    const node = this.nodes.get(name)!;
    for (const dep of deps) {
      if (!node.dependencies.includes(dep)) {
        node.dependencies.push(dep);
      }
      // 确保依赖节点存在
      if (!this.nodes.has(dep)) {
        this.nodes.set(dep, { name: dep, dependencies: [], dependents: [], depth: 0 });
      }
      const depNode = this.nodes.get(dep)!;
      if (!depNode.dependents.includes(name)) {
        depNode.dependents.push(name);
      }
    }
  }

  /** 移除模块（同时清理相关的 dependents 引用） */
  removeModule(name: string): boolean {
    const node = this.nodes.get(name);
    if (!node) return false;
    // 清理其依赖项对该模块的 dependents 引用
    for (const dep of node.dependencies) {
      const depNode = this.nodes.get(dep);
      if (depNode) {
        depNode.dependents = depNode.dependents.filter((d) => d !== name);
      }
    }
    // 清理依赖此模块的节点的 dependencies 引用
    for (const dependent of node.dependents) {
      const dependentNode = this.nodes.get(dependent);
      if (dependentNode) {
        dependentNode.dependencies = dependentNode.dependencies.filter((d) => d !== name);
      }
    }
    this.nodes.delete(name);
    return true;
  }

  /** 返回模块的直接依赖列表 */
  getDependencies(name: string): ReadonlyArray<string> {
    return this.nodes.get(name)?.dependencies ?? [];
  }

  /** 返回直接依赖此模块的模块列表 */
  getDependents(name: string): ReadonlyArray<string> {
    return this.nodes.get(name)?.dependents ?? [];
  }

  /** 返回某模块的所有传递性依赖（递归） */
  getTransitiveDependencies(name: string): ReadonlySet<string> {
    const visited = new Set<string>();
    const queue: string[] = [name];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const node = this.nodes.get(current);
      if (!node) continue;
      for (const dep of node.dependencies) {
        if (!visited.has(dep)) {
          visited.add(dep);
          queue.push(dep);
        }
      }
    }
    return visited;
  }

  /**
   * Kahn 算法拓扑排序
   * @returns 确定性的初始化顺序（依赖方在后）；若有环则返回 null
   */
  topologicalOrder(): ReadonlyArray<string> | null {
    // 每个节点的入度 = 其 dependencies 数量（需等待所有依赖先完成）
    const inDegree = new Map<string, number>();
    for (const [name, node] of this.nodes) {
      inDegree.set(name, node.dependencies.length);
    }

    // 队列：所有入度为 0 的节点（无任何依赖）
    const queue: string[] = [];
    for (const [name, degree] of inDegree) {
      if (degree === 0) queue.push(name);
    }
    queue.sort(); // 确定性排序

    const result: string[] = [];
    while (queue.length > 0) {
      queue.sort(); // 每轮排序保证确定性
      const current = queue.shift()!;
      result.push(current);
      const node = this.nodes.get(current);
      if (!node) continue;
      for (const dependent of [...node.dependents].sort()) {
        const newDegree = (inDegree.get(dependent) ?? 1) - 1;
        inDegree.set(dependent, newDegree);
        if (newDegree === 0) queue.push(dependent);
      }
    }

    if (result.length !== this.nodes.size) return null; // 有环
    return result;
  }

  /** 检测图中是否存在循环依赖 */
  hasCycle(): boolean {
    return this.topologicalOrder() === null;
  }

  /**
   * 找出所有参与循环依赖的节点
   * 使用 DFS + 颜色标记法（白=未访问, gray=访问中, black=已完成）
   */
  findCycleNodes(): ReadonlyArray<string> {
    const color = new Map<string, 'white' | 'gray' | 'black'>();
    const cycleNodes = new Set<string>();
    for (const name of this.nodes.keys()) color.set(name, 'white');

    const dfs = (name: string): boolean => {
      color.set(name, 'gray');
      const node = this.nodes.get(name);
      if (!node) { color.set(name, 'black'); return false; }
      let foundCycle = false;
      for (const dep of node.dependencies) {
        const c = color.get(dep) ?? 'white';
        if (c === 'gray') {
          cycleNodes.add(name);
          cycleNodes.add(dep);
          foundCycle = true;
        } else if (c === 'white') {
          if (dfs(dep)) {
            cycleNodes.add(name);
            foundCycle = true;
          }
        }
      }
      color.set(name, 'black');
      return foundCycle;
    };

    for (const name of this.nodes.keys()) {
      if (color.get(name) === 'white') dfs(name);
    }
    return Array.from(cycleNodes).sort();
  }

  /** 计算每个节点的拓扑深度（从根节点出发的最长路径） */
  private computeDepths(): Map<string, number> {
    const depths = new Map<string, number>();
    const order = this.topologicalOrder();
    if (!order) return depths; // 有环时无法计算

    for (const name of order) {
      const node = this.nodes.get(name);
      if (!node) continue;
      let maxDepParent = -1;
      for (const dep of node.dependencies) {
        maxDepParent = Math.max(maxDepParent, depths.get(dep) ?? 0);
      }
      depths.set(name, maxDepParent + 1);
    }
    return depths;
  }

  /** 获取所有节点名称 */
  moduleNames(): ReadonlyArray<string> {
    return Array.from(this.nodes.keys()).sort();
  }

  /** 判断某模块是否存在于图中 */
  has(name: string): boolean {
    return this.nodes.has(name);
  }

  /** 当前图的节点数量 */
  get size(): number {
    return this.nodes.size;
  }

  /**
   * 生成完整快照（不可变）
   * @returns DaoModuleGraphSnapshot
   */
  snapshot(): DaoModuleGraphSnapshot {
    const depths = this.computeDepths();
    const order = this.topologicalOrder();
    const cycleNodes = order === null ? this.findCycleNodes() : [];
    let maxDepth = 0;

    const nodes: DaoModuleGraphNode[] = [];
    for (const [name, node] of this.nodes) {
      const depth = depths.get(name) ?? 0;
      if (depth > maxDepth) maxDepth = depth;
      nodes.push({
        name,
        dependencies: [...node.dependencies].sort(),
        dependents: [...node.dependents].sort(),
        depth,
      });
    }
    nodes.sort((a, b) => a.name.localeCompare(b.name));

    return {
      nodes,
      topologicalOrder: order ?? [],
      hasCycle: order === null,
      cycleNodes,
      totalModules: this.nodes.size,
      maxDepth,
    };
  }

  /** 重置图（清空所有节点） */
  clear(): void {
    this.nodes.clear();
  }
}

/** 全局模块依赖图单例 */
export const daoModuleGraph = new DaoModuleGraph();
