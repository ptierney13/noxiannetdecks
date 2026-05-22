import { useEffect, useMemo, useState } from "react";
import { ModalShell } from "../../ui-elements";
import type { CardRecord } from "../../types";
import {
  buildCardDetailPath,
  buildTcgplayerAffiliateSearchLink,
  formatCostText,
  formatTypeline,
  normalizeCardText,
  renderTokenizedText,
  usePublishedPriceIndex,
  type CardFinish,
} from "../../lib";
import { VariantSelectorRow } from "../VariantSelectorRow";

export type CardSummaryPopupProps = {
  group: CardRecord[];
  initialCard: CardRecord;
  initialFinish: CardFinish;
  onClose: () => void;
};

/**
 * Returns inline styles for the cost chip based on the card's domain(s).
 * Single domain: domain-soft background + domain border/color.
 * Multi-domain: left-to-right gradient between the two domain soft colors.
 */
function costChipStyle(
  domains: string[]
): { background?: string; borderColor?: string; color?: string } {
  if (domains.length === 0) return {};

  if (domains.length === 1) {
    const d = domains[0]?.toLowerCase() ?? "";
    return {
      background: `var(--domain-${d}-soft)`,
      borderColor: `var(--domain-${d})`,
      color: `var(--domain-${d})`,
    };
  }

  const d0 = domains[0]?.toLowerCase() ?? "";
  const d1 = domains[1]?.toLowerCase() ?? "";
  return {
    background: `linear-gradient(to right, var(--domain-${d0}-soft) 0%, var(--domain-${d0}-soft) 40%, var(--domain-${d1}-soft) 60%, var(--domain-${d1}-soft) 100%)`,
    borderColor: "var(--color-border-default)",
  };
}

export function CardSummaryPopup({
  group,
  initialCard,
  initialFinish,
  onClose,
}: CardSummaryPopupProps) {
  const { index: publishedPriceIndex } = usePublishedPriceIndex();
  const [activeCard, setActiveCard] = useState(initialCard);
  const [activeFinish, setActiveFinish] = useState<CardFinish>(initialFinish);

  useEffect(() => {
    setActiveCard(initialCard);
    setActiveFinish(initialFinish);
  }, [initialCard, initialFinish]);

  const buyHref = useMemo(
    () =>
      buildTcgplayerAffiliateSearchLink({
        query: activeCard.riot_name,
        gameSlug: "riftbound-league-of-legends-trading-card-game",
        productLineName: "riftbound-league-of-legends-trading-card-game",
      }),
    [activeCard.riot_name]
  );

  const detailHref = buildCardDetailPath(activeCard.id);
  const normalizedText = activeCard.text.rich ? normalizeCardText(activeCard.text.rich) : "";
  const costText = formatCostText(activeCard);
  const domains = activeCard.attributes.domain;

  return (
    <ModalShell label={`Card Summary Popup for ${activeCard.riot_name}`} onClose={onClose}>
      <div className="grid gap-0 overflow-hidden rounded-[28px] @[760px]:grid-cols-[minmax(240px,0.86fr)_minmax(0,1.14fr)]">
        <div className="grid place-items-center bg-surface-3 p-5 @[760px]:p-7">
          {activeCard.media.image_url ? (
            <img
              src={activeCard.media.image_url}
              alt={activeCard.media.accessibility_text ?? activeCard.riot_name}
              className="max-h-[70svh] w-full max-w-sm rounded-2xl object-contain shadow-surface-2"
            />
          ) : (
            <div className="grid aspect-[5/7] w-full max-w-sm place-items-center rounded-2xl border border-border-default bg-surface-3 p-6 text-center text-lg font-black uppercase tracking-[0.12em] text-text-tertiary">
              {activeCard.riot_name}
            </div>
          )}
        </div>

        <div className="grid content-start gap-4 p-5 pr-16 @[760px]:p-8 @[760px]:pr-20">
          {/* Name + Cost on the same line */}
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="m-0 text-3xl font-black leading-tight text-text-primary">
              {activeCard.riot_name}
            </h2>
            {costText ? (
              <span
                className="inline-flex items-center gap-1 rounded-xl border px-3 py-1 text-3xl font-black leading-none"
                style={costChipStyle(domains)}
              >
                {renderTokenizedText(costText, { size: "stat" })}
              </span>
            ) : null}
          </div>

          {/* Typeline chip */}
          <span className="inline-flex self-start rounded-xl border border-border-default bg-surface-inset px-3 py-1.5 text-sm font-bold text-text-secondary">
            {formatTypeline(activeCard)}
          </span>

          {/* Rules text */}
          {normalizedText ? (
            <p className="m-0 whitespace-pre-line rounded-2xl border border-border-subtle bg-surface-inset p-4 text-sm leading-6 text-text-secondary">
              {renderTokenizedText(normalizedText)}
            </p>
          ) : null}

          {/* Flavor text */}
          {activeCard.text.flavour ? (
            <p className="m-0 whitespace-pre-line rounded-2xl border border-border-subtle bg-surface-inset p-4 text-sm italic leading-6 text-text-tertiary">
              {activeCard.text.flavour}
            </p>
          ) : null}

          {/* Illustrator */}
          {activeCard.media.artist ? (
            <p className="m-0 text-xs text-text-tertiary">
              Illustrated by {activeCard.media.artist}
            </p>
          ) : null}

          {/* Variants */}
          {group.length > 0 ? (
            <div className="grid gap-2">
              <p className="m-0 text-xs font-black uppercase tracking-[0.18em] text-text-tertiary">
                Variants
              </p>
              <VariantSelectorRow
                cards={group}
                activeKey={`${activeCard.id}-${activeFinish}`}
                showPrice
                showCollectorNumber
                publishedPriceIndex={publishedPriceIndex}
                onVariantSelect={({ card, finish }) => {
                  setActiveCard(card);
                  setActiveFinish(finish);
                }}
              />
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-1">
            {buyHref ? (
              <a
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[image:var(--gradient-accent-button)] px-4 text-sm font-black text-[#1A0D05] shadow-[0_8px_22px_rgba(0,0,0,0.28)] transition hover:brightness-110"
                href={buyHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                Buy on TCGPlayer
              </a>
            ) : null}
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[image:var(--gradient-accent-button)] px-4 text-sm font-black text-[#1A0D05] shadow-[0_8px_22px_rgba(0,0,0,0.28)] transition hover:brightness-110"
              href={detailHref}
              onClick={onClose}
            >
              View full details
            </a>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
