import type { PriceDataLayout } from "../../config.js";
import type { CanonicalSnapshotMetadata } from "../../canonical/schema.js";
import { loadRawCaptureJson } from "../../raw/repository.js";
import type { RawCaptureMetadata } from "../../raw/schema.js";
import { writeCanonicalSnapshot } from "../../canonical/repository.js";
import type { JustTcgCardsResponse, JustTcgVariant } from "./schema.js";
import { justTcgCardsResponseSchema } from "./schema.js";
import { z } from "zod";

const justTcgCanonicalPriceHistoryPointSchema = z.object({
  amount: z.number().nonnegative(),
  observedAt: z.string().datetime({ offset: true })
});

const justTcgCanonicalVariantSchema = z.object({
  sourceVariantId: z.string().min(1),
  condition: z.string().min(1).nullable().optional(),
  printing: z.string().min(1).nullable().optional(),
  language: z.string().min(1).nullable().optional(),
  externalIds: z.object({
    tcgplayerSkuId: z.string().min(1).optional()
  }),
  currentPrice: z.object({
    currency: z.literal("USD"),
    amount: z.number().nonnegative().nullable(),
    lastUpdatedAt: z.string().datetime({ offset: true }).nullable().optional(),
    history: z.array(justTcgCanonicalPriceHistoryPointSchema).default([])
  })
});

const justTcgCanonicalCardSchema = z.object({
  sourceCardId: z.string().min(1),
  name: z.string().min(1),
  gameLabel: z.string().min(1),
  set: z.object({
    slug: z.string().min(1).nullable().optional(),
    label: z.string().min(1).nullable().optional()
  }),
  number: z.string().min(1).nullable().optional(),
  rarity: z.string().min(1).nullable().optional(),
  details: z.string().nullable().optional(),
  externalIds: z.object({
    tcgplayerId: z.string().min(1).optional()
  }),
  variants: z.array(justTcgCanonicalVariantSchema)
});

export const justTcgCanonicalSnapshotSchema = z.object({
  version: z.literal(1),
  sourceId: z.literal("justtcg"),
  snapshotId: z.string().min(1),
  capturedAt: z.string().datetime({ offset: true }),
  game: z.object({
    slug: z.string().min(1),
    label: z.string().min(1).optional()
  }),
  sourceContext: z.object({
    captureKey: z.string().min(1).optional(),
    runId: z.string().min(1).optional(),
    requestUrl: z.string().url().optional(),
    requestUrls: z.array(z.string().url()).default([]),
    rawRelativePayloadPath: z.string().min(1).optional(),
    rawRelativeMetadataPath: z.string().min(1).optional(),
    rawRelativePayloadPaths: z.array(z.string().min(1)).default([]),
    rawRelativeMetadataPaths: z.array(z.string().min(1)).default([]),
    pageCount: z.number().int().positive().optional(),
    requestedLimit: z.number().int().positive().optional(),
    includePriceHistory: z.boolean().optional(),
    includeStatistics: z.boolean().optional()
  }),
  pagination: z.object({
    total: z.number().int().nonnegative().optional(),
    limit: z.number().int().positive().optional(),
    offset: z.number().int().nonnegative().optional(),
    hasMore: z.boolean().optional()
  }),
  usage: z.record(z.string(), z.unknown()).optional(),
  cards: z.array(justTcgCanonicalCardSchema)
});

export type JustTcgCanonicalPriceHistoryPoint = z.infer<
  typeof justTcgCanonicalPriceHistoryPointSchema
>;
export type JustTcgCanonicalVariant = z.infer<typeof justTcgCanonicalVariantSchema>;
export type JustTcgCanonicalCard = z.infer<typeof justTcgCanonicalCardSchema>;
export type JustTcgCanonicalSnapshot = z.infer<typeof justTcgCanonicalSnapshotSchema>;

export function createJustTcgCanonicalSnapshot(
  rawMetadata: RawCaptureMetadata,
  response: JustTcgCardsResponse
): JustTcgCanonicalSnapshot {
  return buildCanonicalSnapshot(rawMetadata, response);
}

