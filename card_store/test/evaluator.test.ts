import { describe, expect, it } from "vitest";
import { searchCards } from "../src/query/evaluator.js";
import { fixtureCards, makeCard } from "./fixtures.js";

function namesFor(query: string): string[] {
  return searchCards(fixtureCards, query).items.map((card) => card.riot_name);
}

const uniqueFixtureCards = [
  makeCard({
    id: "rune-base",
    riftbound_id: "fury-rune",
    riot_name: "Fury Rune",
    clean_name: "Fury Rune",
    collector_number: "7",
    rarity: "Common",
    variant: { alternate_art: false, overnumbered: false, signed: false },
    finishes: ["nonfoil", "foil"],
    attributes: { cost: null, energy: null, might: null, power: null, domain: ["Fury"] },
    type: { cardtype: "Rune", supertype: null, tags: [], typeline: "Rune" },
    media: { image_url: "https://example.test/fury-rune.png", artist: "Rune Artist", accessibility_text: null, layout: "portrait" }
  }),
  makeCard({
    id: "rune-aa",
    riftbound_id: "fury-rune",
    riot_name: "Fury Rune (Alternate Art)",
    clean_name: "Fury Rune",
    collector_number: "7a",
    rarity: "Showcase",
    variant: { alternate_art: true, overnumbered: false, signed: false },
    finishes: ["foil"],
    attributes: { cost: null, energy: null, might: null, power: null, domain: ["Fury"] },
    type: { cardtype: "Rune", supertype: null, tags: [], typeline: "Rune" },
    media: { image_url: "https://example.test/fury-rune-alt.png", artist: "Rune Artist", accessibility_text: null, layout: "portrait" }
  }),
  makeCard({
    id: "rune-reprint",
    riftbound_id: "fury-rune",
    riot_name: "Fury Rune",
    clean_name: "Fury Rune",
    collector_number: "7b",
    rarity: "Promo",
    variant: { alternate_art: false, overnumbered: false, signed: false },
    finishes: ["foil"],
    attributes: { cost: null, energy: null, might: null, power: null, domain: ["Fury"] },
    type: { cardtype: "Rune", supertype: null, tags: [], typeline: "Rune" },
    media: { image_url: "https://example.test/fury-rune.png?accountingTag=RB", artist: "Rune Artist", accessibility_text: null, layout: "portrait" }
  }),
  makeCard({
    id: "vayne-base",
    riftbound_id: "vayne-hunter",
    riot_name: "Vayne - Hunter",
    clean_name: "Vayne Hunter",
    collector_number: "35",
    rarity: "Epic",
    variant: { alternate_art: false, overnumbered: false, signed: false },
    finishes: ["foil"],
    attributes: { cost: null, energy: null, might: null, power: null, domain: ["Body"] },
    type: { cardtype: "Unit", supertype: "Champion", tags: ["Vayne"], typeline: "Unit - Champion - Vayne" },
    media: { image_url: "https://example.test/vayne.png", artist: "Champion Artist", accessibility_text: null, layout: "portrait" }
  }),
  makeCard({
    id: "vayne-on",
    riftbound_id: "vayne-hunter",
    riot_name: "Vayne - Hunter (Overnumbered)",
    clean_name: "Vayne Hunter",
    collector_number: "223",
    rarity: "Showcase",
    variant: { alternate_art: false, overnumbered: true, signed: false },
    finishes: ["foil"],
    attributes: { cost: null, energy: null, might: null, power: null, domain: ["Body"] },
    type: { cardtype: "Unit", supertype: "Champion", tags: ["Vayne"], typeline: "Unit - Champion - Vayne" },
    media: { image_url: "https://example.test/vayne-on.png", artist: "Champion Artist", accessibility_text: null, layout: "portrait" }
  }),
  makeCard({
    id: "vayne-signed",
    riftbound_id: "vayne-hunter",
    riot_name: "Vayne - Hunter (Signature)",
    clean_name: "Vayne Hunter",
    collector_number: "223",
    rarity: "Showcase",
    variant: { alternate_art: false, overnumbered: true, signed: true },
    finishes: ["foil"],
    attributes: { cost: null, energy: null, might: null, power: null, domain: ["Body"] },
    type: { cardtype: "Unit", supertype: "Champion", tags: ["Vayne"], typeline: "Unit - Champion - Vayne" },
    media: { image_url: "https://example.test/vayne-signed.png", artist: "Champion Artist", accessibility_text: null, layout: "portrait" }
  }),
  makeCard({
    id: "poro-base",
    riftbound_id: "pouty-poro",
    riot_name: "Pouty Poro",
    clean_name: "Pouty Poro",
    collector_number: "13",
    rarity: "Common",
    variant: { alternate_art: false, overnumbered: false, signed: false },
    finishes: ["nonfoil", "foil"],
    attributes: { cost: 1, energy: 1, might: 1, power: null, domain: ["Calm"] },
    type: { cardtype: "Unit", supertype: null, tags: ["Poro"], typeline: "Unit - Poro" },
    media: { image_url: "https://example.test/poro.png", artist: "Poro Artist", accessibility_text: null, layout: "portrait" }
  }),
  makeCard({
    id: "poro-on",
    riftbound_id: "pouty-poro",
    riot_name: "Pouty Poro (Overnumbered)",
    clean_name: "Pouty Poro",
    collector_number: "220",
    rarity: "Promo",
    variant: { alternate_art: false, overnumbered: true, signed: false },
    finishes: ["foil"],
    attributes: { cost: 1, energy: 1, might: 1, power: null, domain: ["Calm"] },
    type: { cardtype: "Unit", supertype: null, tags: ["Poro"], typeline: "Unit - Poro" },
    set: { set_id: "PR", label: "Riftbound Promotional Cards" },
    media: { image_url: "https://example.test/poro-on.png", artist: "Poro Artist", accessibility_text: null, layout: "portrait" }
  })
];

