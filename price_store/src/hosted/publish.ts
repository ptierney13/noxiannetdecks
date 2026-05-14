import { loadHostedPublishCardMetadataIndex, type HostedPublishedCardMetadata } from "./card-metadata.js";
import { writePublishedPriceArtifactsToKv } from "../published/kv.js";
import type { PublishedPriceManifest, PublishedPriceRow, PublishedPriceSnapshot } from "../published/schema.js";
import { createHostedPriceStoreRepository } from "./repository.js";
import type { D1DatabaseLike, HostedCookedPriceRow, KVNamespaceLike } from "./types.js";

export type HostedPublishedArtifactWriterInput = {
  canonicalRelativeSnapshotPath: string;
  gameKey: string;
  manifest: PublishedPriceManifest;
  publishedAt: string;
  snapshot: PublishedPriceSnapshot;
};

export type HostedPublishedArtifactWriter = (input: HostedPublishedArtifactWriterInput) => Promise<void>;

export type RunHostedPricePublishInput = {
  database: D1DatabaseLike;
  message: { runId: string };
  publishedArtifactWriter?: HostedPublishedArtifactWriter;
  publishedDataKv?: KVNamespaceLike;
  startedAt?: string;
};

export type HostedPricePublishResult = {
  captureRunId: string;
  manifest: PublishedPriceManifest;
  processRunId: string;
  publishRunId: string;
  rowCount: number;
  snapshot: PublishedPriceSnapshot;
};

export async function runHostedPricePublish(input: RunHostedPricePublishInput): Promise<HostedPricePublishResult> {
  const repository = createHostedPriceStoreRepository(input.database);
  const startedAt = input.startedAt ?? new Date().toISOString();
  const claimed = await repository.claimPublish(input.message.runId, startedAt);
  if (!claimed) {
    const run = await repository.getRun(input.message.runId);
    if (!run || (run.status !== "succeeded" && run.status !== "publishing")) {
      throw new Error(`Run ${input.message.runId} is not ready to publish.`);
    }
  }

  const run = await repository.getRun(input.message.runId);
  if (!run) {
    throw new Error(`Run ${input.message.runId} was not found.`);
  }

  const publishRunId = createHostedPublishRunId(startedAt, input.message.runId);
  await repository.insertPublishRun({
    publishRunId,
    runId: input.message.runId,
    status: "running",
    startedAt,
    completedAt: null,
    manifestKey: null,
    snapshotKey: null,
    rowCount: 0,
    message: `Publishing hosted price artifacts for run ${input.message.runId}.`
  });

  try {
    const priceRows = await repository.listCookedRows(input.message.runId);
    const cardsByTcgplayerId = loadHostedPublishCardMetadataIndex();
    const publishedAt = new Date().toISOString();
    const snapshot = createPublishedPriceSnapshotFromPriceData(priceRows, cardsByTcgplayerId, run.startedAt, publishedAt);
    const manifest = createPublishedPriceManifestFromPriceData(input.message.runId, snapshot, publishedAt);
    let manifestKey: string | null = null;
    let snapshotKey: string | null = null;
    const artifactWriteInput: HostedPublishedArtifactWriterInput = {
      gameKey: snapshot.game.key,
      publishedAt,
      canonicalRelativeSnapshotPath: `d1://price_pipeline_runs/${input.message.runId}`,
      manifest,
      snapshot
    };

    if (input.publishedDataKv) {
      const result = await writePublishedPriceArtifactsToKv(input.publishedDataKv, {
        ...artifactWriteInput,
        pathPrefix: "prices-d1"
      });
      manifestKey = result.manifestKey;
      snapshotKey = result.snapshotKey;
    } else if (input.publishedArtifactWriter) {
      await input.publishedArtifactWriter(artifactWriteInput);
      manifestKey = "prices-d1/manifest.json";
      snapshotKey = `prices-d1/${snapshot.game.key}/latest.json`;
    } else {
      throw new Error("Publish requires either a KV namespace or a published artifact writer.");
    }

    await repository.upsertPublishedArtifact({
      artifactId: `${publishRunId}::manifest`,
      publishRunId,
      runId: input.message.runId,
      gameKey: snapshot.game.key,
      artifactType: "manifest",
      payloadJson: JSON.stringify({
        artifactType: "manifest",
        gameKey: snapshot.game.key,
        key: manifestKey,
        publishedAt,
        rowCount: manifest.rowCount,
        snapshotPath: manifest.snapshotPath,
        version: manifest.version
      })
    });
    await repository.upsertPublishedArtifact({
      artifactId: `${publishRunId}::snapshot`,
      publishRunId,
      runId: input.message.runId,
      gameKey: snapshot.game.key,
      artifactType: "snapshot",
      payloadJson: JSON.stringify({
        artifactType: "snapshot",
        freshestPriceAt: snapshot.freshness.freshestPriceAt,
        gameKey: snapshot.game.key,
        key: snapshotKey,
        pricedRowCount: snapshot.freshness.pricedRowCount,
        publishedAt,
        rowCount: snapshot.rows.length,
        sourceCapturedAt: snapshot.sourceCapturedAt,
        stalestPriceAt: snapshot.freshness.stalestPriceAt,
        version: snapshot.version
      })
    });

    const completedAt = new Date().toISOString();
    await repository.updatePublishRun({
      publishRunId,
      runId: input.message.runId,
      status: "succeeded",
      startedAt,
      completedAt,
      manifestKey,
      snapshotKey,
      rowCount: snapshot.rows.length,
      message: `Published ${snapshot.rows.length} rows for ${snapshot.game.key}.`
    });
    await repository.completePublish(input.message.runId, {
      completedAt,
      livePublishedAt: publishedAt,
      publishedRowCount: snapshot.rows.length
    });
    await repository.setPipelineState("current_live_run_id", input.message.runId);
    await repository.setPipelineState("current_live_published_at", publishedAt);
    await repository.setPipelineState("latest_successful_run_id", input.message.runId);

    return {
      captureRunId: input.message.runId,
      manifest,
      processRunId: input.message.runId,
      publishRunId,
      rowCount: snapshot.rows.length,
      snapshot
    };
  } catch (error) {
    await repository.updatePublishRun({
      publishRunId,
      runId: input.message.runId,
      status: "failed",
      startedAt,
      completedAt: new Date().toISOString(),
      manifestKey: null,
      snapshotKey: null,
      rowCount: 0,
      message: error instanceof Error ? error.message : "Unknown publish failure"
    });
    await repository.markRunFailed(
      input.message.runId,
      error instanceof Error ? error.message : "Unknown publish failure",
      new Date().toISOString()
    );
    throw error;
  }
}

