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
  const presentationName = name.replace(TRAILING_PARENTHETICAL_PATTERN, "").trim();
  const titleStart = presentationName.indexOf(RIOT_LEGEND_NAME_DELIMITER);
  const title = titleStart === -1
    ? presentationName
    : presentationName.slice(titleStart + RIOT_LEGEND_NAME_DELIMITER.length);

  return title
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function hasLegendChampionPrefix(name: string): boolean {
  return name.replace(TRAILING_PARENTHETICAL_PATTERN, "").includes(RIOT_LEGEND_NAME_DELIMITER);
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
