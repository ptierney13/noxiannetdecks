export const BATTLEFIELD_SLOT_LABELS = ["Game 1", "Play", "Draw"] as const;
export type BattlefieldSlotLabel = (typeof BATTLEFIELD_SLOT_LABELS)[number];

export type DraftDeckCard = {
  cardId: string;
  cardName: string;
  imageUrl: string | null;
};

export type DraftDeckListEntry = {
  cardId: string;
  cardName: string;
  cost: string | null;
  quantity: number;
};

export type DraftDeck = {
  version: 1;
  updatedAt: string;
  legend: (DraftDeckCard & { domain: string[] }) | null;
  champion: DraftDeckCard | null;
  // null until a legend with two domains is selected
  runes: { leftDomain: string; leftCount: number; rightDomain: string; rightCount: number } | null;
  // always length 3: indexes map to BATTLEFIELD_SLOT_LABELS
  battlefields: Array<(DraftDeckCard & { enabled: boolean }) | null>;
  maindeck: DraftDeckListEntry[];
  sideboard: DraftDeckListEntry[];
};

export type DeckSection = "maindeck" | "sideboard";

export type DeckListDragState = {
  cardId: string;
  cardName: string;
  fromSection: DeckSection;
  pointerId: number;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  targetSection: DeckSection | null;
};

export const MAINDECK_MAX = 39;
export const SIDEBOARD_MAX = 8;
export const RUNE_TOTAL = 12;

export const DOMAIN_CSS_COLORS: Record<string, string> = {
  fury: "var(--domain-fury)",
  calm: "var(--domain-calm)",
  mind: "var(--domain-mind)",
  body: "var(--domain-body)",
  chaos: "var(--domain-chaos)",
  order: "var(--domain-order)",
};

export function domainColor(domain: string): string {
  return DOMAIN_CSS_COLORS[domain.toLowerCase()] ?? "var(--color-text-tertiary)";
}