export function createJustTcgCanonicalSnapshotFromPages(
  entries: Array<{
    metadata: RawCaptureMetadata;
    response: JustTcgCardsResponse;
  }>
): JustTcgCanonicalSnapshot {
  if (entries.length === 0) {
    throw new Error("At least one JustTCG raw capture entry is required to build a canonical snapshot.");
  }

  const sorted = [...entries].sort((left, right) => left.metadata.capturedAt.localeCompare(right.metadata.capturedAt));
  const first = sorted[0];
  if (!first) {
    throw new Error("Expected at least one JustTCG raw capture entry.");
  }

  const perPageSnapshots = sorted.map((entry) => buildCanonicalSnapshot(entry.metadata, entry.response));
  const firstSnapshot = perPageSnapshots[0];
  if (!firstSnapshot) {
    throw new Error("Expected at least one canonical page snapshot.");
  }

  const requestUrls = perPageSnapshots
    .map((snapshot) => snapshot.sourceContext.requestUrl)
    .filter((value): value is string => Boolean(value));
  const rawRelativePayloadPaths = perPageSnapshots.map(
    (snapshot) => snapshot.sourceContext.rawRelativePayloadPath
  ).filter((value): value is string => Boolean(value));
  const rawRelativeMetadataPaths = perPageSnapshots.map(
    (snapshot) => snapshot.sourceContext.rawRelativeMetadataPath
  ).filter((value): value is string => Boolean(value));
  const pageCount = perPageSnapshots.length;
  const cards = mergeCanonicalCards(perPageSnapshots);
  const capturedAt = first.metadata.capturedAt;
  const gameSlug = firstSnapshot.game.slug;
  const requestedLimit = readLastDefined(
    perPageSnapshots.map((snapshot) => snapshot.sourceContext.requestedLimit)
  );
  const includePriceHistory = readLastDefined(
    perPageSnapshots.map((snapshot) => snapshot.sourceContext.includePriceHistory)
  );
  const includeStatistics = readLastDefined(
    perPageSnapshots.map((snapshot) => snapshot.sourceContext.includeStatistics)
  );
  const usage = readLastDefined(perPageSnapshots.map((snapshot) => snapshot.usage));
  const total = readLastDefined(perPageSnapshots.map((snapshot) => snapshot.pagination.total));
  const limit = readLastDefined(perPageSnapshots.map((snapshot) => snapshot.pagination.limit));
  const finalHasMore = readLastDefined(perPageSnapshots.map((snapshot) => snapshot.pagination.hasMore));

  return justTcgCanonicalSnapshotSchema.parse({
    version: 1,
    sourceId: "justtcg",
    snapshotId: createJustTcgCanonicalSnapshotId(capturedAt, gameSlug),
    capturedAt,
    game: firstSnapshot.game,
    sourceContext: {
      captureKey: `${gameSlug}-cards-catalog`,
      runId: first.metadata.runId,
      requestUrl: requestUrls[0],
      requestUrls,
      rawRelativePayloadPath: rawRelativePayloadPaths[0],
      rawRelativeMetadataPath: rawRelativeMetadataPaths[0],
      rawRelativePayloadPaths,
      rawRelativeMetadataPaths,
      pageCount,
      requestedLimit,
      includePriceHistory,
      includeStatistics
    },
    pagination: {
      total,
      limit,
      offset: 0,
      hasMore: finalHasMore
    },
    usage,
    cards
  });
}

