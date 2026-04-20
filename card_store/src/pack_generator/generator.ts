import type { CardRecord } from "../data/schema.js";
import { seededPackDefinitions } from "./seeded-packs.js";
import type {
  GeneratedCardFinish,
  GeneratedCardSlot,
  GeneratedPack,
  GeneratedPoolCard,
  GeneratedSealedPool,
  GenerateSealedPoolRequest,
  PackGeneratorOptions,
  PackSetId,
  SeededPackDefinition,
  SeededPackReference,
  SealedPoolFormat
} from "./types.js";

const packSets: Array<{ id: PackSetId; label: string; supportsPreRift: boolean }> = [
  { id: "OGN", label: "Origins", supportsPreRift: false },
  { id: "SFD", label: "Spiritforged", supportsPreRift: true },
  { id: "UNL", label: "Unleashed", supportsPreRift: true }
];

const primaryDomains = ["Fury", "Calm", "Mind", "Body", "Chaos", "Order"] as const;
const mainSlotRarities = new Set(["Common", "Uncommon", "Rare", "Epic"]);
const specialRarities = new Set(["Showcase", "Promo"]);
const preRiftBonusCardRefs: Partial<Record<Exclude<PackSetId, "OGN">, SeededPackReference[]>> = {
  UNL: [{ setId: "UNL", collectorNumber: "169" }]
};
const minimumDomainCardsPerPool = 10;
const defaultPoolRetryLimit = 50;

type Rng = () => number;
type UsedFinishKey = `${string}::${GeneratedCardFinish}`;

type GenerateOptions = {
  rng?: Rng;
  seededPacks?: SeededPackDefinition[];
  now?: () => Date;
  maxAttempts?: number;
};

export class PackGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PackGenerationError";
  }
}

export function packGeneratorOptions(seededPacks = seededPackDefinitions): PackGeneratorOptions {
  return {
    sets: packSets.map((set) => ({
      id: set.id,
      label: set.label,
      supportsStandard: true,
      supportsPreRift: set.supportsPreRift
    })),
    seededPacks: seededPacks.map((pack) => ({
      id: pack.id,
      setId: pack.setId,
      label: pack.label,
      cardCount: pack.cardRefs.length + (preRiftBonusCardRefs[pack.setId]?.length ?? 0)
    }))
  };
}

export function isPackSetId(value: unknown): value is PackSetId {
  return typeof value === "string" && packSets.some((set) => set.id === value);
}

export function isSealedPoolFormat(value: unknown): value is SealedPoolFormat {
  return value === "standard" || value === "pre-rift" || value === "custom";
}

function randomId(prefix: string, rng: Rng): string {
  return `${prefix}-${Math.floor(rng() * Number.MAX_SAFE_INTEGER).toString(36)}`;
}

function chooseOne<T>(items: T[], rng: Rng, description: string): T {
  if (items.length === 0) {
    throw new PackGenerationError(`No eligible cards available for ${description}.`);
  }

  const index = Math.min(items.length - 1, Math.floor(rng() * items.length));
  return items[index];
}

function normalizeCollectorNumber(value: string | null): string {
  if (!value) return "";
  return value.trim().toLowerCase().replace(/^0+(\d)/, "$1");
}

function legalIdentity(card: CardRecord): string {
  if (card.riftbound_id) return `riftbound:${card.riftbound_id}`;
  if (card.clean_name) return `clean:${card.clean_name.trim().toLowerCase()}`;
  return `id:${card.id}`;
}

function finishKey(card: CardRecord, finish: GeneratedCardFinish): UsedFinishKey {
  return `${legalIdentity(card)}::${finish}`;
}

function isSpecialTreatment(card: CardRecord): boolean {
  return card.variant.alternate_art || card.variant.overnumbered || card.variant.signed || specialRarities.has(card.rarity ?? "");
}

function eligibleMainSlotCard(card: CardRecord, setId: PackSetId): boolean {
  return (
    card.set.set_id === setId &&
    mainSlotRarities.has(card.rarity ?? "") &&
    !isSpecialTreatment(card) &&
    card.type.cardtype !== "Rune"
  );
}

function cardsByRarity(cards: CardRecord[], setId: PackSetId, rarity: string): CardRecord[] {
  return cards.filter((card) => eligibleMainSlotCard(card, setId) && card.rarity === rarity);
}

function basicRunes(cards: CardRecord[]): CardRecord[] {
  return cards.filter((card) => card.set.set_id === "OGN" && card.type.cardtype === "Rune" && !isSpecialTreatment(card));
}

