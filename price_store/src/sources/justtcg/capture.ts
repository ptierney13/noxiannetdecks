import type { PriceDataLayout } from "../../config.js";
import { writeRawCapture } from "../../raw/repository.js";
import { writeRunStatus } from "../../runs/repository.js";
import type { PriceRunStatus } from "../../runs/schema.js";
import type { JustTcgConfig } from "./config.js";
import { fetchJustTcgCards } from "./client.js";

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

export function createJustTcgCaptureRunId(startedAt: string, game: string): string {
  const datePrefix = new Date(startedAt).toISOString().slice(0, 10);
  return `justtcg-capture-${datePrefix}-${sanitizeSegment(game)}`;
}

export async function captureJustTcgCardsSample(
  layout: PriceDataLayout,
  config: JustTcgConfig,
  input: CaptureJustTcgSampleInput = {}
): Promise<CaptureJustTcgSampleResult> {
  const startedAt = input.startedAt ?? new Date().toISOString();
  const game = input.game ?? config.defaultGame;
  const runId = createJustTcgCaptureRunId(startedAt, game);

  await writeRunStatus(
    layout,
    createRunStatus({
      runId,
      startedAt,
      status: "running",
      message: `Capturing bounded JustTCG card sample for ${game}.`
    })
  );

  try {
    const result = await fetchJustTcgCards(config, {
      game,
      limit: input.limit ?? config.defaultLimit,
      includePriceHistory: input.includePriceHistory ?? config.includePriceHistory,
      includeStatistics: input.includeStatistics ?? config.includeStatistics
    });

    const metadata = await writeRawCapture(layout, {
      sourceId: "justtcg",
      capturedAt: startedAt,
      captureKey: `${game}-cards-sample`,
      extension: "json",
      payload: JSON.stringify(result.data, null, 2),
      payloadFormat: "json",
      requestUrl: result.requestUrl,
      notes: [
        "live-source:justtcg",
        `game:${game}`,
        `requested-limit:${String(input.limit ?? config.defaultLimit)}`,
        `include-price-history:${String(input.includePriceHistory ?? config.includePriceHistory)}`,
        `include-statistics:${String(input.includeStatistics ?? config.includeStatistics)}`,
        "free-plan-budgeted-capture"
      ]
    });

    await writeRunStatus(
      layout,
      createRunStatus({
        runId,
        startedAt,
        status: "succeeded",
        completedAt: new Date().toISOString(),
        rawCaptureCount: 1,
        message: `Captured ${result.data.data.length} JustTCG cards for ${game}.`
      })
    );

    return {
      runId,
      rawCaptureCount: 1,
      relativePayloadPaths: [metadata.relativePayloadPath],
      cardCount: result.data.data.length
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown JustTCG capture failure";

    await writeRunStatus(
      layout,
      createRunStatus({
        runId,
        startedAt,
        status: "failed",
        completedAt: new Date().toISOString(),
        message: `Failed to capture JustTCG sample for ${game}: ${message}`
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
  input: Pick<PriceRunStatus, "runId" | "startedAt" | "status" | "message"> &
    Partial<Pick<PriceRunStatus, "completedAt" | "rawCaptureCount">>
): PriceRunStatus {
  return {
    version: 1,
    runId: input.runId,
    sourceId: "justtcg",
    stage: "raw-capture",
    status: input.status,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    rawCaptureCount: input.rawCaptureCount,
    message: input.message
  };
}
