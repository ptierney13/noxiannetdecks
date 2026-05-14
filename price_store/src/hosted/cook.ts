import { justTcgCardsResponseSchema, type JustTcgVariant } from "../sources/justtcg/schema.js";
import { createHostedPriceStoreRepository } from "./repository.js";
import type {
  D1DatabaseLike,
  HostedCookMessage,
  HostedCookedPriceRow,
  HostedPublishMessage,
  QueueSenderLike
} from "./types.js";

export type RunHostedPriceCookInput = {
  database: D1DatabaseLike;
  message: HostedCookMessage;
  publishQueue: QueueSenderLike<HostedPublishMessage>;
  startedAt?: string;
};

export type HostedPriceCookResult = {
  rowCount: number;
  runId: string;
  shouldEnqueuePublish: boolean;
};

export async function runHostedPriceCook(input: RunHostedPriceCookInput): Promise<HostedPriceCookResult> {
  const repository = createHostedPriceStoreRepository(input.database);
  const startedAt = input.startedAt ?? new Date().toISOString();
  const claimed = await repository.claimCook(input.message.runId, startedAt);
  if (!claimed) {
    const existing = await repository.getRun(input.message.runId);
    if (!existing || (existing.status !== "ready_to_publish" && existing.status !== "succeeded")) {
      throw new Error(`Run ${input.message.runId} is not ready to cook.`);
    }

    return {
      rowCount: existing.cookedRowCount,
      runId: input.message.runId,
      shouldEnqueuePublish: false
    };
  }

  try {
    const run = await repository.getRun(input.message.runId);
    if (!run) {
      throw new Error(`Run ${input.message.runId} was not found.`);
    }

    const pages = await repository.listRawPages(input.message.runId);
    if (pages.length === 0) {
      throw new Error(`Run ${input.message.runId} does not have any raw pages to cook.`);
    }

    const rows = new Map<string, HostedCookedPriceRow>();
    for (const page of pages) {
      const response = justTcgCardsResponseSchema.parse(JSON.parse(page.payloadJson));
      for (const card of response.data) {
        for (const variant of card.variants) {
          const row = createCookedPriceRow({
            runId: input.message.runId,
            gameSlug: run.gameSlug,
            sourceCardId: card.id,
            sourceVariantId: variant.id,
            tcgplayerId: card.tcgplayerId ?? null,
            tcgplayerSkuId: variant.tcgplayerSkuId ?? null,
            language: variant.language ?? null,
            condition: variant.condition ?? null,
            printing: variant.printing ?? null,
            currentPriceAmount: variant.price ?? null,
            currentPriceLastUpdatedAt: normalizeEpochSeconds(variant.lastUpdated),
            priceHistoryJson: JSON.stringify(extractPriceHistory(variant))
          });
          rows.set(row.sourceVariantId, row);
        }
      }
    }

    const cookedRows = [...rows.values()].sort((left, right) =>
      `${left.sourceCardId}::${left.sourceVariantId}`.localeCompare(`${right.sourceCardId}::${right.sourceVariantId}`)
    );
    await repository.replaceCookedRows(input.message.runId, cookedRows);
    const shouldEnqueuePublish = await repository.completeCook(input.message.runId, cookedRows.length, new Date().toISOString());
    if (shouldEnqueuePublish) {
      await input.publishQueue.send({
        runId: input.message.runId
      });
    }

    return {
      rowCount: cookedRows.length,
      runId: input.message.runId,
      shouldEnqueuePublish
    };
  } catch (error) {
    await repository.markRunFailed(
      input.message.runId,
      error instanceof Error ? error.message : "Unknown cook failure",
      new Date().toISOString()
    );
    throw error;
  }
}

function createCookedPriceRow(input: {
  runId: string;
  gameSlug: string;
  sourceCardId: string;
  sourceVariantId: string;
  tcgplayerId: string | null;
  tcgplayerSkuId: string | null;
  language: string | null;
  condition: string | null;
  printing: string | null;
  currentPriceAmount: number | null;
  currentPriceLastUpdatedAt: string | null;
  priceHistoryJson: string;
}): HostedCookedPriceRow {
  return {
    rowId: `${input.runId}::${input.sourceVariantId}`,
    runId: input.runId,
    upstreamProviderId: "justtcg",
    priceSourceId: "tcgplayer",
    gameSlug: input.gameSlug,
    sourceCardId: input.sourceCardId,
    sourceVariantId: input.sourceVariantId,
    tcgplayerId: input.tcgplayerId,
    tcgplayerSkuId: input.tcgplayerSkuId,
    language: input.language,
    condition: input.condition,
    printing: input.printing,
    currency: "USD",
    currentPriceAmount: input.currentPriceAmount,
    currentPriceLastUpdatedAt: input.currentPriceLastUpdatedAt,
    priceHistoryJson: input.priceHistoryJson
  };
}

function extractPriceHistory(variant: JustTcgVariant): Array<{ amount: number; observedAt: string }> {
  if (!Array.isArray(variant.priceHistory)) {
    return [];
  }

  return variant.priceHistory
    .map((value) => {
      if (!value || typeof value !== "object") {
        return null;
      }

      const candidate = value as Record<string, unknown>;
      const amount = readFiniteNumber(candidate.price ?? candidate.amount ?? candidate.value ?? candidate.p);
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

      if (amount === undefined || !observedAt) {
        return null;
      }

      return {
        amount,
        observedAt
      };
    })
    .filter((entry): entry is { amount: number; observedAt: string } => entry !== null);
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

function normalizeEpochSeconds(value: number | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  return new Date(value * 1000).toISOString();
}
