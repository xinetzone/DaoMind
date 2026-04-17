// 高级功能层 — times + skills + nexus + docs + spaces + pages + 对应 universe-*
export type { DaoTimerHandle, DaoTimerOptions, DaoScheduledTask, DaoTimeWindow } from '@daomind/times';
export { DaoTimer, DaoScheduler, daoTimer, daoScheduler, daoTimeWindow } from '@daomind/times';
export type { ExecutionRecord } from '../universe-scheduler';
export { DaoUniverseScheduler } from '../universe-scheduler';
export type { TimesSnapshot } from '../universe-times';
export { DaoUniverseTimes } from '../universe-times';

export type { SkillId, SkillState, DaoSkillDefinition, DaoSkillInstance, DaoSkillScore } from '@daomind/skills';
export { DaoSkillRegistry, daoSkillRegistry, DaoSkillActivator, daoSkillActivator, DaoSkillScorer, daoSkillScorer, DaoSkillCombiner, daoSkillCombiner } from '@daomind/skills';
export type { SkillEventRecord } from '../universe-skills';
export { DaoUniverseSkills } from '../universe-skills';

export type { ConnectionType, ConnectionState, ConnectionHandle, DaoConnection, DaoRouteRule, LoadBalanceStrategy, DaoServiceInstance, DaoNexusRequest, DaoNexusMetrics } from '@daomind/nexus';
export { DaoServiceDiscovery, daoServiceDiscovery, DaoNexusRouter, daoNexusRouter, DaoLoadBalancer, daoLoadBalancer } from '@daomind/nexus';
export type { NexusHealthRecord, NexusDispatchResult, NexusMetrics } from '../universe-nexus';
export { DaoUniverseNexus } from '../universe-nexus';

export type { DocType, DaoDocEntry, DaoApiDescription, DaoVersionRecord, DaoKnowledgeNode } from '@daomind/docs';
export { daoDocStore, DaoDocStore, daoApiDocs, DaoApiDocs, daoVersionTracker, DaoVersionTracker, daoKnowledgeGraph, DaoKnowledgeGraph } from '@daomind/docs';
export type { DocAuditResult, DocsSnapshot } from '../universe-docs';
export { DaoUniverseDocs } from '../universe-docs';

export type { DaoSpaceId, DaoSpace, DaoResourceLocator, PartitionStrategy } from '@daomind/spaces';
export { daoNamespace, DaoNamespaceManager } from '@daomind/spaces';
export type { SpacesSnapshot } from '../universe-spaces';
export { DaoUniverseSpaces } from '../universe-spaces';

export type { ComponentState, DaoComponent, DaoViewSnapshot, BindingPath, DaoBinding } from '@daomind/pages';
export { daoComponentTree, DaoComponentTree, daoStateBinding, DaoStateBinding } from '@daomind/pages';
export type { PagesSnapshot } from '../universe-pages';
export { DaoUniversePages } from '../universe-pages';
