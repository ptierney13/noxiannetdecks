import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { PriceDataLayout } from "../config.js";
import type { CanonicalSnapshotMetadata } from "./schema.js";
import { canonicalSnapshotMetadataSchema } from "./schema.js";
import { resolveCanonicalSnapshotPaths } from "./paths.js";

export type WriteCanonicalSnapshotInput = {
  sourceId: string;
  capturedAt: string;
  snapshotKey: string;
  snapshot: string;
  rawRelativePayloadPath?: string;
  rawRelativeMetadataPath?: string;
  notes?: string[];
};

export async function writeCanonicalSnapshot(
  layout: PriceDataLayout,
  input: WriteCanonicalSnapshotInput
): Promise<CanonicalSnapshotMetadata> {
  const paths = resolveCanonicalSnapshotPaths(layout, {
    sourceId: input.sourceId,
    capturedAt: input.capturedAt,
    snapshotKey: input.snapshotKey,
    extension: "json"
  });

  await mkdir(dirname(paths.snapshotPath), { recursive: true });
  await writeFile(paths.snapshotPath, input.snapshot);

  const metadata = canonicalSnapshotMetadataSchema.parse({
    version: 1,
    sourceId: input.sourceId,
    capturedAt: new Date(input.capturedAt).toISOString(),
    relativeSnapshotPath: paths.relativeSnapshotPath,
    snapshotKey: input.snapshotKey,
    rawRelativePayloadPath: input.rawRelativePayloadPath,
    rawRelativeMetadataPath: input.rawRelativeMetadataPath,
    notes: input.notes ?? []
  });

  await writeFile(paths.metadataPath, JSON.stringify(metadata, null, 2));
  return metadata;
}

export async function loadCanonicalSnapshotMetadata(
  layout: PriceDataLayout,
  relativeMetadataPath: string
): Promise<CanonicalSnapshotMetadata> {
  const content = await readFile(join(layout.rootDir, relativeMetadataPath), "utf8");
  return canonicalSnapshotMetadataSchema.parse(JSON.parse(content));
}

export async function loadCanonicalSnapshotJson<T>(
  layout: PriceDataLayout,
  metadata: Pick<CanonicalSnapshotMetadata, "relativeSnapshotPath">
): Promise<T> {
  const content = await readFile(join(layout.rootDir, metadata.relativeSnapshotPath), "utf8");
  return JSON.parse(content) as T;
}
