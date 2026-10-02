type RiftcodexCollectorNumberSource = {
  riftbound_id: string | null;
  collector_number: string | number | null;
};

type RiftcodexDedupeSourceCard = RiftcodexCollectorNumberSource & {
  name: string;
  classification: {
    type: string | null;
  };
  set: {
    set_id: string;
  };
  metadata: {
    overnumbered?: boolean | null;
  };
};

const RIOT_LEGEND_NAME_DELIMITER = " - ";
const TRAILING_PARENTHETICAL_PATTERN = /\s+\([^)]+\)$/;

export function collectorNumberFromRiftcodexSource(card: RiftcodexCollectorNumberSource): string | null {
  const riftboundIdMatch = card.riftbound_id?.match(/^[^-]+-(\d+)([a-z]*)\*?-\d+$/i);
  if (riftboundIdMatch) {
    return `${Number(riftboundIdMatch[1])}${riftboundIdMatch[2].toLowerCase()}`;
  }

  return card.collector_number === null ? null : String(card.collector_number);
}

function normalizeLegendTitle(name: string): string {
  const presentationName = legendPresentationName(name);
  const titleStart = presentationName.indexOf(RIOT_LEGEND_NAME_DELIMITER);
  const title = titleStart === -1
    ? presentationName
    : presentationName.slice(titleStart + RIOT_LEGEND_NAME_DELIMITER.length);

  return normalizeLegendNamePart(title);
}

function normalizeLegendNamePart(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function legendPresentationName(name: string): string {
  return name.replace(TRAILING_PARENTHETICAL_PATTERN, "").trim();
}

function hasLegendChampionPrefix(name: string): boolean {
  return legendPresentationName(name).includes(RIOT_LEGEND_NAME_DELIMITER);
}

function legendChampionPrefix(name: string): string | null {
  const presentationName = legendPresentationName(name);
  const titleStart = presentationName.indexOf(RIOT_LEGEND_NAME_DELIMITER);
  return titleStart === -1 ? null : presentationName.slice(0, titleStart);
}

function legendDedupeKey(card: RiftcodexDedupeSourceCard): string | null {
  if (card.classification.type?.toLowerCase() !== "legend") {
    return null;
  }

  const collectorNumber = collectorNumberFromRiftcodexSource(card);
  const title = normalizeLegendTitle(card.name);
  if (!collectorNumber || !title) {
    return null;
  }

  return `${card.set.set_id.toUpperCase()}:${collectorNumber}:${title}`;
}

export function dedupeRiftcodexSourceCards<T extends RiftcodexDedupeSourceCard>(cards: T[]): T[] {
  const championPrefixedLegendKeys = new Set<string>();

  for (const card of cards) {
    const key = legendDedupeKey(card);
    if (key && hasLegendChampionPrefix(card.name)) {
      championPrefixedLegendKeys.add(key);
    }
  }

  return cards.filter((card) => {
    const key = legendDedupeKey(card);
    if (!key || hasLegendChampionPrefix(card.name)) {
      return true;
    }

    return !championPrefixedLegendKeys.has(key);
  });
}

function numericCollectorNumber(card: RiftcodexCollectorNumberSource): number | null {
  const collectorNumber = collectorNumberFromRiftcodexSource(card);
  if (!collectorNumber) {
    return null;
  }

  const match = collectorNumber.match(/^\d+/);
  return match ? Number(match[0]) : null;
}

type LegendBaseCard = {
  championPrefix: string;
  collectorNumber: number;
};

function uniqueLegendBaseByTitle<T extends RiftcodexDedupeSourceCard>(cards: T[]): Map<string, LegendBaseCard> {
  const basesByTitle = new Map<string, LegendBaseCard | null>();

  for (const card of cards) {
    if (card.classification.type?.toLowerCase() !== "legend") {
      continue;
    }

    const championPrefix = legendChampionPrefix(card.name);
    if (!championPrefix) {
      continue;
    }

    const collectorNumber = numericCollectorNumber(card);
    if (collectorNumber === null) {
      continue;
    }

    const presentationName = legendPresentationName(card.name);
    const title = presentationName.slice(championPrefix.length + RIOT_LEGEND_NAME_DELIMITER.length);
    const key = `${card.set.set_id.toUpperCase()}:${normalizeLegendNamePart(title)}`;
    const existing = basesByTitle.get(key);
    if (existing === null) {
      continue;
    }

    if (existing) {
      basesByTitle.set(key, null);
      continue;
    }

    basesByTitle.set(key, { championPrefix, collectorNumber });
  }

  return new Map([...basesByTitle.entries()].filter((entry): entry is [string, LegendBaseCard] => entry[1] !== null));
}

export function normalizeRiftcodexSourceCards<T extends RiftcodexDedupeSourceCard>(cards: T[]): T[] {
  const dedupedCards = dedupeRiftcodexSourceCards(cards);
  const legendBases = uniqueLegendBaseByTitle(dedupedCards);

  return dedupedCards.map((card) => {
    if (card.classification.type?.toLowerCase() !== "legend" || hasLegendChampionPrefix(card.name)) {
      return card;
    }

    const title = normalizeLegendTitle(card.name);
    const key = `${card.set.set_id.toUpperCase()}:${title}`;
    const base = legendBases.get(key);
    const collectorNumber = numericCollectorNumber(card);
    if (!base || collectorNumber === null || collectorNumber <= base.collectorNumber) {
      return card;
    }

    return {
      ...card,
      name: `${base.championPrefix} - ${legendPresentationName(card.name)} (Overnumbered)`,
      metadata: {
        ...card.metadata,
        overnumbered: true
      }
    };
  });
}
