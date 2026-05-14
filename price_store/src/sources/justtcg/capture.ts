import type { PriceDataLayout } from "../../config.js";
import { writeRawCapture } from "../../raw/repository.js";
import { writeRunStatus } from "../../runs/repository.js";
import type { PriceRunStatus } from "../../runs/schema.js";
import type { JustTcgConfig } from "./config.js";
import { fetchJustTcgCards, JustTcgRequestError } from "./client.js";
import {
  verifyJustTcgRequestLimit,
  type VerifyJustTcgRequestLimitInput,
  type VerifyJustTcgRequestLimitResult
} from "./limit.js";

const DEFAULT_MAX_REQUESTS = 60;

export type CaptureJustTcgSampleInput = {
  game?: string;
  limit?: number;
  includePriceHistory?: boolean;
  includeStatistics?: boolean;
  startedAt?: string;
};

export type CaptureJustTcgSampleResult = {
  runId: string;
  rawCaptureCount: number;
  relativePayloadPaths: string[];
  cardCount: number;
};

export type CaptureJustTcgCatalogInput = {
  game?: string;
  limit?: number;
  verifyLimit?: boolean;
  includePriceHistory?: boolean;
  includeStatistics?: boolean;
  startedAt?: string;
  maxPages?: number;
  maxRequests?: number;
  requestDelayMs?: number;
  limitSearchUpperBound?: number;
};

export type CaptureJustTcgCatalogResult = {
  runId: string;
  rawCaptureCount: number;
  relativePayloadPaths: string[];
  relativeMetadataPaths: string[];
  cardCount: number;
  pageCount: number;
  requestCount: number;
  verifiedLimit: number;
  hasMoreRemaining: boolean;
  limitVerification?: VerifyJustTcgRequestLimitResult;
};

export function createJustTcgCaptureRunId(startedAt: string, game: string): string {
  const datePrefix = new Date(startedAt).toISOString().slice(0, 10);
  return `justtcg-capture-${datePrefix}-${sanitizeSegment(game)}`;
}

export async function captureJustTcgCardsSample(
  layout: PriceDataLayout,
  config: JustTcgConfig,
  input: CaptureJustTcgSampleInput = {}
): Promise<CaptureJustTcgSampleResult> {
  const result = await captureJustTcgCardsCatalog(layout, config, {
    game: input.game,
    limit: input.limit ?? config.defaultLimit,
    verifyLimit: false,
    includePriceHistory: input.includePriceHistory,
    includeStatistics: input.includeStatistics,
    startedAt: input.startedAt,
    maxPages: 1,
    maxRequests: 1,
    requestDelayMs: 0
  });

  return {
    runId: result.runId,
    rawCaptureCount: result.rawCaptureCount,
    relativePayloadPaths: result.relativePayloadPaths,
    cardCount: result.cardCount
  };
}

