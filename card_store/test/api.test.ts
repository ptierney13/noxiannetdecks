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

    const found = await app.inject({ method: "GET", url: "/api/cards/fixture-001" });
    expect(found.statusCode).toBe(200);
    expect(found.json().riot_name).toBe("Void Gate");

    const missing = await app.inject({ method: "GET", url: "/api/cards/nope" });
    expect(missing.statusCode).toBe(404);

    await app.close();
  });
});
