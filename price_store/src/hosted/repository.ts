import type { CanonicalSnapshotMetadata } from "../canonical/schema.js";
import { canonicalSnapshotMetadataSchema } from "../canonical/schema.js";
import type { PublishedPriceExportMetadata, PublishedPriceManifest, PublishedPriceSnapshot } from "../published/schema.js";
import {
  publishedPriceExportMetadataSchema,
  publishedPriceManifestSchema,
  publishedPriceSnapshotSchema
} from "../published/schema.js";
import type { RawCaptureMetadata } from "../raw/schema.js";
import { rawCaptureMetadataSchema } from "../raw/schema.js";
import type { PriceRunStage, PriceRunStatus } from "../runs/schema.js";
import { priceRunStatusSchema } from "../runs/schema.js";
import { getJson, putJson, type HostedObjectStore } from "./object-store.js";
import {
  resolveActiveCaptureStatePath,
  resolveHostedCanonicalSnapshotPaths,
  resolveHostedPublishedManifestPath,
  resolveHostedPublishedMetadataPath,
  resolveHostedPublishedSnapshotPath,
  resolveHostedRawCapturePaths,
  resolveHostedRunStatusPath,
  resolveLatestSuccessfulCaptureStatePath
} from "./paths.js";
import type { ActiveCaptureState, LatestSuccessfulCaptureState } from "./schema.js";
import { activeCaptureStateSchema, latestSuccessfulCaptureStateSchema } from "./schema.js";

export type HostedPublishedArtifactsResult = {
  exportManifestPath: string;
  exportSnapshotPath: string;
  exportMetadataPath: string;
  metadata: PublishedPriceExportMetadata;
};

export async function writeHostedRawCapture(
  store: HostedObjectStore,
  input: {
    sourceId: string;
    runId: string;
    capturedAt: string;
    captureKey: string;
    payload: string;
    payloadFormat: RawCaptureMetadata["payloadFormat"];
    requestUrl?: string;
    notes?: string[];
  }
): Promise<RawCaptureMetadata> {
  const paths = resolveHostedRawCapturePaths({
    sourceId: input.sourceId,
    capturedAt: input.capturedAt,
    captureKey: input.captureKey,
    extension: "json"
  });
  const metadata = rawCaptureMetadataSchema.parse({
    version: 1,
    sourceId: input.sourceId,
    runId: input.runId,
    capturedAt: input.capturedAt,
    payloadFormat: input.payloadFormat,
    relativePayloadPath: paths.relativePayloadPath,
    captureKey: input.captureKey,
    requestUrl: input.requestUrl,
    notes: input.notes ?? []
  });

  await store.putText(paths.relativePayloadPath, input.payload);
  await putJson(store, paths.relativeMetadataPath, metadata);

  return metadata;
}

export async function writeHostedCanonicalSnapshot(
  store: HostedObjectStore,
  input: Omit<CanonicalSnapshotMetadata, "version" | "relativeSnapshotPath"> & {
    sourceId: string;
    snapshotKey: string;
    snapshot: string;
  }
): Promise<CanonicalSnapshotMetadata> {
  const paths = resolveHostedCanonicalSnapshotPaths({
    sourceId: input.sourceId,
    capturedAt: input.capturedAt,
    snapshotKey: input.snapshotKey,
    extension: "json"
  });
  const metadata = canonicalSnapshotMetadataSchema.parse({
    version: 1,
    sourceId: input.sourceId,
    runId: input.runId,
    capturedAt: input.capturedAt,
    relativeSnapshotPath: paths.relativeSnapshotPath,
    snapshotKey: input.snapshotKey,
    rawRelativePayloadPath: input.rawRelativePayloadPath,
    rawRelativeMetadataPath: input.rawRelativeMetadataPath,
    rawRelativePayloadPaths: input.rawRelativePayloadPaths,
    rawRelativeMetadataPaths: input.rawRelativeMetadataPaths,
    notes: input.notes
  });

  await store.putText(paths.relativeSnapshotPath, input.snapshot);
  await putJson(store, paths.relativeMetadataPath, metadata);

  return metadata;
}

export async function loadHostedCanonicalSnapshotMetadata(
  store: HostedObjectStore,
  relativeMetadataPath: string
): Promise<CanonicalSnapshotMetadata> {
  const data = await getJson<unknown>(store, relativeMetadataPath);
  if (!data) {
    throw new Error(`Hosted canonical metadata "${relativeMetadataPath}" was not found.`);
  }

  return canonicalSnapshotMetadataSchema.parse(data);
}

