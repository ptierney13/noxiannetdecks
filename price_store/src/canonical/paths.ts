import { join, relative } from "node:path";
import type { PriceDataLayout } from "../config.js";
import { createCaptureTimestampId } from "../raw/paths.js";

export type CanonicalSnapshotPathOptions = {
  sourceId: string;
  capturedAt: string;
  snapshotKey: string;
  extension: string;
};

export type CanonicalSnapshotPaths = {
  sourceDir: string;
  snapshotPath: string;
  metadataPath: string;
  relativeSnapshotPath: string;
  relativeMetadataPath: string;
};

function sanitizePathSegment(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
  const sanitized = normalized.replace(/^-+|-+$/g, "");

  if (!sanitized) {
    throw new Error("Path segment must contain at least one supported character");
  }

  return sanitized.toLowerCase();
}

function normalizeExtension(extension: string): string {
  const normalized = extension.trim().replace(/^\.+/, "");
  if (!normalized) {
    throw new Error("Extension must not be empty");
  }

  return normalized.toLowerCase();
}

export function resolveCanonicalSnapshotPaths(
  layout: PriceDataLayout,
  options: CanonicalSnapshotPathOptions
): CanonicalSnapshotPaths {
  const sourceId = sanitizePathSegment(options.sourceId);
  const snapshotKey = sanitizePathSegment(options.snapshotKey);
  const timestampId = createCaptureTimestampId(options.capturedAt);
  const extension = normalizeExtension(options.extension);
  const year = timestampId.slice(0, 4);
  const month = timestampId.slice(5, 7);
  const day = timestampId.slice(8, 10);
  const sourceDir = join(layout.canonicalDir, sourceId, year, month, day);
  const basename = `${timestampId}--${snapshotKey}`;
  const snapshotPath = join(sourceDir, `${basename}.${extension}`);
  const metadataPath = join(sourceDir, `${basename}.meta.json`);

  return {
    sourceDir,
    snapshotPath,
    metadataPath,
    relativeSnapshotPath: relative(layout.rootDir, snapshotPath).replaceAll("\\", "/"),
    relativeMetadataPath: relative(layout.rootDir, metadataPath).replaceAll("\\", "/")
  };
}
