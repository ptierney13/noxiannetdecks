import type { CardRecord } from "../data/schema.js";

export type PackSetId = "OGN" | "SFD" | "UNL";
export type SealedPoolFormat = "standard" | "pre-rift" | "custom";
export type GeneratedPackKind = "booster" | "seeded";
export type GeneratedCardSlot = "common" | "uncommon" | "rare" | "foil" | "token-rune" | "seeded";
export type GeneratedCardFinish = "nonfoil" | "foil";

export type SeededPackReference = {
  setId: PackSetId;
  collectorNumber: string;
};

export type SeededPackDefinition = {
  id: string;
  setId: Exclude<PackSetId, "OGN">;
  label: string;
  cardRefs: SeededPackReference[];
};

export type PackSetOption = {
  id: PackSetId;
  label: string;
  supportsStandard: boolean;
  supportsPreRift: boolean;
};

export type SeededPackOption = {
  id: string;
  setId: Exclude<PackSetId, "OGN">;
  label: string;
  cardCount: number;
};

export type PackGeneratorOptions = {
  sets: PackSetOption[];
  seededPacks: SeededPackOption[];
};

export type GeneratedPoolCard = {
  id: string;
  packId: string;
  packIndex: number;
  slot: GeneratedCardSlot;
  finish: GeneratedCardFinish;
  seeded: boolean;
  card: CardRecord;
};

export type GeneratedPack = {
  id: string;
  index: number;
  label: string;
  kind: GeneratedPackKind;
  setId: PackSetId;
  seededPackId: string | null;
  cards: GeneratedPoolCard[];
};

export type GeneratedSealedPool = {
  id: string;
  format: SealedPoolFormat;
  setId: PackSetId | null;
  seededPackId: string | null;
  packs: GeneratedPack[];
  generatedAt: string;
};

export type GenerateSealedPoolRequest = {
  format: SealedPoolFormat;
  setId?: PackSetId;
  packs?: PackSetId[];
  seededPackId?: string | null;
};
