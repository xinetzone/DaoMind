import type { DaoScheduledTask } from './types';

class DaoScheduler {
  private readonly tasks = new Map<string, DaoScheduledTask>();
  private nextId = 0;

  schedule<T>(task: Omit<DaoScheduledTask<T>, 'id'>): string {
    const id = `task-${++this.nextId}`;
    this.tasks.set(id, { ...task, id } as DaoScheduledTask);
    return id;
  }

  cancel(taskId: string): boolean {
    return this.tasks.delete(taskId);
  }

  async next(): Promise<unknown> {
    const now = Date.now();
    let earliest: DaoScheduledTask | null = null;

    for (const task of this.tasks.values()) {
      if (task.executeAt <= now) {
        if (!earliest || task.priority > earliest.priority) {
          earliest = task;
        }
      }
    }

    if (!earliest) {
      const tasks = Array.from(this.tasks.values());
      if (tasks.length === 0) return undefined;
      const nearest = tasks.reduce((a, b) =>
        a.executeAt < b.executeAt ? a : b
      );
      const wait = nearest.executeAt - Date.now();
      if (wait > 0) {
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
      return this.next();
    }

    this.tasks.delete(earliest.id);
    return earliest.handler();
  }

  pending(): number {
    const now = Date.now();
    let count = 0;
    for (const task of this.tasks.values()) {
      if (task.executeAt <= now) count++;
    }
    return count;
  }
}

export const daoScheduler = new DaoScheduler();
export { DaoScheduler };