export async function captureJustTcgCardsCatalog(
  layout: PriceDataLayout,
  config: JustTcgConfig,
  input: CaptureJustTcgCatalogInput = {}
): Promise<CaptureJustTcgCatalogResult> {
  const startedAt = input.startedAt ?? new Date().toISOString();
  const game = input.game ?? config.defaultGame;
  const includePriceHistory = input.includePriceHistory ?? config.includePriceHistory;
  const includeStatistics = input.includeStatistics ?? config.includeStatistics;
  const runId = createJustTcgCaptureRunId(startedAt, game);
  const maxPages = input.maxPages;
  const maxRequests = input.maxRequests ?? DEFAULT_MAX_REQUESTS;
  const requestDelayMs = input.requestDelayMs ?? 0;

  await writeRunStatus(
    layout,
    createRunStatus({
      runId,
      stage: "raw-capture",
      startedAt,
      status: "running",
      message: `Capturing paged JustTCG catalog data for ${game}.`
    })
  );

  try {
    const limitVerification =
      input.verifyLimit === false
        ? undefined
        : await verifyJustTcgRequestLimit(config, {
            game,
            includePriceHistory,
            includeStatistics,
            searchUpperBound: input.limitSearchUpperBound
          });
    const verifiedLimit = limitVerification?.verifiedLimit ?? input.limit ?? config.defaultLimit;
    const effectiveLimit =
      input.limit !== undefined ? Math.min(input.limit, verifiedLimit) : verifiedLimit;
    const relativePayloadPaths: string[] = [];
    const relativeMetadataPaths: string[] = [];
    let cardCount = 0;
    let pageCount = 0;
    let requestCount = 0;
    let offset = 0;
    let hasMoreRemaining = false;

    while (true) {
      if (pageCount >= maxRequests) {
        hasMoreRemaining = true;
        break;
      }

      if (maxPages !== undefined && pageCount >= maxPages) {
        hasMoreRemaining = true;
        break;
      }

      const pageCapturedAt = new Date().toISOString();
      const result = await fetchJustTcgCards(config, {
        game,
        limit: effectiveLimit,
        offset,
        includePriceHistory,
        includeStatistics
      });

      requestCount += 1;
      pageCount += 1;
      const cardsThisPage = result.data.data.length;
      cardCount += cardsThisPage;
      const pageMetadata = await writeRawCapture(layout, {
        sourceId: "justtcg",
        runId,
        capturedAt: pageCapturedAt,
        captureKey: `${game}-cards-page-${String(pageCount).padStart(3, "0")}`,
        extension: "json",
        payload: JSON.stringify(result.data, null, 2),
        payloadFormat: "json",
        requestUrl: result.requestUrl,
        notes: [
          "live-source:justtcg",
          "paged-catalog-capture",
          `game:${game}`,
          `page-index:${String(pageCount)}`,
          `page-offset:${String(offset)}`,
          `requested-limit:${String(effectiveLimit)}`,
          `verified-limit:${String(verifiedLimit)}`,
          `include-price-history:${String(includePriceHistory)}`,
          `include-statistics:${String(includeStatistics)}`,
          "free-plan-budgeted-capture"
        ]
      });

      relativePayloadPaths.push(pageMetadata.relativePayloadPath);
      relativeMetadataPaths.push(pageMetadata.relativePayloadPath.replace(/\.json$/u, ".meta.json"));

      const hasMore = typeof result.data.meta?.hasMore === "boolean" ? result.data.meta.hasMore : false;
      if (!hasMore) {
        break;
      }

      if (cardsThisPage === 0) {
        throw new Error("JustTCG pagination indicated more results, but the page returned zero cards.");
      }

      offset += cardsThisPage;

      if (requestDelayMs > 0) {
        await wait(requestDelayMs);
      }
    }

    await writeRunStatus(
      layout,
      createRunStatus({
        runId,
        stage: "raw-capture",
        startedAt,
        status: "succeeded",
        completedAt: new Date().toISOString(),
        rawCaptureCount: pageCount,
        pageCount,
        requestCount,
        cardCount,
        verifiedLimit,
        message: hasMoreRemaining
          ? `Captured ${cardCount} JustTCG cards for ${game} across ${pageCount} page(s) before hitting the configured run cap.`
          : `Captured ${cardCount} JustTCG cards for ${game} across ${pageCount} page(s).`
      })
    );

    return {
      runId,
      rawCaptureCount: pageCount,
      relativePayloadPaths,
      relativeMetadataPaths,
      cardCount,
      pageCount,
      requestCount,
      verifiedLimit,
      hasMoreRemaining,
      limitVerification
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown JustTCG capture failure";

    await writeRunStatus(
      layout,
      createRunStatus({
        runId,
        stage: "raw-capture",
        startedAt,
        status: "failed",
        completedAt: new Date().toISOString(),
        message: `Failed to capture JustTCG catalog data for ${game}: ${message}`
      })
    );

    throw error;
  }
}

function sanitizeSegment(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
  const sanitized = normalized.replace(/^-+|-+$/g, "");
  if (!sanitized) {
    throw new Error("Capture segment must contain at least one supported character");
  }

  return sanitized.toLowerCase();
}

function createRunStatus(
  input: Pick<PriceRunStatus, "runId" | "stage" | "startedAt" | "status" | "message"> &
    Partial<
      Pick<
        PriceRunStatus,
        | "completedAt"
        | "rawCaptureCount"
        | "canonicalSnapshotCount"
        | "publishedArtifactCount"
        | "requestCount"
        | "pageCount"
        | "cardCount"
        | "verifiedLimit"
      >
    >
): PriceRunStatus {
  return {
    version: 1,
    runId: input.runId,
    sourceId: "justtcg",
    stage: input.stage,
    status: input.status,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    rawCaptureCount: input.rawCaptureCount,
    canonicalSnapshotCount: input.canonicalSnapshotCount,
    publishedArtifactCount: input.publishedArtifactCount,
    requestCount: input.requestCount,
    pageCount: input.pageCount,
    cardCount: input.cardCount,
    verifiedLimit: input.verifiedLimit,
    message: input.message
  };
}

async function wait(milliseconds: number): Promise<void> {
  if (milliseconds <= 0) {
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}
