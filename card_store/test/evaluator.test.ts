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
    attributes: { cost: "{1}", energy: 1, might: 1, power: 0, domain: ["Calm"] },
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
    attributes: { cost: "{1}", energy: 1, might: 1, power: 0, domain: ["Calm"] },
    type: { cardtype: "Unit", supertype: null, tags: ["Poro"], typeline: "Unit - Poro" },
    set: { set_id: "PR", label: "Riftbound Promotional Cards" },
    media: { image_url: "https://example.test/poro-on.png", artist: "Poro Artist", accessibility_text: null, layout: "portrait" }
  })
];

function uniqueIdsFor(query: string): string[] {
  return searchCards(uniqueFixtureCards, query).items.map((card) => card.id);
}

// Cards for cost-query semantic tests — each needs a unique riftbound_id to survive legal rollup
const costFixtureCards = [
  // energy=1, power=1, Fury — cost: {1}{F}
  makeCard({ id: "c1", riftbound_id: "c1", riot_name: "Fury 1/1", collector_number: "c1",
    attributes: { cost: "{1}{F}", energy: 1, might: null, power: 1, domain: ["Fury"] } }),
  // energy=2, power=1, Fury — cost: {2}{F}
  makeCard({ id: "c2", riftbound_id: "c2", riot_name: "Fury 2/1", collector_number: "c2",
    attributes: { cost: "{2}{F}", energy: 2, might: null, power: 1, domain: ["Fury"] } }),
  // energy=3, power=1, Fury — cost: {3}{F}
  makeCard({ id: "c3", riftbound_id: "c3", riot_name: "Fury 3/1", collector_number: "c3",
    attributes: { cost: "{3}{F}", energy: 3, might: null, power: 1, domain: ["Fury"] } }),
  // energy=3, power=2, Fury — cost: {3}{F}{F}
  makeCard({ id: "c4", riftbound_id: "c4", riot_name: "Fury 3/2", collector_number: "c4",
    attributes: { cost: "{3}{F}{F}", energy: 3, might: null, power: 2, domain: ["Fury"] } }),
  // energy=4, power=2, Fury — cost: {4}{F}{F}
  makeCard({ id: "c5", riftbound_id: "c5", riot_name: "Fury 4/2", collector_number: "c5",
    attributes: { cost: "{4}{F}{F}", energy: 4, might: null, power: 2, domain: ["Fury"] } }),
  // energy=2, power=0, Fury — cost: {2}
  makeCard({ id: "c6", riftbound_id: "c6", riot_name: "Fury 2/0", collector_number: "c6",
    attributes: { cost: "{2}", energy: 2, might: null, power: 0, domain: ["Fury"] } }),
  // energy=3, power=0, Fury — cost: {3}
  makeCard({ id: "c7", riftbound_id: "c7", riot_name: "Fury 3/0", collector_number: "c7",
    attributes: { cost: "{3}", energy: 3, might: null, power: 0, domain: ["Fury"] } }),
  // energy=1, power=1, Fury/Mind hybrid — cost: {1}{F/M}
  makeCard({ id: "c8", riftbound_id: "c8", riot_name: "FM Hybrid 1/1", collector_number: "c8",
    attributes: { cost: "{1}{F/M}", energy: 1, might: null, power: 1, domain: ["Fury", "Mind"] } }),
  // Costless
  makeCard({ id: "c9", riftbound_id: "c9", riot_name: "Costless", collector_number: "c9",
    attributes: { cost: null, energy: null, might: null, power: null, domain: ["Fury"] } }),
];

function costNamesFor(query: string): string[] {
  return searchCards(costFixtureCards, query).items.map((card) => card.riot_name);
}

