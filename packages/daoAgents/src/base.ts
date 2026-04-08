import type { DaoAgent, AgentState, DaoAgentCapability } from './types';

const VALID_STATE_TRANSITIONS: Record<AgentState, readonly AgentState[]> = {
  dormant: ['awakening', 'deceased'],
  awakening: ['active', 'dormant', 'deceased'],
  active: ['resting', 'deceased'],
  resting: ['active', 'dormant', 'deceased'],
  deceased: [],
};

abstract class DaoBaseAgent implements DaoAgent {
  abstract readonly agentType: string;
  abstract readonly capabilities: ReadonlyArray<DaoAgentCapability>;

  readonly id: string;
  readonly createdAt: number;
  readonly existentialType: 'nothing' | 'anything' = 'anything';
  private _state: AgentState = 'dormant';

  constructor(id: string) {
    this.id = id;
    this.createdAt = Date.now();
  }

  get state(): AgentState {
    return this._state;
  }

  protected setState(next: AgentState): void {
    const allowed = VALID_STATE_TRANSITIONS[this._state];
    if (!allowed.includes(next)) {
      throw new Error(
        `[daoAgents] 非法状态转换: ${this.id} 从 "${this._state}" 到 "${next}"`
      );
    }
    this._state = next;
  }

  async initialize(): Promise<void> {
    this.setState('awakening');
  }

  async activate(): Promise<void> {
    this.setState('active');
  }

  async rest(): Promise<void> {
    this.setState('resting');
  }

  async terminate(): Promise<void> {
    this.setState('deceased');
  }

  abstract execute<T>(action: string, payload?: unknown): Promise<T>;
}

export { DaoBaseAgent };
