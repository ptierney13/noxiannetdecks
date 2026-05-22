import type { ReactNode } from "react";
import type { CardRecord } from "../types";

// --- Game symbol constants ---

/** Maps card-store symbol shortcode keys to inline token syntax used in card text. */
export const SYMBOL_MAP: Record<string, string> = {
  rb_might: "{T}",
  rb_exhaust: "{E}",
  rb_rune_fury: "{F}",
  rb_rune_calm: "{C}",
  rb_rune_mind: "{M}",
  rb_rune_body: "{B}",
  rb_rune_chaos: "{H}",
  rb_rune_order: "{O}",
  rb_rune_rainbow: "{P}",
};

/** Canonical set of Riftbound region names. Used for typeline tag classification. */
export const RIFTBOUND_REGIONS = new Set([
  "Noxus", "Freljord", "Ionia", "Demacia", "Piltover", "Zaun",
  "Bilgewater", "Shadow Isles", "Shurima", "Mount Targon",
  "Bandle City", "The Void", "Targon",
]);

// --- Types ---

export type InlineSymbolVariant = "white" | "black";
export type InlineSymbolSize = "text" | "stat" | "chip";

/** The canonical finish values for a card printing. */
export type CardFinish = "foil" | "nonfoil";

// --- Symbol rendering ---

/**
 * Returns the image path for a given inline symbol token, or null if the
 * token is unrecognised. Used by renderTokenizedText and formatCostText.
 */
export function inlineSymbolSrc(token: string, variant: InlineSymbolVariant = "white"): string | null {
  switch (token) {
    case "T":
      return `/assets/riftbound/symbols/stats/might-${variant}.png`;
    case "E":
      return `/assets/riftbound/symbols/actions/exhaust-${variant}.png`;
    case "F":
      return "/assets/riftbound/symbols/runes/rune-fury-inline.png";
    case "C":
      return "/assets/riftbound/symbols/runes/rune-calm-inline.png";
    case "M":
      return "/assets/riftbound/symbols/runes/rune-mind-inline.png";
    case "B":
      return "/assets/riftbound/symbols/runes/rune-body-inline.png";
    case "H":
      return "/assets/riftbound/symbols/runes/rune-chaos-inline.png";
    case "O":
      return "/assets/riftbound/symbols/runes/rune-order-inline.png";
    case "P":
      return "/assets/riftbound/symbols/power/wild-power-inline.png";
    default:
      return null;
  }
}

/**
 * Renders a plain text string as ReactNode[], inserting <br> elements at
 * newline characters. Used internally by renderTokenizedText.
 */
export function renderMultilineText(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const lines = text.split("\n");
  for (const [index, line] of lines.entries()) {
    nodes.push(line);
    if (index < lines.length - 1) {
      nodes.push(<br key={`${keyPrefix}-br-${index}`} />);
    }
  }
  return nodes;
}

/**
 * Renders a card text string as ReactNode[], replacing {token} patterns with
 * inline symbol images. Plain text segments preserve newlines via
 * renderMultilineText. This is the primary rendering mechanism for all card
 * body text and attribute display.
 */
export function renderTokenizedText(
  text: string,
  { variant = "white", size = "text" }: { variant?: InlineSymbolVariant; size?: InlineSymbolSize } = {}
): ReactNode[] {
  const nodes: ReactNode[] = [];
  for (const [index, part] of text.split(/(\{[^}]+\})/g).entries()) {
    const tokenMatch = part.match(/^\{([^}]+)\}$/);
    if (!tokenMatch) {
      nodes.push(...renderMultilineText(part, `text-${index}`));
      continue;
    }

    const token = tokenMatch[1];
    if (/^\d+$/.test(token)) {
      nodes.push(...renderMultilineText(token, `number-${index}`));
      continue;
    }

    const src = inlineSymbolSrc(token, variant);
    if (!src) {
      nodes.push(...renderMultilineText(token, `unknown-${index}`));
      continue;
    }

    nodes.push(
      <img
        key={`symbol-${index}-${token}`}
        className={`card-inline-symbol card-inline-symbol--${size}`}
        src={src}
        alt=""
        aria-hidden="true"
        data-symbol-token={token}
        data-symbol-variant={variant}
      />
    );
  }
  return nodes;
}

