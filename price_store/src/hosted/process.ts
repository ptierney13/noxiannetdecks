import { justTcgCardsResponseSchema, type JustTcgVariant } from "../sources/justtcg/schema.js";
import { createHostedPriceStoreRepository } from "./repository.js";
import type { D1DatabaseLike, HostedPriceDataRow } from "./types.js";

export type RunHostedPriceProcessInput = {
  database: D1DatabaseLike;
  captureRunId?: string;
  startedAt?: string;
};

export type HostedPriceProcessResult = {
  processRunId: string;
  captureRunId: string;
  rowCount: number;
};

export async function runHostedPriceProcess(input: RunHostedPriceProcessInput): Promise<HostedPriceProcessResult> {
  const repository = createHostedPriceStoreRepository(input.database);
  const captureRun =
    (input.captureRunId ? await repository.getCaptureRun(input.captureRunId) : await repository.getLatestSuccessfulCaptureRun()) ??
    null;

  if (!captureRun) {
    throw new Error("No successful hosted capture run is available to process.");
  }

  if (captureRun.status !== "succeeded") {
    throw new Error(`Capture run ${captureRun.runId} is not complete.`);
  }

  const startedAt = input.startedAt ?? new Date().toISOString();
  const processRunId = createHostedProcessRunId(startedAt, captureRun.runId);

  await repository.insertProcessRun({
    processRunId,
    captureRunId: captureRun.runId,
    status: "running",
    startedAt,
    completedAt: null,
    rowCount: 0,
    message: `Processing capture ${captureRun.runId} into relational price rows.`
  });

  try {
    const pages = await repository.listCapturePages(captureRun.runId);
    if (pages.length === 0) {
      throw new Error(`Capture run ${captureRun.runId} does not have any captured pages.`);
    }

    const byVariantId = new Map<string, HostedPriceDataRow>();

    for (const page of pages) {
      const response = justTcgCardsResponseSchema.parse(JSON.parse(page.payloadJson));
      for (const card of response.data) {
        for (const variant of card.variants) {
          const row = createPriceDataRow({
            processRunId,
            captureRunId: captureRun.runId,
            gameSlug: captureRun.gameSlug,
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
          byVariantId.set(row.sourceVariantId, row);
        }
      }
    }

    const rows = [...byVariantId.values()].sort((left, right) =>
      `${left.sourceCardId}::${left.sourceVariantId}`.localeCompare(`${right.sourceCardId}::${right.sourceVariantId}`)
    );
    await repository.replacePriceDataForProcessRun(processRunId, rows);
    await repository.updateProcessRun({
      processRunId,
      captureRunId: captureRun.runId,
      status: "succeeded",
      startedAt,
      completedAt: new Date().toISOString(),
      rowCount: rows.length,
      message: `Processed ${rows.length} price rows from capture ${captureRun.runId}.`
    });

    return {
      processRunId,
      captureRunId: captureRun.runId,
      rowCount: rows.length
    };
  } catch (error) {
    await repository.updateProcessRun({
      processRunId,
      captureRunId: captureRun.runId,
      status: "failed",
      startedAt,
      completedAt: new Date().toISOString(),
      rowCount: 0,
      message: error instanceof Error ? error.message : "Unknown process failure"
    });
    throw error;
  }
}

export function createHostedProcessRunId(startedAt: string, captureRunId: string): string {
  return `hosted-process-${compactTimestamp(startedAt)}-${captureRunId}`;
}

function createPriceDataRow(input: {
  processRunId: string;
  captureRunId: string;
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
}): HostedPriceDataRow {
  return {
    rowId: `${input.processRunId}::${input.sourceVariantId}`,
    processRunId: input.processRunId,
    captureRunId: input.captureRunId,
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

function compactTimestamp(value: string): string {
  return new Date(value).toISOString().replace(/[-:.]/g, "").replace("T", "t");
}
