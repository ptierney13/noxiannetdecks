import cards from "../../../card_store/data/cards.json" with { type: "json" };

type RawCardRecord = {
  tcgplayer_id: string | null;
  riot_name: string;
  collector_number: string | null;
  rarity: string | null;
  finishes: Array<"nonfoil" | "foil">;
  set: {
    set_id: string;
    label: string;
  };
};

export type HostedPublishedCardMetadata = {
  tcgplayerId: string;
  riotName: string;
  collectorNumber: string | null;
  rarity: string | null;
  set: {
    slug: string | null;
    label: string | null;
  };
  finishes: RawCardRecord["finishes"];
};

let cachedMetadataIndex: Map<string, HostedPublishedCardMetadata[]> | null = null;

export function loadHostedPublishCardMetadataIndex(): Map<string, HostedPublishedCardMetadata[]> {
  if (cachedMetadataIndex) {
    return cachedMetadataIndex;
  }

  const metadataIndex = new Map<string, HostedPublishedCardMetadata[]>();

  for (const card of cards as RawCardRecord[]) {
    if (!card.tcgplayer_id) {
      continue;
    }

    const entries = metadataIndex.get(card.tcgplayer_id) ?? [];
    entries.push({
      tcgplayerId: card.tcgplayer_id,
      riotName: card.riot_name,
      collectorNumber: card.collector_number ?? null,
      rarity: card.rarity ?? null,
      set: {
        slug: card.set.set_id.toLowerCase(),
        label: card.set.label ?? null
      },
      finishes: card.finishes
    });
    metadataIndex.set(card.tcgplayer_id, entries);
  }

  cachedMetadataIndex = metadataIndex;
  return metadataIndex;
}
