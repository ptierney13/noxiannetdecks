import { z } from "zod";

export const rawCapturePayloadFormatSchema = z.enum(["json", "html", "text", "csv", "other"]);

export const rawCaptureMetadataSchema = z.object({
  version: z.literal(1),
  sourceId: z.string().min(1),
  runId: z.string().min(1).optional(),
  capturedAt: z.string().datetime({ offset: true }),
  payloadFormat: rawCapturePayloadFormatSchema,
  relativePayloadPath: z.string().min(1),
  captureKey: z.string().min(1),
  requestUrl: z.string().url().optional(),
  notes: z.array(z.string()).default([])
});

export type RawCapturePayloadFormat = z.infer<typeof rawCapturePayloadFormatSchema>;
export type RawCaptureMetadata = z.infer<typeof rawCaptureMetadataSchema>;
