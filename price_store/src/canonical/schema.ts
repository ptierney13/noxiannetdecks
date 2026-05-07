import { z } from "zod";

export const canonicalSnapshotMetadataSchema = z.object({
  version: z.literal(1),
  sourceId: z.string().min(1),
  capturedAt: z.string().datetime({ offset: true }),
  relativeSnapshotPath: z.string().min(1),
  snapshotKey: z.string().min(1),
  rawRelativePayloadPath: z.string().min(1).optional(),
  rawRelativeMetadataPath: z.string().min(1).optional(),
  notes: z.array(z.string()).default([])
});

export type CanonicalSnapshotMetadata = z.infer<typeof canonicalSnapshotMetadataSchema>;