export function createPublishedPriceSnapshotFromPriceData(
  rows: HostedCookedPriceRow[],
  cardsByTcgplayerId: Map<string, HostedPublishedCardMetadata[]>,
  sourceCapturedAt: string,
  publishedAt: string
): PublishedPriceSnapshot {
  const publishedRows = rows.map((row) => createPublishedPriceRow(row, cardsByTcgplayerId));
  const gameSlug = rows[0]?.gameSlug ?? "riftbound-league-of-legends-trading-card-game";

  return {
    version: 1,
    game: {
      slug: gameSlug,
      key: resolvePublishedGameKey(gameSlug),
      label: "Riftbound"
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
  runId: string,
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
      canonicalRelativeSnapshotPath: `d1://price_pipeline_runs/${runId}`,
      rawRelativePayloadPaths: [],
      rawRelativeMetadataPaths: []
    }
  };
}

export function createHostedPublishRunId(startedAt: string, runId: string): string {
  return `hosted-publish-${compactTimestamp(startedAt)}-${runId}`;
}

function createPublishedPriceRow(
  row: HostedCookedPriceRow,
  cardsByTcgplayerId: Map<string, HostedPublishedCardMetadata[]>
): PublishedPriceRow {
  const card = resolveCardMetadata(row, cardsByTcgplayerId);

  return {
    rowId: `${row.sourceCardId}::${row.sourceVariantId}`,
    cardName: card?.riotName ?? row.sourceCardId,
    sourceCardId: row.sourceCardId,
    sourceVariantId: row.sourceVariantId,
    set: {
      slug: card?.set.slug ?? null,
      label: card?.set.label ?? null
    },
    collectorNumber: card?.collectorNumber ?? null,
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

function resolveCardMetadata(
  row: HostedCookedPriceRow,
  cardsByTcgplayerId: Map<string, HostedPublishedCardMetadata[]>
): HostedPublishedCardMetadata | null {
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