export async function materializeJustTcgCanonicalSnapshot(
  layout: PriceDataLayout,
  rawMetadata: RawCaptureMetadata
): Promise<{
  canonicalMetadata: CanonicalSnapshotMetadata;
  snapshot: JustTcgCanonicalSnapshot;
}> {
  const response = justTcgCardsResponseSchema.parse(
    await loadRawCaptureJson<unknown>(layout, rawMetadata)
  );
  const snapshot = createJustTcgCanonicalSnapshot(rawMetadata, response);
  const canonicalMetadata = await writeCanonicalSnapshot(layout, {
    sourceId: "justtcg",
    runId: rawMetadata.runId,
    capturedAt: snapshot.capturedAt,
    snapshotKey: `${snapshot.game.slug}-cards-snapshot`,
    snapshot: JSON.stringify(snapshot, null, 2),
    rawRelativePayloadPath: rawMetadata.relativePayloadPath,
    rawRelativeMetadataPath: deriveRawMetadataPath(rawMetadata.relativePayloadPath),
    rawRelativePayloadPaths: [rawMetadata.relativePayloadPath],
    rawRelativeMetadataPaths: [deriveRawMetadataPath(rawMetadata.relativePayloadPath)],
    notes: [
      "canonical-source-snapshot",
      `game:${snapshot.game.slug}`,
      `card-count:${String(snapshot.cards.length)}`,
      `variant-count:${String(snapshot.cards.reduce((count, card) => count + card.variants.length, 0))}`
    ]
  });

  return {
    canonicalMetadata,
    snapshot
  };
}

export async function materializeJustTcgCanonicalRunSnapshot(
  layout: PriceDataLayout,
  rawMetadatas: RawCaptureMetadata[]
): Promise<{
  canonicalMetadata: CanonicalSnapshotMetadata;
  snapshot: JustTcgCanonicalSnapshot;
}> {
  if (rawMetadatas.length === 0) {
    throw new Error("At least one JustTCG raw capture metadata record is required.");
  }

  const sortedMetadatas = [...rawMetadatas].sort((left, right) => left.capturedAt.localeCompare(right.capturedAt));
  const entries = await Promise.all(
    sortedMetadatas.map(async (metadata) => ({
      metadata,
      response: justTcgCardsResponseSchema.parse(await loadRawCaptureJson<unknown>(layout, metadata))
    }))
  );
  const snapshot = createJustTcgCanonicalSnapshotFromPages(entries);
  const rawRelativePayloadPaths = entries.map((entry) => entry.metadata.relativePayloadPath);
  const rawRelativeMetadataPaths = entries.map((entry) => deriveRawMetadataPath(entry.metadata.relativePayloadPath));
  const firstMetadata = sortedMetadatas[0];
  if (!firstMetadata) {
    throw new Error("Expected at least one sorted JustTCG raw metadata record.");
  }
  const canonicalMetadata = await writeCanonicalSnapshot(layout, {
    sourceId: "justtcg",
    runId: firstMetadata.runId,
    capturedAt: snapshot.capturedAt,
    snapshotKey: `${snapshot.game.slug}-cards-snapshot`,
    snapshot: JSON.stringify(snapshot, null, 2),
    rawRelativePayloadPath: rawRelativePayloadPaths[0],
    rawRelativeMetadataPath: rawRelativeMetadataPaths[0],
    rawRelativePayloadPaths,
    rawRelativeMetadataPaths,
    notes: [
      "canonical-source-snapshot",
      "canonical-source-run-snapshot",
      `game:${snapshot.game.slug}`,
      `page-count:${String(entries.length)}`,
      `card-count:${String(snapshot.cards.length)}`,
      `variant-count:${String(snapshot.cards.reduce((count, card) => count + card.variants.length, 0))}`
    ]
  });

  return {
    canonicalMetadata,
    snapshot
  };
}

export function createJustTcgCanonicalSnapshotId(capturedAt: string, gameSlug: string): string {
  const datePrefix = new Date(capturedAt).toISOString().slice(0, 10);
  return `justtcg-canonical-${datePrefix}-${sanitizeSegment(gameSlug)}`;
}

