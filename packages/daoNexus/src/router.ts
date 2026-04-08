// 帛书依据："曲则全，枉则直"（德经·二十二章）
// 设计原则：路由器将请求路径映射至目标节点
// 曲折方能周全，迂回始可直达

import type { DaoRouteRule } from './types.js';

class DaoNexusRouter {
  private readonly rules: DaoRouteRule[] = [];

  addRule(rule: DaoRouteRule): void {
    const existingIdx = this.rules.findIndex((r) => r.pattern === rule.pattern && r.target === rule.target);
    if (existingIdx >= 0) {
      this.rules[existingIdx] = rule;
    } else {
      this.rules.push(rule);
      this.rules.sort((a, b) => b.priority - a.priority);
    }
  }

  removeRule(pattern: string): boolean {
    const idx = this.rules.findIndex((r) => r.pattern === pattern);
    if (idx < 0) return false;
    this.rules.splice(idx, 1);
    return true;
  }

  resolve(path: string): ReadonlyArray<DaoRouteRule> {
    const matched: DaoRouteRule[] = [];
    for (const rule of this.rules) {
      if (this.matchPattern(rule.pattern, path)) {
        matched.push(rule);
      }
    }
    return matched;
  }

  route(data: { path: string; payload: unknown }): string | null {
    const matched = this.resolve(data.path);
    if (matched.length === 0) return null;
    const first = matched[0];
    return first?.target ?? null;
  }

  getAllRules(): ReadonlyArray<DaoRouteRule> {
    return [...this.rules];
  }

  clear(): void {
    this.rules.length = 0;
  }

  private matchPattern(pattern: string, path: string): boolean {
    if (pattern === '*') return true;
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return path.startsWith(prefix);
    }
    if (pattern.startsWith('*')) {
      const suffix = pattern.slice(1);
      return path.endsWith(suffix);
    }
    if (pattern.includes('*')) {
      const parts = pattern.split('*');
      if (parts.length !== 2) return false;
      const prefix = parts[0];
      const suffix = parts[1];
      if (prefix == null || suffix == null) return false;
      return path.startsWith(prefix) && path.endsWith(suffix) && path.length >= prefix.length + suffix.length;
    }
    return pattern === path;
  }
}

export const daoNexusRouter = new DaoNexusRouter();
export { DaoNexusRouter };
