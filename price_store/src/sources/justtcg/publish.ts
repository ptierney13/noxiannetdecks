import type { PriceDataLayout } from "../../config.js";
import {
  loadCanonicalSnapshotJson
} from "../../canonical/repository.js";
import type { CanonicalSnapshotMetadata } from "../../canonical/schema.js";
import { writeRunStatus } from "../../runs/repository.js";
import {
  writePublishedPriceArtifacts,
  type WritePublishedPriceArtifactsResult
} from "../../published/repository.js";
import type {
  PublishedPriceManifest,
  PublishedPriceRow,
  PublishedPriceSnapshot
} from "../../published/schema.js";
import type { PriceRunStatus } from "../../runs/schema.js";
import type { JustTcgCanonicalSnapshot } from "./canonical.js";
import { justTcgCanonicalSnapshotSchema } from "./canonical.js";

export type PublishJustTcgPricesResult = WritePublishedPriceArtifactsResult & {
  manifest: PublishedPriceManifest;
  snapshot: PublishedPriceSnapshot;
  rowCount: number;
};

export async function publishJustTcgCanonicalSnapshot(
  layout: PriceDataLayout,
  canonicalMetadata: CanonicalSnapshotMetadata,
  options: {
    repositoryRoot?: string;
  } = {}
): Promise<PublishJustTcgPricesResult> {
  const runId =
    canonicalMetadata.runId ??
    `publish-${canonicalMetadata.snapshotKey}-${canonicalMetadata.capturedAt.slice(0, 10)}`;
  const startedAt = new Date().toISOString();

  await writeRunStatus(
    layout,
    createRunStatus({
      runId,
      stage: "publish",
      startedAt,
      status: "running",
      message: `Publishing static price artifacts from ${canonicalMetadata.relativeSnapshotPath}.`
    })
  );

  try {
    const snapshot = justTcgCanonicalSnapshotSchema.parse(
      await loadCanonicalSnapshotJson<unknown>(layout, canonicalMetadata)
    );
    const publishedAt = new Date().toISOString();
    const publishedSnapshot = createPublishedPriceSnapshot(snapshot, publishedAt);
    const manifest = createPublishedPriceManifest(canonicalMetadata, publishedSnapshot, publishedAt);
    const result = await writePublishedPriceArtifacts(layout, {
      gameKey: publishedSnapshot.game.key,
      publishedAt,
      canonicalRelativeSnapshotPath: canonicalMetadata.relativeSnapshotPath,
      manifest,
      snapshot: publishedSnapshot,
      repositoryRoot: options.repositoryRoot
    });

    await writeRunStatus(
      layout,
      createRunStatus({
        runId,
        stage: "publish",
        startedAt,
        status: "succeeded",
        completedAt: new Date().toISOString(),
        publishedArtifactCount: 5,
        cardCount: publishedSnapshot.rows.length,
        message: `Published ${publishedSnapshot.rows.length} price rows to static assets for ${publishedSnapshot.game.key}.`
      })
    );

    return {
      ...result,
      manifest,
      snapshot: publishedSnapshot,
      rowCount: publishedSnapshot.rows.length
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown publish failure";

    await writeRunStatus(
      layout,
      createRunStatus({
        runId,
        stage: "publish",
        startedAt,
        status: "failed",
        completedAt: new Date().toISOString(),
        message: `Failed to publish static price artifacts: ${message}`
      })
    );

    throw error;
  }
}

export function createPublishedPriceSnapshot(
  snapshot: JustTcgCanonicalSnapshot,
  publishedAt: string
): PublishedPriceSnapshot {
  const rows = snapshot.cards.flatMap((card) =>
    card.variants.map((variant) =>
      createPublishedPriceRow(snapshot, card, variant)
    )
  );

  return {
    version: 1,
    game: {
      slug: snapshot.game.slug,
      key: resolvePublishedGameKey(snapshot.game.slug),
      label: snapshot.game.label
    },
    priceSource: {
      id: "tcgplayer",
      label: "TCGPlayer"
    },
    publishedAt,
    sourceCapturedAt: snapshot.capturedAt,
    freshness: summarizeFreshness(rows),
    rows
  };
}

export function createPublishedPriceManifest(
  canonicalMetadata: CanonicalSnapshotMetadata,
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
      canonicalRelativeSnapshotPath: canonicalMetadata.relativeSnapshotPath,
      rawRelativePayloadPaths:
        canonicalMetadata.rawRelativePayloadPaths.length > 0
          ? canonicalMetadata.rawRelativePayloadPaths
          : canonicalMetadata.rawRelativePayloadPath
            ? [canonicalMetadata.rawRelativePayloadPath]
            : [],
      rawRelativeMetadataPaths:
        canonicalMetadata.rawRelativeMetadataPaths.length > 0
          ? canonicalMetadata.rawRelativeMetadataPaths
          : canonicalMetadata.rawRelativeMetadataPath
            ? [canonicalMetadata.rawRelativeMetadataPath]
            : []
    }
  };
}

function createPublishedPriceRow(
  snapshot: JustTcgCanonicalSnapshot,
  card: JustTcgCanonicalSnapshot["cards"][number],
  variant: JustTcgCanonicalSnapshot["cards"][number]["variants"][number]
): PublishedPriceRow {
  return {
    rowId: `${card.sourceCardId}::${variant.sourceVariantId}`,
    cardName: card.name,
    sourceCardId: card.sourceCardId,
    sourceVariantId: variant.sourceVariantId,
    set: {
      slug: card.set.slug ?? null,
      label: card.set.label ?? null
    },
    collectorNumber: card.number ?? null,
    rarity: card.rarity ?? null,
    language: variant.language ?? null,
    condition: variant.condition ?? null,
    printing: variant.printing ?? null,
    externalIds: {
      tcgplayerId: card.externalIds.tcgplayerId,
      tcgplayerSkuId: variant.externalIds.tcgplayerSkuId
    },
    currentPrice: {
      currency: variant.currentPrice.currency,
      amount: variant.currentPrice.amount,
      lastUpdatedAt: variant.currentPrice.lastUpdatedAt ?? null
    },
    priceHistory: variant.currentPrice.history
  };
}

function summarizeFreshness(rows: PublishedPriceRow[]): PublishedPriceSnapshot["freshness"] {
  const priceDates = rows
    .map((row) => row.currentPrice.lastUpdatedAt)
    .filter((value): value is string => Boolean(value))
    .sort();
  const pricedRowCount = rows.filter((row) => row.currentPrice.amount !== null).length;

  return {
    rowCount: rows.length,
    pricedRowCount,
    freshestPriceAt: priceDates.at(-1),
    stalestPriceAt: priceDates[0]
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
    throw new Error("Published game key must contain at least one supported character");
  }

  return sanitized.toLowerCase();
}

function createRunStatus(
  input: Pick<PriceRunStatus, "runId" | "stage" | "startedAt" | "status" | "message"> &
    Partial<Pick<PriceRunStatus, "completedAt" | "publishedArtifactCount" | "cardCount">>
): PriceRunStatus {
  return {
    version: 1,
    runId: input.runId,
    sourceId: "justtcg",
    stage: input.stage,
    status: input.status,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    publishedArtifactCount: input.publishedArtifactCount,
    cardCount: input.cardCount,
    message: input.message
  };
}