function buildCanonicalSnapshot(
  rawMetadata: RawCaptureMetadata,
  response: JustTcgCardsResponse
): JustTcgCanonicalSnapshot {
  const gameSlug = parseGameSlug(rawMetadata);
  const sourceContextFlags = parseCaptureNotes(rawMetadata.notes);

  return justTcgCanonicalSnapshotSchema.parse({
    version: 1,
    sourceId: "justtcg",
    snapshotId: createJustTcgCanonicalSnapshotId(rawMetadata.capturedAt, gameSlug),
    capturedAt: rawMetadata.capturedAt,
    game: {
      slug: gameSlug,
      label: response.data[0]?.game
    },
    sourceContext: {
      captureKey: rawMetadata.captureKey,
      runId: rawMetadata.runId,
      requestUrl: rawMetadata.requestUrl,
      requestUrls: rawMetadata.requestUrl ? [rawMetadata.requestUrl] : [],
      rawRelativePayloadPath: rawMetadata.relativePayloadPath,
      rawRelativeMetadataPath: deriveRawMetadataPath(rawMetadata.relativePayloadPath),
      rawRelativePayloadPaths: [rawMetadata.relativePayloadPath],
      rawRelativeMetadataPaths: [deriveRawMetadataPath(rawMetadata.relativePayloadPath)],
      pageCount: 1,
      requestedLimit: sourceContextFlags.requestedLimit,
      includePriceHistory: sourceContextFlags.includePriceHistory,
      includeStatistics: sourceContextFlags.includeStatistics
    },
    pagination: extractPagination(response.meta),
    usage:
      response._metadata && Object.keys(response._metadata).length > 0 ? response._metadata : undefined,
    cards: response.data.map((card) => ({
      sourceCardId: card.id,
      name: card.name,
      gameLabel: card.game,
      set: {
        slug: card.set,
        label: card.set_name
      },
      number: card.number,
      rarity: card.rarity,
      details: card.details,
      externalIds: {
        ...(asOptionalStringField("tcgplayerId", card.tcgplayerId))
      },
      variants: card.variants.map((variant) => ({
        sourceVariantId: variant.id,
        condition: variant.condition ?? null,
        printing: variant.printing ?? null,
        language: variant.language ?? null,
        externalIds: {
          ...(asOptionalStringField("tcgplayerSkuId", variant.tcgplayerSkuId))
        },
        currentPrice: {
          currency: "USD",
          amount: variant.price ?? null,
          lastUpdatedAt: normalizeEpochSeconds(variant.lastUpdated),
          history: extractPriceHistory(variant)
        }
      }))
    }))
  });
}

function parseGameSlug(metadata: RawCaptureMetadata): string {
  if (metadata.requestUrl) {
    const requestUrl = new URL(metadata.requestUrl);
    const game = requestUrl.searchParams.get("game")?.trim();
    if (game) {
      return game;
    }
  }

  if (metadata.captureKey.endsWith("-cards-sample")) {
    return metadata.captureKey.slice(0, -"-cards-sample".length);
  }

  if (metadata.captureKey.includes("-cards-page-")) {
    return metadata.captureKey.slice(0, metadata.captureKey.indexOf("-cards-page-"));
  }

  return metadata.captureKey;
}

function parseCaptureNotes(notes: string[]): {
  requestedLimit?: number;
  includePriceHistory?: boolean;
  includeStatistics?: boolean;
} {
  const requestedLimit = parseNoteNumber(notes, "requested-limit:");
  const includePriceHistory = parseNoteBoolean(notes, "include-price-history:");
  const includeStatistics = parseNoteBoolean(notes, "include-statistics:");

  return {
    requestedLimit,
    includePriceHistory,
    includeStatistics
  };
}

function parseNoteNumber(notes: string[], prefix: string): number | undefined {
  const note = notes.find((entry) => entry.startsWith(prefix));
  if (!note) {
    return undefined;
  }

  const value = Number(note.slice(prefix.length));
  return Number.isFinite(value) ? value : undefined;
}

function parseNoteBoolean(notes: string[], prefix: string): boolean | undefined {
  const note = notes.find((entry) => entry.startsWith(prefix));
  if (!note) {
    return undefined;
  }

  const value = note.slice(prefix.length).trim().toLowerCase();
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
}

function extractPagination(meta: JustTcgCardsResponse["meta"]): {
  total?: number;
  limit?: number;
  offset?: number;
  hasMore?: boolean;
} {
  if (!meta) {
    return {};
  }

  const total = readInteger(meta.total);
  const limit = readInteger(meta.limit);
  const offset = readInteger(meta.offset);
  const hasMore = typeof meta.hasMore === "boolean" ? meta.hasMore : undefined;

  return {
    total,
    limit,
    offset,
    hasMore
  };
}

