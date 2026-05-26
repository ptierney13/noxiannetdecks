import type { QueryFieldGuide } from "../../types";
import type { LtsDetailItem } from "./GuideDetailCard";

export type GuideDetailField =
  | "name"
  | "cost"
  | "energy"
  | "power"
  | "might"
  | "typeline"
  | "cardtype"
  | "supertype"
  | "tag"
  | "keyword"
  | "text"
  | "domain"
  | "set"
  | "rarity"
  | "number"
  | "artist";

const GUIDE_DETAILS: Record<GuideDetailField, LtsDetailItem> = {
  name: {
    label: "Name",
    description: "Matches cards whose name contains this text.",
    query: "name:blitzcrank",
    shorthand: "n:blitzcrank",
    examples: ["name:jinx", 'n:"loose cannon"', "name:blitz*"],
  },
  cost: {
    label: "Cost",
    description: "Matches by exact play cost. Use >=, <=, >, < for ranges.",
    query: "cost:5",
    shorthand: "c:5",
    examples: ["cost:5", "cost>=3", "cost<=2"],
  },
  energy: {
    label: "Energy",
    description: "Matches by energy value. Supports numeric comparisons.",
    query: "energy:5",
    shorthand: "e:5",
    examples: ["e:5", "e>=3", "e<=2"],
  },
  power: {
    label: "Power",
    description: "Matches by power value. Supports numeric comparisons.",
    query: "power:1",
    shorthand: "p:1",
    examples: ["p:1", "p>=3", "p=0"],
  },
  might: {
    label: "Might",
    description: "Matches by might value. Supports numeric comparisons.",
    query: "might:5",
    shorthand: "m:5",
    examples: ["m:5", "m>=4", "m:none"],
  },
  typeline: {
    label: "Type line",
    description: "Matches any word in the full type line in any order.",
    query: "t:champion",
    examples: ["t:champion", 't:"champion unit"', "t:mech"],
  },
  cardtype: {
    label: "Card type",
    description: "Matches the card type, such as Unit, Spell, Gear, Rune, Battlefield, or Legend.",
    query: "cardtype:unit",
    shorthand: "ct:unit",
    examples: ["ct:unit", "ct:spell", "ct:battlefield"],
  },
  supertype: {
    label: "Supertype",
    description: "Matches the supertype segment, such as Champion or Signature.",
    query: "supertype:champion",
    shorthand: "u:champion",
    examples: ["u:champion", "u:signature"],
  },
  tag: {
    label: "Tag",
    description: "Matches a specific type tag.",
    query: "tag:blitzcrank",
    shorthand: "g:blitzcrank",
    examples: ["tag:blitzcrank", "tag:zaun", "tag:dragon"],
  },
  keyword: {
    label: "Keyword",
    description: "Matches cards that have this rules keyword.",
    query: "keyword:tank",
    shorthand: "k:tank",
    examples: ["k:tank", "k:action", "kw:overwhelm"],
  },
  text: {
    label: "Rules text",
    description: "Searches within the card's rules text.",
    query: "text:move",
    shorthand: "o:move",
    examples: ["o:move", 'o:"draw a card"', "o:battlefield"],
  },
  domain: {
    label: "Domain",
    description: "Matches cards by domain. Domain groups can be combined with or and parentheses.",
    query: "(d:body or d:fury) t:unit",
    shorthand: "d:body",
    examples: ["d:fury", "d=body", "(d:body or d:fury) t:unit"],
  },
  set: {
    label: "Set",
    description: "Matches by set code or set name.",
    query: "set:OGN",
    shorthand: "s:origins",
    examples: ["s:OGN", "s:unleashed", "s:UNL"],
  },
  rarity: {
    label: "Rarity",
    description: "Filters by rarity: Common, Uncommon, Rare, Epic, Showcase, or Promo.",
    query: "rarity:rare",
    shorthand: "r:rare",
    examples: ["rarity:rare", "rarity:epic", "rarity:common"],
  },
  number: {
    label: "Collector #",
    description: "Matches by collector number.",
    query: "number:67",
    shorthand: "cn:67",
    examples: ["cn:67", "number:001", "cn:298"],
  },
  artist: {
    label: "Artist",
    description: "Searches by illustrator name.",
    query: 'artist:"league splash team"',
    shorthand: 'a:"league splash"',
    examples: ['a:"league splash"', "a:sixmorevodka"],
  },
};

const PROPERTY_TO_FIELD: Record<string, GuideDetailField> = {
  name: "name",
  cost: "cost",
  energy: "energy",
  power: "power",
  might: "might",
  "type line": "typeline",
  typeline: "typeline",
  "card type": "cardtype",
  cardtype: "cardtype",
  supertype: "supertype",
  tag: "tag",
  keyword: "keyword",
  "rules text": "text",
  text: "text",
  domain: "domain",
  set: "set",
  rarity: "rarity",
  "collector number": "number",
  "collector #": "number",
  number: "number",
  artist: "artist",
};

export function guideDetailFor(field: GuideDetailField, overrides: Partial<LtsDetailItem> = {}): LtsDetailItem {
  return {
    ...GUIDE_DETAILS[field],
    ...overrides,
    examples: overrides.examples ?? GUIDE_DETAILS[field].examples,
  };
}

export function guideDetailForQueryField(field: QueryFieldGuide): LtsDetailItem {
  const sharedField = PROPERTY_TO_FIELD[field.property.toLowerCase()];

  if (sharedField) {
    return guideDetailFor(sharedField);
  }

  return {
    label: field.property,
    description: field.searches,
    query: field.query,
    shorthand: field.shorthand ?? undefined,
    examples: [field.example],
  };
}