function chooseUniqueCard(
  pool: CardRecord[],
  finish: GeneratedCardFinish,
  used: Set<UsedFinishKey>,
  rng: Rng,
  description: string
): CardRecord {
  const available = pool.filter((card) => !used.has(finishKey(card, finish)));
  const card = chooseOne(available, rng, description);
  used.add(finishKey(card, finish));
  return card;
}

function makePoolCard(
  card: CardRecord,
  pack: Pick<GeneratedPack, "id" | "index">,
  slot: GeneratedCardSlot,
  finish: GeneratedCardFinish,
  seeded: boolean,
  position: number
): GeneratedPoolCard {
  return {
    id: `${pack.id}-${position}-${card.id}-${finish}`,
    packId: pack.id,
    packIndex: pack.index,
    slot,
    finish,
    seeded,
    card
  };
}

function foilRarity(rng: Rng): "Common" | "Uncommon" | "Rare" | "Epic" {
  const roll = rng();
  if (roll < 0.7) return "Common";
  if (roll < 0.95) return "Uncommon";
  if (roll < 0.99) return "Rare";
  return "Epic";
}

function rareSlotRarity(rng: Rng): "Rare" | "Epic" {
  return rng() < 0.125 ? "Epic" : "Rare";
}

function generateBoosterPack(cards: CardRecord[], setId: PackSetId, index: number, rng: Rng): GeneratedPack {
  const pack: GeneratedPack = {
    id: randomId(`pack-${index + 1}`, rng),
    index,
    label: `${setId} Pack ${index + 1}`,
    kind: "booster",
    setId,
    seededPackId: null,
    cards: []
  };
  const used = new Set<UsedFinishKey>();
  const entries: GeneratedPoolCard[] = [];

  for (let slotIndex = 0; slotIndex < 7; slotIndex += 1) {
    const card = chooseUniqueCard(cardsByRarity(cards, setId, "Common"), "nonfoil", used, rng, `${setId} common slot`);
    entries.push(makePoolCard(card, pack, "common", "nonfoil", false, entries.length));
  }

  for (let slotIndex = 0; slotIndex < 3; slotIndex += 1) {
    const card = chooseUniqueCard(cardsByRarity(cards, setId, "Uncommon"), "nonfoil", used, rng, `${setId} uncommon slot`);
    entries.push(makePoolCard(card, pack, "uncommon", "nonfoil", false, entries.length));
  }

  for (let slotIndex = 0; slotIndex < 2; slotIndex += 1) {
    const rarity = rareSlotRarity(rng);
    const card = chooseUniqueCard(cardsByRarity(cards, setId, rarity), "foil", used, rng, `${setId} ${rarity.toLowerCase()} slot`);
    entries.push(makePoolCard(card, pack, "rare", "foil", false, entries.length));
  }

  const foil = foilRarity(rng);
  const foilCard = chooseUniqueCard(cardsByRarity(cards, setId, foil), "foil", used, rng, `${setId} foil slot`);
  entries.push(makePoolCard(foilCard, pack, "foil", "foil", false, entries.length));

  const rune = chooseOne(basicRunes(cards), rng, "token/rune slot");
  entries.push(makePoolCard(rune, pack, "token-rune", "nonfoil", false, entries.length));

  pack.cards = entries;
  return pack;
}

function cardForReference(cards: CardRecord[], reference: SeededPackReference): CardRecord {
  const card = cards.find(
    (candidate) =>
      candidate.set.set_id === reference.setId &&
      normalizeCollectorNumber(candidate.collector_number) === normalizeCollectorNumber(reference.collectorNumber) &&
      !isSpecialTreatment(candidate)
  );

  if (!card) {
    throw new PackGenerationError(`${reference.setId}-${reference.collectorNumber} was not found for seeded pack generation.`);
  }

  return card;
}

function generateSeededPack(cards: CardRecord[], seededPack: SeededPackDefinition, index: number, rng: Rng): GeneratedPack {
  const pack: GeneratedPack = {
    id: randomId(`seeded-${index + 1}`, rng),
    index,
    label: `${seededPack.label} Seeded Pack`,
    kind: "seeded",
    setId: seededPack.setId,
    seededPackId: seededPack.id,
    cards: []
  };

  const bonusRefs = preRiftBonusCardRefs[seededPack.setId] ?? [];
  pack.cards = [...seededPack.cardRefs, ...bonusRefs].map((reference, cardIndex) => {
    const card = cardForReference(cards, reference);
    const finish: GeneratedCardFinish = card.finishes.includes("nonfoil") ? "nonfoil" : "foil";
    return makePoolCard(card, pack, "seeded", finish, true, cardIndex);
  });

  return pack;
}

