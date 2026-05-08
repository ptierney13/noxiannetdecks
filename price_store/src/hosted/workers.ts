import type { CanonicalSnapshotMetadata } from "../canonical/schema.js";
import type { PublishedPriceManifest, PublishedPriceSnapshot } from "../published/schema.js";
import type { PriceRunStatus } from "../runs/schema.js";
import type { JustTcgCardsQuery, JustTcgConfig, JustTcgRequestResult } from "../sources/justtcg/index.js";
import {
  createJustTcgCanonicalSnapshotFromPages,
  createJustTcgCaptureRunId,
  createPublishedPriceManifest,
  createPublishedPriceSnapshot,
  fetchJustTcgCards,
  justTcgCanonicalSnapshotSchema,
  type JustTcgCardsResponse
} from "../sources/justtcg/index.js";
import type { RawCaptureMetadata } from "../raw/schema.js";
import { writeHostedCanonicalSnapshot, writeHostedPublishedPriceArtifacts, writeHostedRawCapture, writeHostedRunStatus, loadActiveCaptureState, writeActiveCaptureState, clearActiveCaptureState, writeLatestSuccessfulCaptureState, loadLatestSuccessfulCaptureState, loadHostedCanonicalSnapshotMetadata, loadHostedCanonicalSnapshotJson, loadHostedRunStatus, findHostedCanonicalMetadataPathByRunId } from "./repository.js";
import type { HostedObjectStore } from "./object-store.js";
import type { HostedCaptureWorkerInput, HostedPublishWorkerInput } from "./schema.js";
import { hostedCaptureWorkerInputSchema, hostedPublishWorkerInputSchema } from "./schema.js";

const DEFAULT_MAX_REQUESTS = 60;
const DEFAULT_REQUEST_DELAY_MS = 6_500;

export type HostedCaptureWorkerResult = {
  runId: string;
  mode: HostedCaptureWorkerInput["mode"];
  updatedAfter?: string;
  rawCaptureCount: number;
  relativePayloadPaths: string[];
  relativeMetadataPaths: string[];
  canonicalRelativeSnapshotPath: string;
  canonicalRelativeMetadataPath: string;
  cardCount: number;
  pageCount: number;
  requestCount: number;
};

export type HostedPublishWorkerResult = {
  captureRunId: string;
  publishRunId: string;
  manifest: PublishedPriceManifest;
  snapshot: PublishedPriceSnapshot;
  rowCount: number;
  exportManifestPath: string;
  exportSnapshotPath: string;
  exportMetadataPath: string;
};

type FetchJustTcgCardsFn = (
  config: JustTcgConfig,
  query?: JustTcgCardsQuery
) => Promise<JustTcgRequestResult<JustTcgCardsResponse>>;

