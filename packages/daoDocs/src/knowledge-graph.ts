import type { DaoKnowledgeNode } from './types.js';

interface GraphEdge {
  sourceId: string;
  targetId: string;
  relation: string;
  weight: number;
}

class DaoKnowledgeGraph {
  private nodes = new Map<string, DaoKnowledgeNode>();
  private edges: GraphEdge[] = [];

  addNode(node: Omit<DaoKnowledgeNode, 'connections'>): string {
    const id = node.id;
    if (!this.nodes.has(id)) {
      this.nodes.set(id, { ...node, connections: [] });
    } else {
      const existing = this.nodes.get(id)!;
      this.nodes.set(id, { ...existing, label: node.label, type: node.type });
    }
    return id;
  }

  removeNode(id: string): boolean {
    if (!this.nodes.has(id)) return false;
    this.nodes.delete(id);
    this.edges = this.edges.filter((e) => e.sourceId !== id && e.targetId !== id);
    for (const node of this.nodes.values()) {
      const filteredConnections = node.connections.filter((c) => c.targetId !== id);
      if (filteredConnections.length !== node.connections.length) {
        this.nodes.set(node.id, { ...node, connections: filteredConnections });
      }
    }
    return true;
  }

  addConnection(sourceId: string, targetId: string, relation: string, weight = 1): void {
    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
      throw new Error('[daoDocs] 节点不存在，无法建立连接');
    }
    const existingEdgeIdx = this.edges.findIndex(
      (e) => e.sourceId === sourceId && e.targetId === targetId && e.relation === relation
    );
    if (existingEdgeIdx !== -1) {
      this.edges[existingEdgeIdx] = { sourceId, targetId, relation, weight };
    } else {
      this.edges.push({ sourceId, targetId, relation, weight });
    }
    const sourceNode = this.nodes.get(sourceId)!;
    const connIdx = sourceNode.connections.findIndex(
      (c) => c.targetId === targetId && c.relation === relation
    );
    const newConnections = [...sourceNode.connections];
    if (connIdx !== -1) {
      newConnections[connIdx] = { targetId, relation, weight };
    } else {
      newConnections.push({ targetId, relation, weight });
    }
    this.nodes.set(sourceId, { ...sourceNode, connections: newConnections });
  }

  findRelated(
    id: string,
    depth = 1
  ): ReadonlyArray<{ node: DaoKnowledgeNode; depth: number }> {
    const startNode = this.nodes.get(id);
    if (!startNode) return [];
    const visited = new Set<string>([id]);
    const result: { node: DaoKnowledgeNode; depth: number }[] = [];
    const queue: Array<{ nodeId: string; d: number }> = [{ nodeId: id, d: 0 }];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.d > depth) continue;
      if (current.d > 0) {
        const currentNode = this.nodes.get(current.nodeId);
        if (currentNode) result.push({ node: currentNode, depth: current.d });
      }
      const neighbors = this.getNeighbors(current.nodeId);
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({ nodeId: neighborId, d: current.d + 1 });
        }
      }
    }
    return result;
  }

  getPath(fromId: string, toId: string): ReadonlyArray<string> | null {
    if (fromId === toId) return [fromId];
    const visited = new Set<string>([fromId]);
    const queue: Array<string[]> = [[fromId]];
    while (queue.length > 0) {
      const path = queue.shift()!;
      const current = path[path.length - 1]!;
      const neighbors = this.getNeighbors(current);
      for (const neighborId of neighbors) {
        if (neighborId === toId) return [...path, toId];
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push([...path, neighborId]);
        }
      }
    }
    return null;
  }

  getStats(): { nodeCount: number; edgeCount: number; avgConnections: number } {
    const nodeCount = this.nodes.size;
    const edgeCount = this.edges.length;
    let totalConns = 0;
    for (const node of this.nodes.values()) {
      totalConns += node.connections.length;
    }
    const avgConnections = nodeCount > 0 ? totalConns / nodeCount : 0;
    return { nodeCount, edgeCount, avgConnections };
  }

  private getNeighbors(nodeId: string): string[] {
    const neighbors: string[] = [];
    for (const edge of this.edges) {
      if (edge.sourceId === nodeId) neighbors.push(edge.targetId);
      if (edge.targetId === nodeId) neighbors.push(edge.sourceId);
    }
    return [...new Set(neighbors)];
  }
}

export const daoKnowledgeGraph = new DaoKnowledgeGraph();
export { DaoKnowledgeGraph };
