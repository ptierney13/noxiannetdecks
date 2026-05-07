import type { PriceDataLayout } from "../../config.js";
import type { CanonicalSnapshotMetadata } from "../../canonical/schema.js";
import { writeCanonicalSnapshot } from "../../canonical/repository.js";
import { loadRawCaptureJson } from "../../raw/repository.js";
import type { RawCaptureMetadata } from "../../raw/schema.js";
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
    captureKey: z.string().min(1),
    requestUrl: z.string().url().optional(),
    rawRelativePayloadPath: z.string().min(1),
    rawRelativeMetadataPath: z.string().min(1),
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
  const gameSlug = parseGameSlug(rawMetadata);
  const sourceContextFlags = parseCaptureNotes(rawMetadata.notes);
  const snapshot = justTcgCanonicalSnapshotSchema.parse({
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
      requestUrl: rawMetadata.requestUrl,
      rawRelativePayloadPath: rawMetadata.relativePayloadPath,
      rawRelativeMetadataPath: deriveRawMetadataPath(rawMetadata.relativePayloadPath),
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
        tcgplayerId: card.tcgplayerId
      },
      variants: card.variants.map((variant) => ({
        sourceVariantId: variant.id,
        condition: variant.condition ?? null,
        printing: variant.printing ?? null,
        language: variant.language ?? null,
        externalIds: {
          tcgplayerSkuId: variant.tcgplayerSkuId
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

  return snapshot;
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
    capturedAt: snapshot.capturedAt,
    snapshotKey: `${snapshot.game.slug}-cards-snapshot`,
    snapshot: JSON.stringify(snapshot, null, 2),
    rawRelativePayloadPath: rawMetadata.relativePayloadPath,
    rawRelativeMetadataPath: deriveRawMetadataPath(rawMetadata.relativePayloadPath),
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

export function createJustTcgCanonicalSnapshotId(capturedAt: string, gameSlug: string): string {
  const datePrefix = new Date(capturedAt).toISOString().slice(0, 10);
  return `justtcg-canonical-${datePrefix}-${sanitizeSegment(gameSlug)}`;
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

function sanitizeSegment(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
  const sanitized = normalized.replace(/^-+|-+$/g, "");

  if (!sanitized) {
    throw new Error("Snapshot segment must contain at least one supported character");
  }

  return sanitized.toLowerCase();
}
