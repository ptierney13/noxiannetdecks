import { describe, expect, it } from "vitest";
import {
  collectorNumberFromRiftcodexSource,
  dedupeRiftcodexSourceCards
} from "../src/data/riftcodex-source.js";

type TestSourceCard = {
  id: string;
  name: string;
  riftbound_id: string | null;
  collector_number: string | number | null;
  classification: {
    type: string | null;
  };
  set: {
    set_id: string;
  };
};

function sourceCard(overrides: Partial<TestSourceCard>): TestSourceCard {
  return {
    id: "card",
    name: "Akali - Rogue Assassin",
    riftbound_id: null,
    collector_number: "139",
    classification: {
      type: "Legend"
    },
    set: {
      set_id: "VEN"
    },
    ...overrides
  };
}

describe("Riftcodex source helpers", () => {
  it("prefers riftbound_id when deriving collector numbers", () => {
    expect(
      collectorNumberFromRiftcodexSource({
        riftbound_id: "ven-007a*-123",
        collector_number: 999
      })
    ).toBe("7a");
  });

  it("removes subtitle-only Legend rows when a champion-prefixed row exists", () => {
    const cards = dedupeRiftcodexSourceCards([
      sourceCard({
        id: "subtitle-only",
        name: "Rogue Assassin"
      }),
      sourceCard({
        id: "champion-prefixed",
        name: "Akali - Rogue Assassin"
      })
    ]);

    expect(cards.map((card) => card.id)).toEqual(["champion-prefixed"]);
  });

  it("matches overnumbered Legend names even when only the champion-prefixed row carries the suffix", () => {
    const cards = dedupeRiftcodexSourceCards([
      sourceCard({
        id: "subtitle-only",
        name: "Heart of the Tempest",
        collector_number: "197"
      }),
      sourceCard({
        id: "champion-prefixed",
        name: "Yordle, Kennen - Heart of the Tempest (Overnumbered)",
        collector_number: "197"
      })
    ]);

    expect(cards.map((card) => card.id)).toEqual(["champion-prefixed"]);
  });

  it("keeps subtitle-only Legend rows when no champion-prefixed row exists", () => {
    const cards = dedupeRiftcodexSourceCards([
      sourceCard({
        id: "subtitle-only",
        name: "Defender of Tomorrow",
        collector_number: "194"
      })
    ]);

    expect(cards.map((card) => card.id)).toEqual(["subtitle-only"]);
  });

  it("does not collapse non-Legend cards", () => {
    const cards = dedupeRiftcodexSourceCards([
      sourceCard({
        id: "spell-subtitle",
        name: "Rogue Assassin",
        classification: {
          type: "Spell"
        }
      }),
      sourceCard({
        id: "spell-prefixed",
        name: "Akali - Rogue Assassin",
        classification: {
          type: "Spell"
        }
      })
    ]);

    expect(cards.map((card) => card.id)).toEqual(["spell-subtitle", "spell-prefixed"]);
  });
});
