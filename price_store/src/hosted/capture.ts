import { verifyJustTcgRequestLimit } from "../sources/justtcg/capture.js";
import { fetchJustTcgCards } from "../sources/justtcg/client.js";
import type { JustTcgConfig } from "../sources/justtcg/config.js";
import { createHostedPriceStoreRepository } from "./repository.js";
import type { D1DatabaseLike } from "./types.js";

const DEFAULT_MAX_REQUESTS = 60;
const RAW_RETENTION_DAYS = 7;

export type HostedCaptureMode = "full" | "incremental";

export type RunHostedPriceCaptureInput = {
  database: D1DatabaseLike;
  config: JustTcgConfig;
  game?: string;
  mode?: HostedCaptureMode;
  updatedAfter?: string;
  includePriceHistory?: boolean;
  includeStatistics?: boolean;
  limit?: number;
  verifyLimit?: boolean;
  maxPages?: number;
  maxRequests?: number;
  requestDelayMs?: number;
  startedAt?: string;
};

export type HostedPriceCaptureResult = {
  runId: string;
  captureMode: HostedCaptureMode;
  pageCount: number;
  requestCount: number;
  cardCount: number;
  verifiedLimit: number;
  updatedAfter: string | null;
};

export async function runHostedPriceCapture(input: RunHostedPriceCaptureInput): Promise<HostedPriceCaptureResult> {
  const repository = createHostedPriceStoreRepository(input.database);
  const startedAt = input.startedAt ?? new Date().toISOString();
  const game = input.game ?? input.config.defaultGame;
  const captureMode = input.mode ?? "incremental";
  const includePriceHistory = input.includePriceHistory ?? input.config.includePriceHistory;
  const includeStatistics = input.includeStatistics ?? input.config.includeStatistics;
  const updatedAfter = captureMode === "incremental" ? normalizeUpdatedAfter(input.updatedAfter) : null;
  const runId = createHostedCaptureRunId(startedAt, game);

  await repository.insertCaptureRun({
    runId,
    captureMode,
    gameSlug: game,
    status: "running",
    startedAt,
    completedAt: null,
    updatedAfter,
    requestCount: 0,
    pageCount: 0,
    cardCount: 0,
    verifiedLimit: null,
    includePriceHistory,
    includeStatistics,
    message: `Capturing ${captureMode} JustTCG pages for ${game}.`
  });
  await repository.setPipelineState("active_capture_run_id", runId);

  try {
    const verifiedLimit =
      input.verifyLimit === false
        ? input.limit ?? input.config.defaultLimit
        : (
            await verifyJustTcgRequestLimit(input.config, {
              game,
              includePriceHistory,
              includeStatistics
            })
          ).verifiedLimit;
    const effectiveLimit = input.limit ? Math.min(input.limit, verifiedLimit) : verifiedLimit;
    const maxRequests = input.maxRequests ?? DEFAULT_MAX_REQUESTS;
    let offset = 0;
    let pageCount = 0;
    let requestCount = 0;
    let cardCount = 0;

    while (requestCount < maxRequests) {
      if (input.maxPages !== undefined && pageCount >= input.maxPages) {
        break;
      }

      const capturedAt = new Date().toISOString();
      const result = await fetchJustTcgCards(input.config, {
        game,
        limit: effectiveLimit,
        offset,
        includePriceHistory,
        includeStatistics,
        updatedAfter: updatedAfter ? Math.floor(new Date(updatedAfter).getTime() / 1000) : undefined
      });
      const pageIndex = pageCount + 1;
      const rowsThisPage = result.data.data.length;

      await repository.insertCapturePage({
        pageId: `${runId}::page-${String(pageIndex).padStart(3, "0")}`,
        captureRunId: runId,
        pageIndex,
        pageOffset: offset,
        capturedAt,
        requestUrl: result.requestUrl,
        rowCount: rowsThisPage,
        payloadJson: JSON.stringify(result.data),
        expiresAt: addDays(capturedAt, RAW_RETENTION_DAYS)
      });

      pageCount = pageIndex;
      requestCount += 1;
      cardCount += rowsThisPage;

      const hasMore = result.data.meta?.hasMore === true;
      if (!hasMore) {
        break;
      }

      if (rowsThisPage === 0) {
        throw new Error("JustTCG indicated more pages but returned zero rows.");
      }

      offset += rowsThisPage;

      if ((input.requestDelayMs ?? 0) > 0) {
        await delay(input.requestDelayMs ?? 0);
      }
    }

    await repository.updateCaptureRun({
      runId,
      captureMode,
      gameSlug: game,
      status: "succeeded",
      startedAt,
      completedAt: new Date().toISOString(),
      updatedAfter,
      requestCount,
      pageCount,
      cardCount,
      verifiedLimit: effectiveLimit,
      includePriceHistory,
      includeStatistics,
      message: `Captured ${cardCount} JustTCG rows across ${pageCount} page(s).`
    });
    await repository.setPipelineState("active_capture_run_id", null);
    await repository.setPipelineState("latest_successful_capture_run_id", runId);

    return {
      runId,
      captureMode,
      pageCount,
      requestCount,
      cardCount,
      verifiedLimit: effectiveLimit,
      updatedAfter
    };
  } catch (error) {
    await repository.updateCaptureRun({
      runId,
      captureMode,
      gameSlug: game,
      status: "failed",
      startedAt,
      completedAt: new Date().toISOString(),
      updatedAfter,
      requestCount: 0,
      pageCount: 0,
      cardCount: 0,
      verifiedLimit: null,
      includePriceHistory,
      includeStatistics,
      message: error instanceof Error ? error.message : "Unknown capture failure"
    });
    await repository.setPipelineState("active_capture_run_id", null);
    throw error;
  }
}

export function createHostedCaptureRunId(startedAt: string, game: string): string {
  return `hosted-capture-${compactTimestamp(startedAt)}-${sanitizeSegment(game)}`;
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

function addDays(value: string, days: number): string {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString();
}

async function delay(milliseconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}
