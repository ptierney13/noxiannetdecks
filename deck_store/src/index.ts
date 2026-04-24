export type {
  DeckDataEnvironment,
  DeckDataLayout
} from "./config.js";
export {
  resolveRepositoryLocalDeckDataDir,
  resolveDefaultDeckDataDir,
  resolveDeckDataLayout
} from "./config.js";
export { initializeDeckDataLayout } from "./bootstrap.js";
export type {
  ArchiveLayer,
  ArchiveLayerStats,
  ArchiveManifest,
  ArchiveSourceStats
} from "./archive/manifest.js";
export {
  archiveLayerSchema,
  archiveLayerStatsSchema,
  archiveManifestSchema,
  archiveSourceStatsSchema,
  createEmptyArchiveManifest
} from "./archive/manifest.js";
export { formatBytes, generateArchiveManifest, manifestSummaryLines, writeArchiveManifest } from "./archive/fs.js";
export type {
  AuditSource,
  AuditSourceRole,
  AuditTarget,
  AuditTargetStatus,
  SourceAuditPlan
} from "./audit/schema.js";
export {
  auditSourceRoleSchema,
  auditSourceSchema,
  auditTargetSchema,
  auditTargetStatusSchema,
  sourceAuditPlanSchema
} from "./audit/schema.js";
export { createDefaultSourceAuditPlan } from "./audit/default-plan.js";
export type { SourceAuditPlanSource } from "./audit/repository.js";
export { JsonFileSourceAuditPlanSource, loadSourceAuditPlan } from "./audit/repository.js";
export type {
  CanonicalStage1Dataset,
  DeckCardRecord,
  DeckCardSection,
  DeckRecord,
  DeckSource,
  DeckSourceKind,
  DecklistStatus,
  EventRecord,
  EventStanding,
  LegendRecord,
  MetagameBucket,
  ProvenanceConfidence,
  ProvenanceEvidence,
  ProvenanceSourceKind,
  RecordProvenance,
  ReviewFlag,
  ReviewState,
  ReviewStatus,
  PrestigeLevel,
  PrimaryRegion,
  RegionBucket,
  SourceCaptureKind,
  SourceCaptureRecord,
  SourceUsePolicy,
  SourceSite
} from "./data/schema.js";
export {
  canonicalStage1DatasetSchema,
  deckCardRecordSchema,
  deckCardSectionSchema,
  deckRecordSchema,
  deckSourceSchema,
  deckSourceKindSchema,
  decklistStatusSchema,
  eventRecordSchema,
  eventStandingSchema,
  legendRecordSchema,
  metagameBucketSchema,
  provenanceConfidenceSchema,
  provenanceEvidenceSchema,
  provenanceSourceKindSchema,
  prestigeLevelSchema,
  primaryRegionSchema,
  regionBucketSchema,
  recordProvenanceSchema,
  reviewFlagSchema,
  reviewStateSchema,
  reviewStatusSchema,
  sourceCaptureKindSchema,
  sourceCaptureRecordSchema,
  sourceUsePolicySchema,
  sourceSiteSchema
} from "./data/schema.js";
export type { Stage1DatasetSource } from "./data/repository.js";
export {
  createStage1DatasetRepository,
  JsonFileStage1DatasetSource,
  loadCanonicalStage1Dataset,
  Stage1DatasetRepository
} from "./data/repository.js";
export type {
  DeckDetailSnapshot,
  EventDetailSnapshot,
  EventIndexSnapshot,
  FilterSummary,
  LegendDetailSnapshot,
  MetagamePilotBundle,
  MetagameOverviewSnapshot,
  SnapshotManifest
} from "./export/schema.js";
export {
  deckDetailSnapshotSchema,
  eventDetailSnapshotSchema,
  eventIndexSnapshotSchema,
  legendDetailSnapshotSchema,
  metagamePilotBundleSchema,
  metagameOverviewSnapshotSchema,
  snapshotManifestSchema
} from "./export/schema.js";
export type { MetagamePilotBundleSource, SnapshotManifestSource } from "./export/repository.js";
export {
  JsonFileMetagamePilotBundleSource,
  JsonFileSnapshotManifestSource,
  loadMetagamePilotBundle,
  loadSnapshotManifest
} from "./export/repository.js";
export { createCcs10kTop8PilotArtifacts } from "./pilot/ccs-10k-top8.js";
