import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { deriveDecklistCardId, deriveLegalCleanName } from "../src/data/decklist-id.js";
import { deriveCardVariant, type CardFinish } from "../src/data/variant.js";
import type { CardRecord } from "../src/data/schema.js";

const SOURCE_BASE_URL = "https://api.riftcodex.com/cards";
const PAGE_SIZE = 100;
const EXISTING_PATH = path.resolve("data", "cards.json");
const TODAY = new Date().toISOString().slice(0, 10);
const OUTPUT_PATH = path.resolve("data", "temp", `${TODAY}.cards.json`);

const nullableString = z.string().nullable();
const nullableNumber = z.number().int().nullable();
const sourceCardSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  riftbound_id: nullableString,
  tcgplayer_id: nullableString,
  collector_number: z.union([z.number().int(), z.string(), z.null()]),
  stats: z.object({ cost: nullableNumber.optional() }).optional(),
  attributes: z.object({
    cost: nullableNumber.optional(),
    energy: nullableNumber,
    might: nullableNumber,
    power: nullableNumber
  }),
  classification: z.object({
    type: nullableString,
    supertype: nullableString,
    rarity: nullableString,
    domain: z.array(z.string())
  }),
  text: z.object({ rich: z.string(), plain: z.string(), flavour: nullableString }),
  set: z.object({ set_id: z.string().min(1), label: z.string().min(1) }),
  media: z.object({ image_url: nullableString, artist: nullableString, accessibility_text: nullableString }),
  tags: z.array(z.string()),
  orientation: z.string().min(1),
  metadata: z.object({
    clean_name: nullableString,
    alternate_art: z.boolean().nullable().optional(),
    overnumbered: z.boolean().nullable().optional(),
    signature: z.boolean().nullable().optional()
  })
});

const riftcodexPageSchema = z.object({
  items: z.array(sourceCardSchema),
  pages: z.number().int().positive()
});

type SourceCard = z.infer<typeof sourceCardSchema>;

const BASE_FOIL_SETS = new Set(["OGN", "SFD", "UNL"]);
const BASE_FOIL_RARITIES = new Set(["Common", "Uncommon"]);
const DOMAIN_SYMBOL: Record<string, string> = { Mind: "M", Fury: "F", Calm: "C", Body: "B", Chaos: "H", Order: "O" };
const VARIANT_SUFFIX_MAP: Record<string, object> = {
  "metal":            { metal: true },
  "starter":          { starter: true },
  "gg ez":            { gg_ez: true },
  "launch exclusive": { launch_exclusive: true },
  "ultimate":         { ultimate: true },
};

function variantFlagsFromName(name: string): object {
  const match = name.match(/\(([^)]+)\)$/);
  if (!match) return {};
  return VARIANT_SUFFIX_MAP[match[1].toLowerCase()] ?? {};
}

function collectorNumberFromSource(card: SourceCard): string | null {
  const m = card.riftbound_id?.match(/^[^-]+-(\d+)([a-z]*)\*?-\d+$/i);
  if (m) return `${Number(m[1])}${m[2].toLowerCase()}`;
  return card.collector_number === null ? null : String(card.collector_number);
}

