import { describe, expect, it } from "vitest";
import { createApp } from "../src/api/app.js";
import { fixtureCards } from "./fixtures.js";

describe("card store API", () => {
  it("serves health and metadata", async () => {
    const app = await createApp({ cards: fixtureCards });

    const health = await app.inject({ method: "GET", url: "/api/health" });
    expect(health.statusCode).toBe(200);
    expect(health.json()).toMatchObject({ ok: true, cardCount: 7 });

    const metadata = await app.inject({ method: "GET", url: "/api/metadata" });
    expect(metadata.statusCode).toBe(200);
    expect(metadata.json().domains).toContain("Body");
    expect(metadata.json().types).toContain("Unit");
    expect(metadata.json().supertypes).toContain("Champion");
    expect(metadata.json().tags).toContain("Dragon");
    expect(metadata.json().keywords).toContain("Action");
    expect(metadata.json().variantFlags).toContain("foil");

    await app.close();
  });

  it("parses and searches cards", async () => {
    const app = await createApp({ cards: fixtureCards });

    const parse = await app.inject({
      method: "POST",
      url: "/api/query/parse",
      payload: { query: "n:jinx" }
    });
    expect(parse.statusCode).toBe(200);
    expect(parse.json().normalizedQuery).toBe("name:jinx");

    const search = await app.inject({ method: "GET", url: "/api/cards?q=name%3Avoid" });
    expect(search.statusCode).toBe(200);
    expect(search.json().items).toHaveLength(1);

    await app.close();
  });

  it("rejects malformed parse bodies", async () => {
    const app = await createApp({ cards: fixtureCards });

    const parse = await app.inject({
      method: "POST",
      url: "/api/query/parse",
      payload: { query: 123 }
    });

    expect(parse.statusCode).toBe(400);

    await app.close();
  });

  it("serves query features and card lookup", async () => {
    const app = await createApp({ cards: fixtureCards });

    const features = await app.inject({ method: "GET", url: "/api/query/features" });
    expect(features.statusCode).toBe(200);
    expect(features.json().fields.length).toBeGreaterThan(10);
    expect(features.json().syntax.length).toBeGreaterThan(5);
    expect(features.json().fields.some((field: { property: string }) => field.property === "Price")).toBe(true);

    const found = await app.inject({ method: "GET", url: "/api/cards/fixture-001" });
    expect(found.statusCode).toBe(200);
    expect(found.json().riot_name).toBe("Void Gate");

    const missing = await app.inject({ method: "GET", url: "/api/cards/nope" });
    expect(missing.statusCode).toBe(404);

    await app.close();
  });

  it("uses the published price index for price queries", async () => {
    const app = await createApp({
      cards: fixtureCards.map((card, index) => (index === 0 ? { ...card, tcgplayer_id: "1001" } : card)),
      loadSearchPriceIndex: async () => ({
        nearMintByTcgplayerId: new Map([["1001", 12.5]])
      })
    });

    const pricedSearch = await app.inject({ method: "GET", url: "/api/cards?q=price%3E%3D10" });
    expect(pricedSearch.statusCode).toBe(200);
    expect(pricedSearch.json().items.map((card: { riot_name: string }) => card.riot_name)).toEqual(["Void Gate"]);

    const missingSearch = await app.inject({ method: "GET", url: "/api/cards?q=price%3Anone" });
    expect(missingSearch.statusCode).toBe(200);
    expect(missingSearch.json().items.some((card: { riot_name: string }) => card.riot_name === "Void Gate")).toBe(false);

    await app.close();
  });

  it("serves the seeded metagame pilot bundle when available", async () => {
    const pilotBundle = {
      version: 1,
      generatedAt: "2026-04-24T12:00:00.000Z",
      sourceCoverageSummary: "Pilot summary",
      assumptions: ["Single event pilot."],
      overview: {
        kind: "metagame-overview",
        generatedAt: "2026-04-24T12:00:00.000Z",
        sourceCoverageSummary: "Pilot summary",
        filters: {
          metagameBuckets: ["set-1"],
          regionBuckets: ["na", "non-cn"],
          prestigeLevels: ["premier"]
        },
        totalDecks: 8,
        legends: []
      },
      eventIndex: {
        kind: "event-index",
        generatedAt: "2026-04-24T12:00:00.000Z",
        sourceCoverageSummary: "Pilot summary",
        filters: {
          metagameBuckets: ["set-1"],
          regionBuckets: ["na", "non-cn"],
          prestigeLevels: ["premier"]
        },
        events: []
      },
      eventDetails: [],
      legendDetails: [],
      deckDetails: []
    };

    const app = await createApp({
      cards: fixtureCards,
      loadMetagamePilotBundle: async () => pilotBundle
    });

    const response = await app.inject({ method: "GET", url: "/api/metagame/pilot" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(pilotBundle);

    await app.close();
  });

  it("serves pack generator options and validates generation requests", async () => {
    const app = await createApp({ cards: fixtureCards });

    const options = await app.inject({ method: "GET", url: "/api/pack-generator/options" });
    expect(options.statusCode).toBe(200);
    expect(options.json().sets.map((set: { id: string }) => set.id)).toEqual(["OGN", "SFD", "UNL"]);
    expect(options.json().seededPacks).toHaveLength(12);

    const malformed = await app.inject({
      method: "POST",
      url: "/api/pack-generator/pools",
      payload: { format: "custom", packs: ["OGN"] }
    });
    expect(malformed.statusCode).toBe(400);

    await app.close();
  });
});
