import type { DaoApiDescription } from './types.js';

class DaoApiDocs {
  private apis: DaoApiDescription[] = [];

  registerApi(api: Omit<DaoApiDescription, 'version'>): void {
    const existingIdx = this.apis.findIndex(
      (a) => a.path === api.path && a.method === api.method
    );
    const entry: DaoApiDescription = { ...api, version: '1.0.0' };
    if (existingIdx !== -1) {
      this.apis[existingIdx] = entry;
    } else {
      this.apis.push(entry);
    }
  }

  unregisterApi(path: string, method: string): boolean {
    const beforeLen = this.apis.length;
    this.apis = this.apis.filter((a) => !(a.path === path && a.method === method));
    return this.apis.length < beforeLen;
  }

  getApi(path: string, method: string): DaoApiDescription | undefined {
    return this.apis.find((a) => a.path === path && a.method === method);
  }

  listApis(): ReadonlyArray<DaoApiDescription> {
    return [...this.apis];
  }

  generateSummary(): { totalApis: number; byMethod: Record<string, number>; latestVersion: string } {
    const byMethod: Record<string, number> = {};
    let latestVersion = '0.0.0';
    for (const api of this.apis) {
      byMethod[api.method] = (byMethod[api.method] ?? 0) + 1;
      if (this.compareVersions(api.version, latestVersion) > 0) {
        latestVersion = api.version;
      }
    }
    return { totalApis: this.apis.length, byMethod, latestVersion };
  }

  private compareVersions(v1: string, v2: string): number {
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
}

export const daoApiDocs = new DaoApiDocs();
export { DaoApiDocs };