function keywordsFromText(text: string): string[] {
  const keywords = new Set<string>();
  for (const match of text.matchAll(/\[([A-Za-z][A-Za-z' -]*(?: \d+)?)\]/g)) {
    const kw = match[1].trim();
    keywords.add(kw === kw.toUpperCase() ? `${kw[0]}${kw.slice(1).toLowerCase()}` : kw);
  }
  return [...keywords].sort((a, b) => a.localeCompare(b));
}

function typelineFromSource(card: SourceCard): string {
  return [card.classification.type, card.classification.supertype, ...card.tags].filter(Boolean).join(" - ");
}

function powerSymbolForDomains(domains: string[]): string {
  return `{${domains.map((d) => DOMAIN_SYMBOL[d] ?? d[0].toUpperCase()).sort().join("/")}}`;
}

function costFromSource(card: SourceCard): string | null {
  const energy = card.stats?.cost ?? card.attributes.cost ?? card.attributes.energy;
  if (energy === null) return null;
  const power = card.attributes.power ?? 0;
  if (power === 0) return `{${energy}}`;
  return `{${energy}}${powerSymbolForDomains(card.classification.domain).repeat(power)}`;
}

function hasDualFinishes(card: Pick<CardRecord, "set" | "rarity" | "variant">): boolean {
  return (
    BASE_FOIL_SETS.has(card.set.set_id) &&
    Boolean(card.rarity && BASE_FOIL_RARITIES.has(card.rarity)) &&
    !card.variant.alternate_art && !card.variant.overnumbered && !card.variant.signed &&
    !card.variant.metal && !card.variant.starter && !card.variant.gg_ez &&
    !card.variant.launch_exclusive && !card.variant.ultimate
  );
}

function finishesForCard(card: Pick<CardRecord, "set" | "rarity" | "variant">): CardFinish[] {
  return hasDualFinishes(card) ? ["nonfoil", "foil"] : ["foil"];
}

function normalizeSourceCard(card: SourceCard): CardRecord {
  const variant = deriveCardVariant({ ...card.metadata, ...variantFlagsFromName(card.name) });
  const cleanName = deriveLegalCleanName(card.metadata.clean_name, card.name);
  const baseCard = { set: card.set, rarity: card.classification.rarity, variant };
  return {
    id: card.id,
    riot_name: card.name,
    clean_name: cleanName,
    riftbound_id: deriveDecklistCardId(cleanName, card.name),
    tcgplayer_id: card.tcgplayer_id,
    collector_number: collectorNumberFromSource(card),
    language: "en",
    rarity: card.classification.rarity,
    variant,
    finishes: finishesForCard(baseCard),
    attributes: {
      cost: costFromSource(card),
      energy: card.attributes.energy,
      might: card.attributes.might,
      power: (card.attributes.energy !== null || card.attributes.might !== null)
        ? (card.attributes.power ?? 0) : null,
      domain: card.classification.domain
    },
    type: {
      cardtype: card.classification.type,
      supertype: card.classification.supertype,
      tags: card.tags,
      typeline: typelineFromSource(card)
    },
    text: {
      rich: card.text.rich,
      plain: card.text.plain,
      flavour: card.text.flavour,
      keywords: keywordsFromText(card.text.plain)
    },
    set: card.set,
    media: {
      image_url: card.media.image_url,
      artist: card.media.artist,
      accessibility_text: card.media.accessibility_text,
      layout: card.orientation
    }
  };
}

async function main() {
  // Fetch current riftcodex data
  console.log("Fetching from riftcodex...");
  const sourceCards: SourceCard[] = [];
  let page = 1;
  let pages = 1;
  while (page <= pages) {
    const response = await fetch(`${SOURCE_BASE_URL}?size=${PAGE_SIZE}&page=${page}`);
    if (!response.ok) throw new Error(`Riftcodex request failed: ${response.status} ${response.statusText}`);
    const payload = riftcodexPageSchema.parse(await response.json());
    sourceCards.push(...payload.items);
    pages = payload.pages;
    page += 1;
  }
  console.log(`Fetched ${sourceCards.length} source cards.`);

  // Normalize to CardRecord shape
  const fresh = sourceCards.map(normalizeSourceCard).sort((a, b) => {
    const s = (a.set?.set_id ?? "").localeCompare(b.set?.set_id ?? "");
    if (s !== 0) return s;
    return (a.collector_number ?? "").localeCompare(b.collector_number ?? "", undefined, { numeric: true });
  });

  // Write to temp output
  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(fresh, null, 2)}\n`, "utf8");
  console.log(`Wrote ${fresh.length} cards to ${OUTPUT_PATH}`);

  // Load existing cards.json and diff
  const existing: CardRecord[] = JSON.parse(await readFile(EXISTING_PATH, "utf8"));
  const existingById = new Map(existing.map((c) => [c.id, c]));
  const freshById = new Map(fresh.map((c) => [c.id, c]));

  const added = fresh.filter((c) => !existingById.has(c.id));
  const removed = existing.filter((c) => !freshById.has(c.id));

  // Detect field-level changes on shared cards
  const changed: { id: string; riot_name: string; fields: string[] }[] = [];
  for (const freshCard of fresh) {
    const old = existingById.get(freshCard.id);
    if (!old) continue;
    const diffs: string[] = [];
    const checkFields: (keyof CardRecord)[] = [
      "riot_name", "clean_name", "tcgplayer_id", "collector_number",
      "rarity", "finishes", "set"
    ];
    for (const field of checkFields) {
      if (JSON.stringify(freshCard[field]) !== JSON.stringify(old[field])) {
        diffs.push(field);
      }
    }
    if (JSON.stringify(freshCard.variant) !== JSON.stringify(old.variant)) diffs.push("variant");
    if (JSON.stringify(freshCard.type) !== JSON.stringify(old.type)) diffs.push("type");
    if (diffs.length > 0) changed.push({ id: freshCard.id, riot_name: freshCard.riot_name, fields: diffs });
  }

  console.log(`\n=== Diff vs cards.json ===`);
  console.log(`Added:   ${added.length} cards`);
  console.log(`Removed: ${removed.length} cards`);
  console.log(`Changed: ${changed.length} cards`);

  if (added.length > 0) {
    console.log("\nAdded cards:");
    for (const c of added) console.log(`  [${c.set.set_id}] ${c.riot_name} (${c.id})`);
  }
  if (removed.length > 0) {
    console.log("\nRemoved cards:");
    for (const c of removed) console.log(`  [${c.set.set_id}] ${c.riot_name} (${c.id})`);
  }
  if (changed.length > 0) {
    console.log("\nChanged cards:");
    for (const c of changed) console.log(`  ${c.riot_name} (${c.id}): ${c.fields.join(", ")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
