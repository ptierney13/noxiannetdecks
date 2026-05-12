import { loadCards, type CardRecord } from "@noxiannet/card-store";
import { writePublishedPriceArtifacts } from "../published/repository.js";
import type {
  PublishedPriceManifest,
  PublishedPriceRow,
  PublishedPriceSnapshot
} from "../published/schema.js";
import { resolvePriceDataLayout } from "../config.js";
import { createHostedPriceStoreRepository } from "./repository.js";
import type { D1DatabaseLike, HostedPriceDataRow } from "./types.js";

export type RunHostedPricePublishInput = {
  database: D1DatabaseLike;
  processRunId?: string;
  repositoryRoot?: string;
  dataRootDir?: string;
  startedAt?: string;
};

export type HostedPricePublishResult = {
  publishRunId: string;
  processRunId: string;
  captureRunId: string;
  rowCount: number;
  manifest: PublishedPriceManifest;
  snapshot: PublishedPriceSnapshot;
};

export async function runHostedPricePublish(input: RunHostedPricePublishInput): Promise<HostedPricePublishResult> {
  const repository = createHostedPriceStoreRepository(input.database);
  const runningCaptureRuns = await repository.countRunningCaptureRuns();
  const runningProcessRuns = await repository.countRunningProcessRuns();
  if (runningCaptureRuns > 0 || runningProcessRuns > 0) {
    throw new Error("Cannot publish while a capture or process run is still active.");
  }

  const processRun =
    (input.processRunId ? await repository.getProcessRun(input.processRunId) : await repository.getLatestSuccessfulProcessRun()) ??
    null;
  if (!processRun) {
    throw new Error("No successful process run is available to publish.");
  }
  if (processRun.status !== "succeeded") {
    throw new Error(`Process run ${processRun.processRunId} is not complete.`);
  }

  const captureRun = await repository.getCaptureRun(processRun.captureRunId);
  if (!captureRun || captureRun.status !== "succeeded") {
    throw new Error(`Capture run ${processRun.captureRunId} is not publishable.`);
  }

  const startedAt = input.startedAt ?? new Date().toISOString();
  const publishRunId = createHostedPublishRunId(startedAt, processRun.processRunId);

  await repository.insertPublishRun({
    publishRunId,
    processRunId: processRun.processRunId,
    captureRunId: processRun.captureRunId,
    status: "running",
    startedAt,
    completedAt: null,
    artifactCount: 0,
    rowCount: 0,
    message: `Publishing D1-backed price artifacts from process run ${processRun.processRunId}.`
  });

  try {
    const priceRows = await repository.listPriceDataForProcessRun(processRun.processRunId);
    const cards = await loadCards();
    const publishedAt = new Date().toISOString();
    const snapshot = createPublishedPriceSnapshotFromPriceData(priceRows, cards, captureRun.startedAt, publishedAt);
    const manifest = createPublishedPriceManifestFromPriceData(processRun.processRunId, snapshot, publishedAt);
    const layout = resolvePriceDataLayout(input.dataRootDir);

    await writePublishedPriceArtifacts(layout, {
      gameKey: snapshot.game.key,
      publishedAt,
      canonicalRelativeSnapshotPath: `d1://price_process_runs/${processRun.processRunId}`,
      manifest,
      snapshot,
      repositoryRoot: input.repositoryRoot,
      pathPrefix: "prices-d1"
    });

    await repository.upsertPublishedArtifact({
      artifactId: `${publishRunId}::manifest`,
      publishRunId,
      processRunId: processRun.processRunId,
      captureRunId: processRun.captureRunId,
      gameKey: snapshot.game.key,
      artifactType: "manifest",
      payloadJson: JSON.stringify(manifest)
    });
    await repository.upsertPublishedArtifact({
      artifactId: `${publishRunId}::snapshot`,
      publishRunId,
      processRunId: processRun.processRunId,
      captureRunId: processRun.captureRunId,
      gameKey: snapshot.game.key,
      artifactType: "snapshot",
      payloadJson: JSON.stringify(snapshot)
    });
    await repository.updatePublishRun({
      publishRunId,
      processRunId: processRun.processRunId,
      captureRunId: processRun.captureRunId,
      status: "succeeded",
      startedAt,
      completedAt: new Date().toISOString(),
      artifactCount: 2,
      rowCount: snapshot.rows.length,
      message: `Published ${snapshot.rows.length} D1-backed price rows for ${snapshot.game.key}.`
    });
    await repository.setPipelineState("latest_successful_publish_run_id", publishRunId);

    return {
      publishRunId,
      processRunId: processRun.processRunId,
      captureRunId: processRun.captureRunId,
      rowCount: snapshot.rows.length,
      manifest,
      snapshot
    };
  } catch (error) {
    await repository.updatePublishRun({
      publishRunId,
      processRunId: processRun.processRunId,
      captureRunId: processRun.captureRunId,
      status: "failed",
      startedAt,
      completedAt: new Date().toISOString(),
      artifactCount: 0,
      rowCount: 0,
      message: error instanceof Error ? error.message : "Unknown publish failure"
    });
    throw error;
  }
}

