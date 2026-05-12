import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import type { PriceDataLayout } from "../config.js";
import { resolvePriceStorePackageRoot } from "../package-root.js";
import type {
  PublishedPriceExportMetadata,
  PublishedPriceManifest,
  PublishedPriceSnapshot
} from "./schema.js";
import {
  publishedPriceExportMetadataSchema,
  publishedPriceManifestSchema,
  publishedPriceSnapshotSchema
} from "./schema.js";

export type WritePublishedPriceArtifactsInput = {
  gameKey: string;
  publishedAt: string;
  canonicalRelativeSnapshotPath: string;
  manifest: PublishedPriceManifest;
  snapshot: PublishedPriceSnapshot;
  repositoryRoot?: string;
  pathPrefix?: string;
};

export type WritePublishedPriceArtifactsResult = {
  exportManifestPath: string;
  exportSnapshotPath: string;
  exportMetadataPath: string;
  frontendManifestPath: string;
  frontendSnapshotPath: string;
  metadata: PublishedPriceExportMetadata;
};

export async function writePublishedPriceArtifacts(
  layout: PriceDataLayout,
  input: WritePublishedPriceArtifactsInput
): Promise<WritePublishedPriceArtifactsResult> {
  const packageRoot = resolvePriceStorePackageRoot();
  const repositoryRoot = input.repositoryRoot ? resolve(input.repositoryRoot) : resolve(packageRoot, "..");
  const pathPrefix = sanitizePathPrefix(input.pathPrefix ?? "prices");
  const exportManifestPath = join(layout.exportsDir, pathPrefix, "manifest.json");
  const exportSnapshotPath = join(layout.exportsDir, pathPrefix, input.gameKey, "latest.json");
  const exportMetadataPath = join(layout.exportsDir, pathPrefix, input.gameKey, "latest.publish.meta.json");
  const frontendManifestPath = join(repositoryRoot, "frontend", "public", "data", pathPrefix, "manifest.json");
  const frontendSnapshotPath = join(
    repositoryRoot,
    "frontend",
    "public",
    "data",
    pathPrefix,
    input.gameKey,
    "latest.json"
  );

  const validatedManifest = publishedPriceManifestSchema.parse(input.manifest);
  const validatedSnapshot = publishedPriceSnapshotSchema.parse(input.snapshot);

  await mkdir(dirname(exportManifestPath), { recursive: true });
  await mkdir(dirname(exportSnapshotPath), { recursive: true });
  await mkdir(dirname(frontendManifestPath), { recursive: true });
  await mkdir(dirname(frontendSnapshotPath), { recursive: true });

  await writeFile(exportManifestPath, JSON.stringify(validatedManifest, null, 2));
  await writeFile(exportSnapshotPath, JSON.stringify(validatedSnapshot, null, 2));
  await writeFile(frontendManifestPath, JSON.stringify(validatedManifest, null, 2));
  await writeFile(frontendSnapshotPath, JSON.stringify(validatedSnapshot, null, 2));

  const metadata = publishedPriceExportMetadataSchema.parse({
    version: 1,
    publishedAt: input.publishedAt,
    canonicalRelativeSnapshotPath: input.canonicalRelativeSnapshotPath,
    exportManifestRelativePath: relative(layout.rootDir, exportManifestPath).replaceAll("\\", "/"),
    exportSnapshotRelativePath: relative(layout.rootDir, exportSnapshotPath).replaceAll("\\", "/"),
    frontendManifestRelativePath: relative(repositoryRoot, frontendManifestPath).replaceAll("\\", "/"),
    frontendSnapshotRelativePath: relative(repositoryRoot, frontendSnapshotPath).replaceAll("\\", "/")
  });

  await writeFile(exportMetadataPath, JSON.stringify(metadata, null, 2));

  return {
    exportManifestPath,
    exportSnapshotPath,
    exportMetadataPath,
    frontendManifestPath,
    frontendSnapshotPath,
    metadata
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
