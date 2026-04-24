import { z } from "zod";

const nullableString = z.string().min(1).nullable();
const positiveInteger = z.number().int().positive();

export const metagameBucketSchema = z.enum(["set-1", "set-2", "set-2-1", "set-3"]);
export const primaryRegionSchema = z.enum(["cn", "na", "eu", "row"]);
export const regionBucketSchema = z.enum(["cn", "na", "eu", "row", "non-cn"]);
export const prestigeLevelSchema = z.enum(["circuit", "premier", "local", "casual"]);
export const deckCardSectionSchema = z.enum(["champion", "battlefield", "rune", "main"]);
export const deckSourceKindSchema = z.enum(["event", "article", "community", "manual", "unknown"]);
export const decklistStatusSchema = z.enum(["present", "missing"]);
export const sourceUsePolicySchema = z.enum(["approved", "manual-review-only", "disallowed"]);
export const provenanceSourceKindSchema = z.enum([
  "official",
  "organizer",
  "registration",
  "submitter",
  "community",
  "aggregator",
  "manual"
]);
export const provenanceConfidenceSchema = z.enum(["high", "medium", "low"]);
export const reviewStatusSchema = z.enum(["pending", "reviewed", "verified", "needs-attention", "rejected"]);
export const reviewFlagSchema = z.enum([
  "missing-primary-source",
  "manual-reference-only",
  "metadata-conflict",
  "decklist-conflict",
  "missing-decklist",
  "incomplete-record",
  "attribution-unconfirmed"
]);
export const sourceCaptureKindSchema = z.enum([
  "event-index",
  "event-detail",
  "deck-detail",
  "meta-report",
  "audit-note",
  "other"
]);
export const sourceSiteSchema = z.enum([
  "official-riot",
  "topdeck",
  "organizer",
  "submitter",
  "riftdecks",
  "riftbound-gg",
  "riftrank",
  "riftmanager",
  "manual",
  "other"
]);

export const legendRecordSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1)
});

export const sourceCaptureRecordSchema = z.object({
  id: z.string().min(1),
  sourceSite: sourceSiteSchema,
  sourceUrl: z.string().url(),
  sourceIdentifier: nullableString,
  kind: sourceCaptureKindSchema,
  capturedAt: z.string().datetime({ offset: true }),
  relativePath: z.string().min(1),
  contentType: nullableString,
  byteLength: z.number().int().nonnegative(),
  sha256: nullableString,
  notes: z.array(z.string().min(1))
});

export const provenanceEvidenceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  sourceKind: provenanceSourceKindSchema,
  sourceSite: sourceSiteSchema,
  sourceUrl: z.string().url().nullable(),
  sourceId: nullableString,
  usePolicy: sourceUsePolicySchema,
  captureId: nullableString,
  notes: z.array(z.string().min(1))
}).superRefine((evidence, context) => {
  if (evidence.usePolicy !== "approved" && evidence.captureId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["captureId"],
      message: "only approved evidence may reference a stored capture"
    });
  }

  if (evidence.sourceKind === "aggregator" && evidence.usePolicy === "approved") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["usePolicy"],
      message: "aggregator evidence is limited to manual review only or disallowed use"
    });
  }

  if (evidence.usePolicy === "approved" && !evidence.sourceUrl && !evidence.captureId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["sourceUrl"],
      message: "approved evidence must include a source URL or a stored capture"
    });
  }
});

export const recordProvenanceSchema = z.object({
  primarySourceKind: provenanceSourceKindSchema,
  primarySourceLabel: z.string().min(1),
  confidence: provenanceConfidenceSchema,
  usePolicy: sourceUsePolicySchema,
  evidence: z.array(provenanceEvidenceSchema).min(1),
  notes: z.array(z.string().min(1))
}).superRefine((provenance, context) => {
  if (provenance.primarySourceKind === "aggregator" && provenance.usePolicy === "approved") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["usePolicy"],
      message: "aggregator records cannot be treated as approved primary sources"
    });
  }

  if (provenance.usePolicy === "approved" && !provenance.evidence.some((evidence) => evidence.usePolicy === "approved")) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["evidence"],
      message: "approved provenance must include at least one approved evidence source"
    });
  }
});

export const reviewStateSchema = z.object({
  status: reviewStatusSchema,
  flags: z.array(reviewFlagSchema),
  reviewedAt: z.string().datetime({ offset: true }).nullable(),
  reviewer: nullableString,
  notes: z.array(z.string().min(1))
}).superRefine((reviewState, context) => {
  if (reviewState.status !== "pending" && !reviewState.reviewedAt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["reviewedAt"],
      message: "non-pending review states must include a reviewedAt timestamp"
    });
  }

  if (reviewState.status === "needs-attention" && reviewState.flags.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["flags"],
      message: "needs-attention records must include at least one review flag"
    });
  }
});

export const eventStandingSchema = z.object({
  placement: positiveInteger.nullable(),
  placementLabel: nullableString,
  playerName: nullableString,
  deckId: nullableString,
  decklistStatus: decklistStatusSchema,
  record: nullableString
}).superRefine((standing, context) => {
  if (standing.decklistStatus === "present" && !standing.deckId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["deckId"],
      message: "present standings must reference a deck id"
    });
  }

  if (standing.decklistStatus === "missing" && standing.deckId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["deckId"],
      message: "missing standings must not reference a deck id"
    });
  }
});

