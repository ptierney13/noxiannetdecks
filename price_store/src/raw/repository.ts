import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { PriceDataLayout } from "../config.js";
import type { RawCaptureMetadata, RawCapturePayloadFormat } from "./schema.js";
import { rawCaptureMetadataSchema } from "./schema.js";
import { resolveRawCapturePaths } from "./paths.js";

export type WriteRawCaptureInput = {
  sourceId: string;
  runId?: string;
  capturedAt: string;
  captureKey: string;
  extension: string;
  payload: string;
  payloadFormat: RawCapturePayloadFormat;
  requestUrl?: string;
  notes?: string[];
};

export async function writeRawCapture(
  layout: PriceDataLayout,
  input: WriteRawCaptureInput
): Promise<RawCaptureMetadata> {
  const paths = resolveRawCapturePaths(layout, input);

  await mkdir(dirname(paths.payloadPath), { recursive: true });
  await writeFile(paths.payloadPath, input.payload);

  const metadata = rawCaptureMetadataSchema.parse({
    version: 1,
    sourceId: input.sourceId,
    runId: input.runId,
    capturedAt: new Date(input.capturedAt).toISOString(),
    payloadFormat: input.payloadFormat,
    relativePayloadPath: paths.relativePayloadPath,
    captureKey: input.captureKey,
    requestUrl: input.requestUrl,
    notes: input.notes ?? []
  });

  await writeFile(paths.metadataPath, JSON.stringify(metadata, null, 2));
  return metadata;
}

export async function loadRawCaptureMetadata(
  layout: PriceDataLayout,
  relativeMetadataPath: string
): Promise<RawCaptureMetadata> {
  const content = await readFile(join(layout.rootDir, relativeMetadataPath), "utf8");
  return rawCaptureMetadataSchema.parse(JSON.parse(content));
}

export async function loadRawCaptureText(
  layout: PriceDataLayout,
  metadata: Pick<RawCaptureMetadata, "relativePayloadPath">
): Promise<string> {
  return readFile(join(layout.rootDir, metadata.relativePayloadPath), "utf8");
}

export async function loadRawCaptureJson<T>(
  layout: PriceDataLayout,
  metadata: Pick<RawCaptureMetadata, "relativePayloadPath">
): Promise<T> {
  return JSON.parse(await loadRawCaptureText(layout, metadata)) as T;
}
