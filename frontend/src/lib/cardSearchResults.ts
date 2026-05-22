import type { CardRecord } from "../types";
import { cardEnergy } from "./cardPresentation";

export type CardSearchSortKey = "energy-asc" | "energy-desc" | "name-asc" | "name-desc" | "set";
export type CardSearchVariantMode = "unique-cards" | "unique-printings";

export type CardSearchResultGroup = {
  key: string;
  representative: CardRecord;
  cards: CardRecord[];
};

export const CARD_SEARCH_SORT_OPTIONS: { value: CardSearchSortKey; label: string }[] = [
  { value: "energy-asc", label: "Energy Asc" },
  { value: "energy-desc", label: "Energy Desc" },
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
  { value: "set", label: "Set order" },
];

export function sortCardsByKey(cards: CardRecord[], sort: CardSearchSortKey): CardRecord[] {
  if (sort === "set") {
    return cards;
  }

  return [...cards].sort((left, right) => {
    switch (sort) {
      case "energy-asc": {
        const leftEnergy = cardEnergy(left) ?? Infinity;
        const rightEnergy = cardEnergy(right) ?? Infinity;
        if (leftEnergy !== rightEnergy) {
          return leftEnergy - rightEnergy;
        }
        return (left.attributes.power ?? Infinity) - (right.attributes.power ?? Infinity);
      }
      case "energy-desc": {
        const leftEnergy = cardEnergy(left) ?? -Infinity;
        const rightEnergy = cardEnergy(right) ?? -Infinity;
        if (leftEnergy !== rightEnergy) {
          return rightEnergy - leftEnergy;
        }
        return (right.attributes.power ?? -Infinity) - (left.attributes.power ?? -Infinity);
      }
      case "name-asc":
        return left.riot_name.localeCompare(right.riot_name);
      case "name-desc":
        return right.riot_name.localeCompare(left.riot_name);
    }
  });
}

export function groupCardsByRiftboundId(cards: CardRecord[]): CardRecord[][] {
  const groups = new Map<string, CardRecord[]>();

  for (const card of cards) {
    const key = card.riftbound_id ?? card.id;
    groups.set(key, [...(groups.get(key) ?? []), card]);
  }

  return [...groups.values()];
}

export function buildCardSearchResultGroups(
  cards: CardRecord[],
  variantMode: CardSearchVariantMode
): CardSearchResultGroup[] {
  const groups = variantMode === "unique-cards" ? groupCardsByRiftboundId(cards) : cards.map((card) => [card]);

  return groups.flatMap((group) => {
    const representative = group[0];
    if (!representative) {
      return [];
    }

    return [
      {
        key: variantMode === "unique-cards" ? representative.riftbound_id ?? representative.id : representative.id,
        representative,
        cards: group,
      },
    ];
  });
}
