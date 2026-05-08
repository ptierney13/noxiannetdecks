import { createCaptureTimestampId } from "../raw/paths.js";
import type { PriceRunStage } from "../runs/schema.js";

export type HostedRawCapturePaths = {
  relativePayloadPath: string;
  relativeMetadataPath: string;
};

export type HostedCanonicalSnapshotPaths = {
  relativeSnapshotPath: string;
  relativeMetadataPath: string;
};

function sanitizePathSegment(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
  const sanitized = normalized.replace(/^-+|-+$/g, "");

  if (!sanitized) {
    throw new Error("Hosted path segment must contain at least one supported character");
  }

  return sanitized.toLowerCase();
}

function createDateSegments(capturedAt: string): { timestampId: string; year: string; month: string; day: string } {
  const timestampId = createCaptureTimestampId(capturedAt);

  return {
    timestampId,
    year: timestampId.slice(0, 4),
    month: timestampId.slice(5, 7),
    day: timestampId.slice(8, 10)
  };
}

export function resolveHostedRawCapturePaths(input: {
  sourceId: string;
  capturedAt: string;
  captureKey: string;
  extension: string;
}): HostedRawCapturePaths {
  const sourceId = sanitizePathSegment(input.sourceId);
  const captureKey = sanitizePathSegment(input.captureKey);
  const extension = input.extension.trim().replace(/^\.+/, "").toLowerCase();
  const { timestampId, year, month, day } = createDateSegments(input.capturedAt);
  const basename = `${timestampId}--${captureKey}`;
  const sourceDir = `raw/${sourceId}/${year}/${month}/${day}`;

  return {
    relativePayloadPath: `${sourceDir}/${basename}.${extension}`,
    relativeMetadataPath: `${sourceDir}/${basename}.meta.json`
  };
}

export function resolveHostedCanonicalSnapshotPaths(input: {
  sourceId: string;
  capturedAt: string;
  snapshotKey: string;
  extension: string;
}): HostedCanonicalSnapshotPaths {
  const sourceId = sanitizePathSegment(input.sourceId);
  const snapshotKey = sanitizePathSegment(input.snapshotKey);
  const extension = input.extension.trim().replace(/^\.+/, "").toLowerCase();
  const { timestampId, year, month, day } = createDateSegments(input.capturedAt);
  const basename = `${timestampId}--${snapshotKey}`;
  const sourceDir = `canonical/${sourceId}/${year}/${month}/${day}`;

  return {
    relativeSnapshotPath: `${sourceDir}/${basename}.${extension}`,
    relativeMetadataPath: `${sourceDir}/${basename}.meta.json`
  };
}

export function resolveHostedRunStatusPath(runId: string, stage: PriceRunStage): string {
  return `runs/${sanitizePathSegment(stage)}/${sanitizePathSegment(runId)}.json`;
}

export function resolveHostedPublishedManifestPath(): string {
  return "published/prices/manifest.json";
}

export function resolveHostedPublishedSnapshotPath(gameKey: string): string {
  return `published/prices/${sanitizePathSegment(gameKey)}/latest.json`;
}

export function resolveHostedPublishedMetadataPath(gameKey: string): string {
  return `published/prices/${sanitizePathSegment(gameKey)}/latest.publish.meta.json`;
}

export function resolveActiveCaptureStatePath(): string {
  return "state/active-capture.json";
}

export function resolveLatestSuccessfulCaptureStatePath(): string {
  return "state/latest-successful-capture.json";
}
