export type {
  DocType,
  DaoDocEntry,
  DaoApiDescription,
  DaoVersionRecord,
  DaoKnowledgeNode,
} from './types.js';
export { daoDocStore, DaoDocStore } from './doc-store.js';
export { daoApiDocs, DaoApiDocs } from './api-docs.js';
export { daoVersionTracker, DaoVersionTracker } from './version-tracker.js';
export { daoKnowledgeGraph, DaoKnowledgeGraph } from './knowledge-graph.js';

export const daoDocs = {
  name: '@dao/docs',
  description: '文档层 — 记录之意，知识与理解的载体',
}
