import { describe, expect, it } from "vitest";
import { deriveDecklistCardId, deriveLegalCleanName } from "../src/data/decklist-id.js";
import { createCardRepository, loadCardDatabase, type CardSource } from "../src/data/repository.js";
import { fixtureCards } from "./fixtures.js";

describe("canonical card data", () => {
  it("validates every card and has unique source IDs", async () => {
    const database = await loadCardDatabase();
    const ids = new Set(database.map((card) => card.id));

    expect(ids.size).toBe(database.length);
    expect(database.length).toBeGreaterThan(0);
  });

  it("collapses foil availability into finishes without generated foil IDs", async () => {
    const database = await loadCardDatabase();

    expect(database.some((card) => /[:-]foil$/i.test(card.id))).toBe(false);

    for (const card of database) {
      expect(card.finishes.length).toBeGreaterThan(0);
      expect(new Set(card.finishes).size).toBe(card.finishes.length);
      expect(card.finishes.every((finish) => finish === "nonfoil" || finish === "foil")).toBe(true);
      expect(card.variant.signed ? card.variant.overnumbered : true).toBe(true);
    }
  });

  it("derives decklist IDs from clean names", async () => {
    const database = await loadCardDatabase();
    const stackedDeckIds = new Set(database.filter((card) => card.riot_name === "Stacked Deck").map((card) => card.riftbound_id));
    const ireliaIds = new Set(database.filter((card) => card.clean_name === "Irelia Fervent").map((card) => card.riftbound_id));
    const idsByCleanName = new Map<string | null, Set<string | null>>();
    const cleanNamesById = new Map<string | null, Set<string | null>>();

    expect(stackedDeckIds.size).toBe(1);
    expect(ireliaIds.size).toBe(1);

    for (const card of database) {
      expect(card.clean_name).toBe(deriveLegalCleanName(card.clean_name, card.riot_name));
      expect(card.riftbound_id).toBe(deriveDecklistCardId(card.clean_name, card.riot_name));

      const ids = idsByCleanName.get(card.clean_name) ?? new Set<string | null>();
      ids.add(card.riftbound_id);
      idsByCleanName.set(card.clean_name, ids);

      const cleanNames = cleanNamesById.get(card.riftbound_id) ?? new Set<string | null>();
      cleanNames.add(card.clean_name);
      cleanNamesById.set(card.riftbound_id, cleanNames);
    }

    for (const ids of idsByCleanName.values()) {
      expect(ids.size).toBe(1);
    }

    for (const cleanNames of cleanNamesById.values()) {
      expect(cleanNames.size).toBe(1);
    }
  });

  it("loads cards through an injectable cached source", async () => {
    let calls = 0;
    const source: CardSource = {
      async load() {
        calls += 1;
        return fixtureCards;
      }
    };
    const repository = createCardRepository(source);

    await expect(repository.loadCards()).resolves.toHaveLength(fixtureCards.length);
    await expect(repository.loadCards()).resolves.toHaveLength(fixtureCards.length);

    expect(calls).toBe(1);
  });
});
