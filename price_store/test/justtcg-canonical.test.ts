import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createJustTcgCanonicalSnapshot,
  justTcgCanonicalSnapshotSchema,
  justTcgCardsResponseSchema,
  rawCaptureMetadataSchema
} from "../src/index.js";

const fixturesDir = join(process.cwd(), "fixtures", "justtcg");

describe("JustTCG canonical snapshots", () => {
  it("normalizes a captured sample into card and variant source records", async () => {
    const response = justTcgCardsResponseSchema.parse(
      JSON.parse(await readFile(join(fixturesDir, "riftbound-cards-sample.json"), "utf8"))
    );
    const rawMetadata = rawCaptureMetadataSchema.parse({
      version: 1,
      sourceId: "justtcg",
      capturedAt: "2026-05-07T00:43:01.077Z",
      payloadFormat: "json",
      relativePayloadPath: "raw/justtcg/2026/05/07/sample.json",
      captureKey: "riftbound-league-of-legends-trading-card-game-cards-sample",
      requestUrl:
        "https://api.justtcg.com/v1/cards?game=riftbound-league-of-legends-trading-card-game&limit=5&include_price_history=false",
      notes: [
        "requested-limit:5",
        "include-price-history:false",
        "include-statistics:false"
      ]
    });

    const snapshot = createJustTcgCanonicalSnapshot(rawMetadata, response);

    expect(justTcgCanonicalSnapshotSchema.parse(snapshot)).toMatchObject({
      sourceId: "justtcg",
      game: {
        slug: "riftbound-league-of-legends-trading-card-game",
        label: "Riftbound: League of Legends Trading Card Game"
      },
      sourceContext: {
        requestedLimit: 5,
        includePriceHistory: false
      },
      pagination: {
        total: 1092,
        limit: 5,
        offset: 0,
        hasMore: true
      }
    });
    expect(snapshot.cards[0]?.externalIds.tcgplayerId).toBe("653102");
    expect(snapshot.cards[0]?.variants).toHaveLength(2);
    expect(snapshot.cards[0]?.variants[0]?.currentPrice.lastUpdatedAt).toBe(
      "2026-05-06T23:20:17.000Z"
    );
  });

  it("preserves optional price history in structured canonical form", async () => {
    const response = justTcgCardsResponseSchema.parse(
      JSON.parse(await readFile(join(fixturesDir, "riftbound-cards-sample-with-history.json"), "utf8"))
    );
    const rawMetadata = rawCaptureMetadataSchema.parse({
      version: 1,
      sourceId: "justtcg",
      capturedAt: "2026-05-07T01:05:00.000Z",
      payloadFormat: "json",
      relativePayloadPath: "raw/justtcg/2026/05/07/sample-with-history.json",
      captureKey: "riftbound-league-of-legends-trading-card-game-cards-sample",
      requestUrl:
        "https://api.justtcg.com/v1/cards?game=riftbound-league-of-legends-trading-card-game&limit=20&include_price_history=true",
      notes: [
        "requested-limit:20",
        "include-price-history:true",
        "include-statistics:false"
      ]
    });

    const snapshot = createJustTcgCanonicalSnapshot(rawMetadata, response);
    const history = snapshot.cards[0]?.variants[0]?.currentPrice.history ?? [];

    expect(history).toEqual([
      {
        amount: 2100.5,
        observedAt: "2026-05-01T00:00:00.000Z"
      },
      {
        amount: 1999.99,
        observedAt: "2026-05-04T23:43:28.000Z"
      }
    ]);
    expect(snapshot.cards[0]?.variants[0]?.externalIds.tcgplayerSkuId).toBe("825001");
  });
});
