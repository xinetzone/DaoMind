/**
 * 背压与流量控制
 * 帕书《道德经》乙本·四十二章："万物负阴而抱阳，冲气以为和"
 * 气流过盛则溢，过衰则竭；背压机制维持系统之"和"
 */

export interface BackpressureConfig {
  maxRatePerNode: number;
  sampleRate: number;
  windowSize: number;
}

const DEFAULT_CONFIG: BackpressureConfig = {
  maxRatePerNode: 100,
  sampleRate: 0.5,
  windowSize: 1000,
};

interface NodeStats {
  timestamps: number[];
  limited: boolean;
}

export class DaoBackpressure {
  private config: BackpressureConfig;
  private nodes = new Map<string, NodeStats>();

  constructor(config?: Partial<BackpressureConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  allow(nodeId: string): boolean {
    const now = Date.now();
    let stats = this.nodes.get(nodeId);
    if (!stats) {
      stats = { timestamps: [], limited: false };
      this.nodes.set(nodeId, stats);
    }
    stats.timestamps = stats.timestamps.filter(t => now - t < this.config.windowSize);
    const current = stats.timestamps.length;
    const limit = stats.limited
      ? Math.floor(this.config.maxRatePerNode * this.config.sampleRate)
      : this.config.maxRatePerNode;
    if (current >= limit) {
      stats.limited = true;
      return false;
    }
    if (current < this.config.maxRatePerNode * this.config.sampleRate) {
      stats.limited = false;
    }
    return true;
  }

  record(nodeId: string): void {
    const stats = this.nodes.get(nodeId);
    if (stats) {
      stats.timestamps.push(Date.now());
    }
  }

  getStats(nodeId: string): { current: number; limited: boolean } {
    const now = Date.now();
    const stats = this.nodes.get(nodeId);
    if (!stats) return { current: 0, limited: false };
    const filtered = stats.timestamps.filter(t => now - t < this.config.windowSize);
    return { current: filtered.length, limited: stats.limited };
  }
}