export function createPublishedPriceSnapshotFromPriceData(
  rows: HostedPriceDataRow[],
  cards: CardRecord[],
  sourceCapturedAt: string,
  publishedAt: string
): PublishedPriceSnapshot {
  const cardsByTcgplayerId = indexCardsByTcgplayerId(cards);
  const publishedRows = rows.map((row) => createPublishedPriceRow(row, cardsByTcgplayerId));
  const gameSlug = rows[0]?.gameSlug ?? "riftbound-league-of-legends-trading-card-game";

  return {
    version: 1,
    game: {
      slug: gameSlug,
      key: resolvePublishedGameKey(gameSlug),
      label: rows.length > 0 ? "Riftbound" : "Riftbound"
    },
    priceSource: {
      id: "tcgplayer",
      label: "TCGPlayer"
    },
    publishedAt,
    sourceCapturedAt,
    freshness: summarizeFreshness(publishedRows),
    rows: publishedRows
  };
}

export function createPublishedPriceManifestFromPriceData(
  processRunId: string,
  snapshot: PublishedPriceSnapshot,
  publishedAt: string
): PublishedPriceManifest {
  return {
    version: 1,
    game: snapshot.game,
    priceSource: snapshot.priceSource,
    publishedAt,
    sourceCapturedAt: snapshot.sourceCapturedAt,
    snapshotPath: `${snapshot.game.key}/latest.json`,
    rowCount: snapshot.rows.length,
    variantCount: snapshot.rows.length,
    freshness: snapshot.freshness,
    provenance: {
      upstreamProvider: {
        id: "justtcg",
        label: "JustTCG"
      },
      canonicalRelativeSnapshotPath: `d1://price_process_runs/${processRunId}`,
      rawRelativePayloadPaths: [],
      rawRelativeMetadataPaths: []
    }
  };
}

export function createHostedPublishRunId(startedAt: string, processRunId: string): string {
  return `hosted-publish-${compactTimestamp(startedAt)}-${processRunId}`;
}

function createPublishedPriceRow(
  row: HostedPriceDataRow,
  cardsByTcgplayerId: Map<string, CardRecord[]>
): PublishedPriceRow {
  const card = resolveCardMetadata(row, cardsByTcgplayerId);

  return {
    rowId: `${row.sourceCardId}::${row.sourceVariantId}`,
    cardName: card?.riot_name ?? row.sourceCardId,
    sourceCardId: row.sourceCardId,
    sourceVariantId: row.sourceVariantId,
    set: {
      slug: card?.set.set_id.toLowerCase() ?? null,
      label: card?.set.label ?? null
    },
    collectorNumber: card?.collector_number ?? null,
    rarity: card?.rarity ?? null,
    language: row.language,
    condition: row.condition,
    printing: row.printing,
    externalIds: {
      ...(row.tcgplayerId ? { tcgplayerId: row.tcgplayerId } : {}),
      ...(row.tcgplayerSkuId ? { tcgplayerSkuId: row.tcgplayerSkuId } : {})
    },
    currentPrice: {
      currency: "USD",
      amount: row.currentPriceAmount,
      lastUpdatedAt: row.currentPriceLastUpdatedAt
    },
    priceHistory: JSON.parse(row.priceHistoryJson) as PublishedPriceRow["priceHistory"]
  };
}

function resolveCardMetadata(row: HostedPriceDataRow, cardsByTcgplayerId: Map<string, CardRecord[]>): CardRecord | null {
  if (!row.tcgplayerId) {
    return null;
  }

  const candidates = cardsByTcgplayerId.get(row.tcgplayerId) ?? [];
  if (candidates.length === 0) {
    return null;
  }

  const preferredFinish = normalizePricePrinting(row.printing);
  return (
    candidates.find((candidate) =>
      preferredFinish ? candidate.finishes.includes(preferredFinish === "foil" ? "foil" : "nonfoil") : true
    ) ??
    candidates[0] ??
    null
  );
}

function indexCardsByTcgplayerId(cards: CardRecord[]): Map<string, CardRecord[]> {
  const map = new Map<string, CardRecord[]>();

  for (const card of cards) {
    if (!card.tcgplayer_id) {
      continue;
    }

    const existing = map.get(card.tcgplayer_id) ?? [];
    existing.push(card);
    map.set(card.tcgplayer_id, existing);
  }

  return map;
}

function normalizePricePrinting(value: string | null | undefined): "foil" | "normal" | "" {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "foil") {
    return "foil";
  }
  if (normalized === "normal" || normalized === "nonfoil" || normalized === "non-foil") {
    return "normal";
  }
  return "";
}

function summarizeFreshness(rows: PublishedPriceRow[]): PublishedPriceSnapshot["freshness"] {
  const dates = rows
    .map((row) => row.currentPrice.lastUpdatedAt)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => left.localeCompare(right));
  const pricedRowCount = rows.filter((row) => row.currentPrice.amount !== null).length;

  return {
    rowCount: rows.length,
    pricedRowCount,
    freshestPriceAt: dates.at(-1),
    stalestPriceAt: dates[0]
  };
}

function resolvePublishedGameKey(gameSlug: string): string {
  if (gameSlug === "riftbound-league-of-legends-trading-card-game") {
    return "riftbound";
  }

  return sanitizeSegment(gameSlug);
}

function sanitizeSegment(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
  const sanitized = normalized.replace(/^-+|-+$/g, "");

  if (!sanitized) {
    throw new Error("Published game key must contain at least one supported character.");
  }

  return sanitized.toLowerCase();
}

function compactTimestamp(value: string): string {
  return new Date(value).toISOString().replace(/[-:.]/g, "").replace("T", "t");
}
