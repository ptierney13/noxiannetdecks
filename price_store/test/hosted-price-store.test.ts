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
const createdDirs: string[] = [];

beforeEach(async () => {
  samplePayload = await readFile(join(process.cwd(), "fixtures", "justtcg", "riftbound-cards-sample-with-history.json"), "utf8");
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
});
