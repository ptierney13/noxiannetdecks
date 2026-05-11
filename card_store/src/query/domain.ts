import { normalizeText } from "./normalize.js";
import type { QueryOperator } from "./ast.js";

export const DOMAIN_PRIMARY: Record<string, string> = {
  m: "Mind",
  f: "Fury",
  c: "Calm",
  b: "Body",
  h: "Chaos",
  o: "Order"
};

export const DOMAIN_COLOR: Record<string, string> = {
  u: "Mind",
  r: "Fury",
  g: "Calm",
  o: "Body",
  p: "Chaos",
  y: "Order"
};

const DOMAIN_NAME_ALIASES = new Map<string, string>([
  ["mind", "Mind"],
  ["blue", "Mind"],
  ["blu", "Mind"],
  ["fury", "Fury"],
  ["red", "Fury"],
  ["calm", "Calm"],
  ["green", "Calm"],
  ["gree", "Calm"],
  ["body", "Body"],
  ["orange", "Body"],
  ["oran", "Body"],
  ["chaos", "Chaos"],
  ["purple", "Chaos"],
  ["purp", "Chaos"],
  ["order", "Order"],
  ["yellow", "Order"],
  ["yell", "Order"]
]);

function uniqueDomains(values: Iterable<string>): Set<string> {
  return new Set(values);
}

export function parseDomainQueryValue(value: string): Set<string> | null {
  const normalized = normalizeText(value);
  const namedDomain = DOMAIN_NAME_ALIASES.get(normalized);
  if (namedDomain) {
    return new Set([namedDomain]);
  }

  const chars = normalized.split("");
  if (chars.length === 0 || chars.length > 8) return null;

  const allPrimary = chars.every((ch) => ch in DOMAIN_PRIMARY);
  if (allPrimary) {
    return uniqueDomains(chars.map((ch) => DOMAIN_PRIMARY[ch]));
  }

  const allColor = chars.every((ch) => ch in DOMAIN_COLOR);
  if (allColor) {
    return uniqueDomains(chars.map((ch) => DOMAIN_COLOR[ch]));
  }

  return null;
}

function isSubset(left: Set<string>, right: Set<string>): boolean {
  return [...left].every((value) => right.has(value));
}

export function compareDomainSet(cardDomains: string[], queryDomains: Set<string>, operator: QueryOperator): boolean {
  if (cardDomains.length === 0) return false;

  const candidate = uniqueDomains(cardDomains);
  const candidateSubset = isSubset(candidate, queryDomains);
  const querySubset = isSubset(queryDomains, candidate);

  switch (operator) {
    case "contains":
    case "lte":
      return candidateSubset;
    case "lt":
      return candidateSubset && candidate.size < queryDomains.size;
    case "eq":
      return candidateSubset && querySubset;
    case "gte":
      return querySubset;
    case "gt":
      return querySubset && candidate.size > queryDomains.size;
  }
}
