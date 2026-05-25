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
    shorthand: "o:<text>",
    searches: "text.plain and text.rich",
    example: 'o:"draw a card"'
  },
  {
    property: "Flavor text",
    query: "flavour:<text>",
    shorthand: "ft:<text> or flavor:<text>",
    searches: "text.flavour",
    example: 'ft:"brave"'
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
    query: "cardtype:<text>",
    shorthand: "ct:<text>",
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
    shorthand: "g:<text>",
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
    searches: "attributes.domain; supports domain names, color aliases like purple/yellow, and domain-set codes where parsed `:` queries use subset-or-equal semantics",
    example: "d:Body or d:purp or d<=mf"
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
    shorthand: "r:<text>",
    searches: "rarity",
    example: "r:Rare"
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
    shorthand: "c<number comparison>",
    searches: "attributes.cost",
    example: "c>=3"
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
    property: "Price",
    query: "price<number comparison>",
    shorthand: null,
    searches: "published Near Mint market price joined by tcgplayer_id; cards without a published Near Mint price match price:none",
    example: "price>=10"
  },
  {
    property: "Collector number",
    query: "number=<collector number>",
    shorthand: "cn=<collector number>",
    searches: "collector_number",
    example: "cn=200a"
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
    operation: "Domain set comparisons",
    examples: ["d:mf", "d=mf", "d<pu", "d>p", "d:purple"],
    behavior: "Recognized domain names, color aliases, and domain codes use set semantics uniformly: : and <= are subset-or-equal, = is exact, < is strict subset, > is strict superset."
  },
  {
    operation: "Exact match",
    examples: ['name="Jinx - Loose Cannon"', "set=OGN"],
    behavior: "Exact normalized match."
  },
  {
    operation: "Numeric comparisons",
    examples: ["c>=3", "e>=3", "m<5", "p=1"],
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
];
