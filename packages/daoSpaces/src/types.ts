export type DaoSpaceId = string;

export interface DaoSpace {
  readonly id: DaoSpaceId;
  readonly name: string;
  readonly parent?: DaoSpaceId;
  readonly depth: number;
}

export interface DaoResourceLocator {
  readonly space: DaoSpaceId;
  readonly path: string[];
  readonly version?: string;
}

export type PartitionStrategy = 'hash' | 'range' | 'consistent';
