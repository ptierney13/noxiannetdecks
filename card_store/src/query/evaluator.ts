import type { CardRecord } from "../data/schema.js";
import { normalizeVariantQuery } from "../data/variant.js";
import type { ParsedQuery, QueryNode, QueryOperator } from "./ast.js";
import { resolveField } from "./fields.js";
import { normalizeText } from "./normalize.js";
import { parseQuery } from "./parser.js";
import type { SearchUniqueMode } from "./unique.js";

export type SearchResult = {
  total: number;
  normalizedQuery: string;
  uniqueMode: SearchUniqueMode;
  diagnostics: ParsedQuery["diagnostics"];
  items: CardRecord[];
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wildcardRegex(pattern: string): RegExp {
  const expression = pattern.split("*").map(escapeRegExp).join(".*");
  return new RegExp(`^${expression}$`, "i");
}

function matchesText(candidate: string, expected: string, operator: QueryOperator): boolean {
  const normalizedCandidate = normalizeText(candidate);
  const normalizedExpected = normalizeText(expected);

  if (expected.includes("*")) {
    return wildcardRegex(normalizedExpected).test(normalizedCandidate);
  }

  if (operator === "eq") {
    return normalizedCandidate === normalizedExpected;
  }

  return normalizedCandidate.includes(normalizedExpected);
}

// Domain letter-code mappings
const DOMAIN_PRIMARY: Record<string, string> = {
  m: "Mind", f: "Fury", c: "Calm", b: "Body", h: "Chaos", o: "Order"
};
const DOMAIN_COLOR: Record<string, string> = {
  u: "Mind", r: "Fury", g: "Calm", o: "Body", p: "Chaos", y: "Order"
};

function parseDomainCodes(value: string): Set<string> | null {
  const chars = value.toLowerCase().split("");
  if (chars.length === 0 || chars.length > 8) return null;

  // Try all-primary first
  const allPrimary = chars.every((ch) => ch in DOMAIN_PRIMARY);
  if (allPrimary) {
    return new Set(chars.map((ch) => DOMAIN_PRIMARY[ch]));
  }

  // Fall back to color-based for all chars
  const allColor = chars.every((ch) => ch in DOMAIN_COLOR);
  if (allColor) {
    return new Set(chars.map((ch) => DOMAIN_COLOR[ch]));
  }

  return null;
}

function typeLineTerms(card: CardRecord): string[] {
  return [card.type.cardtype, card.type.supertype, ...card.type.tags]
    .filter((value): value is string => Boolean(value))
    .map(normalizeText);
}

function matchesTypeLine(card: CardRecord, expected: string, operator: QueryOperator): boolean {
  const candidates = [card.type.typeline, typeLineTerms(card).join(" ")].filter(Boolean);

  if (operator === "contains" && !expected.includes("*")) {
    const expectedTerms = normalizeText(expected)
      .split(/[^a-z0-9]+/)
      .filter(Boolean);

    if (expectedTerms.length > 1) {
      const terms = typeLineTerms(card);
      return expectedTerms.every((term) => terms.some((candidate) => candidate === term || candidate.includes(term)));
    }
  }

  return candidates.some((candidate) => matchesText(candidate, expected, operator));
}

function stringValuesForField(card: CardRecord, canonicalField: string): string[] {
  switch (canonicalField) {
    case "id":
      return [card.id];
    case "riftbound_id":
      return card.riftbound_id ? [card.riftbound_id] : [];
    case "tcgplayer_id":
      return card.tcgplayer_id ? [card.tcgplayer_id] : [];
    case "name":
      return [card.riot_name, card.clean_name ?? ""].filter(Boolean);
    case "clean_name":
      return card.clean_name ? [card.clean_name] : [];
    case "text":
      return [card.text.plain, card.text.rich, card.text.flavour ?? "", ...card.text.keywords].filter(Boolean);
    case "t":
      return [card.type.typeline];
    case "cardtype":
      return card.type.cardtype ? [card.type.cardtype] : [];
    case "supertype":
      return card.type.supertype ? [card.type.supertype] : [];
    case "tag":
      return card.type.tags;
    case "keyword":
      return card.text.keywords;
    case "domain":
      return card.attributes.domain;
    case "set":
      return [card.set.set_id, card.set.label];
    case "rarity":
      return card.rarity ? [card.rarity] : [];
    case "artist":
      return card.media.artist ? [card.media.artist] : [];
    case "number":
      return [card.collector_number ?? ""].filter(Boolean);
    case "layout":
      return [card.media.layout];
    case "language":
      return [card.language];
    case "finish":
      return card.finishes;
    default:
      return [];
  }
}

function numberValueForField(card: CardRecord, canonicalField: string): number | null {
  switch (canonicalField) {
    case "cost":
      return card.attributes.cost;
    case "energy":
      return card.attributes.energy;
    case "might":
      return card.attributes.might;
    case "power":
      return card.attributes.power;
    default:
      return null;
  }
}

function compareNumber(candidate: number, operator: QueryOperator, expected: number): boolean {
  switch (operator) {
    case "eq":
    case "contains":
      return candidate === expected;
    case "lt":
      return candidate < expected;
    case "lte":
      return candidate <= expected;
    case "gt":
      return candidate > expected;
    case "gte":
      return candidate >= expected;
  }
}

function matchesDomainWithLetterCodes(cardDomains: string[], domainSet: Set<string>): boolean {
  if (cardDomains.length === 0) return false;
  return cardDomains.every((d) => domainSet.has(d));
}

function matchesPowerLetterCodes(card: CardRecord, operator: QueryOperator, value: string): boolean | null {
  const codes = parseDomainCodes(value);
  if (!codes) return null;

  const count = value.length;
  const actualPower = card.attributes.power ?? 0;

  if (!compareNumber(actualPower, operator, count)) return false;
  if (actualPower === 0) return true;
  return matchesDomainWithLetterCodes(card.attributes.domain, codes);
}

function collectorNumberParts(value: string | null): { number: number; suffix: string; raw: string } {
  if (!value) return { number: Number.MAX_SAFE_INTEGER, suffix: "", raw: "" };

  const normalized = value.trim().toLowerCase();
  const match = normalized.match(/^(\d+)([a-z]*)$/);

  if (!match) {
    return { number: Number.MAX_SAFE_INTEGER, suffix: "", raw: normalized };
  }

  return {
    number: Number(match[1]),
    suffix: match[2],
    raw: normalized
  };
}

function compareCollectorNumbers(left: string | null, right: string | null): number {
  const a = collectorNumberParts(left);
  const b = collectorNumberParts(right);

  if (a.number !== b.number) return a.number - b.number;

  const suffixOrder = a.suffix.localeCompare(b.suffix);
  if (suffixOrder !== 0) return suffixOrder;

  return a.raw.localeCompare(b.raw);
}

function legalIdentityKey(card: CardRecord): string {
  if (card.riftbound_id) return `riftbound:${card.riftbound_id}`;
  if (card.clean_name) return `clean:${normalizeText(card.clean_name)}`;
  return `id:${card.id}`;
}

function normalizedImageKey(card: CardRecord): string {
  if (!card.media.image_url) return `missing:${card.id}`;

  try {
    const url = new URL(card.media.image_url);
    url.search = "";
    url.hash = "";
    return url.toString().toLowerCase();
  } catch {
    return card.media.image_url.trim().toLowerCase();
  }
}

function uniqueKeyForCard(card: CardRecord, uniqueMode: SearchUniqueMode): string {
  switch (uniqueMode) {
    case "legal":
      return legalIdentityKey(card);
    case "art":
      return `${legalIdentityKey(card)}::art:${normalizedImageKey(card)}`;
    case "id":
      return `id:${card.id}`;
    case "cn":
      return `${card.set.set_id.toLowerCase()}::cn:${normalizeText(card.collector_number ?? card.id)}`;
  }
}

function isPromoLike(card: CardRecord): boolean {
  const values = [card.rarity ?? "", card.set.set_id, card.set.label].join(" ").toLowerCase();
  return /\b(promo|promotional|showcase)\b/.test(values) || ["jdg", "opp", "pr"].includes(card.set.set_id.toLowerCase());
}

function representativeScore(card: CardRecord): number {
  const collector = collectorNumberParts(card.collector_number);
  let score = 0;

  if (card.variant.signed) score += 160;
  if (card.variant.overnumbered) score += 80;
  if (card.variant.alternate_art) score += 60;
  if (isPromoLike(card)) score += 40;
  if (!card.finishes.includes("nonfoil")) score += 10;
  if (!card.media.image_url) score += 5;
  if (collector.suffix) score += 1;

  return score;
}

function compareRepresentativeCards(left: CardRecord, right: CardRecord): number {
  const scoreOrder = representativeScore(left) - representativeScore(right);
  if (scoreOrder !== 0) return scoreOrder;

  const setOrder = left.set.set_id.localeCompare(right.set.set_id);
  if (setOrder !== 0) return setOrder;

  const collectorOrder = compareCollectorNumbers(left.collector_number, right.collector_number);
  if (collectorOrder !== 0) return collectorOrder;

  return left.id.localeCompare(right.id);
}

function rollupCards(cards: CardRecord[], uniqueMode: SearchUniqueMode): CardRecord[] {
  const representatives = new Map<string, CardRecord>();

  for (const card of cards) {
    const key = uniqueKeyForCard(card, uniqueMode);
    const existing = representatives.get(key);
    if (!existing || compareRepresentativeCards(card, existing) < 0) {
      representatives.set(key, card);
    }
  }

  return sortCards([...representatives.values()]);
}

function isMissingValue(card: CardRecord, canonicalField: string): boolean {
  const numberValue = numberValueForField(card, canonicalField);
  if (numberValue !== null) return false;

  const stringValues = stringValuesForField(card, canonicalField);
  return stringValues.length === 0 || stringValues.every((value) => normalizeText(value).length === 0);
}

function matchesPredicate(card: CardRecord, fieldName: string, operator: QueryOperator, value: string): boolean {
  const field = resolveField(fieldName);
  if (!field) return false;

  if (field.canonical === "is") {
    const expectedFlag = normalizeVariantQuery(value);
    if (!expectedFlag) return false;
    switch (expectedFlag) {
      case "normal":
        return !card.variant.alternate_art && !card.variant.overnumbered && !card.variant.signed;
      case "foil":
        return card.finishes.includes("foil");
      case "nonfoil":
        return card.finishes.includes("nonfoil");
      case "aa":
        return card.variant.alternate_art;
      case "on":
        return card.variant.overnumbered;
      case "signed":
        return card.variant.signed;
    }
  }

  if (normalizeText(value) === "none") {
    return isMissingValue(card, field.canonical);
  }

  if (field.kind === "number") {
    if (field.canonical === "power") {
      // Try letter-based domain codes first (e.g. p=ff, p<=f, p=oo)
      const letterResult = matchesPowerLetterCodes(card, operator, value);
      if (letterResult !== null) return letterResult;
      // Treat null power as 0 (no power cost)
      const expected = Number(value);
      if (Number.isNaN(expected)) return false;
      return compareNumber(card.attributes.power ?? 0, operator, expected);
    }

    const candidate = numberValueForField(card, field.canonical);
    if (candidate === null) return false;
    const expected = Number(value);
    if (Number.isNaN(expected)) return false;
    return compareNumber(candidate, operator, expected);
  }

  if (field.canonical === "t") {
    return matchesTypeLine(card, value, operator);
  }

  // Domain field: try letter-code subset matching before standard string matching
  if (field.canonical === "domain") {
    const domainSet = parseDomainCodes(value);
    if (domainSet) {
      return matchesDomainWithLetterCodes(card.attributes.domain, domainSet);
    }
  }

  // Keyword field: require whole-word (exact per-entry) match for contains operator
  if (field.canonical === "keyword" && operator === "contains" && !value.includes("*")) {
    const normalized = normalizeText(value);
    return card.text.keywords.some((kw) => normalizeText(kw) === normalized);
  }

  return stringValuesForField(card, field.canonical).some((candidate) => matchesText(candidate, value, operator));
}

function matchesTerm(card: CardRecord, value: string): boolean {
  const candidates = [
    card.riot_name,
    card.clean_name ?? "",
    card.text.plain,
    card.text.rich,
    ...card.text.keywords,
    ...card.type.tags
  ];

  return candidates.some((candidate) => matchesText(candidate, value, "contains"));
}

export function evaluateQueryNode(card: CardRecord, node: QueryNode): boolean {
  switch (node.type) {
    case "all":
      return true;
    case "term":
      return matchesTerm(card, node.value);
    case "predicate":
      return matchesPredicate(card, node.field, node.operator, node.value);
    case "not":
      return !evaluateQueryNode(card, node.child);
    case "and":
      return node.children.every((child) => evaluateQueryNode(card, child));
    case "or":
      return node.children.some((child) => evaluateQueryNode(card, child));
  }
}

export function sortCards(cards: CardRecord[]): CardRecord[] {
  return [...cards].sort((a, b) => {
    const setOrder = a.set.set_id.localeCompare(b.set.set_id);
    if (setOrder !== 0) return setOrder;
    return compareCollectorNumbers(a.collector_number, b.collector_number);
  });
}

export function searchCards(cards: CardRecord[], query: string): SearchResult {
  const parsed = parseQuery(query);
  const matched =
    parsed.diagnostics.length > 0
      ? []
      : sortCards(cards.filter((card) => evaluateQueryNode(card, parsed.ast)));
  const items = parsed.diagnostics.length > 0 ? [] : rollupCards(matched, parsed.uniqueMode);

  return {
    total: items.length,
    normalizedQuery: parsed.normalizedQuery,
    uniqueMode: parsed.uniqueMode,
    diagnostics: parsed.diagnostics,
    items
  };
}
