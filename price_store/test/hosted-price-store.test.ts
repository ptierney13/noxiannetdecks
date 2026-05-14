import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyHostedPriceStoreMigrations,
  createHostedPriceStoreRepository,
  LocalD1Database,
  resolveHostedPriceStoreLayout,
  runHostedPriceCook,
  runHostedPriceDiscovery,
  runHostedPriceIngestion,
  runHostedPriceMaintenance,
  runHostedPricePublish
} from "../src/hosted/index.js";
import type {
  HostedCookMessage,
  HostedIngestionChunkMessage,
  HostedPipelineRunRow,
  HostedPublishMessage,
  QueueSenderLike
} from "../src/hosted/types.js";
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

beforeEach(async () => {
  samplePayload = await import("node:fs/promises").then(({ readFile }) =>
    readFile(new URL("../fixtures/justtcg/riftbound-cards-sample-with-history.json", import.meta.url), "utf8")
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("hosted D1 queue price store", () => {
  it("discovers the total page count, stores a run, and enqueues bounded chunks", async () => {
    const database = new LocalD1Database(":memory:");
    const ingestionQueue = new LocalQueue<HostedIngestionChunkMessage>();

    try {
      await applyHostedPriceStoreMigrations(database, resolveHostedPriceStoreLayout().migrationsDir);
      vi.stubGlobal("fetch", vi.fn(async () => new Response(samplePayload, { status: 200 })));

      const result = await runHostedPriceDiscovery({
        database,
        config: JUSTTCG_CONFIG,
        ingestionQueue,
        chunkRequestBudget: 45,
        verifyLimit: false
      });
      const repository = createHostedPriceStoreRepository(database);
      const run = await repository.getRun(result.runId);
      const chunks = await repository.listChunks(result.runId);

      expect(result.pageCount).toBe(55);
      expect(result.chunkCount).toBe(2);
      expect(run?.status).toBe("ingesting");
      expect(run?.remainingChunkCount).toBe(2);
      expect(chunks).toHaveLength(2);
      expect(chunks[0]?.pageStartIndex).toBe(1);
      expect(chunks[0]?.pageEndIndex).toBe(45);
      expect(chunks[1]?.pageStartIndex).toBe(46);
      expect(chunks[1]?.pageEndIndex).toBe(55);
      expect(ingestionQueue.messages).toHaveLength(2);
    } finally {
      database.close();
    }
  });

  it("ingests raw pages and enqueues cook exactly once when the last chunk finishes", async () => {
    const database = new LocalD1Database(":memory:");
    const ingestionQueue = new LocalQueue<HostedIngestionChunkMessage>();
    const cookQueue = new LocalQueue<HostedCookMessage>();

    try {
      await applyHostedPriceStoreMigrations(database, resolveHostedPriceStoreLayout().migrationsDir);
      const discoveryPayload = createPagedSamplePayload({ hasMore: true, limit: 1, total: 2, variantSuffix: "d" });
      const firstPagePayload = createPagedSamplePayload({ hasMore: true, limit: 1, total: 2, variantSuffix: "a" });
      const secondPagePayload = createPagedSamplePayload({ hasMore: false, limit: 1, total: 2, variantSuffix: "b" });
      vi.stubGlobal(
        "fetch",
        vi.fn()
          .mockResolvedValueOnce(new Response(JSON.stringify(discoveryPayload), { status: 200 }))
          .mockResolvedValueOnce(new Response(JSON.stringify(firstPagePayload), { status: 200 }))
          .mockResolvedValueOnce(new Response(JSON.stringify(secondPagePayload), { status: 200 }))
      );

      const discovery = await runHostedPriceDiscovery({
        database,
        config: { ...JUSTTCG_CONFIG, defaultLimit: 1 },
        ingestionQueue,
        chunkRequestBudget: 1,
        verifyLimit: false
      });

      const firstChunk = ingestionQueue.messages.shift();
      const secondChunk = ingestionQueue.messages.shift();
      if (!firstChunk || !secondChunk) {
        throw new Error("Expected discovery to enqueue two ingestion chunks.");
      }

      const firstResult = await runHostedPriceIngestion(
        {
          cookQueue,
          database,
          message: firstChunk,
          requestDelayMs: 0
        },
        { ...JUSTTCG_CONFIG, defaultLimit: 1 }
      );
      const secondResult = await runHostedPriceIngestion(
        {
          cookQueue,
          database,
          message: secondChunk,
          requestDelayMs: 0
        },
        { ...JUSTTCG_CONFIG, defaultLimit: 1 }
      );
      const repository = createHostedPriceStoreRepository(database);
      const run = await repository.getRun(discovery.runId);
      const rawPages = await repository.listRawPages(discovery.runId);

      expect(firstResult.shouldEnqueueCook).toBe(false);
      expect(secondResult.shouldEnqueueCook).toBe(true);
      expect(cookQueue.messages).toHaveLength(1);
      expect(run?.status).toBe("ready_to_cook");
      expect(run?.completedChunkCount).toBe(2);
      expect(run?.remainingChunkCount).toBe(0);
      expect(rawPages).toHaveLength(2);
    } finally {
      database.close();
    }
  });

  it("cooks ingested pages, publishes KV artifacts, and records the live run", async () => {
    const database = new LocalD1Database(":memory:");
    const ingestionQueue = new LocalQueue<HostedIngestionChunkMessage>();
    const cookQueue = new LocalQueue<HostedCookMessage>();
    const publishQueue = new LocalQueue<HostedPublishMessage>();
    const kv = new InMemoryKvNamespace();

    try {
      await applyHostedPriceStoreMigrations(database, resolveHostedPriceStoreLayout().migrationsDir);
      vi.stubGlobal("fetch", vi.fn(async () => new Response(samplePayload, { status: 200 })));

      const discovery = await runHostedPriceDiscovery({
        database,
        config: JUSTTCG_CONFIG,
        ingestionQueue,
        chunkRequestBudget: 45,
        verifyLimit: false
      });

      while (ingestionQueue.messages.length > 0) {
        const message = ingestionQueue.messages.shift();
        if (!message) {
          continue;
        }

        await runHostedPriceIngestion(
          {
            cookQueue,
            database,
            message,
            requestDelayMs: 0
          },
          JUSTTCG_CONFIG
        );
      }

      const cookMessage = cookQueue.messages.shift();
      if (!cookMessage) {
        throw new Error("Expected ingestion to enqueue one cook message.");
      }

      const cookResult = await runHostedPriceCook({
        database,
        message: cookMessage,
        publishQueue
      });
      const publishMessage = publishQueue.messages.shift();
      if (!publishMessage) {
        throw new Error("Expected cook to enqueue one publish message.");
      }

      const publishResult = await runHostedPricePublish({
        database,
        message: publishMessage,
        publishedDataKv: kv
      });
      const repository = createHostedPriceStoreRepository(database);
      const latestPublishRun = await repository.getLatestSuccessfulPublishRun();
      const run = await repository.getRun(discovery.runId);

      expect(cookResult.rowCount).toBeGreaterThan(0);
      expect(publishResult.rowCount).toBe(cookResult.rowCount);
      expect(await kv.get("prices-d1/manifest.json", "text")).toContain("\"snapshotPath\": \"riftbound/latest.json\"");
      expect(await kv.get("prices-d1/riftbound/latest.json", "text")).toContain("\"rows\"");
      expect(latestPublishRun?.runId).toBe(discovery.runId);
      expect(await repository.getPipelineState("current_live_run_id")).toBe(discovery.runId);
      expect(run?.status).toBe("succeeded");
      expect(run?.publishedRowCount).toBe(publishResult.rowCount);
    } finally {
      database.close();
    }
  });

  it("deletes runs older than one week behind the live snapshot", async () => {
    const database = new LocalD1Database(":memory:");

    try {
      await applyHostedPriceStoreMigrations(database, resolveHostedPriceStoreLayout().migrationsDir);
      const repository = createHostedPriceStoreRepository(database);

      await repository.insertRun(createRunRow("old-run", "2026-05-01T00:00:00.000Z", "2026-05-01T12:00:00.000Z"));
      await repository.insertRun(createRunRow("live-run", "2026-05-12T00:00:00.000Z", "2026-05-12T12:00:00.000Z"));
      await repository.setPipelineState("current_live_run_id", "live-run");
      await repository.setPipelineState("current_live_published_at", "2026-05-12T12:00:00.000Z");

      const result = await runHostedPriceMaintenance({
        database
      });

      expect(result.cutoffIso).toBe("2026-05-05T12:00:00.000Z");
      expect(result.deletedRunCount).toBe(1);
      expect(await repository.getRun("old-run")).toBeNull();
      expect(await repository.getRun("live-run")).not.toBeNull();
    } finally {
      database.close();
    }
  });
});

function createRunRow(runId: string, startedAt: string, publishedAt: string): HostedPipelineRunRow {
  return {
    runId,
    gameSlug: "riftbound-league-of-legends-trading-card-game",
    captureMode: "full",
    status: "succeeded",
    startedAt,
    discoveryCompletedAt: startedAt,
    ingestionCompletedAt: startedAt,
    cookStartedAt: startedAt,
    cookCompletedAt: startedAt,
    publishStartedAt: startedAt,
    completedAt: publishedAt,
    updatedAfter: null,
    verifiedLimit: 20,
    requestBudgetPerChunk: 45,
    pageCount: 1,
    chunkCount: 1,
    completedChunkCount: 1,
    remainingChunkCount: 0,
    rawPageCount: 1,
    cookedRowCount: 1,
    publishedRowCount: 1,
    cookEnqueueRequestedAt: startedAt,
    publishEnqueueRequestedAt: startedAt,
    livePublishedAt: publishedAt,
    latestError: null
  };
}

function createPagedSamplePayload(input: {
  hasMore: boolean;
  limit: number;
  total: number;
  variantSuffix: string;
}): {
  data: Array<Record<string, unknown>>;
  meta: Record<string, unknown>;
} {
  const payload = JSON.parse(samplePayload) as {
    data: Array<Record<string, unknown>>;
    meta?: Record<string, unknown>;
  };
  const card = structuredClone(payload.data[0]);
  if (card && typeof card === "object") {
    card.id = `${String(card.id)}-${input.variantSuffix}`;
    if (Array.isArray(card.variants) && card.variants[0] && typeof card.variants[0] === "object") {
      card.variants[0].id = `${String(card.variants[0].id)}-${input.variantSuffix}`;
      if (card.variants[0].tcgplayerSkuId) {
        card.variants[0].tcgplayerSkuId = `${String(card.variants[0].tcgplayerSkuId)}${input.variantSuffix}`;
      }
    }
  }

  return {
    data: [card],
    meta: {
      ...payload.meta,
      hasMore: input.hasMore,
      limit: input.limit,
      total: input.total
    }
  };
}

class LocalQueue<T> implements QueueSenderLike<T> {
  readonly messages: T[] = [];

  async send(body: T): Promise<void> {
    this.messages.push(body);
  }
}

class InMemoryKvNamespace {
  private readonly values = new Map<string, string>();

  async get(key: string, type: "text"): Promise<string | null> {
    if (type !== "text") {
      throw new Error(`Unsupported type ${type}`);
    }

    return this.values.get(key) ?? null;
  }

  async put(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }
}
