import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { deriveDecklistCardId, deriveLegalCleanName } from "../src/data/decklist-id.js";
import { cardDatabaseSchema, type CardRecord } from "../src/data/schema.js";
import { deriveCardVariant, type CardFinish } from "../src/data/variant.js";

const SOURCE_BASE_URL = "https://api.riftcodex.com/cards";
const PAGE_SIZE = 100;
const OUTPUT_PATH = path.resolve("data", "cards.json");
const BASE_FOIL_SETS = new Set(["OGN", "SFD", "UNL"]);
const BASE_FOIL_RARITIES = new Set(["Common", "Uncommon"]);

const nullableString = z.string().nullable();
const nullableNumber = z.number().int().nullable();
const sourceCardSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  riftbound_id: nullableString,
  tcgplayer_id: nullableString,
  collector_number: z.union([z.number().int(), z.string(), z.null()]),
  stats: z.object({
    cost: nullableNumber.optional()
  }).optional(),
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
  text: z.object({
    rich: z.string(),
    plain: z.string(),
    flavour: nullableString
  }),
  set: z.object({
    set_id: z.string().min(1),
    label: z.string().min(1)
  }),
  media: z.object({
    image_url: nullableString,
    artist: nullableString,
    accessibility_text: nullableString
  }),
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

function collectorNumberFromSource(card: SourceCard): string | null {
  const riftboundIdMatch = card.riftbound_id?.match(/^[^-]+-(\d+)([a-z]*)\*?-\d+$/i);
  if (riftboundIdMatch) {
    return `${Number(riftboundIdMatch[1])}${riftboundIdMatch[2].toLowerCase()}`;
  }

  return card.collector_number === null ? null : String(card.collector_number);
}

function keywordsFromText(text: string): string[] {
  const keywords = new Set<string>();
  const matches = text.matchAll(/\[([A-Za-z][A-Za-z' -]*(?: \d+)?)\]/g);

  for (const match of matches) {
    const keyword = match[1].trim();
    keywords.add(keyword === keyword.toUpperCase() ? `${keyword.slice(0, 1)}${keyword.slice(1).toLowerCase()}` : keyword);
  }

  return [...keywords].sort((a, b) => a.localeCompare(b));
}

function typelineFromSource(card: SourceCard): string {
  return [card.classification.type, card.classification.supertype, ...card.tags].filter(Boolean).join(" - ");
}

const DOMAIN_SYMBOL: Record<string, string> = {
  Mind: "M", Fury: "F", Calm: "C", Body: "B", Chaos: "H", Order: "O"
};

function powerSymbolForDomains(domains: string[]): string {
  const letters = domains.map((d) => DOMAIN_SYMBOL[d] ?? d[0].toUpperCase()).sort().join("/");
  return `{${letters}}`;
}

function costFromSource(card: SourceCard): string | null {
  const energy = card.stats?.cost ?? card.attributes.cost ?? card.attributes.energy;
  if (energy === null) return null;
  const power = card.attributes.power ?? 0;
  if (power === 0) return `{${energy}}`;
  const symbol = powerSymbolForDomains(card.classification.domain);
  return `{${energy}}${symbol.repeat(power)}`;
}

function sourceValidationMessage(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`).join("; ");
}

const PARENTHETICAL_VARIANT_MAP: Record<string, Partial<Parameters<typeof deriveCardVariant>[0]>> = {
  "metal":           { metal: true },
  "starter":         { starter: true },
  "gg ez":           { gg_ez: true },
  "launch exclusive":{ launch_exclusive: true },
  "ultimate":        { ultimate: true },
};

function variantFlagsFromName(name: string): Partial<Parameters<typeof deriveCardVariant>[0]> {
  const match = name.match(/\(([^)]+)\)$/);
  if (!match) return {};
  return PARENTHETICAL_VARIANT_MAP[match[1].toLowerCase()] ?? {};
}

function hasDualFinishes(card: Pick<CardRecord, "set" | "rarity" | "variant">): boolean {
  return (
    BASE_FOIL_SETS.has(card.set.set_id) &&
    Boolean(card.rarity && BASE_FOIL_RARITIES.has(card.rarity)) &&
    !card.variant.alternate_art &&
    !card.variant.overnumbered &&
    !card.variant.signed &&
    !card.variant.metal &&
    !card.variant.starter &&
    !card.variant.gg_ez &&
    !card.variant.launch_exclusive &&
    !card.variant.ultimate
  );
}

function finishesForCard(card: Pick<CardRecord, "set" | "rarity" | "variant">): CardFinish[] {
  return hasDualFinishes(card) ? ["nonfoil", "foil"] : ["foil"];
}

function normalizeSourceCard(card: SourceCard): CardRecord {
  const variant = deriveCardVariant({ ...card.metadata, ...variantFlagsFromName(card.name) });
  const cleanName = deriveLegalCleanName(card.metadata.clean_name, card.name);
  const baseCard = {
    set: card.set,
    rarity: card.classification.rarity,
    variant
  };

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
        ? (card.attributes.power ?? 0)
        : null,
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
  const sourceCards: SourceCard[] = [];
  let page = 1;
  let pages = 1;

  while (page <= pages) {
    const sourceUrl = `${SOURCE_BASE_URL}?size=${PAGE_SIZE}&page=${page}`;
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`Riftcodex request failed: ${response.status} ${response.statusText}`);
    }

    const payloadResult = riftcodexPageSchema.safeParse(await response.json());
    if (!payloadResult.success) {
      throw new Error(`Riftcodex payload page ${page} did not match expected schema: ${sourceValidationMessage(payloadResult.error)}`);
    }

    const payload = payloadResult.data;
    sourceCards.push(...payload.items);
    pages = payload.pages;
    page += 1;
  }

  const normalizedCards = sourceCards.map(normalizeSourceCard);

  const cards = cardDatabaseSchema.parse(normalizedCards).sort((a, b) => {
    const setOrder = (a.set?.set_id ?? "").localeCompare(b.set?.set_id ?? "");
    if (setOrder !== 0) return setOrder;
    return (a.collector_number ?? "").localeCompare(b.collector_number ?? "", undefined, { numeric: true });
  });

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(cards, null, 2)}\n`, "utf8");
  console.log(`Wrote ${cards.length} cards to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