export const eventRecordSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  sourceSite: sourceSiteSchema,
  sourceId: nullableString,
  sourceUrl: z.string().url().nullable(),
  startDate: z.string().date(),
  endDate: z.string().date().nullable(),
  city: nullableString,
  countryCode: nullableString,
  countryName: nullableString,
  attendance: z.number().int().positive().nullable(),
  prestige: prestigeLevelSchema,
  metagameBucket: metagameBucketSchema,
  primaryRegion: primaryRegionSchema,
  regionBuckets: z.array(regionBucketSchema).min(1),
  rawFacts: z.object({
    sourceMetagameLabel: nullableString,
    sourceCountryCode: nullableString,
    sourceCountryLabel: nullableString,
    sourcePrestigeLabel: nullableString,
    seasonLabel: nullableString,
    banWindowLabel: nullableString
  }),
  provenance: recordProvenanceSchema,
  reviewState: reviewStateSchema,
  standingRows: z.array(eventStandingSchema),
  captureIds: z.array(z.string().min(1)).min(1)
}).superRefine((event, context) => {
  if (!event.regionBuckets.includes(event.primaryRegion)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["regionBuckets"],
      message: "region buckets must include the primary region"
    });
  }

  const hasNonChina = event.regionBuckets.includes("non-cn");
  if (event.primaryRegion === "cn" && hasNonChina) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["regionBuckets"],
      message: "China events must not be tagged as non-cn"
    });
  }

  if (event.primaryRegion !== "cn" && !hasNonChina) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["regionBuckets"],
      message: "non-China events must include the non-cn bucket"
    });
  }
});

export const deckSourceSchema = z.object({
  kind: deckSourceKindSchema,
  sourceSite: sourceSiteSchema,
  sourceId: nullableString,
  sourceUrl: z.string().url().nullable(),
  eventId: nullableString,
  placement: positiveInteger.nullable(),
  placementLabel: nullableString,
  playerName: nullableString,
  record: nullableString,
  publishedAt: z.string().datetime({ offset: true }).nullable()
}).superRefine((source, context) => {
  if (source.kind === "event" && !source.eventId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["eventId"],
      message: "event deck sources must reference an event id"
    });
  }
});

export const deckCardRecordSchema = z.object({
  section: deckCardSectionSchema,
  quantity: positiveInteger,
  cardName: z.string().min(1),
  cardSlug: z.string().min(1),
  canonicalCardId: nullableString
});

export const deckRecordSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: nullableString,
  legendId: z.string().min(1),
  legendName: z.string().min(1),
  archetypeId: nullableString,
  archetypeName: nullableString,
  subArchetypeId: nullableString,
  subArchetypeName: nullableString,
  source: deckSourceSchema,
  metagameBucket: metagameBucketSchema,
  primaryRegion: primaryRegionSchema,
  regionBuckets: z.array(regionBucketSchema).min(1),
  provenance: recordProvenanceSchema,
  reviewState: reviewStateSchema,
  deckCards: z.array(deckCardRecordSchema).min(1),
  captureIds: z.array(z.string().min(1)).min(1)
}).superRefine((deck, context) => {
  if (!deck.regionBuckets.includes(deck.primaryRegion)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["regionBuckets"],
      message: "region buckets must include the primary region"
    });
  }
});

export const canonicalStage1DatasetSchema = z.object({
  version: z.literal(1),
  generatedAt: z.string().datetime({ offset: true }),
  sourceCaptures: z.array(sourceCaptureRecordSchema),
  legends: z.array(legendRecordSchema),
  events: z.array(eventRecordSchema),
  decks: z.array(deckRecordSchema)
});

export type MetagameBucket = z.infer<typeof metagameBucketSchema>;
export type PrimaryRegion = z.infer<typeof primaryRegionSchema>;
export type RegionBucket = z.infer<typeof regionBucketSchema>;
export type PrestigeLevel = z.infer<typeof prestigeLevelSchema>;
export type DeckCardSection = z.infer<typeof deckCardSectionSchema>;
export type DeckSourceKind = z.infer<typeof deckSourceKindSchema>;
export type DecklistStatus = z.infer<typeof decklistStatusSchema>;
export type SourceUsePolicy = z.infer<typeof sourceUsePolicySchema>;
export type ProvenanceSourceKind = z.infer<typeof provenanceSourceKindSchema>;
export type ProvenanceConfidence = z.infer<typeof provenanceConfidenceSchema>;
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;
export type ReviewFlag = z.infer<typeof reviewFlagSchema>;
export type SourceCaptureKind = z.infer<typeof sourceCaptureKindSchema>;
export type SourceSite = z.infer<typeof sourceSiteSchema>;
export type LegendRecord = z.infer<typeof legendRecordSchema>;
export type SourceCaptureRecord = z.infer<typeof sourceCaptureRecordSchema>;
export type ProvenanceEvidence = z.infer<typeof provenanceEvidenceSchema>;
export type RecordProvenance = z.infer<typeof recordProvenanceSchema>;
export type ReviewState = z.infer<typeof reviewStateSchema>;
export type EventStanding = z.infer<typeof eventStandingSchema>;
export type EventRecord = z.infer<typeof eventRecordSchema>;
export type DeckSource = z.infer<typeof deckSourceSchema>;
export type DeckCardRecord = z.infer<typeof deckCardRecordSchema>;
export type DeckRecord = z.infer<typeof deckRecordSchema>;
export type CanonicalStage1Dataset = z.infer<typeof canonicalStage1DatasetSchema>;
