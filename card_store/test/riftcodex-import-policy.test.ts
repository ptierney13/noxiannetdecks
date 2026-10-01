import { describe, expect, it } from "vitest";
import {
  assertKnownRiftcodexSetFinishPolicy,
  finishesForImportedCard,
  summarizeImportedSets
} from "../src/data/riftcodex-import-policy.js";
import type { CardRecord } from "../src/data/schema.js";

const normalVariant: CardRecord["variant"] = {
  alternate_art: false,
  overnumbered: false,
  signed: false,
  metal: false,
  starter: false,
  gg_ez: false,
  launch_exclusive: false,
  ultimate: false
};

function policyCard(
  overrides: Partial<Pick<CardRecord, "riot_name" | "collector_number" | "set" | "rarity" | "variant">>
): Pick<CardRecord, "riot_name" | "collector_number" | "set" | "rarity" | "variant"> {
  return {
    riot_name: "Example Card",
    collector_number: "1",
    rarity: "Common",
    variant: normalVariant,
    set: {
      set_id: "VEN",
      label: "Vendetta"
    },
    ...overrides
  };
}

describe("Riftcodex import policy", () => {
  it("allows Vendetta base commons and uncommons to import with both finishes", () => {
    expect(finishesForImportedCard(policyCard({ rarity: "Common" }))).toEqual(["nonfoil", "foil"]);
    expect(finishesForImportedCard(policyCard({ rarity: "Uncommon" }))).toEqual(["nonfoil", "foil"]);
  });

  it("keeps rare cards and special treatments foil-only", () => {
    expect(finishesForImportedCard(policyCard({ rarity: "Rare" }))).toEqual(["foil"]);
    expect(
      finishesForImportedCard(
        policyCard({
          rarity: "Common",
          variant: {
            ...normalVariant,
            alternate_art: true
          }
        })
      )
    ).toEqual(["foil"]);
  });

  it("fails clearly when a new likely-booster set needs an explicit policy decision", () => {
    expect(() =>
      assertKnownRiftcodexSetFinishPolicy([
        policyCard({
          riot_name: "Future Common",
          collector_number: "7",
          set: {
            set_id: "NEW",
            label: "New Set"
          }
        })
      ])
    ).toThrow(/NEW \(New Set\).*Update DUAL_FINISH_SET_IDS/);
  });

  it("summarizes imported set counts in set-code order", () => {
    expect(
      summarizeImportedSets([
        policyCard({ set: { set_id: "VEN", label: "Vendetta" } }),
        policyCard({ set: { set_id: "OGN", label: "Origins" } }),
        policyCard({ set: { set_id: "VEN", label: "Vendetta" } })
      ])
    ).toEqual([
      { setId: "OGN", label: "Origins", count: 1 },
      { setId: "VEN", label: "Vendetta", count: 2 }
    ]);
  });
});
