import { join, relative } from "node:path";
import type { PriceDataLayout } from "../config.js";

export type RawCapturePathOptions = {
  sourceId: string;
  capturedAt: string;
  captureKey: string;
  extension: string;
};

export type RawCapturePaths = {
  sourceDir: string;
  payloadPath: string;
  metadataPath: string;
  relativePayloadPath: string;
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

export function createCaptureTimestampId(capturedAt: string): string {
  const parsed = new Date(capturedAt);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid capture timestamp: ${capturedAt}`);
  }

  return parsed.toISOString().replace(/:/g, "-");
}

export function resolveRawCapturePaths(
  layout: PriceDataLayout,
  options: RawCapturePathOptions
): RawCapturePaths {
  const sourceId = sanitizePathSegment(options.sourceId);
  const captureKey = sanitizePathSegment(options.captureKey);
  const timestampId = createCaptureTimestampId(options.capturedAt);
  const extension = normalizeExtension(options.extension);
  const year = timestampId.slice(0, 4);
  const month = timestampId.slice(5, 7);
  const day = timestampId.slice(8, 10);
  const sourceDir = join(layout.rawDir, sourceId, year, month, day);
  const basename = `${timestampId}--${captureKey}`;
  const payloadPath = join(sourceDir, `${basename}.${extension}`);
  const metadataPath = join(sourceDir, `${basename}.meta.json`);

  return {
    sourceDir,
    payloadPath,
    metadataPath,
    relativePayloadPath: relative(layout.rootDir, payloadPath).replaceAll("\\", "/"),
    relativeMetadataPath: relative(layout.rootDir, metadataPath).replaceAll("\\", "/")
  };
}
