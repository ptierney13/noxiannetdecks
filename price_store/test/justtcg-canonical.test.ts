import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createJustTcgCanonicalSnapshot,
  createJustTcgCanonicalSnapshotFromPages,
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

  it("aggregates paged raw captures into a single canonical run snapshot", () => {
    const pageOneMetadata = rawCaptureMetadataSchema.parse({
      version: 1,
      sourceId: "justtcg",
      runId: "justtcg-capture-2026-05-07-riftbound",
      capturedAt: "2026-05-07T03:00:00.000Z",
      payloadFormat: "json",
      relativePayloadPath: "raw/justtcg/2026/05/07/page-1.json",
      captureKey: "riftbound-league-of-legends-trading-card-game-cards-page-001",
      requestUrl:
        "https://api.justtcg.com/v1/cards?game=riftbound-league-of-legends-trading-card-game&limit=2&offset=0&include_price_history=true",
      notes: ["requested-limit:2", "include-price-history:true", "include-statistics:false"]
    });
    const pageTwoMetadata = rawCaptureMetadataSchema.parse({
      version: 1,
      sourceId: "justtcg",
      runId: "justtcg-capture-2026-05-07-riftbound",
      capturedAt: "2026-05-07T03:00:05.000Z",
      payloadFormat: "json",
      relativePayloadPath: "raw/justtcg/2026/05/07/page-2.json",
      captureKey: "riftbound-league-of-legends-trading-card-game-cards-page-002",
      requestUrl:
        "https://api.justtcg.com/v1/cards?game=riftbound-league-of-legends-trading-card-game&limit=2&offset=2&include_price_history=true",
      notes: ["requested-limit:2", "include-price-history:true", "include-statistics:false"]
    });

    const pageOneResponse = justTcgCardsResponseSchema.parse({
      data: [
        {
          id: "card-1",
          name: "Card One",
          game: "Riftbound: League of Legends Trading Card Game",
          set: "ogn",
          set_name: "Origins",
          variants: [{ id: "card-1_nm", price: 1.11, lastUpdated: 1746576000 }]
        },
        {
          id: "card-2",
          name: "Card Two",
          game: "Riftbound: League of Legends Trading Card Game",
          set: "ogn",
          set_name: "Origins",
          variants: [{ id: "card-2_nm", price: 2.22, lastUpdated: 1746576001 }]
        }
      ],
      meta: { total: 3, limit: 2, offset: 0, hasMore: true },
      _metadata: { apiPlan: "free", apiRequestsUsed: 1 }
    });
    const pageTwoResponse = justTcgCardsResponseSchema.parse({
      data: [
        {
          id: "card-3",
          name: "Card Three",
          game: "Riftbound: League of Legends Trading Card Game",
          set: "ogn",
          set_name: "Origins",
          variants: [{ id: "card-3_nm", price: 3.33, lastUpdated: 1746576002 }]
        }
      ],
      meta: { total: 3, limit: 2, offset: 2, hasMore: false },
      _metadata: { apiPlan: "free", apiRequestsUsed: 2 }
    });

    const snapshot = createJustTcgCanonicalSnapshotFromPages([
      { metadata: pageOneMetadata, response: pageOneResponse },
      { metadata: pageTwoMetadata, response: pageTwoResponse }
    ]);

    expect(justTcgCanonicalSnapshotSchema.parse(snapshot)).toMatchObject({
      sourceContext: {
        runId: "justtcg-capture-2026-05-07-riftbound",
        pageCount: 2,
        rawRelativePayloadPaths: [
          "raw/justtcg/2026/05/07/page-1.json",
          "raw/justtcg/2026/05/07/page-2.json"
        ]
      },
      pagination: {
        total: 3,
        limit: 2,
        offset: 0,
        hasMore: false
      }
    });
    expect(snapshot.cards).toHaveLength(3);
  });
});
