export type QueryFieldGuide = {
  property: string;
  query: string;
  shorthand: string | null;
  searches: string;
  example: string;
};

export type QuerySyntaxGuide = {
  operation: string;
  examples: string[];
  behavior: string;
};

export const queryFieldGuides: QueryFieldGuide[] = [
  {
    property: "Name",
    query: "name:<text>",
    shorthand: "n:<text>",
    searches: "riot_name and clean_name",
    example: "n:jinx"
  },
  {
    property: "Rules text",
    query: "text:<text>",
    shorthand: "r:<text> or o:<text>",
    searches: "text.plain and text.rich",
    example: 'r:"draw a card"'
  },
  {
    property: "Type line",
    query: "t:<text>",
    shorthand: "type:<text>",
    searches: "type.typeline, with multiword type terms matched in any order",
    example: 't:"Champion Unit"'
  },
  {
    property: "Card type",
    query: "ct:<text>",
    shorthand: null,
    searches: "type.cardtype",
    example: "ct:unit"
  },
  {
    property: "Supertype",
    query: "supertype:<text>",
    shorthand: "u:<text>",
    searches: "type.supertype",
    example: "u:Champion"
  },
  {
    property: "Tag",
    query: "tag:<text>",
    shorthand: null,
    searches: "type.tags",
    example: "tag:Dragon"
  },
  {
    property: "Keyword",
    query: "keyword:<text>",
    shorthand: "k:<text> or kw:<text>",
    searches: "text.keywords (whole-word match)",
    example: "k:Action"
  },
  {
    property: "Domain",
    query: "domain:<text>",
    shorthand: "d:<text>",
    searches: "attributes.domain; single letters or multi-letter codes select by domain (e.g. d:mf = Mind or Fury)",
    example: "d:Body or d:mf"
  },
  {
    property: "Set",
    query: "set:<text>",
    shorthand: "s:<text>",
    searches: "set.set_id and set.label",
    example: "s:OGN"
  },
  {
    property: "Rarity",
    query: "rarity:<text>",
    shorthand: null,
    searches: "rarity",
    example: "rarity:Rare"
  },
  {
    property: "Artist",
    query: "artist:<text>",
    shorthand: "a:<text>",
    searches: "media.artist",
    example: 'a:"Six More Vodka"'
  },
  {
    property: "Cost",
    query: "cost<number comparison>",
    shorthand: null,
    searches: "attributes.cost",
    example: "cost>=3"
  },
  {
    property: "Energy",
    query: "energy<number comparison>",
    shorthand: "e<number comparison>",
    searches: "attributes.energy",
    example: "e>=3"
  },
  {
    property: "Might",
    query: "might<number comparison>",
    shorthand: "m<number comparison>",
    searches: "attributes.might",
    example: "m>=5"
  },
  {
    property: "Power",
    query: "power<operator>",
    shorthand: "p<operator>",
    searches: "attributes.power; accepts numbers or domain letter codes (p=ff = two Fury, p<=f = at most one Fury)",
    example: "p=1 or p=ff or p<=f"
  },
  {
    property: "Collector number",
    query: "number=<collector number>",
    shorthand: "c=<collector number>",
    searches: "collector_number",
    example: "c=200a"
  },
  {
    property: "Finish or treatment flag",
    query: "is:<flag>",
    shorthand: null,
    searches: "finishes and variant treatment flags",
    example: "is:AA"
  },
  {
    property: "Finish",
    query: "finish:<text>",
    shorthand: "variant:<text>",
    searches: "finishes",
    example: "finish:foil"
  },
  {
    property: "Layout",
    query: "layout:<text>",
    shorthand: "orientation:<text>",
    searches: "media.layout",
    example: "layout:portrait"
  },
  {
    property: "IDs and codes",
    query: "id:, riftbound_id:, tcgplayer_id:",
    shorthand: null,
    searches: "source id, decklist id, and TCGplayer ids",
    example: "id:69bc5bc6d308c64675ca86b6"
  }
];

export const querySyntaxGuides: QuerySyntaxGuide[] = [
  {
    operation: "Contains match",
    examples: ["name:jinx", "tag:Dragon", "keyword:Action"],
    behavior: "Case-insensitive normalized contains match."
  },
  {
    operation: "Exact match",
    examples: ['name="Jinx - Loose Cannon"', "set=OGN"],
    behavior: "Exact normalized match."
  },
  {
    operation: "Numeric comparisons",
    examples: ["cost>=3", "e>=3", "m<5", "p=1"],
    behavior: "Supports =, <, <=, >, >= on numeric fields."
  },
  {
    operation: "Implicit AND",
    examples: ["t:unit d:body"],
    behavior: "Whitespace between terms means AND."
  },
  {
    operation: "Explicit OR",
    examples: ["d:body or d:fury"],
    behavior: "Matches either side."
  },
  {
    operation: "Negation",
    examples: ["not tag:Dragon", "-rarity:Common"],
    behavior: "Excludes matching cards."
  },
  {
    operation: "Grouping",
    examples: ["(d:body or d:fury) t:unit"],
    behavior: "Parentheses control precedence."
  },
  {
    operation: "Quoted values",
    examples: ['a:"Six More Vodka"'],
    behavior: "Use quotes for spaces or punctuation-heavy values."
  },
  {
    operation: "Wildcards",
    examples: ["name:jin*", "text:*dragon*"],
    behavior: "Supports * in string values."
  },
  {
    operation: "Missing values",
    examples: ["might:none", "artist:none"],
    behavior: "Matches null or empty field values."
  },
  {
    operation: "Result uniqueness",
    examples: ["unique:legal", "unique:id", "unique:art", "unique:cn"],
    behavior: "Defaults to one representative per legal card. Use id for every record, art for one per artwork, or cn for one per set collector number."
  },
  {
    operation: "Finish and treatment filters",
    examples: ["is:foil", "is:ON", "is:Signed", "is:altart"],
    behavior: "Matches finishes plus treatment flags: foil, nonfoil, normal, overnumbered, signed, and alternate art."
  },
  {
    operation: "Diagnostics",
    examples: ["energy>>3", "(type:unit"],
    behavior: "Malformed queries return parse errors instead of crashing."
  }
];
