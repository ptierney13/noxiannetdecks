import type { CardRecord } from "../types";
import {
  formatUsdPrice,
  getPublishedRowsForCard,
  normalizeCardFinish,
  resolveNearMintMarketPrice,
  type CardFinish,
  type PublishedPriceIndex,
} from "../lib";

// Re-export so callers that import from features/index still work.
export type { CardFinish } from "../lib";
export { normalizeCardFinish } from "../lib";

export type VariantSelection = {
  card: CardRecord;
  finish: CardFinish;
  key: string;
};

export type VariantSelectorRowProps = {
  cards: CardRecord[];
  activeKey?: string;
  showPrice?: boolean;
  publishedPriceIndex?: PublishedPriceIndex | null;
  orientation?: "horizontal" | "vertical";
  onVariantSelect: (selection: VariantSelection) => void;
};

function variantButtonLabel(card: CardRecord, finish: CardFinish): string {
  const parts: string[] = [card.set.set_id];
  if (card.variant.alternate_art) {
    parts.push("AA");
  }
  if (card.variant.signed) {
    parts.push("SIG");
  } else if (card.variant.overnumbered) {
    parts.push("ON");
  }
  if (finish === "foil" && card.finishes.includes("nonfoil")) {
    parts.push("FOIL");
  }
  return parts.join(" ");
}

export function VariantSelectorRow({
  cards,
  activeKey,
  showPrice = false,
  publishedPriceIndex = null,
  orientation = "horizontal",
  onVariantSelect,
}: VariantSelectorRowProps) {
  const rowClass =
    orientation === "vertical"
      ? "grid gap-2"
      : "flex flex-wrap gap-2";

  return (
    <div className={rowClass} onClick={(event) => event.stopPropagation()}>
      {cards.flatMap((card) =>
        card.finishes.map((rawFinish) => {
          const finish = normalizeCardFinish(rawFinish);
          const key = `${card.id}-${finish}`;
          const label = variantButtonLabel(card, finish);
          const priceRows = getPublishedRowsForCard(publishedPriceIndex, card.tcgplayer_id);
          const priceRow = showPrice ? resolveNearMintMarketPrice(priceRows, finish) : null;
          const price = showPrice ? formatUsdPrice(priceRow?.currentPrice.amount) : null;
          const active = activeKey === key;

          return (
            <button
              key={key}
              type="button"
              className={`inline-flex min-h-9 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-black uppercase tracking-[0.08em] transition ${
                active
                  ? "border-accent-warm bg-accent-warm-soft text-accent-warm"
                  : "border-border-default bg-surface-inset text-text-secondary hover:border-border-strong hover:text-text-primary"
              }`}
              onClick={() => onVariantSelect({ card, finish, key })}
              aria-pressed={active}
            >
              <span>{label}</span>
              {price ? <span className="text-text-primary">{price}</span> : null}
            </button>
          );
        })
      )}
    </div>
  );
}
