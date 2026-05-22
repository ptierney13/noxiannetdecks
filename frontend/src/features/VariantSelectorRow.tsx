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
  showCollectorNumber?: boolean;
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
  showCollectorNumber = false,
  publishedPriceIndex = null,
  orientation = "horizontal",
  onVariantSelect,
}: VariantSelectorRowProps) {
  const rowClass =
    orientation === "vertical"
      ? "grid gap-2"
      : "flex flex-nowrap gap-2 overflow-x-auto";

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
              className={`inline-flex flex-shrink-0 flex-col min-h-[2.6rem] rounded-xl border px-3.5 py-[0.4375rem] text-left text-[0.875rem] font-black uppercase tracking-[0.08em] transition ${
                active
                  ? "border-accent bg-[rgba(197,50,71,0.45)] text-white"
                  : "border-border-default bg-surface-inset text-text-secondary hover:bg-accent-soft hover:border-accent hover:text-text-primary hover:shadow-[0_0_0_1px_rgba(197,50,71,0.25),0_0_16px_rgba(197,50,71,0.18)]"
              }`}
              onClick={() => onVariantSelect({ card, finish, key })}
              aria-pressed={active}
            >
              <span>{label}</span>
              {showCollectorNumber && card.collector_number ? (
                <span className="mt-0.5 text-xs font-bold normal-case tracking-normal">
                  {card.collector_number}
                </span>
              ) : null}
              {price ? (
                <span className="mt-0.5 text-xs font-bold normal-case tracking-normal text-price">
                  {price}
                </span>
              ) : null}
            </button>
          );
        })
      )}
    </div>
  );
}
