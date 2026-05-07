import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  justTcgCanonicalSnapshotSchema,
  loadCanonicalSnapshotMetadata,
  publishJustTcgCanonicalSnapshot,
  publishedPriceManifestSchema,
  publishedPriceSnapshotSchema,
  resolvePriceDataLayout,
  writeCanonicalSnapshot
} from "../src/index.js";

const createdDirs: string[] = [];

afterEach(async () => {
  for (const dir of createdDirs.splice(0)) {
    await import("node:fs/promises").then(({ rm }) => rm(dir, { recursive: true, force: true }));
  }
});

describe("JustTCG publish pipeline", () => {
  it("publishes a canonical snapshot into export and frontend static assets", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "price-store-publish-"));
    const repositoryRoot = await mkdtemp(join(tmpdir(), "price-store-repo-"));
    createdDirs.push(rootDir, repositoryRoot);
    const layout = resolvePriceDataLayout(rootDir);
    const snapshot = justTcgCanonicalSnapshotSchema.parse({
      version: 1,
      sourceId: "justtcg",
      snapshotId: "justtcg-canonical-2026-05-07-riftbound",
      capturedAt: "2026-05-07T04:00:00.000Z",
      game: {
        slug: "riftbound-league-of-legends-trading-card-game",
        label: "Riftbound: League of Legends Trading Card Game"
      },
      sourceContext: {
        runId: "justtcg-capture-2026-05-07-riftbound",
        requestUrls: ["https://api.justtcg.com/v1/cards?game=riftbound-league-of-legends-trading-card-game&limit=20"],
        rawRelativePayloadPaths: ["raw/justtcg/2026/05/07/page-1.json"],
        rawRelativeMetadataPaths: ["raw/justtcg/2026/05/07/page-1.meta.json"],
        pageCount: 1,
        requestedLimit: 20,
        includePriceHistory: true,
        includeStatistics: false
      },
      pagination: {
        total: 1,
        limit: 20,
        offset: 0,
        hasMore: false
      },
      cards: [
        {
          sourceCardId: "card-1",
          name: "Demo Card",
          gameLabel: "Riftbound: League of Legends Trading Card Game",
          set: {
            slug: "ogn",
            label: "Origins"
          },
          number: "12",
          rarity: "Rare",
          externalIds: {
            tcgplayerId: "653102"
          },
          variants: [
            {
              sourceVariantId: "card-1_nm",
              condition: "Near Mint",
              printing: "Normal",
              language: "English",
              externalIds: {
                tcgplayerSkuId: "825001"
              },
              currentPrice: {
                currency: "USD",
                amount: 12.34,
                lastUpdatedAt: "2026-05-07T03:30:00.000Z",
                history: [
                  {
                    amount: 11.5,
                    observedAt: "2026-05-06T03:30:00.000Z"
                  }
                ]
              }
            }
          ]
        }
      ]
    });
    const metadata = await writeCanonicalSnapshot(layout, {
      sourceId: "justtcg",
      runId: "justtcg-capture-2026-05-07-riftbound",
      capturedAt: snapshot.capturedAt,
      snapshotKey: "riftbound-cards-snapshot",
      snapshot: JSON.stringify(snapshot, null, 2),
      rawRelativePayloadPath: "raw/justtcg/2026/05/07/page-1.json",
      rawRelativeMetadataPath: "raw/justtcg/2026/05/07/page-1.meta.json",
      rawRelativePayloadPaths: ["raw/justtcg/2026/05/07/page-1.json"],
      rawRelativeMetadataPaths: ["raw/justtcg/2026/05/07/page-1.meta.json"],
      notes: ["canonical-source-snapshot"]
    });
    const canonicalMetadata = await loadCanonicalSnapshotMetadata(
      layout,
      metadata.relativeSnapshotPath.replace(/\.json$/u, ".meta.json")
    );

    const result = await publishJustTcgCanonicalSnapshot(layout, canonicalMetadata, {
      repositoryRoot
    });

    const manifest = publishedPriceManifestSchema.parse(
      JSON.parse(await readFile(result.frontendManifestPath, "utf8"))
    );
    const publishedSnapshot = publishedPriceSnapshotSchema.parse(
      JSON.parse(await readFile(result.frontendSnapshotPath, "utf8"))
    );

    expect(manifest.snapshotPath).toBe("riftbound/latest.json");
    expect(manifest.priceSource.label).toBe("TCGPlayer");
    expect(publishedSnapshot.rows).toHaveLength(1);
    expect(publishedSnapshot.rows[0]).toMatchObject({
      rowId: "card-1::card-1_nm",
      condition: "Near Mint",
      currentPrice: {
        amount: 12.34
      }
    });
  });
});
