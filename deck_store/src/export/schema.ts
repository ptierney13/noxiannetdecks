import { z } from "zod";
import { deckCardSectionSchema, metagameBucketSchema, prestigeLevelSchema, primaryRegionSchema, regionBucketSchema } from "../data/schema.js";

const nullableString = z.string().min(1).nullable();

export const filterSummarySchema = z.object({
  metagameBuckets: z.array(metagameBucketSchema).min(1),
  regionBuckets: z.array(regionBucketSchema).min(1),
  prestigeLevels: z.array(prestigeLevelSchema).default([])
});

export const legendShareRowSchema = z.object({
  legendId: z.string().min(1),
  legendName: z.string().min(1),
  deckCount: z.number().int().nonnegative(),
  percentage: z.number().nonnegative()
});

export const metagameOverviewSnapshotSchema = z.object({
  kind: z.literal("metagame-overview"),
  generatedAt: z.string().datetime({ offset: true }),
  sourceCoverageSummary: z.string().min(1),
  filters: filterSummarySchema,
  totalDecks: z.number().int().nonnegative(),
  legends: z.array(legendShareRowSchema)
});

export const cardInclusionRowSchema = z.object({
  section: deckCardSectionSchema,
  cardName: z.string().min(1),
  cardSlug: z.string().min(1),
  canonicalCardId: nullableString,
  deckCount: z.number().int().nonnegative(),
  inclusionRate: z.number().nonnegative()
});

export const recentDeckRowSchema = z.object({
  deckId: z.string().min(1),
  deckName: nullableString,
  playerName: nullableString,
  placementLabel: nullableString,
  eventId: nullableString,
  eventName: nullableString,
  startDate: z.string().date().nullable()
});

export const legendDetailSnapshotSchema = z.object({
  kind: z.literal("legend-detail"),
  generatedAt: z.string().datetime({ offset: true }),
  sourceCoverageSummary: z.string().min(1),
  legendId: z.string().min(1),
  legendName: z.string().min(1),
  filters: filterSummarySchema,
  canonicalDeckId: nullableString,
  recentDecks: z.array(recentDeckRowSchema),
  inclusionBreakdown: z.object({
    champion: z.array(cardInclusionRowSchema),
    battlefield: z.array(cardInclusionRowSchema),
    rune: z.array(cardInclusionRowSchema),
    main: z.array(cardInclusionRowSchema)
  })
});

export const eventListRowSchema = z.object({
  eventId: z.string().min(1),
  name: z.string().min(1),
  startDate: z.string().date(),
  attendance: z.number().int().positive().nullable(),
  prestige: prestigeLevelSchema,
  metagameBucket: metagameBucketSchema,
  primaryRegion: primaryRegionSchema,
  countryCode: nullableString
});

export const eventIndexSnapshotSchema = z.object({
  kind: z.literal("event-index"),
  generatedAt: z.string().datetime({ offset: true }),
  sourceCoverageSummary: z.string().min(1),
  filters: filterSummarySchema,
  events: z.array(eventListRowSchema)
});

export const eventPlacementRowSnapshotSchema = z.object({
  placement: z.number().int().positive().nullable(),
  placementLabel: nullableString,
  playerName: nullableString,
  deckId: nullableString,
  deckName: nullableString,
  decklistStatus: z.enum(["present", "missing"])
});

export const eventDetailSnapshotSchema = z.object({
  kind: z.literal("event-detail"),
  generatedAt: z.string().datetime({ offset: true }),
  sourceCoverageSummary: z.string().min(1),
  eventId: z.string().min(1),
  name: z.string().min(1),
  startDate: z.string().date(),
  attendance: z.number().int().positive().nullable(),
  prestige: prestigeLevelSchema,
  metagameBucket: metagameBucketSchema,
  primaryRegion: primaryRegionSchema,
  placements: z.array(eventPlacementRowSnapshotSchema)
});

export const deckCardSectionSnapshotSchema = z.object({
  section: deckCardSectionSchema,
  cards: z.array(z.object({
    cardName: z.string().min(1),
    cardSlug: z.string().min(1),
    canonicalCardId: nullableString,
    quantity: z.number().int().positive()
  }))
});

export const deckDetailSnapshotSchema = z.object({
  kind: z.literal("deck-detail"),
  generatedAt: z.string().datetime({ offset: true }),
  sourceCoverageSummary: z.string().min(1),
  deckId: z.string().min(1),
  deckName: nullableString,
  legendId: z.string().min(1),
  legendName: z.string().min(1),
  eventId: nullableString,
  eventName: nullableString,
  placementLabel: nullableString,
  playerName: nullableString,
  metagameBucket: metagameBucketSchema,
  primaryRegion: primaryRegionSchema,
  sections: z.array(deckCardSectionSnapshotSchema)
});

export const snapshotManifestEntrySchema = z.object({
  kind: z.enum(["metagame-overview", "legend-detail", "event-index", "event-detail", "deck-detail"]),
  id: z.string().min(1),
  relativePath: z.string().min(1)
});

export const snapshotManifestSchema = z.object({
  version: z.literal(1),
  generatedAt: z.string().datetime({ offset: true }),
  sourceCoverageSummary: z.string().min(1),
  entries: z.array(snapshotManifestEntrySchema)
});

export const metagamePilotBundleSchema = z.object({
  version: z.literal(1),
  generatedAt: z.string().datetime({ offset: true }),
  sourceCoverageSummary: z.string().min(1),
  assumptions: z.array(z.string().min(1)).min(1),
  overview: metagameOverviewSnapshotSchema,
  eventIndex: eventIndexSnapshotSchema,
  eventDetails: z.array(eventDetailSnapshotSchema),
  legendDetails: z.array(legendDetailSnapshotSchema),
  deckDetails: z.array(deckDetailSnapshotSchema)
});

export type FilterSummary = z.infer<typeof filterSummarySchema>;
export type MetagameOverviewSnapshot = z.infer<typeof metagameOverviewSnapshotSchema>;
export type LegendDetailSnapshot = z.infer<typeof legendDetailSnapshotSchema>;
export type EventIndexSnapshot = z.infer<typeof eventIndexSnapshotSchema>;
export type EventDetailSnapshot = z.infer<typeof eventDetailSnapshotSchema>;
export type DeckDetailSnapshot = z.infer<typeof deckDetailSnapshotSchema>;
export type SnapshotManifest = z.infer<typeof snapshotManifestSchema>;
export type MetagamePilotBundle = z.infer<typeof metagamePilotBundleSchema>;