// --- Card text normalization ---

/**
 * Converts :shortcode: notation and :rb_energy_N: patterns to {token} syntax
 * using SYMBOL_MAP. Applied by normalizeCardText before rendering.
 */
export function applySymbols(text: string): string {
  return text
    .replace(/:rb_energy_(\d+):/g, (_, n) => `{${n}}`)
    .replace(/:([a-z_]+):/g, (_, key) => SYMBOL_MAP[key] ?? `{${key}}`);
}

/**
 * Strips HTML tags from card rich text, normalizes HTML entities, and applies
 * symbol substitution. Pass the result to renderTokenizedText for display.
 */
export function normalizeCardText(richText: string): string {
  const stripped = richText
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\[>\]/g, "");
  return applySymbols(stripped).trim();
}

// --- Card finish normalization ---

/**
 * Normalizes a raw finish string (from card data) to the canonical CardFinish
 * union. Any value that is not "foil" is treated as "nonfoil".
 */
export function normalizeCardFinish(finish: string | null | undefined): CardFinish {
  return finish === "foil" ? "foil" : "nonfoil";
}

// --- Card attribute formatters ---

/** Returns the card's energy attribute value, or null if not present. */
export function cardEnergy(card: CardRecord): number | null {
  return card.attributes.energy;
}

/**
 * Formats the card's cost attribute as a token string suitable for
 * renderTokenizedText. Falls back to the energy attribute if no explicit
 * cost is set. Returns null if neither is present.
 */
export function formatCostText(card: CardRecord): string | null {
  const rawCost = card.attributes.cost;
  if (rawCost) {
    return rawCost.replace(/\{([^}]+)\}/g, (match, token: string) => {
      if (/^\d+$/.test(token)) return match;
      return inlineSymbolSrc(token) ? match : "{P}";
    });
  }

  if (card.attributes.energy != null) {
    return `{${card.attributes.energy}}`;
  }

  return null;
}

/**
 * Formats the display typeline for a card, e.g. "Champion - Noxus Warrior".
 * Classifies tags into name-derived, region, and other categories and orders
 * them accordingly.
 */
export function formatTypeline(card: CardRecord): string {
  const { supertype, cardtype, tags } = card.type;
  const baseName = (card.clean_name ?? card.riot_name).toLowerCase();
  const nameTags = tags.filter((t) => baseName.startsWith(t.toLowerCase()));
  const regionTags = tags.filter((t) => RIFTBOUND_REGIONS.has(t) && !nameTags.includes(t));
  const otherTags = tags.filter((t) => !nameTags.includes(t) && !RIFTBOUND_REGIONS.has(t));
  const sortedTags = [...nameTags, ...regionTags, ...otherTags];

  const left = [supertype, cardtype].filter(Boolean).join(" ");
  const right = sortedTags.join(" ");
  return right ? `${left} - ${right}` : left;
}

/**
 * Returns the CSS class string for a domain chip using the legacy CSS utility
 * class system (`card-attr-chip--domain-*`). Single-domain cards receive a
 * domain-specific color class; multi-domain cards receive the multicolor class.
 *
 * @deprecated Use a local `DOMAIN_CHIP_CLASSES` lookup with Tailwind utility
 * classes for new components (see `QueryBuilderView` or `CardSearchResultsPane`
 * for the pattern). This version is kept for existing callers in
 * `cardFormat.tsx` and will be removed when that file is retired.
 */
export function domainChipClass(domains: string[]): string {
  if (domains.length === 1) {
    return `card-attr-chip card-attr-chip--domain card-attr-chip--domain-${domains[0].toLowerCase()}`;
  }
  return "card-attr-chip card-attr-chip--domain card-attr-chip--domain-multicolor";
}
