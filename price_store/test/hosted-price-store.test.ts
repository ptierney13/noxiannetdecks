import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyHostedPriceStoreMigrations,
  createHostedPriceStoreRepository,
  LocalD1Database,
  resolveHostedPriceStoreLayout,
  runHostedPriceCapture,
  runHostedPriceProcess,
  runHostedPricePublish
} from "../src/hosted/index.js";
import type { HostedPriceDataRow } from "../src/hosted/types.js";
import type { JustTcgConfig } from "../src/sources/justtcg/index.js";

const JUSTTCG_CONFIG: JustTcgConfig = {
  apiKey: "test-key",
  baseUrl: "https://api.justtcg.com/v1/",
  defaultGame: "riftbound-league-of-legends-trading-card-game",
  defaultLimit: 20,
  includePriceHistory: true,
  includeStatistics: false
};

let samplePayload = "";
let deltaMergeFixture: DeltaMergeFixture;
const createdDirs: string[] = [];

beforeEach(async () => {
  samplePayload = await readFile(join(process.cwd(), "fixtures", "justtcg", "riftbound-cards-sample-with-history.json"), "utf8");
  deltaMergeFixture = JSON.parse(
    await readFile(join(process.cwd(), "fixtures", "hosted", "2026-05-12-delta-merge-sample.json"), "utf8")
  ) as DeltaMergeFixture;
});

afterEach(async () => {
  vi.restoreAllMocks();
  for (const dir of createdDirs.splice(0)) {
    await import("node:fs/promises").then(({ rm }) => rm(dir, { recursive: true, force: true }));
  }
});

