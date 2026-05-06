import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { PriceDataLayout } from "../config.js";
import type { RawCaptureMetadata, RawCapturePayloadFormat } from "./schema.js";
import { rawCaptureMetadataSchema } from "./schema.js";
import { resolveRawCapturePaths } from "./paths.js";

export type WriteRawCaptureInput = {
  sourceId: string;
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