export async function loadHostedCanonicalSnapshotJson<T>(
  store: HostedObjectStore,
  metadata: CanonicalSnapshotMetadata
): Promise<T> {
  const text = await store.getText(metadata.relativeSnapshotPath);
  if (text === undefined) {
    throw new Error(`Hosted canonical snapshot "${metadata.relativeSnapshotPath}" was not found.`);
  }

  return JSON.parse(text) as T;
}

export async function findHostedCanonicalMetadataPathByRunId(
  store: HostedObjectStore,
  runId: string
): Promise<string | undefined> {
  const keys = await store.list("canonical/");
  const metadataKeys = keys.filter((key) => key.endsWith(".meta.json")).sort().reverse();

  for (const key of metadataKeys) {
    const value = await getJson<unknown>(store, key);
    if (!value) {
      continue;
    }

    const metadata = canonicalSnapshotMetadataSchema.parse(value);
    if (metadata.runId === runId) {
      return key;
    }
  }

  return undefined;
}

export async function writeHostedRunStatus(
  store: HostedObjectStore,
  status: PriceRunStatus
): Promise<void> {
  const validated = priceRunStatusSchema.parse(status);
  await putJson(store, resolveHostedRunStatusPath(validated.runId, validated.stage), validated);
}

export async function loadHostedRunStatus(
  store: HostedObjectStore,
  runId: string,
  stage: PriceRunStage
): Promise<PriceRunStatus | undefined> {
  const value = await getJson<unknown>(store, resolveHostedRunStatusPath(runId, stage));
  return value ? priceRunStatusSchema.parse(value) : undefined;
}

export async function writeActiveCaptureState(
  store: HostedObjectStore,
  state: ActiveCaptureState
): Promise<void> {
  await putJson(store, resolveActiveCaptureStatePath(), activeCaptureStateSchema.parse(state));
}

export async function loadActiveCaptureState(
  store: HostedObjectStore
): Promise<ActiveCaptureState | undefined> {
  const value = await getJson<unknown>(store, resolveActiveCaptureStatePath());
  return value ? activeCaptureStateSchema.parse(value) : undefined;
}

export async function clearActiveCaptureState(store: HostedObjectStore): Promise<void> {
  await store.delete(resolveActiveCaptureStatePath());
}

export async function writeLatestSuccessfulCaptureState(
  store: HostedObjectStore,
  state: LatestSuccessfulCaptureState
): Promise<void> {
  await putJson(store, resolveLatestSuccessfulCaptureStatePath(), latestSuccessfulCaptureStateSchema.parse(state));
}

export async function loadLatestSuccessfulCaptureState(
  store: HostedObjectStore
): Promise<LatestSuccessfulCaptureState | undefined> {
  const value = await getJson<unknown>(store, resolveLatestSuccessfulCaptureStatePath());
  return value ? latestSuccessfulCaptureStateSchema.parse(value) : undefined;
}

export async function writeHostedPublishedPriceArtifacts(
  store: HostedObjectStore,
  input: {
    publishedAt: string;
    canonicalRelativeSnapshotPath: string;
    manifest: PublishedPriceManifest;
    snapshot: PublishedPriceSnapshot;
  }
): Promise<HostedPublishedArtifactsResult> {
  const manifest = publishedPriceManifestSchema.parse(input.manifest);
  const snapshot = publishedPriceSnapshotSchema.parse(input.snapshot);
  const exportManifestPath = resolveHostedPublishedManifestPath();
  const exportSnapshotPath = resolveHostedPublishedSnapshotPath(snapshot.game.key);
  const exportMetadataPath = resolveHostedPublishedMetadataPath(snapshot.game.key);

  await putJson(store, exportManifestPath, manifest);
  await putJson(store, exportSnapshotPath, snapshot);

  const metadata = publishedPriceExportMetadataSchema.parse({
    version: 1,
    publishedAt: input.publishedAt,
    canonicalRelativeSnapshotPath: input.canonicalRelativeSnapshotPath,
    exportManifestRelativePath: exportManifestPath,
    exportSnapshotRelativePath: exportSnapshotPath,
    frontendManifestRelativePath: "frontend/public/data/prices/manifest.json",
    frontendSnapshotRelativePath: `frontend/public/data/prices/${snapshot.game.key}/latest.json`
  });

  await putJson(store, exportMetadataPath, metadata);

  return {
    exportManifestPath,
    exportSnapshotPath,
    exportMetadataPath,
    metadata
  };
}