function seededPacksForSet(seededPacks: SeededPackDefinition[], setId: PackSetId): SeededPackDefinition[] {
  return seededPacks.filter((pack) => pack.setId === setId);
}

function chooseSeededPack(
  seededPacks: SeededPackDefinition[],
  setId: PackSetId,
  seededPackId: string | null | undefined,
  rng: Rng
): SeededPackDefinition {
  const available = seededPacksForSet(seededPacks, setId);

  if (available.length === 0) {
    throw new PackGenerationError(`${setId} does not have Pre-Rift seeded packs.`);
  }

  if (!seededPackId || seededPackId === "random") {
    return chooseOne(available, rng, `${setId} seeded pack`);
  }

  const found = available.find((pack) => pack.id === seededPackId);
  if (!found) {
    throw new PackGenerationError(`Seeded pack "${seededPackId}" is not available for ${setId}.`);
  }

  return found;
}

function packRecipeForRequest(request: GenerateSealedPoolRequest, rng: Rng, seededPacks: SeededPackDefinition[]) {
  switch (request.format) {
    case "standard": {
      const setId = request.setId ?? "SFD";
      return {
        format: "standard" as const,
        setId,
        seededPack: null,
        boosters: Array.from({ length: 6 }, () => setId)
      };
    }
    case "custom": {
      if (request.packs?.length !== 6) {
        throw new PackGenerationError("Choose My Packs requires exactly six pack selections.");
      }

      return {
        format: "custom" as const,
        setId: null,
        seededPack: null,
        boosters: request.packs
      };
    }
    case "pre-rift": {
      const setId = request.setId ?? "SFD";
      if (setId === "OGN") {
        throw new PackGenerationError("Origins does not have a Pre-Rift seeded pack option.");
      }

      return {
        format: "pre-rift" as const,
        setId,
        seededPack: chooseSeededPack(seededPacks, setId, request.seededPackId, rng),
        boosters: Array.from({ length: 5 }, () => setId)
      };
    }
  }
}

function domainCountsForPool(packs: GeneratedPack[]) {
  const counts = new Map<(typeof primaryDomains)[number], number>(primaryDomains.map((domain) => [domain, 0]));

  for (const pack of packs) {
    for (const entry of pack.cards) {
      for (const domain of entry.card.attributes.domain) {
        if (!counts.has(domain as (typeof primaryDomains)[number])) continue;
        counts.set(domain as (typeof primaryDomains)[number], (counts.get(domain as (typeof primaryDomains)[number]) ?? 0) + 1);
      }
    }
  }

  return counts;
}

function poolMeetsPrimaryDomainFloor(packs: GeneratedPack[]): boolean {
  return [...domainCountsForPool(packs).values()].every((count) => count >= minimumDomainCardsPerPool);
}

function generatePoolPacks(
  cards: CardRecord[],
  recipe: ReturnType<typeof packRecipeForRequest>,
  rng: Rng
): GeneratedPack[] {
  const packs: GeneratedPack[] = [];

  if (recipe.seededPack) {
    packs.push(generateSeededPack(cards, recipe.seededPack, packs.length, rng));
  }

  for (const setId of recipe.boosters) {
    packs.push(generateBoosterPack(cards, setId, packs.length, rng));
  }

  return packs;
}

export function generateSealedPool(
  cards: CardRecord[],
  request: GenerateSealedPoolRequest,
  options: GenerateOptions = {}
): GeneratedSealedPool {
  const rng = options.rng ?? Math.random;
  const now = options.now ?? (() => new Date());
  const seededPacks = options.seededPacks ?? seededPackDefinitions;
  const recipe = packRecipeForRequest(request, rng, seededPacks);
  const maxAttempts = Math.max(1, options.maxAttempts ?? defaultPoolRetryLimit);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const packs = generatePoolPacks(cards, recipe, rng);
    if (!poolMeetsPrimaryDomainFloor(packs)) continue;

    return {
      id: randomId("pool", rng),
      format: recipe.format,
      setId: recipe.setId,
      seededPackId: recipe.seededPack?.id ?? null,
      packs,
      generatedAt: now().toISOString()
    };
  }

  throw new PackGenerationError(
    `Unable to generate a sealed pool where every primary domain has at least ${minimumDomainCardsPerPool} cards after ${maxAttempts} attempts.`
  );
}
