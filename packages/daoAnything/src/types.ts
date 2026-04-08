import type { ExistenceContract } from '@daomind/nothing';

export interface DaoModuleRegistration {
  readonly name: string;
  readonly version: string;
  readonly path: string;
  readonly dependencies?: readonly string[];
}

export type ModuleLifecycle =
  | 'registered'
  | 'initialized'
  | 'active'
  | 'suspending'
  | 'terminated';

export interface DaoModuleMeta extends ExistenceContract {
  readonly name: string;
  readonly lifecycle: ModuleLifecycle;
  readonly registeredAt: number;
  readonly activatedAt?: number;
}
