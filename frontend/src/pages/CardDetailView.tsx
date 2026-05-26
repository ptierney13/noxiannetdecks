import { useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { cardDetailQueryOptions, cardPrintingsQueryOptions } from "../data";
import {
  buildCardDetailPath,
  buildTcgplayerAffiliateLink,
  formatCostText,
  formatHeadlinePrice,
  formatSeriesToggleLabel,
  formatTypeline,
  formatUsdPrice,
  getPublishedRowsForCard,
  groupRowsByPrinting,
  normalizePrinting,
  normalizeCardText,
  PRICE_SERIES_COLORS,
  renderTokenizedText,
  resolveNearMintMarketPrice,
  usePublishedPriceIndex,
} from "../lib";
import { PriceHistoryChart } from "../features/card/PriceHistoryChart";
import type { CardRecord } from "../types";

// ── Loading skeleton ───────────────────────────────────────────────────────────

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-surface-2 ${className}`} />;
}

function LoadingLayout() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr] lg:items-start">
      <div className="space-y-3 lg:sticky lg:top-6">
        <SkeletonBlock className="w-full aspect-[744/1039] rounded-xl" />
      </div>
      <div className="space-y-5 min-w-0">
        <SkeletonBlock className="h-8 w-2/3" />
        <SkeletonBlock className="h-4 w-1/3" />
        <div className="flex gap-2">
          <SkeletonBlock className="h-14 w-20" />
          <SkeletonBlock className="h-14 w-20" />
        </div>
        <SkeletonBlock className="h-20 w-full" />
        <SkeletonBlock className="h-36 w-full rounded-xl" />
        <SkeletonBlock className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}

// ── Image with fallback ────────────────────────────────────────────────────────

function CardImage({ card }: { card: CardRecord }) {
  const [failed, setFailed] = useState(false);

  if (card.media.image_url && !failed) {
    return (
      <img
        className="block w-full aspect-[744/1039] rounded-xl object-cover shadow-[0_16px_48px_rgba(0,0,0,0.6)] bg-surface-2"
        src={card.media.image_url}
        alt={card.media.accessibility_text ?? card.riot_name}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="w-full aspect-[744/1039] rounded-xl bg-surface-2 flex items-center justify-center">
      <span className="text-sm text-text-tertiary">Image Not Found</span>
    </div>
  );
}

// ── Printings list ─────────────────────────────────────────────────────────────

type PrintingRow = {
  key: string;
  cardRec: CardRecord;
  finish: string;
  variantTags: string[];
  isCurrent: boolean;
};

function buildPrintingRows(allPrintings: CardRecord[], currentId: string): PrintingRow[] {
  const rows: PrintingRow[] = [];
  for (const p of allPrintings) {
    const variantTags: string[] = [];
    if (p.variant.alternate_art) variantTags.push("Alt Art");
    if (p.variant.signed) variantTags.push("Signed");
    if (p.variant.overnumbered) variantTags.push("Overnumbered");
    for (const finish of p.finishes) {
      rows.push({ key: `${p.id}-${finish}`, cardRec: p, finish, variantTags, isCurrent: p.id === currentId });
    }
  }
  return rows;
}

function rowLabel(r: PrintingRow) {
  const parts = [r.finish === "foil" ? "Foil" : "Nonfoil", ...r.variantTags];
  return parts.join(", ");
}

const VERSION_BAR_BASE =
  "flex w-full items-baseline gap-2.5 rounded-md border px-3 py-2 text-[0.82rem] font-normal text-left no-underline transition-[border-color,background] duration-[120ms]";
const VERSION_BAR_INACTIVE =
  "border-border-subtle bg-surface-2 text-text-secondary cursor-pointer hover:border-border-strong hover:bg-[#22243a]";
const VERSION_BAR_ACTIVE =
  "border-accent bg-[rgba(181,32,56,0.08)] text-text-primary cursor-default";

function PrintingsList({
  rows,
  publishedPriceIndex,
}: {
  rows: PrintingRow[];
  publishedPriceIndex: ReturnType<typeof usePublishedPriceIndex>["index"];
}) {
  const navigate = useNavigate();

  return (
    <div className="mt-4 flex flex-col gap-0.5">
      <p className="mb-1.5 text-[0.72rem] font-bold uppercase tracking-[0.06em] text-text-tertiary">
        Printings
      </p>
      {rows.map((r) => {
        const barPriceRow = resolveNearMintMarketPrice(
          getPublishedRowsForCard(publishedPriceIndex, r.cardRec.tcgplayer_id),
          r.finish
        );
        const barPrice = formatUsdPrice(barPriceRow?.currentPrice.amount);

        if (r.isCurrent) {
          return (
            <div
              key={r.key}
              className={`${VERSION_BAR_BASE} ${VERSION_BAR_ACTIVE}`}
              aria-current="page"
            >
              <span className="shrink-0 text-[0.75rem] font-bold tabular-nums text-accent">
                {r.cardRec.set.set_id} #{r.cardRec.collector_number ?? "?"}
              </span>
              <span className="flex-1 truncate">{rowLabel(r)}</span>
              {barPrice ? (
                <span className="ml-auto shrink-0 text-[0.78rem] font-bold tabular-nums text-accent-warm">
                  {barPrice}
                </span>
              ) : null}
            </div>
          );
        }

        const href = buildCardDetailPath(r.cardRec.id);
        return (
          <a
            key={r.key}
            href={href}
            className={`${VERSION_BAR_BASE} ${VERSION_BAR_INACTIVE}`}
            onClick={(event) => {
              if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.altKey ||
                event.shiftKey
              )
                return;
              event.preventDefault();
              void navigate({ href });
            }}
          >
            <span className="shrink-0 text-[0.75rem] font-bold tabular-nums text-text-tertiary">
              {r.cardRec.set.set_id} #{r.cardRec.collector_number ?? "?"}
            </span>
            <span className="flex-1 truncate">{rowLabel(r)}</span>
            {barPrice ? (
              <span className="ml-auto shrink-0 text-[0.78rem] font-bold tabular-nums text-accent-warm">
                {barPrice}
              </span>
            ) : null}
          </a>
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function CardDetailView({ cardId }: { cardId: string }) {
  const navigate = useNavigate();
  const [selectedPriceRowIds, setSelectedPriceRowIds] = useState<string[]>([]);
  const priceSeriesColorsRef = useRef<Record<string, string>>({});
  const nextPriceSeriesColorIndexRef = useRef(0);

  const cardQuery = useQuery(cardDetailQueryOptions(cardId));
  const card = cardQuery.data ?? null;

  const printingsQuery = card
    ? card.riftbound_id
      ? `riftbound_id="${card.riftbound_id}" unique:prints`
      : card.clean_name
      ? `n="${card.clean_name}" unique:prints`
      : ""
    : "";

  // NOTE: sequential fetch is unavoidable — printings query requires riftbound_id or
  // clean_name from the card response body. If load perf becomes an issue, the right
  // fix is a combined backend endpoint returning card + printings in one response.
  const printingsResult = useQuery(cardPrintingsQueryOptions(printingsQuery));
  const allPrintings = printingsResult.data?.items ?? [];

  const { index: publishedPriceIndex, status: priceStatus } = usePublishedPriceIndex();

  const currentPriceRows = useMemo(
    () => getPublishedRowsForCard(publishedPriceIndex, card?.tcgplayer_id),
    [publishedPriceIndex, card?.tcgplayer_id]
  );
  const currentNearMintPrice = useMemo(
    () => resolveNearMintMarketPrice(currentPriceRows),
    [currentPriceRows]
  );
  const currentHeadlinePrice = formatHeadlinePrice(currentNearMintPrice);
  const pricingGroups = useMemo(() => groupRowsByPrinting(currentPriceRows), [currentPriceRows]);

  const cardDetailBuyLinks = useMemo(() => {
    const productId = card?.tcgplayer_id?.trim();
    if (!productId) return [];

    const availablePrintings = new Set(
      currentPriceRows
        .map((row) => normalizePrinting(row.printing))
        .filter((value): value is string => value === "foil" || value === "normal")
    );

    if (availablePrintings.has("foil") && availablePrintings.has("normal")) {
      return [
        {
          key: "foil",
          finishLabel: "FOIL",
          href: buildTcgplayerAffiliateLink({ productId, printing: "Foil" }),
        },
        {
          key: "normal",
          finishLabel: "NONFOIL",
          href: buildTcgplayerAffiliateLink({ productId, printing: "Normal" }),
        },
      ].filter((entry): entry is { key: string; finishLabel: string; href: string } =>
        Boolean(entry.href)
      );
    }

    const href = buildTcgplayerAffiliateLink({ productId });
    return href ? [{ key: "default", finishLabel: null, href }] : [];
  }, [card?.tcgplayer_id, currentPriceRows]);

  const selectedPriceRows = useMemo(
    () => currentPriceRows.filter((row) => selectedPriceRowIds.includes(row.rowId)),
    [currentPriceRows, selectedPriceRowIds]
  );

  const selectedPriceRowColors = useMemo(() => {
    const colorsByRowId = priceSeriesColorsRef.current;
    let nextIndex = nextPriceSeriesColorIndexRef.current;
    for (const rowId of selectedPriceRowIds) {
      if (!colorsByRowId[rowId]) {
        colorsByRowId[rowId] = PRICE_SERIES_COLORS[nextIndex % PRICE_SERIES_COLORS.length];
        nextIndex += 1;
      }
    }
    nextPriceSeriesColorIndexRef.current = nextIndex;
    return { ...colorsByRowId };
  }, [selectedPriceRowIds]);

  function togglePriceRow(rowId: string) {
    setSelectedPriceRowIds((current) =>
      current.includes(rowId)
        ? current.filter((candidate) => candidate !== rowId)
        : [...current, rowId]
    );
  }

  const apiUrl = card ? `/api/cards/${encodeURIComponent(card.id)}` : "";
  const printingRows = card ? buildPrintingRows(allPrintings, card.id) : [];

  return (
    <section className="mx-auto flex w-full max-w-[960px] flex-col gap-8 px-4 py-8 pb-16">
      <nav>
        <button
          type="button"
          className="text-sm font-semibold text-text-secondary transition-colors duration-[120ms] hover:text-text-primary"
          onClick={() => void navigate({ href: "/cards" })}
        >
          ← Card Search
        </button>
      </nav>

      {cardQuery.isPending && <LoadingLayout />}

      {cardQuery.isError && (
        <div className="rounded-2xl border border-[var(--color-negative-border)] bg-[var(--color-negative-soft)] px-5 py-4 text-sm text-text-primary">
          <strong className="block font-black">Failed to load card</strong>
          <span className="mt-1 block text-text-secondary">
            {cardQuery.error instanceof Error
              ? cardQuery.error.message
              : "Unable to load this card."}
          </span>
        </div>
      )}

      {card && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr] lg:items-start">
          {/* Image column */}
          <div className="lg:sticky lg:top-6">
            <CardImage card={card} />
            {printingRows.length > 0 && (
              <PrintingsList rows={printingRows} publishedPriceIndex={publishedPriceIndex} />
            )}
          </div>

          {/* Info column */}
          <div className="flex min-w-0 flex-col gap-5">
            {/* Name + headline price */}
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="m-0 text-[1.75rem] font-bold leading-[1.1] tracking-[-0.01em] text-text-primary">
                {card.riot_name}
              </h1>
              {currentHeadlinePrice ? (
                <span className="text-[1.1rem] font-bold text-accent-warm">
                  {currentHeadlinePrice}
                </span>
              ) : null}
            </div>

            {/* Typeline */}
            <p className="m-0 text-[0.92rem] text-text-secondary">{formatTypeline(card)}</p>

            {/* Attributes (Cost / Might / Domain) */}
            {(formatCostText(card) != null ||
              card.attributes.might != null ||
              card.attributes.domain.length > 0) && (
              <dl className="flex flex-wrap gap-2.5">
                {formatCostText(card) != null && (
                  <div className="flex min-w-16 flex-col gap-0.5 rounded-lg border border-border-default bg-surface-2 px-3.5 py-2">
                    <dt className="text-[0.72rem] font-bold uppercase tracking-[0.06em] text-text-tertiary">
                      Cost
                    </dt>
                    <dd className="m-0 inline-flex flex-wrap items-center gap-[0.22em] text-[1.05rem] font-bold text-text-primary">
                      {renderTokenizedText(formatCostText(card) ?? "", { size: "stat" })}
                    </dd>
                  </div>
                )}
                {card.attributes.might != null && (
                  <div className="flex min-w-16 flex-col gap-0.5 rounded-lg border border-border-default bg-surface-2 px-3.5 py-2">
                    <dt className="text-[0.72rem] font-bold uppercase tracking-[0.06em] text-text-tertiary">
                      Might
                    </dt>
                    <dd className="m-0 inline-flex flex-wrap items-center gap-[0.22em] text-[1.05rem] font-bold text-text-primary">
                      <span className="inline-flex items-center gap-[0.22em]">
                        <span>{card.attributes.might}</span>
                        {renderTokenizedText("{T}", { size: "stat" })}
                      </span>
                    </dd>
                  </div>
                )}
                {card.attributes.domain.length > 0 && (
                  <div className="flex min-w-16 flex-col gap-0.5 rounded-lg border border-border-default bg-surface-2 px-3.5 py-2">
                    <dt className="text-[0.72rem] font-bold uppercase tracking-[0.06em] text-text-tertiary">
                      Domain
                    </dt>
                    <dd className="m-0 text-[1.05rem] font-bold text-text-primary">
                      {card.attributes.domain.join(", ")}
                    </dd>
                  </div>
                )}
              </dl>
            )}

            {/* Rich text */}
            {card.text.rich && (
              <div>
                <p className="m-0 whitespace-pre-line text-[0.9rem] leading-[1.6] text-text-secondary">
                  {renderTokenizedText(normalizeCardText(card.text.rich))}
                </p>
              </div>
            )}

            {/* Flavour text */}
            {card.text.flavour && (
              <div>
                <p className="m-0 text-[0.86rem] italic leading-[1.55] text-text-tertiary">
                  "{card.text.flavour}"
                </p>
              </div>
            )}

            {/* Facts table */}
            <dl className="overflow-hidden rounded-lg border border-border-subtle">
              {[
                { label: "Set", value: `${card.set.label} (${card.set.set_id})` },
                { label: "Number", value: card.collector_number ?? "—" },
                ...(card.rarity ? [{ label: "Rarity", value: card.rarity }] : []),
                { label: "Finishes", value: card.finishes.join(", ") },
                ...(card.media.artist ? [{ label: "Artist", value: card.media.artist }] : []),
                { label: "Language", value: card.language },
                ...(card.variant.alternate_art ? [{ label: "Variant", value: "Alternate Art" }] : []),
                ...(card.variant.signed ? [{ label: "Variant", value: "Signed" }] : []),
                ...(card.variant.overnumbered ? [{ label: "Variant", value: "Overnumbered" }] : []),
              ].map(({ label, value }, index, arr) => (
                <div
                  key={`${label}-${index}`}
                  className={`flex items-center justify-between gap-3 px-3.5 py-2 text-[0.86rem] ${
                    index < arr.length - 1 ? "border-b border-border-subtle" : ""
                  }`}
                >
                  <dt className="shrink-0 text-text-tertiary">{label}</dt>
                  <dd className="m-0 text-right text-text-primary">{value}</dd>
                </div>
              ))}
            </dl>

            {/* Links */}
            <div className="flex flex-wrap gap-2.5">
              <a
                className="inline-flex items-center rounded border border-border-default bg-surface-2 px-3.5 py-1.5 text-[0.84rem] font-semibold text-text-secondary no-underline transition-[border-color,color] duration-[120ms] hover:border-border-strong hover:text-text-primary"
                href={`${apiUrl}?pretty=1`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Card JSON ↗
              </a>
              {cardDetailBuyLinks.map((link) => (
                <a
                  key={link.key}
                  className="inline-flex items-center rounded border border-border-default bg-surface-2 px-3.5 py-1.5 text-[0.84rem] font-semibold text-text-secondary no-underline transition-[border-color,color] duration-[120ms] hover:border-border-strong hover:text-text-primary"
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.finishLabel ? <>Buy {link.finishLabel} on TCGPlayer ↗</> : <>Buy on TCGPlayer ↗</>}
                </a>
              ))}
            </div>

            {/* Pricing panel — reserves space during price index load to avoid reflow */}
            <div className="flex flex-col gap-3.5">
              <h2 className="m-0 text-[1.05rem] font-semibold text-text-primary">Pricing</h2>
              {priceStatus === "loading" && (
                <div className="flex flex-col gap-3">
                  <SkeletonBlock className="h-8 w-48" />
                  <SkeletonBlock className="h-48 w-full rounded-xl" />
                </div>
              )}
              {priceStatus === "ready" && pricingGroups.length === 0 && (
                <p className="m-0 text-[0.88rem] text-text-tertiary">
                  No published market prices are available for this version yet.
                </p>
              )}
              {priceStatus === "ready" && pricingGroups.length > 0 && (
                <>
                  {pricingGroups.map((group) => (
                    <div key={group.key} className="flex flex-col gap-2">
                      <p className="m-0 text-[0.78rem] font-bold uppercase tracking-[0.06em] text-text-tertiary">
                        {group.label}
                      </p>
                      <div className="flex flex-wrap gap-2.5">
                        {group.rows.map((row) => {
                          const isSelected = selectedPriceRowIds.includes(row.rowId);
                          return (
                            <button
                              key={row.rowId}
                              type="button"
                              className={[
                                "rounded-full border px-3.5 py-2 text-[0.84rem] font-semibold transition-[border-color,background,color] duration-[120ms] cursor-pointer",
                                isSelected
                                  ? "border-[rgba(215,170,73,0.7)] bg-[var(--color-accent-warm-soft)] text-[#fde68a]"
                                  : "border-border-default bg-surface-2 text-text-secondary hover:border-border-strong hover:bg-[#22243a] hover:text-text-primary",
                              ].join(" ")}
                              onClick={() => togglePriceRow(row.rowId)}
                              aria-pressed={isSelected}
                            >
                              {formatSeriesToggleLabel(row)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {selectedPriceRows.length > 0 ? (
                    <PriceHistoryChart rows={selectedPriceRows} colorsByRowId={selectedPriceRowColors} />
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
