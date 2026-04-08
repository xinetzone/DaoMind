export type DocType = 'api' | 'guide' | 'reference' | 'changelog';

export interface DaoDocEntry {
  readonly id: string;
  readonly type: DocType;
  readonly title: string;
  readonly content: string;
  readonly version: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly tags?: readonly string[];
  readonly relatedApis?: readonly string[];
}

export interface DaoApiDescription {
  readonly path: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  readonly summary: string;
  readonly params?: ReadonlyArray<{ name: string; type: string; required: boolean; description: string }>;
  readonly requestBody?: { type: string; description: string };
  readonly responses: ReadonlyArray<{ status: number; description: string; type?: string }>;
  readonly version: string;
}

export interface DaoVersionRecord {
  readonly version: string;
  readonly date: number;
  readonly changes: ReadonlyArray<{
    readonly type: 'added' | 'changed' | 'fixed' | 'removed';
    readonly description: string;
  }>;
}

export interface DaoKnowledgeNode {
  readonly id: string;
  readonly label: string;
  readonly type: string;
  readonly connections: ReadonlyArray<{ targetId: string; relation: string; weight: number }>;
}
