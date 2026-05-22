// display.ts — browser-safe helper for converting ExecutedQueryItem[] into
// human-readable display blocks (prefix / value / suffix).
//
// This module has no Node.js dependencies and is safe to import in frontend
// builds. It is the single source of truth for query display text, replacing
// the frontend's former queryBlocks.ts.

import type { ExecutedCondition, ExecutedQueryItem } from "./ast.js";
import { parseDomainQueryValue } from "./domain.js";

export type DisplayBlock = {
  kind: "condition";
  prefix: string;   // descriptive label, e.g. "Domain is" or "NOT Might"
  value: string;    // data-driven part, e.g. "Fury OR Calm" or "> 3"
  suffix?: string;  // trailing descriptor — only for bare-text searches
};

export type DisplayItem = DisplayBlock | "AND" | "OR";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1);
}

function fmtOp(op: string): string {
  if (op === ">=") return "≥";
  if (op === "<=") return "≤";
  return op;
}

function parseDomainDisplayNames(value: string): string[] {
  const domainSet = parseDomainQueryValue(value);
  // parseDomainQueryValue already resolves to canonical display names (e.g. "Fury", "Calm")
  if (domainSet && domainSet.size > 0) return [...domainSet];
  return [capitalize(value)];
}

// ---------------------------------------------------------------------------
// Block parts builder — canonical-field-aware label construction.
// Uses backend canonical names from fields.ts (e.g. "t" not "typeline").
// ---------------------------------------------------------------------------

type Condition = { op: string; value: string; negated: boolean };

function buildBlockParts(
  canonicalField: string | null,
  conditions: Condition[],
  intraConnector: "AND" | "OR"
): { prefix: string; value: string; suffix?: string } {
  const allNegated = conditions.every((c) => c.negated);
  const not = allNegated ? "NOT " : ""; // trailing space for concat
  const conn = ` ${intraConnector} `;

  // Bare-text search — value is the quoted text; suffix is the static descriptor
  if (canonicalField === null) {
    return {
      prefix: allNegated ? "NOT" : "",
      value: conditions.map((c) => `"${c.value}"`).join(conn),
      suffix: "anywhere on the card"
    };
  }

  switch (canonicalField) {
    case "name": {
      const opStr = conditions[0]!.op === "=" ? "is" : "contains";
      return {
        prefix: `${not}Name ${opStr}`,
        value: conditions.map((c) => `"${c.value}"`).join(conn)
      };
    }
    case "clean_name":
      return {
        prefix: `${not}Clean name contains`,
        value: conditions.map((c) => `"${c.value}"`).join(conn)
      };
    case "text":
      return {
        prefix: `${not}Rules text contains`,
        value: conditions.map((c) => `"${c.value}"`).join(conn)
      };
    case "t": // backend canonical for type line
      return {
        prefix: `${not}Type line includes`,
        value: conditions.map((c) => capitalize(c.value)).join(conn)
      };
    case "cardtype":
      return {
        prefix: `${not}Card type is`,
        value: conditions.map((c) => capitalize(c.value)).join(conn)
      };
    case "supertype":
      return {
        prefix: `${not}Supertype is`,
        value: conditions.map((c) => capitalize(c.value)).join(conn)
      };
    case "domain": {
      const op0 = conditions[0]!.op;
      const isSetCompare = op0 === ">" || op0 === ">=" || op0 === "<" || op0 === "<=";
      if (isSetCompare) {
        return {
          prefix: `${not}Domain`,
          value: conditions
            .map((c) => `${fmtOp(c.op)} ${parseDomainDisplayNames(c.value).join(" AND ")}`)
            .join(conn)
        };
      }
      return {
        prefix: `${not}Domain is`,
        value: conditions.flatMap((c) => parseDomainDisplayNames(c.value)).join(conn)
      };
    }
    case "tag":
      return {
        prefix: `${not}Tags contain`,
        value: conditions.map((c) => c.value).join(conn)
      };
    case "keyword":
      return {
        prefix: `${not}Keyword is`,
        value: conditions.map((c) => capitalize(c.value)).join(conn)
      };
    case "rarity":
      return {
        prefix: `${not}Rarity is`,
        value: conditions.map((c) => capitalize(c.value)).join(conn)
      };
    case "set":
      return {
        prefix: `${not}Set is`,
        value: conditions.map((c) => `"${c.value}"`).join(conn)
      };
    case "artist":
      return {
        prefix: `${not}Artist is`,
        value: conditions.map((c) => `"${c.value}"`).join(conn)
      };
    case "number":
      return {
        prefix: `${not}Collector #`,
        value: conditions.map((c) => `${fmtOp(c.op)} ${c.value}`).join(conn)
      };
    case "is":
      return {
        prefix: `${not}Card is`,
        value: conditions.map((c) => c.value).join(conn)
      };
    case "finish":
      return {
        prefix: `${not}Finish is`,
        value: conditions.map((c) => c.value).join(conn)
      };
    case "cost":
      return {
        prefix: `${not}Cost`,
        value: conditions.map((c) => `${fmtOp(c.op)} ${c.value}`).join(conn)
      };
    case "energy":
      return {
        prefix: `${not}Energy`,
        value: conditions.map((c) => `${fmtOp(c.op)} ${c.value}`).join(conn)
      };
    case "might":
      return {
        prefix: `${not}Might`,
        value: conditions.map((c) => `${fmtOp(c.op)} ${c.value}`).join(conn)
      };
    case "power":
      return {
        prefix: `${not}Power`,
        value: conditions.map((c) => `${fmtOp(c.op)} ${c.value}`).join(conn)
      };
    case "price":
      return {
        prefix: `${not}Price`,
        value: conditions.map((c) => `${fmtOp(c.op)} $${c.value}`).join(conn)
      };
    case "layout":
      return {
        prefix: `${not}Layout is`,
        value: conditions.map((c) => c.value).join(conn)
      };
    case "language":
      return {
        prefix: `${not}Language is`,
        value: conditions.map((c) => c.value).join(conn)
      };
    case "flavour":
      return {
        prefix: `${not}Flavor text contains`,
        value: conditions.map((c) => `"${c.value}"`).join(conn)
      };
    case "id":
      return {
        prefix: `${not}Card ID is`,
        value: conditions.map((c) => c.value).join(conn)
      };
    case "riftbound_id":
      return {
        prefix: `${not}Riftbound ID is`,
        value: conditions.map((c) => c.value).join(conn)
      };
    case "tcgplayer_id":
      return {
        prefix: `${not}TCGplayer ID is`,
        value: conditions.map((c) => c.value).join(conn)
      };
    default:
      return {
        prefix: `${not}${canonicalField}:`,
        value: conditions.map((c) => c.value).join(conn)
      };
  }
}

