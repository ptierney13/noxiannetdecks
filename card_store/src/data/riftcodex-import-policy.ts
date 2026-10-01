import type { CardRecord } from "./schema.js";
import type { CardFinish, CardVariant } from "./variant.js";

export const DUAL_FINISH_SET_IDS = new Set(["OGN", "SFD", "UNL", "VEN"]);
export const DUAL_FINISH_RARITIES = new Set(["Common", "Uncommon"]);
export const FOIL_ONLY_OR_SPECIAL_SET_IDS = new Set(["JDG", "OGS", "OPP", "PR"]);

type ImportPolicyCard = Pick<CardRecord, "set" | "rarity" | "variant">;
type ImportPolicyAuditCard = ImportPolicyCard & Pick<CardRecord, "riot_name" | "collector_number">;

export type ImportedSetSummary = {
  setId: string;
  label: string;
  count: number;
};

export function isSpecialTreatmentVariant(variant: CardVariant): boolean {
  return (
    variant.alternate_art ||
    variant.overnumbered ||
    variant.signed ||
    variant.metal ||
    variant.starter ||
    variant.gg_ez ||
    variant.launch_exclusive ||
    variant.ultimate
  );
}

export function hasDualFinishes(card: ImportPolicyCard): boolean {
  return (
    DUAL_FINISH_SET_IDS.has(card.set.set_id) &&
    Boolean(card.rarity && DUAL_FINISH_RARITIES.has(card.rarity)) &&
    !isSpecialTreatmentVariant(card.variant)
  );
}

export function finishesForImportedCard(card: ImportPolicyCard): CardFinish[] {
  return hasDualFinishes(card) ? ["nonfoil", "foil"] : ["foil"];
}

export function summarizeImportedSets(cards: Array<Pick<CardRecord, "set">>): ImportedSetSummary[] {
  const summaries = new Map<string, ImportedSetSummary>();

  for (const card of cards) {
    const key = card.set.set_id;
    const current = summaries.get(key) ?? {
      setId: card.set.set_id,
      label: card.set.label,
      count: 0
    };
    current.count += 1;
    summaries.set(key, current);
  }

  return [...summaries.values()].sort((left, right) => left.setId.localeCompare(right.setId));
}

export function assertKnownRiftcodexSetFinishPolicy(cards: ImportPolicyAuditCard[]): void {
  const unknownLikelyBoosterSets = new Map<string, ImportPolicyAuditCard>();

  for (const card of cards) {
    if (DUAL_FINISH_SET_IDS.has(card.set.set_id) || FOIL_ONLY_OR_SPECIAL_SET_IDS.has(card.set.set_id)) {
      continue;
    }

    if (!card.rarity || !DUAL_FINISH_RARITIES.has(card.rarity) || isSpecialTreatmentVariant(card.variant)) {
      continue;
    }

    unknownLikelyBoosterSets.set(card.set.set_id, card);
  }

  if (unknownLikelyBoosterSets.size === 0) {
    return;
  }

  const details = [...unknownLikelyBoosterSets.values()]
    .sort((left, right) => left.set.set_id.localeCompare(right.set.set_id))
    .map((card) => {
      const collectorNumber = card.collector_number ? ` #${card.collector_number}` : "";
      return `${card.set.set_id} (${card.set.label}) e.g. ${card.riot_name}${collectorNumber}`;
    })
    .join("; ");

  throw new Error(
    `Riftcodex import found set(s) without a finish policy: ${details}. ` +
      "Update DUAL_FINISH_SET_IDS for normal booster sets, or FOIL_ONLY_OR_SPECIAL_SET_IDS for foil-only/special sets."
  );
}
