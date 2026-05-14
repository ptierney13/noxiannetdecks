import {
  publishedPriceManifestSchema,
  publishedPriceSnapshotSchema
} from "./schema.js";
import type {
  PublishedPriceManifest,
  PublishedPriceSnapshot
} from "./schema.js";

export type WritePublishedPriceArtifactsToKvInput = {
  gameKey: string;
  publishedAt: string;
  canonicalRelativeSnapshotPath: string;
  manifest: PublishedPriceManifest;
  snapshot: PublishedPriceSnapshot;
  pathPrefix?: string;
};

export type WritePublishedPriceArtifactsToKvResult = {
  manifestKey: string;
  snapshotKey: string;
};

export async function writePublishedPriceArtifactsToKv(
  namespace: { put(key: string, value: string): Promise<void> },
  input: WritePublishedPriceArtifactsToKvInput
): Promise<WritePublishedPriceArtifactsToKvResult> {
  const pathPrefix = sanitizePathPrefix(input.pathPrefix ?? "prices");
  const manifestKey = `${pathPrefix}/manifest.json`;
  const snapshotKey = `${pathPrefix}/${input.gameKey}/latest.json`;
  const validatedManifest = publishedPriceManifestSchema.parse(input.manifest);
  const validatedSnapshot = publishedPriceSnapshotSchema.parse(input.snapshot);

  await namespace.put(manifestKey, JSON.stringify(validatedManifest, null, 2));
  await namespace.put(snapshotKey, JSON.stringify(validatedSnapshot, null, 2));

  return {
    manifestKey,
    snapshotKey
  };
}

function sanitizePathPrefix(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9/_-]+/g, "-").replace(/\/+/g, "/");
  const sanitized = normalized.replace(/^\/+|\/+$/g, "");

  if (!sanitized) {
    throw new Error("Published path prefix must contain at least one supported character.");
  }

  return sanitized;
}
