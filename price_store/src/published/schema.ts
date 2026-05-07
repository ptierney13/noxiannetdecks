import { z } from "zod";

export const publishedPriceSourceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1)
});

export const publishedPriceFreshnessSchema = z.object({
  rowCount: z.number().int().nonnegative(),
  pricedRowCount: z.number().int().nonnegative(),
  freshestPriceAt: z.string().datetime({ offset: true }).optional(),
  stalestPriceAt: z.string().datetime({ offset: true }).optional()
});

export const publishedPriceHistoryPointSchema = z.object({
  amount: z.number().nonnegative(),
  observedAt: z.string().datetime({ offset: true })
});

export const publishedPriceRowSchema = z.object({
  rowId: z.string().min(1),
  cardName: z.string().min(1),
  sourceCardId: z.string().min(1),
  sourceVariantId: z.string().min(1),
  set: z.object({
    slug: z.string().min(1).nullable().optional(),
    label: z.string().min(1).nullable().optional()
  }),
  collectorNumber: z.string().min(1).nullable().optional(),
  rarity: z.string().min(1).nullable().optional(),
  language: z.string().min(1).nullable().optional(),
  condition: z.string().min(1).nullable().optional(),
  printing: z.string().min(1).nullable().optional(),
  externalIds: z.object({
    tcgplayerId: z.string().min(1).optional(),
    tcgplayerSkuId: z.string().min(1).optional()
  }),
  currentPrice: z.object({
    currency: z.literal("USD"),
    amount: z.number().nonnegative().nullable(),
    lastUpdatedAt: z.string().datetime({ offset: true }).nullable().optional()
  }),
  priceHistory: z.array(publishedPriceHistoryPointSchema).default([])
});

export const publishedPriceSnapshotSchema = z.object({
  version: z.literal(1),
  game: z.object({
    slug: z.string().min(1),
    key: z.string().min(1),
    label: z.string().min(1).optional()
  }),
  priceSource: publishedPriceSourceSchema,
  publishedAt: z.string().datetime({ offset: true }),
  sourceCapturedAt: z.string().datetime({ offset: true }),
  freshness: publishedPriceFreshnessSchema,
  rows: z.array(publishedPriceRowSchema)
});

export const publishedPriceManifestSchema = z.object({
  version: z.literal(1),
  game: z.object({
    slug: z.string().min(1),
    key: z.string().min(1),
    label: z.string().min(1).optional()
  }),
  priceSource: publishedPriceSourceSchema,
  publishedAt: z.string().datetime({ offset: true }),
  sourceCapturedAt: z.string().datetime({ offset: true }),
  snapshotPath: z.string().min(1),
  rowCount: z.number().int().nonnegative(),
  variantCount: z.number().int().nonnegative(),
  freshness: publishedPriceFreshnessSchema,
  provenance: z.object({
    upstreamProvider: z
      .object({
        id: z.string().min(1),
        label: z.string().min(1)
      })
      .optional(),
    canonicalRelativeSnapshotPath: z.string().min(1),
    rawRelativePayloadPaths: z.array(z.string().min(1)).default([]),
    rawRelativeMetadataPaths: z.array(z.string().min(1)).default([])
  })
});

export const publishedPriceExportMetadataSchema = z.object({
  version: z.literal(1),
  publishedAt: z.string().datetime({ offset: true }),
  canonicalRelativeSnapshotPath: z.string().min(1),
  exportManifestRelativePath: z.string().min(1),
  exportSnapshotRelativePath: z.string().min(1),
  frontendManifestRelativePath: z.string().min(1),
  frontendSnapshotRelativePath: z.string().min(1)
});

export type PublishedPriceSource = z.infer<typeof publishedPriceSourceSchema>;
export type PublishedPriceFreshness = z.infer<typeof publishedPriceFreshnessSchema>;
export type PublishedPriceHistoryPoint = z.infer<typeof publishedPriceHistoryPointSchema>;
export type PublishedPriceRow = z.infer<typeof publishedPriceRowSchema>;
export type PublishedPriceSnapshot = z.infer<typeof publishedPriceSnapshotSchema>;
export type PublishedPriceManifest = z.infer<typeof publishedPriceManifestSchema>;
export type PublishedPriceExportMetadata = z.infer<typeof publishedPriceExportMetadataSchema>;
