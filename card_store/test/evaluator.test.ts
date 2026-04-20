import { describe, expect, it } from "vitest";
import { searchCards } from "../src/query/evaluator.js";
import { fixtureCards } from "./fixtures.js";

function namesFor(query: string): string[] {
  return searchCards(fixtureCards, query).items.map((card) => card.riot_name);
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

  it("matches exact fields and aliases", () => {
    expect(namesFor("set=OGN r:rare")).toEqual(["Void Gate"]);
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
    expect(namesFor("c:3a")).toEqual(["Alternate Gate"]);
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
});
