import { describe, expect, it } from "vitest";
import {
  createR2HostedObjectStore,
  handleCaptureWorkerFetch,
  handleCaptureWorkerScheduled,
  handlePublishWorkerRequest,
  type PriceStoreCaptureWorkerEnv,
  type PriceStorePublishWorkerEnv
} from "../../workers/shared/price-store-worker.js";

class MemoryR2Bucket {
  readonly values = new Map<string, string>();

  async put(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }

  async get(key: string): Promise<{ text(): Promise<string> } | null> {
    const value = this.values.get(key);
    return value === undefined
      ? null
      : {
          async text() {
            return value;
          }
        };
  }

  async delete(key: string): Promise<void> {
    this.values.delete(key);
  }

  async list(options: { prefix: string; cursor?: string }): Promise<{
    objects: Array<{ key: string }>;
    truncated: boolean;
    cursor?: string;
  }> {
    return {
      objects: [...this.values.keys()]
        .filter((key) => key.startsWith(options.prefix))
        .sort()
        .map((key) => ({ key })),
      truncated: false
    };
  }
}

describe("Cloudflare price-store worker bridge", () => {
  it("returns 405 for direct capture fetch requests", async () => {
    const response = await handleCaptureWorkerFetch();
    expect(response.status).toBe(405);
  });

  it("runs scheduled capture and forwards to publish via the internal binding", async () => {
    const publishBodies: string[] = [];
    const env = createCaptureEnv();
    const response = await handleCaptureWorkerScheduled(env, {
      runCapture: async () => ({
        runId: "justtcg-capture-2026-05-08-riftbound",
        mode: "incremental",
        updatedAfter: "2026-05-06T00:00:00.000Z",
        rawCaptureCount: 1,
        relativePayloadPaths: ["raw/justtcg/2026/05/08/page-001.json"],
        relativeMetadataPaths: ["raw/justtcg/2026/05/08/page-001.meta.json"],
        canonicalRelativeSnapshotPath: "canonical/justtcg/2026/05/08/snapshot.json",
        canonicalRelativeMetadataPath: "canonical/justtcg/2026/05/08/snapshot.meta.json",
        cardCount: 20,
        pageCount: 1,
        requestCount: 1
      }),
      publishFetch: async (request) => {
        publishBodies.push(await request.text());
        return new Response(
          JSON.stringify({
            publishRunId: "publish-justtcg-capture-2026-05-08-riftbound"
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json"
            }
          }
        );
      }
    });

    expect(response.status).toBe(200);
    expect(publishBodies).toHaveLength(1);
    expect(JSON.parse(publishBodies[0] ?? "{}")).toEqual({
      captureRunId: "justtcg-capture-2026-05-08-riftbound"
    });
  });

  it("accepts internal publish requests on /publish only", async () => {
    const env = createPublishEnv();
    const response = await handlePublishWorkerRequest(
      new Request("https://price-store.internal/publish", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({})
      }),
      env,
      {
        runPublish: async () => ({
          captureRunId: "justtcg-capture-2026-05-08-riftbound",
          publishRunId: "publish-justtcg-capture-2026-05-08-riftbound",
          manifest: {
            version: 1,
            game: {
              slug: "riftbound-league-of-legends-trading-card-game",
              key: "riftbound",
              label: "Riftbound"
            },
            priceSource: {
              id: "tcgplayer",
              label: "TCGPlayer"
            },
            publishedAt: "2026-05-08T00:00:00.000Z",
            sourceCapturedAt: "2026-05-08T00:00:00.000Z",
            snapshotPath: "riftbound/latest.json",
            rowCount: 1,
            variantCount: 1,
            freshness: {
              rowCount: 1,
              pricedRowCount: 1
            },
            provenance: {
              canonicalRelativeSnapshotPath: "canonical/justtcg/example.json",
              rawRelativePayloadPaths: [],
              rawRelativeMetadataPaths: []
            }
          },
          snapshot: {
            version: 1,
            game: {
              slug: "riftbound-league-of-legends-trading-card-game",
              key: "riftbound",
              label: "Riftbound"
            },
            priceSource: {
              id: "tcgplayer",
              label: "TCGPlayer"
            },
            publishedAt: "2026-05-08T00:00:00.000Z",
            sourceCapturedAt: "2026-05-08T00:00:00.000Z",
            freshness: {
              rowCount: 1,
              pricedRowCount: 1
            },
            rows: []
          },
          rowCount: 1,
          exportManifestPath: "published/prices/manifest.json",
          exportSnapshotPath: "published/prices/riftbound/latest.json",
          exportMetadataPath: "published/prices/riftbound/latest.publish.meta.json"
        })
      }
    );

    expect(response.status).toBe(200);
  });

  it("rejects publish requests to other paths", async () => {
    const env = createPublishEnv();
    const response = await handlePublishWorkerRequest(
      new Request("https://price-store.internal/not-publish", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({})
      }),
      env
    );

    expect(response.status).toBe(404);
  });
});

function createCaptureEnv(): PriceStoreCaptureWorkerEnv {
  return {
    PRICE_STORE_BUCKET: new MemoryR2Bucket(),
    PRICE_STORE_PUBLISHER: {
      async fetch(_request: Request) {
        throw new Error("Expected test override to provide publish fetch.");
      }
    },
    JUSTTCG_API_KEY: "test-key",
    JUSTTCG_BASE_URL: "https://api.justtcg.com/v1",
    JUSTTCG_DEFAULT_GAME: "riftbound-league-of-legends-trading-card-game",
    JUSTTCG_DEFAULT_LIMIT: "20",
    JUSTTCG_INCLUDE_PRICE_HISTORY: "true",
    JUSTTCG_INCLUDE_STATISTICS: "false",
    PRICE_STORE_CAPTURE_MAX_REQUESTS: "55",
    PRICE_STORE_CAPTURE_REQUEST_DELAY_MS: "0"
  };
}

function createPublishEnv(): PriceStorePublishWorkerEnv {
  return {
    PRICE_STORE_BUCKET: new MemoryR2Bucket()
  };
}

describe("Cloudflare price-store object store adapter", () => {
  it("exposes the R2-backed object store contract", async () => {
    const bucket = new MemoryR2Bucket();
    const store = createR2HostedObjectStore(bucket);

    await store.putText("runs/example.json", "{\"ok\":true}");
    expect(await store.getText("runs/example.json")).toBe("{\"ok\":true}");
    expect(await store.list("runs/")).toEqual(["runs/example.json"]);
    await store.delete("runs/example.json");
    expect(await store.getText("runs/example.json")).toBeUndefined();
  });
});
