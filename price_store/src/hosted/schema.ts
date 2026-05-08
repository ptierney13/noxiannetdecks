import { z } from "zod";

export const hostedCaptureModeSchema = z.enum(["incremental", "full"]);

export const hostedCaptureWorkerInputSchema = z.object({
  mode: hostedCaptureModeSchema,
  updatedAfter: z.string().datetime({ offset: true }).optional(),
  maxRequests: z.number().int().positive().optional(),
  requestDelayMs: z.number().int().nonnegative().optional()
});

export const hostedPublishWorkerInputSchema = z.object({
  captureRunId: z.string().min(1).optional()
});

export const activeCaptureStateSchema = z.object({
  runId: z.string().min(1),
  mode: hostedCaptureModeSchema,
  startedAt: z.string().datetime({ offset: true })
});

export const latestSuccessfulCaptureStateSchema = z.object({
  runId: z.string().min(1),
  mode: hostedCaptureModeSchema,
  capturedAt: z.string().datetime({ offset: true }),
  canonicalRelativeMetadataPath: z.string().min(1),
  canonicalRelativeSnapshotPath: z.string().min(1)
});

export type HostedCaptureMode = z.infer<typeof hostedCaptureModeSchema>;
export type HostedCaptureWorkerInput = z.infer<typeof hostedCaptureWorkerInputSchema>;
export type HostedPublishWorkerInput = z.infer<typeof hostedPublishWorkerInputSchema>;
export type ActiveCaptureState = z.infer<typeof activeCaptureStateSchema>;
export type LatestSuccessfulCaptureState = z.infer<typeof latestSuccessfulCaptureStateSchema>;
