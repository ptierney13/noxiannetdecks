import { z } from "zod";

export const priceRunStageSchema = z.enum(["raw-capture", "canonical-materialization", "publish"]);
export const priceRunStatusStateSchema = z.enum(["running", "succeeded", "failed"]);

export const priceRunStatusSchema = z.object({
  version: z.literal(1),
  runId: z.string().min(1),
  sourceId: z.string().min(1),
  stage: priceRunStageSchema,
  status: priceRunStatusStateSchema,
  startedAt: z.string().datetime({ offset: true }),
  completedAt: z.string().datetime({ offset: true }).optional(),
  message: z.string().min(1).optional(),
  rawCaptureCount: z.number().int().nonnegative().optional(),
  canonicalSnapshotCount: z.number().int().nonnegative().optional(),
  publishedArtifactCount: z.number().int().nonnegative().optional(),
  requestCount: z.number().int().nonnegative().optional(),
  pageCount: z.number().int().nonnegative().optional(),
  cardCount: z.number().int().nonnegative().optional(),
  verifiedLimit: z.number().int().positive().optional()
});

export type PriceRunStage = z.infer<typeof priceRunStageSchema>;
export type PriceRunStatusState = z.infer<typeof priceRunStatusStateSchema>;
export type PriceRunStatus = z.infer<typeof priceRunStatusSchema>;
