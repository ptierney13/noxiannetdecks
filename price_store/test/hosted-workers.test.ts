import { describe, expect, it } from "vitest";
import {
  loadActiveCaptureState,
  loadHostedRunStatus,
  loadLatestSuccessfulCaptureState,
  runHostedJustTcgCaptureWorker,
  runHostedJustTcgPublishWorker,
  writeActiveCaptureState,
  writeHostedRunStatus,
  writeLatestSuccessfulCaptureState,
  type HostedCaptureWorkerInput,
  type HostedObjectStore,
  type JustTcgCardsQuery,
  type JustTcgCardsResponse,
  type JustTcgConfig
} from "../src/index.js";

class MemoryHostedObjectStore implements HostedObjectStore {
  readonly values = new Map<string, string>();

  async putText(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }

  async getText(key: string): Promise<string | undefined> {
    return this.values.get(key);
  }

  async delete(key: string): Promise<void> {
    this.values.delete(key);
  }

  async list(prefix: string): Promise<string[]> {
    return [...this.values.keys()].filter((key) => key.startsWith(prefix)).sort();
  }
}

describe("hosted price-store workers", () => {
  it("captures incremental hosted data and records the latest successful pointer", async () => {
    const store = new MemoryHostedObjectStore();
    const config = createConfig();
    const queries: JustTcgCardsQuery[] = [];

    const result = await runHostedJustTcgCaptureWorker(
      store,
      config,
      {
        mode: "incremental",
        updatedAfter: "2026-05-05T00:00:00.000Z",
        requestDelayMs: 0
      },
      {
        startedAt: "2026-05-07T12:00:00.000Z",
        fetchCards: async (_config, query = {}) => {
          queries.push(query);
          return {
            data: createCardsResponse(),
            requestUrl: "https://api.justtcg.com/v1/cards?offset=0"
          };
        }
      }
    );

    expect(queries).toHaveLength(1);
    expect(queries[0]?.updatedAfter).toBe(Math.floor(new Date("2026-05-05T00:00:00.000Z").getTime() / 1000));
    expect(result.mode).toBe("incremental");
    expect(result.rawCaptureCount).toBe(1);
    expect(result.requestCount).toBe(1);
    expect(await loadActiveCaptureState(store)).toBeUndefined();

    const status = await loadHostedRunStatus(store, result.runId, "raw-capture");
    expect(status?.status).toBe("succeeded");
    expect(status?.canonicalSnapshotCount).toBe(1);

    const latest = await loadLatestSuccessfulCaptureState(store);
    expect(latest?.runId).toBe(result.runId);
    expect(latest?.canonicalRelativeSnapshotPath).toBe(result.canonicalRelativeSnapshotPath);
  });

  it("omits updatedAfter in full hosted captures", async () => {
    const store = new MemoryHostedObjectStore();
    const config = createConfig();
    const queries: JustTcgCardsQuery[] = [];

    await runHostedJustTcgCaptureWorker(
      store,
      config,
      {
        mode: "full",
        requestDelayMs: 0
      },
      {
        startedAt: "2026-05-07T12:00:00.000Z",
        fetchCards: async (_config, query = {}) => {
          queries.push(query);
          return {
            data: createCardsResponse(),
            requestUrl: "https://api.justtcg.com/v1/cards?offset=0"
          };
        }
      }
    );

    expect(queries[0]?.updatedAfter).toBeUndefined();
  });

  it("refuses publish while a hosted capture is still active", async () => {
    const store = new MemoryHostedObjectStore();
    await writeActiveCaptureState(store, {
      runId: "justtcg-capture-2026-05-07-riftbound",
      mode: "incremental",
      startedAt: "2026-05-07T12:00:00.000Z"
    });

    await expect(runHostedJustTcgPublishWorker(store)).rejects.toThrow(/still running/i);
  });

  it("reruns publish without making extra upstream API requests", async () => {
    const store = new MemoryHostedObjectStore();
    const config = createConfig();
    let fetchCount = 0;

    const capture = await runHostedJustTcgCaptureWorker(
      store,
      config,
      {
        mode: "incremental",
        updatedAfter: "2026-05-05T00:00:00.000Z",
        requestDelayMs: 0
      },
      {
        startedAt: "2026-05-07T12:00:00.000Z",
        fetchCards: async () => {
          fetchCount += 1;
          return {
            data: createCardsResponse(),
            requestUrl: "https://api.justtcg.com/v1/cards?offset=0"
          };
        }
      }
    );

    const firstPublish = await runHostedJustTcgPublishWorker(store);
    const secondPublish = await runHostedJustTcgPublishWorker(store);

    expect(fetchCount).toBe(1);
    expect(firstPublish.captureRunId).toBe(capture.runId);
    expect(firstPublish.manifest.snapshotPath).toBe("riftbound/latest.json");
    expect(firstPublish.exportManifestPath).toBe("published/prices/manifest.json");
    expect(secondPublish.rowCount).toBe(firstPublish.rowCount);
  });

  it("refuses publish when the latest hosted capture did not succeed", async () => {
    const store = new MemoryHostedObjectStore();
    await writeLatestSuccessfulCaptureState(store, {
      runId: "failed-capture",
      mode: "incremental",
      capturedAt: "2026-05-07T12:00:00.000Z",
      canonicalRelativeMetadataPath: "canonical/justtcg/2026/05/07/fake.meta.json",
      canonicalRelativeSnapshotPath: "canonical/justtcg/2026/05/07/fake.json"
    });
    await writeHostedRunStatus(store, {
      version: 1,
      runId: "failed-capture",
      sourceId: "justtcg",
      stage: "raw-capture",
      status: "failed",
      startedAt: "2026-05-07T12:00:00.000Z",
      completedAt: "2026-05-07T12:01:00.000Z",
      message: "failed"
    });

    await expect(runHostedJustTcgPublishWorker(store)).rejects.toThrow(/not in a succeeded state/i);
  });
});

function createConfig(): JustTcgConfig {
  return {
    apiKey: "test-key",
    baseUrl: "https://api.justtcg.com/v1",
    defaultGame: "riftbound-league-of-legends-trading-card-game",
    defaultLimit: 20,
    includePriceHistory: true,
    includeStatistics: false
  };
}

function createCardsResponse(overrides: Partial<JustTcgCardsResponse["meta"]> = {}): JustTcgCardsResponse {
  return {
    data: [
      {
        id: "riftbound-card-1",
        name: "Ahri - Test",
        game: "Riftbound: League of Legends Trading Card Game",
        set: "origins-riftbound-league-of-legends-trading-card-game",
        set_name: "Origins",
        number: "001/298",
        tcgplayerId: "123",
        rarity: "Rare",
        details: null,
        variants: [
          {
            id: "riftbound-card-1_near-mint_foil",
            condition: "Near Mint",
            printing: "Foil",
            language: "English",
            tcgplayerSkuId: "456",
            price: 12.34,
            lastUpdated: Math.floor(new Date("2026-05-07T00:00:00.000Z").getTime() / 1000),
            priceHistory: [
              {
                p: 11.5,
                t: Math.floor(new Date("2026-05-06T00:00:00.000Z").getTime() / 1000)
              },
              {
                p: 12.34,
                t: Math.floor(new Date("2026-05-07T00:00:00.000Z").getTime() / 1000)
              }
            ]
          }
        ]
      }
    ],
    meta: {
      total: 1,
      limit: 20,
      offset: 0,
      hasMore: false,
      ...overrides
    },
    _metadata: {
      apiRequestsUsed: 1
    }
  };
}
