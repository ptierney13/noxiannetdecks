import type { CardRecord } from "../data/schema.js";
import { normalizeVariantQuery } from "../data/variant.js";
import type { ParsedQuery, QueryNode, QueryOperator } from "./ast.js";
import { resolveField } from "./fields.js";
import { normalizeText } from "./normalize.js";
import { parseQuery } from "./parser.js";

export type SearchResult = {
  total: number;
  normalizedQuery: string;
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
    case "type":
    case "cardtype":
      return card.type.cardtype ? [card.type.cardtype] : [];
    case "supertype":
      return card.type.supertype ? [card.type.supertype] : [];
    case "typeline":
      return card.type.typeline ? [card.type.typeline] : [];
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
    const candidate = numberValueForField(card, field.canonical);
    if (candidate === null) return false;

    const expected = Number(value);
    if (Number.isNaN(expected)) return false;
    return compareNumber(candidate, operator, expected);
  }

  if (field.canonical === "t") {
    return matchesTypeLine(card, value, operator);
  }

  return stringValuesForField(card, field.canonical).some((candidate) => matchesText(candidate, value, operator));
}

function matchesTerm(card: CardRecord, value: string): boolean {
  const candidates = [
    card.riot_name,
    card.clean_name ?? "",
    card.text.plain,
    card.text.rich,
    card.text.flavour ?? "",
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
  const items =
    parsed.diagnostics.length > 0
      ? []
      : sortCards(cards.filter((card) => evaluateQueryNode(card, parsed.ast)));

  return {
    total: items.length,
    normalizedQuery: parsed.normalizedQuery,
    diagnostics: parsed.diagnostics,
    items
  };
}