const domainOperatorFixtureCards = [
  makeCard({
    id: "d1",
    riftbound_id: "d1",
    riot_name: "Chaos Solo",
    collector_number: "d1",
    attributes: { cost: "{1}{H}", energy: 1, might: null, power: 1, domain: ["Chaos"] }
  }),
  makeCard({
    id: "d2",
    riftbound_id: "d2",
    riot_name: "Mind Solo",
    collector_number: "d2",
    attributes: { cost: "{1}{M}", energy: 1, might: null, power: 1, domain: ["Mind"] }
  }),
  makeCard({
    id: "d3",
    riftbound_id: "d3",
    riot_name: "Chaos Mind Hybrid",
    collector_number: "d3",
    attributes: { cost: "{1}{H/M}", energy: 1, might: null, power: 1, domain: ["Chaos", "Mind"] }
  }),
  makeCard({
    id: "d4",
    riftbound_id: "d4",
    riot_name: "Chaos Body Hybrid",
    collector_number: "d4",
    attributes: { cost: "{1}{H/B}", energy: 1, might: null, power: 1, domain: ["Chaos", "Body"] }
  }),
  makeCard({
    id: "d5",
    riftbound_id: "d5",
    riot_name: "Order Solo",
    collector_number: "d5",
    attributes: { cost: "{1}{O}", energy: 1, might: null, power: 1, domain: ["Order"] }
  }),
  makeCard({
    id: "d6",
    riftbound_id: "d6",
    riot_name: "Chaos Fury Hybrid",
    collector_number: "d6",
    attributes: { cost: "{1}{H/F}", energy: 1, might: null, power: 1, domain: ["Chaos", "Fury"] }
  })
];

function domainNamesFor(query: string): string[] {
  return searchCards(domainOperatorFixtureCards, query).items.map((card) => card.riot_name);
}

const priceFixtureCards = [
  makeCard({
    id: "p1",
    riftbound_id: "p1",
    tcgplayer_id: "1001",
    riot_name: "Cheap Gate",
    clean_name: "Cheap Gate",
    collector_number: "p1"
  }),
  makeCard({
    id: "p2",
    riftbound_id: "p2",
    tcgplayer_id: "1002",
    riot_name: "Premium Gate",
    clean_name: "Premium Gate",
    collector_number: "p2"
  }),
  makeCard({
    id: "p3",
    riftbound_id: "p3",
    tcgplayer_id: null,
    riot_name: "Unpriced Gate",
    clean_name: "Unpriced Gate",
    collector_number: "p3"
  })
];

const priceSearchContext = {
  priceIndex: {
    nearMintByTcgplayerId: new Map([
      ["1001", 1.25],
      ["1002", 12.5]
    ])
  }
};