describe("hosted D1 price store", () => {
  it("applies migrations and records capture pages through the D1 pipeline", async () => {
    const database = new LocalD1Database(":memory:");

    try {
      await applyHostedPriceStoreMigrations(database, resolveHostedPriceStoreLayout().migrationsDir);
      const fetchMock = vi.fn(async () => new Response(samplePayload, { status: 200 }));
      vi.stubGlobal("fetch", fetchMock);

      const result = await runHostedPriceCapture({
        database,
        config: JUSTTCG_CONFIG,
        mode: "full",
        verifyLimit: false,
        maxPages: 1
      });
      const repository = createHostedPriceStoreRepository(database);
      const captureRun = await repository.getCaptureRun(result.runId);
      const pages = await repository.listCapturePages(result.runId);

      expect(captureRun?.status).toBe("succeeded");
      expect(captureRun?.captureMode).toBe("full");
      expect(pages).toHaveLength(1);
      expect(pages[0]?.rowCount).toBeGreaterThan(0);
      expect(await repository.getPipelineState("latest_successful_capture_run_id")).toBe(result.runId);
    } finally {
      database.close();
    }
  });

  it("processes captured pages, publishes parallel artifacts, and allows reruns", async () => {
    const dataRoot = await mkdtemp(join(tmpdir(), "price-store-hosted-data-"));
    const repositoryRoot = await mkdtemp(join(tmpdir(), "price-store-hosted-repo-"));
    createdDirs.push(dataRoot, repositoryRoot);
    const database = new LocalD1Database(":memory:");

    try {
      await applyHostedPriceStoreMigrations(database, resolveHostedPriceStoreLayout().migrationsDir);
      vi.stubGlobal("fetch", vi.fn(async () => new Response(samplePayload, { status: 200 })));

      const capture = await runHostedPriceCapture({
        database,
        config: JUSTTCG_CONFIG,
        mode: "full",
        verifyLimit: false,
        maxPages: 1
      });
      const processOne = await runHostedPriceProcess({
        database,
        captureRunId: capture.runId
      });
      const publishOne = await runHostedPricePublish({
        database,
        processRunId: processOne.processRunId,
        dataRootDir: dataRoot,
        repositoryRoot
      });
      const publishTwo = await runHostedPricePublish({
        database,
        processRunId: processOne.processRunId,
        dataRootDir: dataRoot,
        repositoryRoot
      });
      const repository = createHostedPriceStoreRepository(database);
      const publishedRun = await repository.getLatestSuccessfulPublishRun();
      const snapshotPath = join(repositoryRoot, "frontend", "public", "data", "prices-d1", "riftbound", "latest.json");
      const snapshot = JSON.parse(await readFile(snapshotPath, "utf8")) as {
        rows: Array<{ rowId: string; externalIds: { tcgplayerId?: string } }>;
      };

      expect(processOne.rowCount).toBeGreaterThan(0);
      expect(publishOne.rowCount).toBe(processOne.rowCount);
      expect(publishTwo.publishRunId).not.toBe(publishOne.publishRunId);
      expect(publishedRun?.publishRunId).toBe(publishTwo.publishRunId);
      expect(snapshot.rows.length).toBe(processOne.rowCount);
      expect(snapshot.rows[0]?.externalIds.tcgplayerId).toBeTruthy();
    } finally {
      database.close();
    }
  });

  it("refuses publish while process work is still active", async () => {
    const database = new LocalD1Database(":memory:");

    try {
      await applyHostedPriceStoreMigrations(database, resolveHostedPriceStoreLayout().migrationsDir);
      const repository = createHostedPriceStoreRepository(database);

      await repository.insertCaptureRun({
        runId: "capture-1",
        captureMode: "full",
        gameSlug: "riftbound-league-of-legends-trading-card-game",
        status: "succeeded",
        startedAt: "2026-05-11T00:00:00.000Z",
        completedAt: "2026-05-11T00:10:00.000Z",
        updatedAfter: null,
        requestCount: 1,
        pageCount: 1,
        cardCount: 1,
        verifiedLimit: 20,
        includePriceHistory: true,
        includeStatistics: false,
        message: "done"
      });
      await repository.insertProcessRun({
        processRunId: "process-1",
        captureRunId: "capture-1",
        status: "running",
        startedAt: "2026-05-11T00:11:00.000Z",
        completedAt: null,
        rowCount: 0,
        message: "still running"
      });

      await expect(
        runHostedPricePublish({
          database
        })
      ).rejects.toThrow("Cannot publish while a capture or process run is still active.");
    } finally {
      database.close();
    }
  });

  it("deletes expired raw capture pages by expires_at", async () => {
    const database = new LocalD1Database(":memory:");

    try {
      await applyHostedPriceStoreMigrations(database, resolveHostedPriceStoreLayout().migrationsDir);
      const repository = createHostedPriceStoreRepository(database);

      await repository.insertCaptureRun({
        runId: "capture-1",
        captureMode: "full",
        gameSlug: "riftbound-league-of-legends-trading-card-game",
        status: "succeeded",
        startedAt: "2026-05-01T00:00:00.000Z",
        completedAt: "2026-05-01T00:10:00.000Z",
        updatedAfter: null,
        requestCount: 1,
        pageCount: 0,
        cardCount: 0,
        verifiedLimit: 20,
        includePriceHistory: true,
        includeStatistics: false,
        message: "done"
      });
      await repository.insertCapturePage({
        pageId: "page-expired",
        captureRunId: "capture-1",
        pageIndex: 1,
        pageOffset: 0,
        capturedAt: "2026-05-01T00:05:00.000Z",
        requestUrl: "https://example.test/page-expired",
        rowCount: 1,
        payloadJson: "{}",
        expiresAt: "2026-05-02T00:00:00.000Z"
      });
      await repository.insertCapturePage({
        pageId: "page-fresh",
        captureRunId: "capture-1",
        pageIndex: 2,
        pageOffset: 20,
        capturedAt: "2026-05-01T00:06:00.000Z",
        requestUrl: "https://example.test/page-fresh",
        rowCount: 1,
        payloadJson: "{}",
        expiresAt: "2026-05-20T00:00:00.000Z"
      });

      const deleted = await repository.deleteExpiredCapturePages("2026-05-11T00:00:00.000Z");
      const pages = await repository.listCapturePages("capture-1");

      expect(deleted).toBe(1);
      expect(pages).toHaveLength(1);
      expect(pages[0]?.pageId).toBe("page-fresh");
    } finally {
      database.close();
    }
  });

  it("requires a previous successful process run before processing an incremental capture", async () => {
    const database = new LocalD1Database(":memory:");

    try {
      await applyHostedPriceStoreMigrations(database, resolveHostedPriceStoreLayout().migrationsDir);
      const repository = createHostedPriceStoreRepository(database);

      await repository.insertCaptureRun({
        runId: "capture-incremental-only",
        captureMode: "incremental",
        gameSlug: "riftbound-league-of-legends-trading-card-game",
        status: "succeeded",
        startedAt: "2026-05-12T22:37:49.539Z",
        completedAt: "2026-05-12T22:45:20.000Z",
        updatedAfter: "2026-05-12T00:00:00.000Z",
        requestCount: 1,
        pageCount: 1,
        cardCount: deltaMergeFixture.incrementalPayload.data.length,
        verifiedLimit: 20,
        includePriceHistory: true,
        includeStatistics: false,
        message: "Incremental delta capture"
      });
      await repository.insertCapturePage({
        pageId: "capture-incremental-only::page-001",
        captureRunId: "capture-incremental-only",
        pageIndex: 1,
        pageOffset: 0,
        capturedAt: "2026-05-12T22:37:49.539Z",
        requestUrl: "https://api.justtcg.com/v1/cards?updated_after=1778544000",
        rowCount: deltaMergeFixture.incrementalPayload.data.length,
        payloadJson: JSON.stringify(deltaMergeFixture.incrementalPayload),
        expiresAt: "2026-05-19T22:37:49.539Z"
      });

      await expect(
        runHostedPriceProcess({
          database,
          captureRunId: "capture-incremental-only"
        })
      ).rejects.toThrow("cannot be processed before a previous successful process run establishes full truth");
    } finally {
      database.close();
    }
  });

  it("merges incremental captures into prior truth, preserving untouched cards and removing missing touched variants", async () => {
    const dataRoot = await mkdtemp(join(tmpdir(), "price-store-hosted-data-"));
    const repositoryRoot = await mkdtemp(join(tmpdir(), "price-store-hosted-repo-"));
    createdDirs.push(dataRoot, repositoryRoot);
    const database = new LocalD1Database(":memory:");

    try {
      await applyHostedPriceStoreMigrations(database, resolveHostedPriceStoreLayout().migrationsDir);
      const repository = createHostedPriceStoreRepository(database);

      await repository.insertCaptureRun({
        runId: "capture-full-baseline",
        captureMode: "full",
        gameSlug: "riftbound-league-of-legends-trading-card-game",
        status: "succeeded",
        startedAt: "2026-05-07T22:55:56.911Z",
        completedAt: "2026-05-07T23:11:01.327Z",
        updatedAfter: null,
        requestCount: 55,
        pageCount: 55,
        cardCount: 1092,
        verifiedLimit: 20,
        includePriceHistory: true,
        includeStatistics: false,
        message: "Baseline full capture"
      });
      await repository.insertProcessRun({
        processRunId: "process-full-baseline",
        captureRunId: "capture-full-baseline",
        status: "succeeded",
        startedAt: "2026-05-07T23:11:05.000Z",
        completedAt: "2026-05-07T23:11:10.000Z",
        rowCount: deltaMergeFixture.previousRows.length,
        message: "Baseline full process run"
      });
      await repository.replacePriceDataForProcessRun(
        "process-full-baseline",
        deltaMergeFixture.previousRows.map((row) => createHostedPriceDataRowFromFixture(row, "process-full-baseline", "capture-full-baseline"))
      );

      await repository.insertCaptureRun({
        runId: "capture-incremental-2026-05-12",
        captureMode: "incremental",
        gameSlug: "riftbound-league-of-legends-trading-card-game",
        status: "succeeded",
        startedAt: "2026-05-12T22:37:49.539Z",
        completedAt: "2026-05-12T22:45:20.000Z",
        updatedAfter: "2026-05-12T00:00:00.000Z",
        requestCount: 46,
        pageCount: 1,
        cardCount: deltaMergeFixture.incrementalPayload.data.length,
        verifiedLimit: 20,
        includePriceHistory: true,
        includeStatistics: false,
        message: "May 12 incremental delta capture"
      });
      await repository.insertCapturePage({
        pageId: "capture-incremental-2026-05-12::page-001",
        captureRunId: "capture-incremental-2026-05-12",
        pageIndex: 1,
        pageOffset: 0,
        capturedAt: "2026-05-12T22:37:49.539Z",
        requestUrl: "https://api.justtcg.com/v1/cards?updated_after=1778544000",
        rowCount: deltaMergeFixture.incrementalPayload.data.length,
        payloadJson: JSON.stringify(deltaMergeFixture.incrementalPayload),
        expiresAt: "2026-05-19T22:37:49.539Z"
      });

      const processResult = await runHostedPriceProcess({
        database,
        captureRunId: "capture-incremental-2026-05-12"
      });
      const mergedRows = await repository.listPriceDataForProcessRun(processResult.processRunId);
      const publishResult = await runHostedPricePublish({
        database,
        processRunId: processResult.processRunId,
        dataRootDir: dataRoot,
        repositoryRoot
      });

      expect(processResult.rowCount).toBe(6);
      expect(mergedRows).toHaveLength(6);
      expect(
        mergedRows.filter(
          (row) =>
            row.sourceCardId === "riftbound-league-of-legends-trading-card-game-origins-blazing-scorcher-common" &&
            row.sourceVariantId ===
              "riftbound-league-of-legends-trading-card-game-origins-blazing-scorcher-common_near-mint"
        )
      ).toHaveLength(1);
      expect(
        mergedRows.filter(
          (row) =>
            row.sourceCardId === "riftbound-league-of-legends-trading-card-game-unleashed-vex-apathetic-epic"
        )
      ).toHaveLength(1);
      expect(
        mergedRows.some(
          (row) =>
            row.sourceVariantId ===
            "riftbound-league-of-legends-trading-card-game-unleashed-vex-apathetic-epic_lightly-played_foil"
        )
      ).toBe(false);
      expect(
        mergedRows.filter(
          (row) =>
            row.sourceCardId === "riftbound-league-of-legends-trading-card-game-origins-acceptable-losses-uncommon"
        )
      ).toHaveLength(4);
      expect(
        mergedRows
          .filter(
            (row) =>
              row.sourceCardId === "riftbound-league-of-legends-trading-card-game-origins-blazing-scorcher-common"
          )
          .every((row) => row.processRunId === processResult.processRunId)
      ).toBe(true);

      expect(publishResult.rowCount).toBe(6);
      expect(
        publishResult.snapshot.rows.filter((row) => row.cardName === "Vex - Apathetic")
      ).toHaveLength(1);
      expect(
        publishResult.snapshot.rows.filter((row) => row.cardName === "Acceptable Losses")
      ).toHaveLength(4);
      expect(
        publishResult.snapshot.rows.some(
          (row) =>
            row.cardName === "Blazing Scorcher" &&
            row.externalIds.tcgplayerSkuId === "8925402"
        )
      ).toBe(true);
    } finally {
      database.close();
    }
  });
});