// ---------------------------------------------------------------------------
// Grouper — merges adjacent same-canonical-field executed conditions
// ---------------------------------------------------------------------------

type ConditionGroup = {
  canonicalField: string | null;
  conditions: Condition[];
  intraConnector: "AND" | "OR";
};

type GroupEntry = { group: ConditionGroup; followingConnector: "AND" | "OR" };

function buildDisplayGroups(items: (ExecutedCondition | "AND" | "OR")[]): GroupEntry[] {
  type Segment = { cond: ExecutedCondition; followingConnector: "AND" | "OR" };
  const segments: Segment[] = [];
  let nextConn: "AND" | "OR" = "AND";

  for (const item of items) {
    if (item === "AND" || item === "OR") {
      nextConn = item;
      continue;
    }
    if (segments.length > 0) {
      segments[segments.length - 1]!.followingConnector = nextConn;
    }
    segments.push({ cond: item, followingConnector: "AND" });
    nextConn = "AND";
  }

  const groups: GroupEntry[] = [];
  let i = 0;

  while (i < segments.length) {
    const seg = segments[i]!;
    const group: ConditionGroup = {
      canonicalField: seg.cond.canonicalField,
      conditions: [{ op: seg.cond.op, value: seg.cond.value, negated: seg.cond.negated }],
      intraConnector: "AND"
    };

    let j = i;
    while (j + 1 < segments.length) {
      const next = segments[j + 1]!;
      if (next.cond.canonicalField === group.canonicalField) {
        group.intraConnector = segments[j]!.followingConnector;
        group.conditions.push({ op: next.cond.op, value: next.cond.value, negated: next.cond.negated });
        j++;
      } else {
        break;
      }
    }

    groups.push({ group, followingConnector: segments[j]!.followingConnector });
    i = j + 1;
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export type ExecutedTokensToDisplayOptions = {
  /** When true, includes dropped conditions as DisplayBlocks (default: false). */
  includeDropped?: boolean;
};

/**
 * Converts a flat ExecutedQueryItem[] from the search API into DisplayItem[]
 * suitable for rendering as chip UI. By default only executed conditions are
 * shown; pass { includeDropped: true } to also render invalid/dropped ones.
 *
 * Adjacent conditions with the same canonical field are merged into one chip
 * (e.g. two consecutive domain conditions become "Domain is Fury OR Calm").
 */
export function executedTokensToDisplay(
  items: ExecutedQueryItem[],
  options: ExecutedTokensToDisplayOptions = {}
): DisplayItem[] {
  const { includeDropped = false } = options;

  // Build a filtered view with only the conditions we want to render,
  // stitching connectors correctly across dropped conditions.
  const filtered: (ExecutedCondition | "AND" | "OR")[] = [];
  let pendingConnector: "AND" | "OR" | null = null;
  let hasRendered = false;

  for (const item of items) {
    if (item === "AND" || item === "OR") {
      pendingConnector = item;
    } else if (item.state === "executed" || includeDropped) {
      if (hasRendered && pendingConnector) {
        filtered.push(pendingConnector);
      }
      filtered.push(item);
      hasRendered = true;
      pendingConnector = null;
    }
    // Dropped (when not included): skip but keep updating pendingConnector
    // so the connector before the next executed token is correct.
  }

  if (filtered.length === 0) return [];

  const groups = buildDisplayGroups(filtered);
  const result: DisplayItem[] = [];

  groups.forEach(({ group, followingConnector }, idx) => {
    const parts = buildBlockParts(group.canonicalField, group.conditions, group.intraConnector);
    result.push({ kind: "condition", ...parts });
    if (idx < groups.length - 1) {
      result.push(followingConnector);
    }
  });

  return result;
}
