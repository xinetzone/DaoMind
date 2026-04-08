import type { FlowVector } from './types.js';

interface Edge {
  from: string;
  to: string;
  magnitude: number;
  direction: FlowVector['direction'];
  pressure: number;
}

export class DaoVectorField {
  private edges = new Map<string, Edge>();
  private adjacencyIn = new Map<string, Set<string>>();
  private adjacencyOut = new Map<string, Set<string>>();

  private edgeKey(from: string, to: string): string {
    return `${from}->${to}`;
  }

  recordFlow(
    from: string,
    to: string,
    magnitude: number,
    direction: FlowVector['direction'],
  ): void {
    const key = this.edgeKey(from, to);
    const existing = this.edges.get(key);
    const pressure = existing ? Math.min(1, magnitude / (existing.magnitude + 1)) : 0;

    this.edges.set(key, { from, to, magnitude, direction, pressure });

    if (!this.adjacencyOut.has(from)) this.adjacencyOut.set(from, new Set());
    if (!this.adjacencyIn.has(to)) this.adjacencyIn.set(to, new Set());
    this.adjacencyOut.get(from)!.add(to);
    this.adjacencyIn.get(to)!.add(from);
  }

  getVectors(): ReadonlyArray<FlowVector> {
    return Array.from(this.edges.values()).map((e) => ({
      ...e,
    }));
  }

  getNodeInbound(nodeId: string): ReadonlyArray<FlowVector> {
    const sources = this.adjacencyIn.get(nodeId);
    if (!sources) return [];
    return Array.from(sources)
      .map((s) => this.edges.get(this.edgeKey(s, nodeId))!)
      .filter(Boolean);
  }

  getNodeOutbound(nodeId: string): ReadonlyArray<FlowVector> {
    const targets = this.adjacencyOut.get(nodeId);
    if (!targets) return [];
    return Array.from(targets)
      .map((t) => this.edges.get(this.edgeKey(nodeId, t))!)
      .filter(Boolean);
  }

  getHotspots(
    limit = 10,
  ): ReadonlyArray<{ nodeId: string; totalThroughput: number }> {
    const throughput = new Map<string, number>();
    for (const edge of this.edges.values()) {
      throughput.set(
        edge.from,
        (throughput.get(edge.from) || 0) + edge.magnitude,
      );
      throughput.set(
        edge.to,
        (throughput.get(edge.to) || 0) + edge.magnitude,
      );
    }
    return Array.from(throughput.entries())
      .map(([nodeId, totalThroughput]) => ({ nodeId, totalThroughput }))
      .sort((a, b) => b.totalThroughput - a.totalThroughput)
      .slice(0, limit);
  }
}
