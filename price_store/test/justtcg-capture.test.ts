import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  captureJustTcgCardsSample,
  loadRunStatus,
  rawCaptureMetadataSchema,
  resolvePriceDataLayout
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
    expect(rawCaptureMetadataSchema.parse(metadata).notes).toContain("free-plan-budgeted-capture");

    await expect(loadRunStatus(layout, result.runId)).resolves.toMatchObject({
      status: "succeeded",
      rawCaptureCount: 1,
      sourceId: "justtcg"
    });
  });
});