function uniqueIdsFor(query: string): string[] {
  return searchCards(uniqueFixtureCards, query).items.map((card) => card.id);
}

describe("searchCards", () => {
  it("returns every card for an empty query", () => {
    expect(namesFor("")).toEqual([
      "Void Gate",
      "Jinx - Loose Cannon",
      "Shield Wall",
      "Alternate Gate",
      "Signed Gate",
      "Overnumbered Gate",
      "Foil Gate"
    ]);
  });

  it("matches free text and field contains", () => {
    expect(namesFor("dragon")).toEqual(["Void Gate"]);
    expect(namesFor("name:jinx")).toEqual(["Jinx - Loose Cannon"]);
  });

  it("does not use flavor text for free-text search", () => {
    expect(namesFor("down")).toEqual([]);
  });

  it("matches exact fields and aliases", () => {
    expect(namesFor("set=OGN rarity:rare")).toEqual(["Void Gate"]);
  });

  it("matches numeric comparisons and aliases", () => {
    expect(namesFor("e>=3 m<5 p=2")).toEqual(["Void Gate"]);
    expect(namesFor("cost>=3 m<5 p=2")).toEqual(["Void Gate"]);
  });

  it("honors boolean logic, grouping, and negation", () => {
    expect(namesFor("(domain:body or domain:fury) -rarity:common")).toEqual(["Void Gate", "Foil Gate"]);
    expect(namesFor("type:unit and domain:body")).toEqual(["Void Gate"]);
  });

  it("matches type-or-tag, tag-only, wildcards, and missing values", () => {
    expect(namesFor("t:unit")).toEqual(["Void Gate", "Jinx - Loose Cannon"]);
    expect(namesFor("t:\"Champion Unit\"")).toEqual(["Jinx - Loose Cannon"]);
    expect(namesFor("t:\"Unit Champion\"")).toEqual(["Jinx - Loose Cannon"]);
    expect(namesFor("t:Jinx")).toEqual(["Jinx - Loose Cannon"]);
    expect(namesFor("u:Champion")).toEqual(["Jinx - Loose Cannon"]);
    expect(namesFor("tag:Dragon")).toEqual(["Void Gate"]);
    expect(namesFor("name:jin*")).toEqual(["Jinx - Loose Cannon"]);
    expect(namesFor("keyword:Action")).toEqual(["Shield Wall"]);
    expect(namesFor("typeline:Champion")).toEqual(["Jinx - Loose Cannon"]);
    expect(namesFor("might:none artist:none")).toEqual(["Jinx - Loose Cannon"]);
  });

  it("matches collector suffixes and variant flag aliases", () => {
    expect(namesFor("number=3a")).toEqual(["Alternate Gate"]);
    expect(namesFor("cn:3a")).toEqual(["Alternate Gate"]);
    expect(namesFor("is:AA")).toEqual(["Alternate Gate"]);
    expect(namesFor("is:altart")).toEqual(["Alternate Gate"]);
    expect(namesFor("is:alternateart")).toEqual(["Alternate Gate"]);
    expect(namesFor("is:Signed")).toEqual(["Signed Gate"]);
    expect(namesFor("is:Signature")).toEqual(["Signed Gate"]);
    expect(namesFor("is:ON")).toEqual(["Signed Gate", "Overnumbered Gate"]);
    expect(namesFor("is:overnumbered")).toEqual(["Signed Gate", "Overnumbered Gate"]);
    expect(namesFor("is:foil")).toEqual([
      "Void Gate",
      "Jinx - Loose Cannon",
      "Shield Wall",
      "Alternate Gate",
      "Signed Gate",
      "Overnumbered Gate",
      "Foil Gate"
    ]);
    expect(namesFor("is:nonfoil")).toEqual(["Jinx - Loose Cannon", "Shield Wall"]);
    expect(namesFor("finish:nonfoil")).toEqual(["Jinx - Loose Cannon", "Shield Wall"]);
    expect(namesFor("variant:nonfoil")).toEqual(["Jinx - Loose Cannon", "Shield Wall"]);
  });

  it("returns diagnostics and no cards for invalid queries", () => {
    const result = searchCards(fixtureCards, "energy>>3");
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.items).toEqual([]);
  });

  it("defaults to one representative per legal card and prefers standard rune records", () => {
    const result = searchCards(uniqueFixtureCards, "type:rune");
    expect(result.uniqueMode).toBe("legal");
    expect(result.items.map((card) => card.id)).toEqual(["rune-base"]);
  });

  it("allows unique:id to preserve all matched records", () => {
    const result = searchCards(uniqueFixtureCards, "type:rune unique:id");
    expect(result.normalizedQuery).toBe("t:rune unique:id");
    expect(result.uniqueMode).toBe("id");
    expect(result.items.map((card) => card.id)).toEqual(["rune-base", "rune-aa", "rune-reprint"]);
  });

  it("allows unique:art to keep alternate art while collapsing duplicate images", () => {
    expect(uniqueIdsFor("type:rune unique:art")).toEqual(["rune-base", "rune-aa"]);
  });

  it("allows unique:cn to collapse signed and overnumbered cards with the same collector number", () => {
    expect(uniqueIdsFor("name:vayne unique:cn")).toEqual(["vayne-base", "vayne-on"]);
  });

  it("applies treatment filters before legal rollup", () => {
    expect(uniqueIdsFor("is:Signed")).toEqual(["vayne-signed"]);
    expect(uniqueIdsFor("is:AA")).toEqual(["rune-aa"]);
  });

  it("prefers non-promo records for the default legal rollup", () => {
    expect(uniqueIdsFor("name:poro")).toEqual(["poro-base"]);
  });
});
