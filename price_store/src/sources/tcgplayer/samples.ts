import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import type { PriceDataLayout } from "../../config.js";
import { writeRawCapture } from "../../raw/repository.js";
import { writeRunStatus } from "../../runs/repository.js";
import type { PriceRunStatus } from "../../runs/schema.js";
import type { TcgplayerSampleManifest } from "./schema.js";
import { tcgplayerSampleManifestSchema } from "./schema.js";

export type ImportTcgplayerSampleManifestResult = {
  runId: string;
  rawCaptureCount: number;
  relativePayloadPaths: string[];
};

function sanitizeRunSegment(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
  const sanitized = normalized.replace(/^-+|-+$/g, "");

  if (!sanitized) {
    throw new Error("Run segment must contain at least one supported character");
  }

  return sanitized.toLowerCase();
}

export function createTcgplayerSampleImportRunId(datasetLabel: string, startedAt: string): string {
  const timestamp = new Date(startedAt);

  if (Number.isNaN(timestamp.getTime())) {
    throw new Error(`Invalid run timestamp: ${startedAt}`);
  }

  const datePrefix = timestamp.toISOString().slice(0, 10);
  return `tcgplayer-samples-${datePrefix}-${sanitizeRunSegment(datasetLabel)}`;
}

export async function loadTcgplayerSampleManifest(
  manifestPath: string
): Promise<TcgplayerSampleManifest> {
  const content = await readFile(manifestPath, "utf8");
  return tcgplayerSampleManifestSchema.parse(JSON.parse(content));
}

export async function importTcgplayerSampleManifest(
  layout: PriceDataLayout,
  manifestPath: string,
  startedAt: string = new Date().toISOString()
): Promise<ImportTcgplayerSampleManifestResult> {
  const manifest = await loadTcgplayerSampleManifest(manifestPath);
  const runId = createTcgplayerSampleImportRunId(manifest.datasetLabel, startedAt);
  const manifestDir = dirname(resolve(manifestPath));

  await writeRunStatus(
    layout,
    createRunStatus({
      runId,
      startedAt,
      status: "running",
      message: `Importing ${manifest.entries.length} TCGplayer sample payload(s) from ${manifest.datasetLabel}.`
    })
  );

  try {
    const results = [];

    for (const entry of manifest.entries) {
      const payloadPath = resolve(manifestDir, entry.payloadFile);
      const payload = await readFile(payloadPath, "utf8");
      const metadata = await writeRawCapture(layout, {
        sourceId: manifest.sourceId,
        capturedAt: entry.capturedAt,
        captureKey: entry.captureKey,
        extension: entry.extension,
        payload,
        payloadFormat: entry.payloadFormat,
        requestUrl: entry.requestUrl,
        notes: [...entry.notes, `dataset:${manifest.datasetLabel}`]
      });

      results.push(metadata.relativePayloadPath);
    }

    await writeRunStatus(
      layout,
      createRunStatus({
        runId,
        startedAt,
        status: "succeeded",
        completedAt: new Date().toISOString(),
        rawCaptureCount: results.length,
        message: `Imported ${results.length} TCGplayer sample payload(s) from ${manifest.datasetLabel}.`
      })
    );

    return {
      runId,
      rawCaptureCount: results.length,
      relativePayloadPaths: results
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sample import failure";

    await writeRunStatus(
      layout,
      createRunStatus({
        runId,
        startedAt,
        status: "failed",
        completedAt: new Date().toISOString(),
        message: `Failed to import TCGplayer samples from ${manifest.datasetLabel}: ${message}`
      })
    );

    throw error;
  }
}

export function resolveBundledTcgplayerSampleManifestPath(packageRoot: string): string {
  return join(packageRoot, "fixtures", "tcgplayer", "sample-manifest.json");
}

function createRunStatus(
  input: Pick<PriceRunStatus, "runId" | "startedAt" | "status" | "message"> &
    Partial<Pick<PriceRunStatus, "completedAt" | "rawCaptureCount">>
): PriceRunStatus {
  return {
    version: 1,
    runId: input.runId,
    sourceId: "tcgplayer",
    stage: "raw-capture",
    status: input.status,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    rawCaptureCount: input.rawCaptureCount,
    message: input.message
  };
}