function mergeCanonicalCards(
  pageSnapshots: JustTcgCanonicalSnapshot[]
): JustTcgCanonicalCard[] {
  const mergedByCardId = new Map<string, JustTcgCanonicalCard>();

  for (const snapshot of pageSnapshots) {
    for (const card of snapshot.cards) {
      const existing = mergedByCardId.get(card.sourceCardId);
      if (!existing) {
        mergedByCardId.set(card.sourceCardId, card);
        continue;
      }

      mergedByCardId.set(card.sourceCardId, mergeCanonicalCard(existing, card));
    }
  }

  return [...mergedByCardId.values()];
}

function mergeCanonicalCard(
  existing: JustTcgCanonicalCard,
  incoming: JustTcgCanonicalCard
): JustTcgCanonicalCard {
  const variantsById = new Map<string, JustTcgCanonicalVariant>();
  for (const variant of existing.variants) {
    variantsById.set(variant.sourceVariantId, variant);
  }
  for (const variant of incoming.variants) {
    variantsById.set(variant.sourceVariantId, variant);
  }

  return {
    ...existing,
    name: existing.name || incoming.name,
    gameLabel: existing.gameLabel || incoming.gameLabel,
    set: {
      slug: existing.set.slug ?? incoming.set.slug ?? null,
      label: existing.set.label ?? incoming.set.label ?? null
    },
    number: existing.number ?? incoming.number ?? null,
    rarity: existing.rarity ?? incoming.rarity ?? null,
    details: existing.details ?? incoming.details ?? null,
    externalIds: {
      tcgplayerId: existing.externalIds.tcgplayerId ?? incoming.externalIds.tcgplayerId
    },
    variants: [...variantsById.values()]
  };
}

function readInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) ? value : undefined;
}

function extractPriceHistory(variant: JustTcgVariant): JustTcgCanonicalPriceHistoryPoint[] {
  if (!Array.isArray(variant.priceHistory)) {
    return [];
  }

  return variant.priceHistory
    .map((entry) => parsePriceHistoryPoint(entry))
    .filter((entry): entry is JustTcgCanonicalPriceHistoryPoint => entry !== undefined);
}

function parsePriceHistoryPoint(value: unknown): JustTcgCanonicalPriceHistoryPoint | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as Record<string, unknown>;
  const amount = readFiniteNumber(candidate.price ?? candidate.amount ?? candidate.value);
  const compactAmount = readFiniteNumber(candidate.p);
  const observedAt = normalizeObservedAt(
    candidate.observedAt ??
      candidate.recordedAt ??
      candidate.date ??
      candidate.timestamp ??
      candidate.time ??
      candidate.updatedAt ??
      candidate.lastUpdated ??
      candidate.t
  );

  const resolvedAmount = amount ?? compactAmount;

  if (resolvedAmount === undefined || !observedAt) {
    return undefined;
  }

  return {
    amount: resolvedAmount,
    observedAt
  };
}

function readFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeObservedAt(value: unknown): string | undefined {
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const milliseconds = value > 10_000_000_000 ? value : value * 1000;
    return new Date(milliseconds).toISOString();
  }

  return undefined;
}

function normalizeEpochSeconds(value: number | null | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return new Date(value * 1000).toISOString();
}

function deriveRawMetadataPath(relativePayloadPath: string): string {
  return relativePayloadPath.replace(/\.json$/u, ".meta.json");
}

function asOptionalStringField<T extends string>(
  key: T,
  value: string | null | undefined
): Partial<Record<T, string>> {
  return typeof value === "string" && value.trim().length > 0 ? { [key]: value } as Record<T, string> : {};
}

function sanitizeSegment(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
  const sanitized = normalized.replace(/^-+|-+$/g, "");

  if (!sanitized) {
    throw new Error("Snapshot segment must contain at least one supported character");
  }

  return sanitized.toLowerCase();
}

function readLastDefined<T>(values: Array<T | undefined>): T | undefined {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    const value = values[index];
    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}
