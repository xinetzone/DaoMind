import type { AgentState, DaoAgent } from './types';

class DaoAgentRegistry {
  private readonly agents = new Map<string, DaoAgent>();

  register(agent: DaoAgent): void {
    if (this.agents.has(agent.id)) {
      throw new Error(`[daoAgents] Agent 已注册: ${agent.id}`);
    }
    this.agents.set(agent.id, agent);
  }

  unregister(id: string): boolean {
    return this.agents.delete(id);
  }

  get(id: string): DaoAgent | undefined {
    return this.agents.get(id);
  }

  findByCapability(capability: string): ReadonlyArray<DaoAgent> {
    const result: DaoAgent[] = [];
    for (const agent of this.agents.values()) {
      if (agent.state !== 'deceased' && agent.capabilities.some((c) => c.name === capability)) {
        result.push(agent);
      }
    }
    return result;
  }

  findByType(type: string): ReadonlyArray<DaoAgent> {
    const result: DaoAgent[] = [];
    for (const agent of this.agents.values()) {
      if (agent.agentType === type) {
        result.push(agent);
      }
    }
    return result;
  }

  listAll(): ReadonlyArray<DaoAgent> {
    return Array.from(this.agents.values());
  }

  countByState(state: AgentState): number {
    let count = 0;
    for (const agent of this.agents.values()) {
      if (agent.state === state) count++;
    }
    return count;
  }
}

export const daoAgentRegistry = new DaoAgentRegistry();
export { DaoAgentRegistry };
