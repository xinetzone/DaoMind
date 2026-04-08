import type { AppState } from './types';

interface StateTransition {
  from: AppState;
  to: AppState;
  timestamp: number;
}

class DaoLifecycleManager {
  private readonly listeners = new Map<string, Array<(from: AppState, to: AppState) => void>>();
  private readonly histories = new Map<string, StateTransition[]>();
  private readonly MAX_HISTORY = 100;

  onStateChange(appId: string, callback: (from: AppState, to: AppState) => void): () => void {
    if (!this.listeners.has(appId)) {
      this.listeners.set(appId, []);
    }
    const list = this.listeners.get(appId)!;
    list.push(callback);
    let disposed = false;
    return () => {
      if (disposed) return;
      disposed = true;
      const idx = list.indexOf(callback);
      if (idx !== -1) list.splice(idx, 1);
    };
  }

  emit(appId: string, from: AppState, to: AppState): void {
    const transition: StateTransition = { from, to, timestamp: Date.now() };
    if (!this.histories.has(appId)) {
      this.histories.set(appId, []);
    }
    const history = this.histories.get(appId)!;
    history.push(transition);
    if (history.length > this.MAX_HISTORY) {
      history.shift();
    }
    const list = this.listeners.get(appId);
    if (list) {
      for (const cb of list) {
        try {
          cb(from, to);
        } catch {}
      }
    }
  }

  getHistory(appId: string, limit?: number): ReadonlyArray<{ from: AppState; to: AppState; timestamp: number }> {
    const history = this.histories.get(appId);
    if (!history) return [];
    if (limit !== undefined && limit >= 0) {
      return history.slice(-limit);
    }
    return [...history];
  }
}

export const daoLifecycleManager = new DaoLifecycleManager();
export { DaoLifecycleManager };
