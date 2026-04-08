export type ComponentState = 'mounted' | 'updating' | 'unmounting' | 'unmounted';

export interface DaoComponent {
  readonly id: string;
  readonly type: string;
  readonly props: Record<string, unknown>;
  readonly state: ComponentState;
  readonly children?: readonly DaoComponent[];
}

export interface DaoViewSnapshot {
  readonly root: DaoComponent;
  readonly timestamp: number;
  readonly version: number;
}

export type BindingPath = readonly string[];

export interface DaoBinding {
  readonly path: BindingPath;
  readonly componentId: string;
  readonly property: string;
  readonly transform?: (value: unknown) => unknown;
}
