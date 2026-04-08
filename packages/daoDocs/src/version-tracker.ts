import type { DaoVersionRecord } from './types.js';

class DaoVersionTracker {
  private history: DaoVersionRecord[] = [];

  record(record: Omit<DaoVersionRecord, 'date'>): void {
    this.history.push({ ...record, date: Date.now() });
  }

  getHistory(limit?: number): ReadonlyArray<DaoVersionRecord> {
    if (limit !== undefined && limit >= 0) {
      return this.history.slice(-limit);
    }
    return [...this.history];
  }

  getCurrentVersion(): string | null {
    if (this.history.length === 0) return null;
    return this.history[this.history.length - 1]!.version;
  }

  compareVersions(v1: string, v2: string): -1 | 0 | 1 {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] ?? 0;
      const p2 = parts2[i] ?? 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }

  generateChangelog(sinceVersion?: string): string {
    const lines: string[] = ['# 变更日志\n'];
    let startIndex = 0;
    if (sinceVersion) {
      const idx = this.history.findIndex((r) => r.version === sinceVersion);
      if (idx !== -1) startIndex = idx + 1;
    }
    for (let i = startIndex; i < this.history.length; i++) {
      const rec = this.history[i]!;
      lines.push(`## ${rec.version} (${new Date(rec.date).toLocaleDateString('zh-CN')})`);
      for (const change of rec.changes) {
        const emoji =
          change.type === 'added'
            ? '✅'
            : change.type === 'changed'
              ? '🔄'
              : change.type === 'fixed'
                ? '🔧'
                : '❌';
        lines.push(`- ${emoji} **${change.type}**: ${change.description}`);
      }
      lines.push('');
    }
    return lines.join('\n');
  }
}

export const daoVersionTracker = new DaoVersionTracker();
export { DaoVersionTracker };
