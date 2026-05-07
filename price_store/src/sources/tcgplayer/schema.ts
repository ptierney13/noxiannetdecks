import { z } from "zod";
import { rawCapturePayloadFormatSchema } from "../../raw/schema.js";

export const tcgplayerSampleManifestEntrySchema = z.object({
  captureKey: z.string().min(1),
  capturedAt: z.string().datetime({ offset: true }),
  payloadFile: z.string().min(1),
  payloadFormat: rawCapturePayloadFormatSchema,
  extension: z.string().min(1).default("json"),
  requestUrl: z.string().url().optional(),
  notes: z.array(z.string()).default([])
});

export const tcgplayerSampleManifestSchema = z.object({
  version: z.literal(1),
  sourceId: z.literal("tcgplayer").default("tcgplayer"),
  datasetLabel: z.string().min(1),
  entries: z.array(tcgplayerSampleManifestEntrySchema).min(1)
});

export type TcgplayerSampleManifestEntry = z.infer<typeof tcgplayerSampleManifestEntrySchema>;
export type TcgplayerSampleManifest = z.infer<typeof tcgplayerSampleManifestSchema>;
