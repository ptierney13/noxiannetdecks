import { describe, expect, it } from "vitest";
import { loadCardDatabase } from "../src/data/repository.js";
import { generateSealedPool, packGeneratorOptions, PackGenerationError } from "../src/pack_generator/index.js";
import type { GeneratedPack, GeneratedSealedPool } from "../src/pack_generator/index.js";

const primaryDomains = ["Fury", "Calm", "Mind", "Body", "Chaos", "Order"] as const;

function legalFinishKeys(pack: GeneratedPack): string[] {
  return pack.cards.map((entry) => `${entry.card.riftbound_id ?? entry.card.clean_name ?? entry.card.id}::${entry.finish}`);
}

function minimumPrimaryDomainCount(pool: GeneratedSealedPool): number {
  const counts = new Map<(typeof primaryDomains)[number], number>(primaryDomains.map((domain) => [domain, 0]));

  for (const pack of pool.packs) {
    for (const entry of pack.cards) {
      for (const domain of entry.card.attributes.domain) {
        if (!counts.has(domain as (typeof primaryDomains)[number])) continue;
        counts.set(domain as (typeof primaryDomains)[number], (counts.get(domain as (typeof primaryDomains)[number]) ?? 0) + 1);
      }
    }
  }

  return Math.min(...counts.values());
}

function retryRng(seed: number, zeroCalls: number): () => number {
  let count = 0;
  let state = seed >>> 0;

  return () => {
    count += 1;
    if (count <= zeroCalls) return 0;
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function seededRng(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

describe("pack generator", () => {
  it("lists Origins, Spiritforged, Unleashed, and only SFD/UNL seeded packs", () => {
    const options = packGeneratorOptions();

    expect(options.sets.map((set) => set.id)).toEqual(["OGN", "SFD", "UNL"]);
    expect(options.sets.find((set) => set.id === "OGN")?.supportsPreRift).toBe(false);
    expect(options.sets.find((set) => set.id === "SFD")?.supportsPreRift).toBe(true);
    expect(options.sets.find((set) => set.id === "UNL")?.supportsPreRift).toBe(true);
    expect(options.seededPacks.filter((pack) => pack.setId === "SFD")).toHaveLength(6);
    expect(options.seededPacks.filter((pack) => pack.setId === "UNL")).toHaveLength(6);
    expect(options.seededPacks.some((pack) => pack.setId === "OGN")).toBe(false);
    expect(options.seededPacks.find((pack) => pack.id === "unl-vi")?.cardCount).toBe(16);
  });

  it("generates six intended booster packs for standard sealed", async () => {
    const cards = await loadCardDatabase();
    const pool = generateSealedPool(cards, { format: "standard", setId: "SFD" }, { rng: seededRng(1001) });

    expect(pool.format).toBe("standard");
    expect(pool.setId).toBe("SFD");
    expect(pool.packs).toHaveLength(6);

    for (const pack of pool.packs) {
      expect(pack.kind).toBe("booster");
      expect(pack.setId).toBe("SFD");
      expect(pack.cards).toHaveLength(14);
      expect(pack.cards.filter((entry) => entry.slot === "common")).toHaveLength(7);
      expect(pack.cards.filter((entry) => entry.slot === "uncommon")).toHaveLength(3);
      expect(pack.cards.filter((entry) => entry.slot === "rare")).toHaveLength(2);
      expect(pack.cards.filter((entry) => entry.slot === "foil")).toHaveLength(1);
      expect(pack.cards.filter((entry) => entry.slot === "token-rune")).toHaveLength(1);
      expect(new Set(legalFinishKeys(pack)).size).toBe(pack.cards.length);
    }
  });

  it("generates custom six-pack recipes", async () => {
    const cards = await loadCardDatabase();
    const pool = generateSealedPool(
      cards,
      { format: "custom", packs: ["OGN", "OGN", "SFD", "SFD", "UNL", "UNL"] },
      { rng: seededRng(2002) }
    );

    expect(pool.format).toBe("custom");
    expect(pool.setId).toBeNull();
    expect(pool.packs.map((pack) => pack.setId)).toEqual(["OGN", "OGN", "SFD", "SFD", "UNL", "UNL"]);
    expect(pool.packs.every((pack) => pack.cards.length === 14)).toBe(true);
  });

  it("generates Pre-Rift pools with a selected seeded pack plus five boosters", async () => {
    const cards = await loadCardDatabase();
    const pool = generateSealedPool(cards, { format: "pre-rift", setId: "UNL", seededPackId: "unl-vi" }, { rng: seededRng(3003) });

    expect(pool.format).toBe("pre-rift");
    expect(pool.setId).toBe("UNL");
    expect(pool.seededPackId).toBe("unl-vi");
    expect(pool.packs).toHaveLength(6);
    expect(pool.packs[0]).toMatchObject({ kind: "seeded", setId: "UNL", seededPackId: "unl-vi" });
    expect(pool.packs[0].cards).toHaveLength(16);
    expect(pool.packs[0].cards.some((entry) => entry.card.riot_name === "Ashe - Focused")).toBe(true);
    expect(pool.packs.slice(1).every((pack) => pack.kind === "booster" && pack.cards.length === 14)).toBe(true);
  });

  it("does not add Ashe - Focused outside Unleashed Pre-Rift pools", async () => {
    const cards = await loadCardDatabase();
    const spiritforgedPool = generateSealedPool(cards, { format: "pre-rift", setId: "SFD", seededPackId: "sfd-ezreal" }, { rng: seededRng(4004) });
    const unleashedStandardPool = generateSealedPool(cards, { format: "standard", setId: "UNL" }, { rng: seededRng(5005) });

    expect(spiritforgedPool.packs[0].cards).toHaveLength(15);
    expect(spiritforgedPool.packs[0].cards.some((entry) => entry.card.riot_name === "Ashe - Focused")).toBe(false);
    expect(unleashedStandardPool.packs.flatMap((pack) => pack.cards).some((entry) => entry.card.riot_name === "Ashe - Focused")).toBe(false);
  });

  it("retries low-domain pools until every primary domain reaches ten cards", async () => {
    const cards = await loadCardDatabase();
    const pool = generateSealedPool(cards, { format: "standard", setId: "OGN" }, { rng: retryRng(1, 108), maxAttempts: 2 });

    expect(minimumPrimaryDomainCount(pool)).toBeGreaterThanOrEqual(10);
  });

  it("fails cleanly when the retry cap is exhausted by low-domain pools", async () => {
    const cards = await loadCardDatabase();

    expect(() => generateSealedPool(cards, { format: "standard", setId: "OGN" }, { rng: () => 0, maxAttempts: 1 })).toThrow(
      "Unable to generate a sealed pool where every primary domain has at least 10 cards after 1 attempts."
    );
  });

  it("does not allow Origins Pre-Rift generation", async () => {
    const cards = await loadCardDatabase();

    expect(() => generateSealedPool(cards, { format: "pre-rift", setId: "OGN" }, { rng: seededRng(6006) })).toThrow(PackGenerationError);
  });
});