type DeltaMergeFixture = {
  previousRows: Array<FixturePriceDataRow>;
  incrementalPayload: {
    data: Array<Record<string, unknown>>;
    meta: Record<string, unknown>;
  };
};

type FixturePriceDataRow = {
  sourceCardId: string;
  sourceVariantId: string;
  tcgplayerId: string | null;
  tcgplayerSkuId: string | null;
  language: string | null;
  condition: string | null;
  printing: string | null;
  currentPriceAmount: number | null;
  currentPriceLastUpdatedAt: string | null;
  priceHistory: Array<{ amount: number; observedAt: string }>;
};

function createHostedPriceDataRowFromFixture(
  row: FixturePriceDataRow,
  processRunId: string,
  captureRunId: string
): HostedPriceDataRow {
  return {
    rowId: `${processRunId}::${row.sourceVariantId}`,
    processRunId,
    captureRunId,
    upstreamProviderId: "justtcg",
    priceSourceId: "tcgplayer",
    gameSlug: "riftbound-league-of-legends-trading-card-game",
    sourceCardId: row.sourceCardId,
    sourceVariantId: row.sourceVariantId,
    tcgplayerId: row.tcgplayerId,
    tcgplayerSkuId: row.tcgplayerSkuId,
    language: row.language,
    condition: row.condition,
    printing: row.printing,
    currency: "USD",
    currentPriceAmount: row.currentPriceAmount,
    currentPriceLastUpdatedAt: row.currentPriceLastUpdatedAt,
    priceHistoryJson: JSON.stringify(row.priceHistory)
  };
}