function priceNamesFor(query: string): string[] {
  return searchCards(priceFixtureCards, query, priceSearchContext).items.map((card) => card.riot_name);
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

describe("cost and power query semantics", () => {
  // c<3f = c<=2: only energy comparison for < operator
  it("c<3f returns same results as c<=2 (energy-only for < operator)", () => {
    const lt3f = costNamesFor("c<3f");
    const lte2 = costNamesFor("c<=2");
    expect(lt3f).toEqual(lte2);
    // Should include energy=1 and energy=2 cards, exclude energy=3+
    expect(lt3f).not.toContain("Fury 3/1");
    expect(lt3f).not.toContain("Fury 3/0");
    expect(lt3f).toContain("Fury 1/1");
    expect(lt3f).toContain("Fury 2/1");
    expect(lt3f).toContain("Fury 2/0");
    expect(lt3f).toContain("FM Hybrid 1/1");
    expect(lt3f).not.toContain("Costless");
  });

  // c>3f = (c>=ff and e>=4): both energy and power conditions for > operator
  it("c>3f returns cards with energy>3 AND power>1 Fury (same as c>=ff and e>=4)", () => {
    const gt3f = costNamesFor("c>3f");
    const combined = costNamesFor("c>=ff e>=4");
    expect(gt3f).toEqual(combined);
    expect(gt3f).toContain("Fury 4/2");   // energy=4, power=2, Fury ✓
    expect(gt3f).not.toContain("Fury 3/2"); // energy=3 not >3
    expect(gt3f).not.toContain("Fury 3/1"); // energy=3 not >3
    expect(gt3f).not.toContain("Fury 3/0"); // energy=3 not >3, power=0 not >1
  });

  // c=3f: exact energy=3 AND power=1 Fury
  it("c=3f returns cards with exactly energy=3, power=1, domain=Fury", () => {
    const eq3f = costNamesFor("c=3f");
    const combined = costNamesFor("p=1 e=3 d:f");
    expect(eq3f).toEqual(combined);
    expect(eq3f).toEqual(["Fury 3/1"]);
    expect(eq3f).not.toContain("Fury 3/2"); // power=2 not =1
    expect(eq3f).not.toContain("Fury 3/0"); // power=0 not =1
  });

  // c>={f/m}: hybrid power comparison, only power=symbol notation
  it("c>={f/m} returns cards with Fury/Mind hybrid power >= 1", () => {
    const result = costNamesFor("c>={f/m}");
    expect(result).toEqual(["FM Hybrid 1/1"]);
    expect(result).not.toContain("Fury 1/1"); // pure Fury, not hybrid
  });

  // Pure power symbol query: p=ff = power=2 AND domain=Fury
  it("p=ff matches cards with exactly 2 Fury pips", () => {
    expect(costNamesFor("p=ff")).toEqual(["Fury 3/2", "Fury 4/2"]);
  });

  // p=f matches power=1 Fury
  it("p=f matches cards with exactly 1 Fury pip", () => {
    expect(costNamesFor("p=f")).toEqual(["Fury 1/1", "Fury 2/1", "Fury 3/1"]);
  });

  // p=0 matches costed cards with power=0 (not costless)
  it("p=0 matches costed cards with zero power cost", () => {
    const result = costNamesFor("p=0");
    expect(result).toContain("Fury 2/0");
    expect(result).toContain("Fury 3/0");
    expect(result).not.toContain("Costless"); // null power, not 0
  });

  // p:none matches costless cards only
  it("p:none matches only costless cards", () => {
    expect(costNamesFor("p:none")).toEqual(["Costless"]);
  });

  // Hybrid domain doesn't match single-domain power query
  it("hybrid card does not match single-domain power query", () => {
    expect(costNamesFor("p=f")).not.toContain("FM Hybrid 1/1");
    expect(costNamesFor("p=m")).not.toContain("FM Hybrid 1/1");
  });
});

describe("domain set query semantics", () => {
  it("supports explicit color aliases and curated substrings", () => {
    expect(namesFor("d:purple")).toEqual(["Alternate Gate"]);
    expect(namesFor("d:purp")).toEqual(["Alternate Gate"]);
    expect(namesFor("d:yellow")).toEqual(["Overnumbered Gate"]);
    expect(namesFor("d:oran")).toEqual(["Void Gate", "Foil Gate"]);
  });

  it("treats parsed domain values as set comparisons", () => {
    expect(domainNamesFor("d=p")).toEqual(["Chaos Solo"]);
    expect(domainNamesFor("d>p")).toEqual(["Chaos Mind Hybrid", "Chaos Body Hybrid", "Chaos Fury Hybrid"]);
    expect(domainNamesFor("d<pu")).toEqual(["Chaos Solo", "Mind Solo"]);
    expect(domainNamesFor("d<=pu")).toEqual(["Chaos Solo", "Mind Solo", "Chaos Mind Hybrid"]);
    expect(domainNamesFor("d:pu")).toEqual(["Chaos Solo", "Mind Solo", "Chaos Mind Hybrid"]);
    expect(domainNamesFor("d:rp")).toEqual(["Chaos Solo", "Chaos Fury Hybrid"]);
    expect(domainNamesFor("d>=pu")).toEqual(["Chaos Mind Hybrid"]);
  });

  it("falls back to plain string matching for unrecognized domain text", () => {
    expect(domainNamesFor("d:cha")).toEqual(["Chaos Solo", "Chaos Mind Hybrid", "Chaos Body Hybrid", "Chaos Fury Hybrid"]);
    expect(searchCards(domainOperatorFixtureCards, "d>mystery").diagnostics.length).toBeGreaterThan(0);
  });
});

describe("price query semantics", () => {
  it("supports numeric comparisons against published near-mint prices", () => {
    expect(priceNamesFor("price>=10")).toEqual(["Premium Gate"]);
    expect(priceNamesFor("price<2")).toEqual(["Cheap Gate"]);
  });

  it("treats cards without a published near-mint price as missing", () => {
    expect(priceNamesFor("price:none")).toEqual(["Unpriced Gate"]);
    expect(priceNamesFor("price>=1")).not.toContain("Unpriced Gate");
  });
});
