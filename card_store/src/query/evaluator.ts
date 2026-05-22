import type { CardRecord } from "../data/schema.js";
import type { SearchPriceIndex } from "../prices/published.js";
import { normalizeVariantQuery } from "../data/variant.js";
import type { ParsedQuery, QueryNode, QueryOperator } from "./ast.js";
import { compareDomainSet, parseDomainQueryValue, DOMAIN_PRIMARY } from "./domain.js";
import { resolveField } from "./fields.js";
import { normalizeText } from "./normalize.js";
import { parseQuery } from "./parser.js";
import type { SearchUniqueMode } from "./unique.js";

export type SearchResult = {
  total: number;
  normalizedQuery: string;
  uniqueMode: SearchUniqueMode;
  diagnostics: ParsedQuery["diagnostics"];
  executedTokens: ParsedQuery["executedTokens"];
  items: CardRecord[];
};

export type SearchEvaluationContext = {
  priceIndex?: SearchPriceIndex | null;
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
      return [card.text.plain, card.text.rich, ...card.text.keywords].filter(Boolean);
    case "flavour":
      return card.text.flavour ? [card.text.flavour] : [];
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

function numberValueForField(card: CardRecord, canonicalField: string, context: SearchEvaluationContext): number | null {
  switch (canonicalField) {
    case "cost":
      return card.attributes.energy;
    case "energy":
      return card.attributes.energy;
    case "might":
      return card.attributes.might;
    case "power":
      return card.attributes.power;
    case "price":
      return card.tcgplayer_id ? context.priceIndex?.nearMintByTcgplayerId.get(card.tcgplayer_id) ?? null : null;
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

type PowerSpec = { count: number; domains: Set<string> };

// Parse a power symbol string: bare letters ("ff", "bb") or braced hybrids ("{f/m}", "{f/m}{f/m}").
// Each character / each {x/y} token is one pip. All tokens must have the same domain composition.
function parsePowerSymbols(value: string): PowerSpec | null {
  const lower = value.toLowerCase();

  if (lower.includes("{")) {
    const tokenRe = /\{([a-z](?:\/[a-z])*)\}/g;
    const tokens = [...lower.matchAll(tokenRe)];
    if (tokens.length === 0) return null;
    if (tokens.map((t) => t[0]).join("") !== lower) return null; // unconsumed chars
    const firstSpec = tokens[0][1];
    if (!tokens.every((t) => t[1] === firstSpec)) return null; // mixed symbol types
    const domains = new Set<string>();
    for (const letter of firstSpec.split("/")) {
      const domain = DOMAIN_PRIMARY[letter];
      if (!domain) return null;
      domains.add(domain);
    }
    return { count: tokens.length, domains };
  }

  const codes = parseDomainQueryValue(lower);
  if (!codes) return null;
  return { count: lower.length, domains: codes };
}

// Card's domain must exactly match the spec's domain set (sorted).
function domainsMatchSpec(cardDomains: string[], spec: PowerSpec): boolean {
  const sorted = [...cardDomains].sort();
  const specSorted = [...spec.domains].sort();
  return sorted.length === specSorted.length && sorted.every((d, i) => d === specSorted[i]);
}

function matchesPowerSpec(card: CardRecord, operator: QueryOperator, spec: PowerSpec): boolean {
  const actualPower = card.attributes.power;
  if (actualPower === null) return false;
  if (!compareNumber(actualPower, operator, spec.count)) return false;
  if (actualPower === 0) return true; // count comparison passed with 0 pips — no domain to check
  return domainsMatchSpec(card.attributes.domain, spec);
}

// Parse a cost query value: optional leading integer + optional power symbol string.
// Examples: "3", "3f", "ff", "{f/m}", "3{f/m}"
type CostSpec = { energy: number | null; powerSpec: PowerSpec | null };

function parseCostSpec(value: string): CostSpec | null {
  const numMatch = value.match(/^(\d+)/);
  const energy = numMatch ? parseInt(numMatch[1], 10) : null;
  const rest = numMatch ? value.slice(numMatch[0].length) : value;
  if (rest === "") return { energy, powerSpec: null };
  const powerSpec = parsePowerSymbols(rest);
  if (!powerSpec) return null;
  return { energy, powerSpec };
}

function matchesCostField(card: CardRecord, operator: QueryOperator, value: string): boolean | null {
  const spec = parseCostSpec(value);
  if (!spec) return null;
  const { energy: queryEnergy, powerSpec } = spec;

  // Only power symbols — treat identically to power field
  if (queryEnergy === null && powerSpec !== null) {
    return matchesPowerSpec(card, operator, powerSpec);
  }

  // Only a number — treat identically to energy field
  if (queryEnergy !== null && powerSpec === null) {
    const cardEnergy = card.attributes.energy;
    if (cardEnergy === null) return false;
    return compareNumber(cardEnergy, operator, queryEnergy);
  }

  // Both energy and power components:
  // For < and <=: only the energy comparison applies (power symbols are ignored)
  // For =, >, >=: both conditions must hold
  if (queryEnergy !== null && powerSpec !== null) {
    const cardEnergy = card.attributes.energy;
    if (cardEnergy === null) return false;
    if (!compareNumber(cardEnergy, operator, queryEnergy)) return false;
    if (operator === "lt" || operator === "lte") return true;
    return matchesPowerSpec(card, operator, powerSpec);
  }

  return null;
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

function isMissingValue(card: CardRecord, canonicalField: string, context: SearchEvaluationContext): boolean {
  const numberValue = numberValueForField(card, canonicalField, context);
  if (numberValue !== null) return false;

  const stringValues = stringValuesForField(card, canonicalField);
  return stringValues.length === 0 || stringValues.every((value) => normalizeText(value).length === 0);
}

function matchesPredicate(
  card: CardRecord,
  fieldName: string,
  operator: QueryOperator,
  value: string,
  context: SearchEvaluationContext
): boolean {
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
    return isMissingValue(card, field.canonical, context);
  }

  if (field.kind === "number") {
    if (field.canonical === "cost") {
      const result = matchesCostField(card, operator, value);
      if (result !== null) return result;
      const cardEnergy = card.attributes.energy;
      if (cardEnergy === null) return false;
      const expected = Number(value);
      if (Number.isNaN(expected)) return false;
      return compareNumber(cardEnergy, operator, expected);
    }

    if (field.canonical === "power") {
      const spec = parsePowerSymbols(value);
      if (spec !== null) return matchesPowerSpec(card, operator, spec);
      const candidate = card.attributes.power;
      if (candidate === null) return false;
      const expected = Number(value);
      if (Number.isNaN(expected)) return false;
      return compareNumber(candidate, operator, expected);
    }

    const candidate = numberValueForField(card, field.canonical, context);
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
    const domainSet = parseDomainQueryValue(value);
    if (domainSet) {
      return compareDomainSet(card.attributes.domain, domainSet, operator);
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

export function evaluateQueryNode(card: CardRecord, node: QueryNode, context: SearchEvaluationContext = {}): boolean {
  switch (node.type) {
    case "all":
      return true;
    case "term":
      return matchesTerm(card, node.value);
    case "predicate":
      return matchesPredicate(card, node.field, node.operator, node.value, context);
    case "not":
      return !evaluateQueryNode(card, node.child, context);
    case "and":
      return node.children.every((child) => evaluateQueryNode(card, child, context));
    case "or":
      return node.children.some((child) => evaluateQueryNode(card, child, context));
  }
}

export function sortCards(cards: CardRecord[]): CardRecord[] {
  return [...cards].sort((a, b) => {
    const setOrder = a.set.set_id.localeCompare(b.set.set_id);
    if (setOrder !== 0) return setOrder;
    return compareCollectorNumbers(a.collector_number, b.collector_number);
  });
}

export function searchCardsFromParsed(
  cards: CardRecord[],
  parsed: ParsedQuery,
  context: SearchEvaluationContext = {}
): SearchResult {
  // Determine whether evaluation should run.
  //   • Empty query: always evaluate (returns all cards — intentional "browse" state).
  //   • Non-empty query with at least one executed token: evaluate the clean AST.
  //   • Non-empty query with zero executed tokens: structural/lex error, or every token
  //     was dropped by field validation — return empty so the user sees that nothing ran.
  const isEmptyQuery = parsed.source.trim().length === 0;
  const hasExecuted =
    isEmptyQuery ||
    parsed.executedTokens.some(
      (item): item is import("./ast.js").ExecutedCondition =>
        typeof item !== "string" && item.state === "executed"
    );

  const matched = hasExecuted
    ? sortCards(cards.filter((card) => evaluateQueryNode(card, parsed.ast, context)))
    : [];
  const items = hasExecuted ? rollupCards(matched, parsed.uniqueMode) : [];

  return {
    total: items.length,
    normalizedQuery: parsed.normalizedQuery,
    uniqueMode: parsed.uniqueMode,
    diagnostics: parsed.diagnostics,
    executedTokens: parsed.executedTokens,
    items
  };
}

export function searchCards(cards: CardRecord[], query: string, context: SearchEvaluationContext = {}): SearchResult {
  return searchCardsFromParsed(cards, parseQuery(query), context);
}
