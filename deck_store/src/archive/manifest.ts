import { z } from "zod";

export const archiveLayerSchema = z.enum(["raw", "canonical", "exports", "audit"]);

export const archiveLayerStatsSchema = z.object({
  layer: archiveLayerSchema,
  fileCount: z.number().int().nonnegative(),
  totalBytes: z.number().int().nonnegative()
});

export const archiveSourceStatsSchema = z.object({
  sourceId: z.string().min(1),
  captureCount: z.number().int().nonnegative(),
  totalBytes: z.number().int().nonnegative()
});

export const archiveManifestSchema = z.object({
  version: z.literal(1),
  generatedAt: z.string().datetime({ offset: true }),
  totalFiles: z.number().int().nonnegative(),
  totalBytes: z.number().int().nonnegative(),
  layers: z.array(archiveLayerStatsSchema),
  sources: z.array(archiveSourceStatsSchema)
});

export type ArchiveLayer = z.infer<typeof archiveLayerSchema>;
export type ArchiveLayerStats = z.infer<typeof archiveLayerStatsSchema>;
export type ArchiveSourceStats = z.infer<typeof archiveSourceStatsSchema>;
export type ArchiveManifest = z.infer<typeof archiveManifestSchema>;

export function createEmptyArchiveManifest(generatedAt = new Date().toISOString()): ArchiveManifest {
  return {
    version: 1,
    generatedAt,
    totalFiles: 0,
    totalBytes: 0,
    layers: archiveLayerSchema.options.map((layer) => ({
      layer,
      fileCount: 0,
      totalBytes: 0
    })),
    sources: []
  };
}
