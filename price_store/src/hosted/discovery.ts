import { verifyJustTcgRequestLimit } from "../sources/justtcg/limit.js";
import { fetchJustTcgCards } from "../sources/justtcg/client.js";
import type { JustTcgConfig } from "../sources/justtcg/config.js";
import { createHostedPriceStoreRepository } from "./repository.js";
import type {
  D1DatabaseLike,
  HostedCaptureMode,
  HostedIngestionChunkMessage,
  HostedPipelineRunRow,
  QueueSenderLike
} from "./types.js";

const DEFAULT_REQUEST_BUDGET_PER_CHUNK = 45;

export type RunHostedPriceDiscoveryInput = {
  chunkRequestBudget?: number;
  config: JustTcgConfig;
  database: D1DatabaseLike;
  game?: string;
  ingestionQueue: QueueSenderLike<HostedIngestionChunkMessage>;
  mode?: HostedCaptureMode;
  requestDelayMs?: number;
  startedAt?: string;
  updatedAfter?: string;
  verifyLimit?: boolean;
};

export type HostedPriceDiscoveryResult = {
  chunkCount: number;
  pageCount: number;
  runId: string;
  verifiedLimit: number;
};

export async function runHostedPriceDiscovery(input: RunHostedPriceDiscoveryInput): Promise<HostedPriceDiscoveryResult> {
  const repository = createHostedPriceStoreRepository(input.database);
  const startedAt = input.startedAt ?? new Date().toISOString();
  const game = input.game ?? input.config.defaultGame;
  const captureMode = input.mode ?? "full";
  const updatedAfter = captureMode === "incremental" ? normalizeUpdatedAfter(input.updatedAfter) : null;
  const verifiedLimit =
    input.verifyLimit === false
      ? input.config.defaultLimit
      : (
          await verifyJustTcgRequestLimit(input.config, {
            game,
            includePriceHistory: input.config.includePriceHistory,
            includeStatistics: input.config.includeStatistics
          })
        ).verifiedLimit;
  const discoveryRequest = await fetchJustTcgCards(input.config, {
    game,
    limit: verifiedLimit,
    offset: 0,
    includePriceHistory: input.config.includePriceHistory,
    includeStatistics: input.config.includeStatistics,
    updatedAfter: updatedAfter ? Math.floor(new Date(updatedAfter).getTime() / 1000) : undefined
  });
  const totalRows = readFiniteInteger(discoveryRequest.data.meta?.total);
  if (totalRows == null) {
    throw new Error("Discovery could not determine the JustTCG page count because meta.total was missing.");
  }

  const pageCount = Math.max(1, Math.ceil(totalRows / verifiedLimit));
  const chunkRequestBudget = Math.max(1, input.chunkRequestBudget ?? DEFAULT_REQUEST_BUDGET_PER_CHUNK);
  const chunkCount = Math.ceil(pageCount / chunkRequestBudget);
  const runId = createHostedRunId(startedAt, game);
  const baseRun: HostedPipelineRunRow = {
    runId,
    gameSlug: game,
    captureMode,
    status: "ingesting",
    startedAt,
    discoveryCompletedAt: new Date().toISOString(),
    ingestionCompletedAt: null,
    cookStartedAt: null,
    cookCompletedAt: null,
    publishStartedAt: null,
    completedAt: null,
    updatedAfter,
    verifiedLimit,
    requestBudgetPerChunk: chunkRequestBudget,
    pageCount,
    chunkCount,
    completedChunkCount: 0,
    remainingChunkCount: chunkCount,
    rawPageCount: 0,
    cookedRowCount: 0,
    publishedRowCount: 0,
    cookEnqueueRequestedAt: null,
    publishEnqueueRequestedAt: null,
    livePublishedAt: null,
    latestError: null
  };
  await repository.insertRun(baseRun);

  for (let index = 0; index < chunkCount; index += 1) {
    const pageStartIndex = index * chunkRequestBudget + 1;
    const pageEndIndex = Math.min(pageCount, pageStartIndex + chunkRequestBudget - 1);
    const chunkId = `${runId}::chunk-${String(index + 1).padStart(3, "0")}`;
    await repository.insertChunk({
      chunkId,
      runId,
      pageStartIndex,
      pageEndIndex,
      requestCount: pageEndIndex - pageStartIndex + 1,
      status: "queued",
      createdAt: startedAt,
      claimedAt: null,
      completedAt: null,
      latestError: null
    });
    await input.ingestionQueue.send({
      chunkId,
      game,
      includePriceHistory: input.config.includePriceHistory,
      includeStatistics: input.config.includeStatistics,
      limit: verifiedLimit,
      pageEndIndex,
      pageStartIndex,
      runId,
      updatedAfter
    });
  }

  return {
    chunkCount,
    pageCount,
    runId,
    verifiedLimit
  };
}

export function createHostedRunId(startedAt: string, game: string): string {
  return `hosted-run-${compactTimestamp(startedAt)}-${sanitizeSegment(game)}`;
}

function normalizeUpdatedAfter(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid updatedAfter timestamp: ${value}`);
  }

  return parsed.toISOString();
}

function readFiniteInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
  }

  return null;
}

function compactTimestamp(value: string): string {
  return new Date(value).toISOString().replace(/[-:.]/g, "").replace("T", "t");
}

function sanitizeSegment(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
  const sanitized = normalized.replace(/^-+|-+$/g, "");

  if (!sanitized) {
    throw new Error("Run id segment must contain at least one supported character.");
  }

  return sanitized.toLowerCase();
}
