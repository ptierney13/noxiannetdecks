import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  captureJustTcgCardsCatalog,
  captureJustTcgCardsSample,
  loadRunStatus,
  rawCaptureMetadataSchema,
  resolvePriceDataLayout,
  verifyJustTcgRequestLimit
} from "../src/index.js";

const createdDirs: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();

  for (const dir of createdDirs.splice(0)) {
    await import("node:fs/promises").then(({ rm }) => rm(dir, { recursive: true, force: true }));
  }
});

describe("JustTCG capture", () => {
  it("persists a bounded live-capture payload and run record", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "price-store-justtcg-"));
    createdDirs.push(rootDir);
    const layout = resolvePriceDataLayout(rootDir);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify({
            data: [
              {
                id: "riftbound-demo-card",
                name: "Demo Card",
                game: "riftbound",
                variants: [
                  {
                    id: "riftbound-demo-card_near-mint_normal",
                    price: 12.34,
                    lastUpdated: 1746576000
                  }
                ]
              }
            ],
            meta: {
              total: 1,
              limit: 3,
              offset: 0,
              hasMore: false
            },
            _metadata: {
              apiPlan: "free",
              apiRequestLimit: 1000,
              apiDailyLimit: 100,
              apiRateLimit: 10,
              apiRequestsUsed: 1,
              apiDailyRequestsUsed: 1,
              apiRequestsRemaining: 999,
              apiDailyRequestsRemaining: 99
            }
          }),
        status: 200,
        statusText: "OK"
      })
    );

    const result = await captureJustTcgCardsSample(
      layout,
      {
        apiKey: "tcg_test",
        baseUrl: "https://api.justtcg.com/v1",
        defaultGame: "riftbound",
        defaultLimit: 3,
        includePriceHistory: false,
        includeStatistics: false
      },
      {
        startedAt: "2026-05-06T12:00:00.000Z"
      }
    );

    expect(result.runId).toBe("justtcg-capture-2026-05-06-riftbound");
    expect(result.rawCaptureCount).toBe(1);
    expect(result.cardCount).toBe(1);

    const payload = await readFile(join(rootDir, result.relativePayloadPaths[0]), "utf8");
    const metadataPath = result.relativePayloadPaths[0].replace(/\.json$/, ".meta.json");
    const metadata = JSON.parse(await readFile(join(rootDir, metadataPath), "utf8"));

    expect(payload).toContain("\"riftbound-demo-card\"");
    expect(payload).toContain("\"apiPlan\"");
    expect(rawCaptureMetadataSchema.parse(metadata)).toMatchObject({
      runId: "justtcg-capture-2026-05-06-riftbound",
      notes: expect.arrayContaining(["free-plan-budgeted-capture"])
    });

    await expect(loadRunStatus(layout, result.runId)).resolves.toMatchObject({
      status: "succeeded",
      rawCaptureCount: 1,
      sourceId: "justtcg"
    });
  });

  it("verifies the documented limit and searches upward when a higher limit works", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (input: URL | string) => {
        const url = new URL(typeof input === "string" ? input : input.toString());
        const limit = Number(url.searchParams.get("limit"));

        if (limit <= 37) {
          return {
            ok: true,
            text: async () => JSON.stringify({ data: [], meta: { total: 0, limit, offset: 0, hasMore: false } }),
            status: 200,
            statusText: "OK"
          };
        }

        return {
          ok: false,
          text: async () => JSON.stringify({ error: "limit too high", code: "validation_error" }),
          status: 400,
          statusText: "Bad Request"
        };
      })
    );

    const result = await verifyJustTcgRequestLimit({
      apiKey: "tcg_test",
      baseUrl: "https://api.justtcg.com/v1",
      defaultGame: "riftbound",
      defaultLimit: 20,
      includePriceHistory: false,
      includeStatistics: false
    });

    expect(result.verifiedLimit).toBe(37);
    expect(result.documentedLimitWorked).toBe(true);
    expect(result.nextHigherLimitWorked).toBe(true);
    expect(result.testedLimits).toContain(20);
    expect(result.testedLimits).toContain(21);
  });

  it("captures a paged catalog run and records one raw file per page", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "price-store-justtcg-catalog-"));
    createdDirs.push(rootDir);
    const layout = resolvePriceDataLayout(rootDir);

    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          text: async () =>
            JSON.stringify({
              data: [
                { id: "card-1", name: "One", game: "riftbound", variants: [{ id: "card-1_nm", price: 1.1 }] },
                { id: "card-2", name: "Two", game: "riftbound", variants: [{ id: "card-2_nm", price: 2.2 }] }
              ],
              meta: { total: 3, limit: 2, offset: 0, hasMore: true }
            }),
          status: 200,
          statusText: "OK"
        })
        .mockResolvedValueOnce({
          ok: true,
          text: async () =>
            JSON.stringify({
              data: [{ id: "card-3", name: "Three", game: "riftbound", variants: [{ id: "card-3_nm", price: 3.3 }] }],
              meta: { total: 3, limit: 2, offset: 2, hasMore: false }
            }),
          status: 200,
          statusText: "OK"
        })
    );

    const result = await captureJustTcgCardsCatalog(
      layout,
      {
        apiKey: "tcg_test",
        baseUrl: "https://api.justtcg.com/v1",
        defaultGame: "riftbound",
        defaultLimit: 20,
        includePriceHistory: false,
        includeStatistics: false
      },
      {
        startedAt: "2026-05-07T03:00:00.000Z",
        limit: 2,
        verifyLimit: false,
        requestDelayMs: 0
      }
    );

    expect(result.rawCaptureCount).toBe(2);
    expect(result.cardCount).toBe(3);
    expect(result.pageCount).toBe(2);
    expect(result.relativeMetadataPaths).toHaveLength(2);

    const firstMetadata = JSON.parse(await readFile(join(rootDir, result.relativeMetadataPaths[0]), "utf8"));
    expect(rawCaptureMetadataSchema.parse(firstMetadata)).toMatchObject({
      runId: result.runId,
      notes: expect.arrayContaining(["paged-catalog-capture", "page-index:1", "page-offset:0"])
    });

    await expect(loadRunStatus(layout, result.runId)).resolves.toMatchObject({
      status: "succeeded",
      rawCaptureCount: 2,
      pageCount: 2,
      cardCount: 3
    });
  });
});
