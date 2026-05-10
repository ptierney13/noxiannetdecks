import { describe, expect, it } from "vitest";
import { parseQuery } from "../src/query/parser.js";

describe("parseQuery", () => {
  it.each([
    ["free text", "dragon"],
    ["quoted free text", "\"Void Gate\""],
    ["field contains", "name:jinx"],
    ["quoted field contains", "text:\"draw a card\""],
    ["exact field match", "name=\"Void Gate\""],
    ["exact set match", "set=OGN"],
    ["field aliases", "n:jinx o:draw t:unit u:champion d:body s:OGN r:rare a:artist"],
    ["type-line shorthand", "t:\"Champion Unit\""],
    ["tag field", "tag:dragon"],
    ["numeric comparisons", "energy>=3 might<5 power=2"],
    ["numeric aliases", "e>=3 m>4 p=1 c=12"],
    ["explicit and", "type:unit and domain:body"],
    ["implicit and", "type:unit domain:body"],
    ["or", "domain:body or domain:fury"],
    ["domain set comparisons", "domain>p domain<=pu d:purple d:purp d=yellow"],
    ["not", "not type:gear"],
    ["minus negation", "-rarity:common"],
    ["grouping", "(domain:body or domain:fury) type:unit"],
    ["wildcards", "name:jin* text:*dragon*"],
    ["missing values", "might:none artist:none"],
    ["variant flags", "is:foil is:nonfoil is:ON is:overnumbered is:Signed is:Signature is:AA is:altart is:alternateart"],
    ["finish field", "finish:foil variant:nonfoil"],
    ["unique option", "unique:legal"],
    ["keywords and cost", "keyword:Action k:Action cost>=3"],
    ["collector suffix", "number=200a cn:200a"]
  ])("parses %s", (_label, query) => {
    expect(parseQuery(query).diagnostics).toEqual([]);
  });

  it("normalizes aliases to canonical field names", () => {
    expect(parseQuery("n:jinx u:champion e>=3 variant:foil").normalizedQuery).toBe("name:jinx supertype:champion energy>=3 finish:foil");
  });

  it("normalizes unique option aliases", () => {
    const parsed = parseQuery("n:jinx unique:prints");
    expect(parsed.normalizedQuery).toBe("name:jinx unique:id");
    expect(parsed.uniqueMode).toBe("id");
    expect(parseQuery("unique:*").uniqueMode).toBe("id");
    expect(parseQuery("unique:\"collector number\"").normalizedQuery).toBe("unique:cn");
  });

  it.each([
    "energy>>3",
    "energy=abc",
    "(type:unit",
    "unknown:thing",
    "name>jinx",
    "domain>mystery",
    "is:etched",
    "unique:etched",
    "unique>id",
    "-unique:id",
    "unique:legal or domain:body"
  ])("returns diagnostics for %s", (query) => {
    expect(parseQuery(query).diagnostics.length).toBeGreaterThan(0);
  });
});