export async function runHostedJustTcgCaptureWorker(
  store: HostedObjectStore,
  config: JustTcgConfig,
  input: HostedCaptureWorkerInput,
  options: {
    fetchCards?: FetchJustTcgCardsFn;
    startedAt?: string;
  } = {}
): Promise<HostedCaptureWorkerResult> {
  const validated = hostedCaptureWorkerInputSchema.parse(input);
  const active = await loadActiveCaptureState(store);
  if (active) {
    throw new Error(`Capture worker is already running for ${active.runId}.`);
  }

  const startedAt = options.startedAt ?? new Date().toISOString();
  const game = config.defaultGame;
  const runId = createJustTcgCaptureRunId(startedAt, game);
  const fetchCards = options.fetchCards ?? fetchJustTcgCards;
  const updatedAfter = await resolveUpdatedAfter(store, validated);
  const requestDelayMs = validated.requestDelayMs ?? DEFAULT_REQUEST_DELAY_MS;
  const maxRequests = validated.maxRequests ?? DEFAULT_MAX_REQUESTS;

  await writeActiveCaptureState(store, {
    runId,
    mode: validated.mode,
    startedAt
  });
  await writeHostedRunStatus(
    store,
    createCaptureRunStatus({
      runId,
      startedAt,
      status: "running",
      message: `Hosted ${validated.mode} capture started for ${game}.`
    })
  );

  try {
    const entries: Array<{ metadata: RawCaptureMetadata; response: JustTcgCardsResponse }> = [];
    const relativePayloadPaths: string[] = [];
    const relativeMetadataPaths: string[] = [];
    let offset = 0;
    let pageCount = 0;
    let requestCount = 0;
    let cardCount = 0;

    while (true) {
      if (requestCount >= maxRequests) {
        throw new Error(`Hosted capture reached the configured maxRequests cap (${String(maxRequests)}).`);
      }

      const pageCapturedAt = new Date().toISOString();
      const result = await fetchCards(config, {
        game,
        limit: config.defaultLimit,
        offset,
        includePriceHistory: config.includePriceHistory,
        includeStatistics: config.includeStatistics,
        updatedAfter: updatedAfter ? Math.floor(new Date(updatedAfter).getTime() / 1000) : undefined
      });

      requestCount += 1;
      pageCount += 1;
      cardCount += result.data.data.length;
      const metadata = await writeHostedRawCapture(store, {
        sourceId: "justtcg",
        runId,
        capturedAt: pageCapturedAt,
        captureKey: `${game}-cards-page-${String(pageCount).padStart(3, "0")}`,
        payload: JSON.stringify(result.data, null, 2),
        payloadFormat: "json",
        requestUrl: result.requestUrl,
        notes: [
          "live-source:justtcg",
          "hosted-manual-capture",
          `refresh-mode:${validated.mode}`,
          `game:${game}`,
          `page-index:${String(pageCount)}`,
          `page-offset:${String(offset)}`,
          `requested-limit:${String(config.defaultLimit)}`,
          `include-price-history:${String(config.includePriceHistory)}`,
          `include-statistics:${String(config.includeStatistics)}`,
          ...(updatedAfter ? [`updated-after:${updatedAfter}`] : [])
        ]
      });
      entries.push({
        metadata,
        response: result.data
      });
      relativePayloadPaths.push(metadata.relativePayloadPath);
      relativeMetadataPaths.push(deriveMetadataPath(metadata.relativePayloadPath));

      const hasMore = typeof result.data.meta?.hasMore === "boolean" ? result.data.meta.hasMore : false;
      if (!hasMore) {
        break;
      }

      if (result.data.data.length === 0) {
        throw new Error("JustTCG indicated there were more hosted capture pages, but the current page was empty.");
      }

      offset += result.data.data.length;
      await wait(requestDelayMs);
    }

    const canonicalSnapshot = createJustTcgCanonicalSnapshotFromPages(entries);
    const canonicalMetadata = await writeHostedCanonicalSnapshot(store, {
      sourceId: "justtcg",
      runId,
      capturedAt: canonicalSnapshot.capturedAt,
      snapshotKey: `${canonicalSnapshot.game.slug}-cards-snapshot`,
      snapshot: JSON.stringify(canonicalSnapshot, null, 2),
      rawRelativePayloadPath: relativePayloadPaths[0],
      rawRelativeMetadataPath: relativeMetadataPaths[0],
      rawRelativePayloadPaths: relativePayloadPaths,
      rawRelativeMetadataPaths: relativeMetadataPaths,
      notes: [
        "canonical-source-snapshot",
        "hosted-manual-capture",
        `refresh-mode:${validated.mode}`,
        `game:${canonicalSnapshot.game.slug}`,
        `page-count:${String(pageCount)}`,
        `card-count:${String(canonicalSnapshot.cards.length)}`,
        `variant-count:${String(canonicalSnapshot.cards.reduce((count, card) => count + card.variants.length, 0))}`
      ]
    });

    await writeHostedRunStatus(
      store,
      createCaptureRunStatus({
        runId,
        startedAt,
        status: "succeeded",
        completedAt: new Date().toISOString(),
        rawCaptureCount: pageCount,
        canonicalSnapshotCount: 1,
        requestCount,
        pageCount,
        cardCount,
        verifiedLimit: config.defaultLimit,
        message: `Hosted ${validated.mode} capture completed for ${game}.`
      })
    );
    await writeLatestSuccessfulCaptureState(store, {
      runId,
      mode: validated.mode,
      capturedAt: canonicalSnapshot.capturedAt,
      canonicalRelativeMetadataPath: deriveMetadataPath(canonicalMetadata.relativeSnapshotPath),
      canonicalRelativeSnapshotPath: canonicalMetadata.relativeSnapshotPath
    });

    return {
      runId,
      mode: validated.mode,
      updatedAfter,
      rawCaptureCount: pageCount,
      relativePayloadPaths,
      relativeMetadataPaths,
      canonicalRelativeSnapshotPath: canonicalMetadata.relativeSnapshotPath,
      canonicalRelativeMetadataPath: deriveMetadataPath(canonicalMetadata.relativeSnapshotPath),
      cardCount,
      pageCount,
      requestCount
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown hosted capture failure";
    await writeHostedRunStatus(
      store,
      createCaptureRunStatus({
        runId,
        startedAt,
        status: "failed",
        completedAt: new Date().toISOString(),
        message: `Hosted capture failed: ${message}`
      })
    );
    throw error;
  } finally {
    await clearActiveCaptureState(store);
  }
}

export async function runHostedJustTcgPublishWorker(
  store: HostedObjectStore,
  input: HostedPublishWorkerInput = {}
): Promise<HostedPublishWorkerResult> {
  const validated = hostedPublishWorkerInputSchema.parse(input);
  const active = await loadActiveCaptureState(store);
  if (active) {
    throw new Error(`Cannot publish while capture ${active.runId} is still running.`);
  }

  const latest = await loadLatestSuccessfulCaptureState(store);
  const captureRunId = validated.captureRunId ?? latest?.runId;
  if (!captureRunId) {
    throw new Error("No successful hosted capture is available to publish.");
  }

  const captureStatus = await loadHostedRunStatus(store, captureRunId, "raw-capture");
  if (!captureStatus || captureStatus.status !== "succeeded") {
    throw new Error(`Capture run ${captureRunId} is not in a succeeded state.`);
  }

  const canonicalMetadataPath =
    captureRunId === latest?.runId
      ? latest.canonicalRelativeMetadataPath
      : await findHostedCanonicalMetadataPathByRunId(store, captureRunId);

  if (!canonicalMetadataPath) {
    throw new Error(`Could not locate hosted canonical metadata for capture run ${captureRunId}.`);
  }

  const canonicalMetadata = await loadHostedCanonicalSnapshotMetadata(store, canonicalMetadataPath);
  const startedAt = new Date().toISOString();
  const publishRunId = `publish-${captureRunId}`;
  await writeHostedRunStatus(
    store,
    createPublishRunStatus({
      runId: publishRunId,
      startedAt,
      status: "running",
      message: `Publishing hosted artifacts from ${canonicalMetadata.relativeSnapshotPath}.`
    })
  );

  try {
    const canonicalSnapshot = justTcgCanonicalSnapshotSchema.parse(
      await loadHostedCanonicalSnapshotJson<unknown>(store, canonicalMetadata)
    );
    const publishedAt = new Date().toISOString();
    const snapshot = createPublishedPriceSnapshot(canonicalSnapshot, publishedAt);
    const manifest = createPublishedPriceManifest(canonicalMetadata, snapshot, publishedAt);
    const artifacts = await writeHostedPublishedPriceArtifacts(store, {
      publishedAt,
      canonicalRelativeSnapshotPath: canonicalMetadata.relativeSnapshotPath,
      manifest,
      snapshot
    });

    await writeHostedRunStatus(
      store,
      createPublishRunStatus({
        runId: publishRunId,
        startedAt,
        status: "succeeded",
        completedAt: new Date().toISOString(),
        publishedArtifactCount: 3,
        cardCount: snapshot.rows.length,
        message: `Published ${snapshot.rows.length} hosted price rows for ${snapshot.game.key}.`
      })
    );

    return {
      captureRunId,
      publishRunId,
      manifest,
      snapshot,
      rowCount: snapshot.rows.length,
      exportManifestPath: artifacts.exportManifestPath,
      exportSnapshotPath: artifacts.exportSnapshotPath,
      exportMetadataPath: artifacts.exportMetadataPath
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown hosted publish failure";
    await writeHostedRunStatus(
      store,
      createPublishRunStatus({
        runId: publishRunId,
        startedAt,
        status: "failed",
        completedAt: new Date().toISOString(),
        message: `Hosted publish failed: ${message}`
      })
    );
    throw error;
  }
}

async function resolveUpdatedAfter(
  store: HostedObjectStore,
  input: HostedCaptureWorkerInput
): Promise<string | undefined> {
  if (input.mode === "full") {
    return undefined;
  }

  if (input.updatedAfter) {
    return input.updatedAfter;
  }

  const latest = await loadLatestSuccessfulCaptureState(store);
  return latest?.capturedAt;
}

function createCaptureRunStatus(
  input: Pick<PriceRunStatus, "runId" | "startedAt" | "status" | "message"> &
    Partial<
      Pick<
        PriceRunStatus,
        "completedAt" | "rawCaptureCount" | "canonicalSnapshotCount" | "requestCount" | "pageCount" | "cardCount" | "verifiedLimit"
      >
    >
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
    canonicalSnapshotCount: input.canonicalSnapshotCount,
    requestCount: input.requestCount,
    pageCount: input.pageCount,
    cardCount: input.cardCount,
    verifiedLimit: input.verifiedLimit,
    message: input.message
  };
}

function createPublishRunStatus(
  input: Pick<PriceRunStatus, "runId" | "startedAt" | "status" | "message"> &
    Partial<Pick<PriceRunStatus, "completedAt" | "publishedArtifactCount" | "cardCount">>
): PriceRunStatus {
  return {
    version: 1,
    runId: input.runId,
    sourceId: "justtcg",
    stage: "publish",
    status: input.status,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    publishedArtifactCount: input.publishedArtifactCount,
    cardCount: input.cardCount,
    message: input.message
  };
}

async function wait(milliseconds: number): Promise<void> {
  if (milliseconds <= 0) {
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function deriveMetadataPath(relativeSnapshotPath: string): string {
  return relativeSnapshotPath.replace(/\.json$/u, ".meta.json");
}
