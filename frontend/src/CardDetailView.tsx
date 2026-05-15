import { useEffect, useMemo, useRef, useState } from "react";
import { getCard, searchCards } from "./api";
import {
  formatCostText,
  formatHeadlinePrice,
  formatSeriesToggleLabel,
  formatTypeline,
  groupRowsByPrinting,
  normalizeCardText,
  PRICE_SERIES_COLORS,
  PriceHistoryChart,
  renderTokenizedText,
} from "./cardFormat";
import {
  buildTcgplayerAffiliateLink,
  formatUsdPrice,
  getPublishedRowsForCard,
  normalizePrinting,
  resolveNearMintMarketPrice,
  usePublishedPriceIndex,
} from "./lib";
import { buildCardDetailPath } from "./routes";
import type { CardRecord } from "./types";

export default function CardDetailView({
  cardId,
  onError,
  onNavigate
}: {
  cardId: string;
  onError: (message: string | null) => void;
  onNavigate: (path: string) => void;
}) {
  const [card, setCard] = useState<CardRecord | null>(null);
  const [allPrintings, setAllPrintings] = useState<CardRecord[]>([]);
  const [selectedPriceRowIds, setSelectedPriceRowIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { index: publishedPriceIndex } = usePublishedPriceIndex();
  const priceSeriesColorsRef = useRef<Record<string, string>>({});
  const nextPriceSeriesColorIndexRef = useRef(0);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setCard(null);
    setAllPrintings([]);
    setSelectedPriceRowIds([]);
    priceSeriesColorsRef.current = {};
    nextPriceSeriesColorIndexRef.current = 0;
    onError(null);

    async function load() {
      try {
        const loaded = await getCard(cardId);
        if (ignore) return;
        setCard(loaded);

        const printingsQuery = loaded.riftbound_id
          ? `riftbound_id="${loaded.riftbound_id}" unique:prints`
          : loaded.clean_name
          ? `n="${loaded.clean_name}" unique:prints`
          : null;
        if (printingsQuery) {
          try {
            const result = await searchCards(printingsQuery);
            if (!ignore) {
              setAllPrintings(result.items);
            }
          } catch {
            // printings are best-effort
          }
        }
      } catch (caught) {
        if (!ignore) onError(caught instanceof Error ? caught.message : "Failed to load card.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();
    return () => { ignore = true; };
  }, [cardId, onError]);

  const apiUrl = card ? `/api/cards/${encodeURIComponent(card.id)}` : "";
  const currentPriceRows = useMemo(
    () => getPublishedRowsForCard(publishedPriceIndex, card?.tcgplayer_id),
    [publishedPriceIndex, card?.tcgplayer_id]
  );
  const currentNearMintPrice = useMemo(
    () => resolveNearMintMarketPrice(currentPriceRows),
    [currentPriceRows]
  );
  const currentHeadlinePrice = formatHeadlinePrice(currentNearMintPrice);
  const pricingGroups = useMemo(
    () => groupRowsByPrinting(currentPriceRows),
    [currentPriceRows]
  );
  const cardDetailBuyLinks = useMemo(() => {
    const productId = card?.tcgplayer_id?.trim();
    if (!productId) {
      return [];
    }

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
          href: buildTcgplayerAffiliateLink({
            productId,
            printing: "Foil"
          })
        },
        {
          key: "normal",
          finishLabel: "NONFOIL",
          href: buildTcgplayerAffiliateLink({
            productId,
            printing: "Normal"
          })
        }
      ].filter((entry): entry is { key: string; finishLabel: string; href: string } => Boolean(entry.href));
    }

    const href = buildTcgplayerAffiliateLink({ productId });
    return href
      ? [
          {
            key: "default",
            finishLabel: null,
            href
          }
        ]
      : [];
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
      current.includes(rowId) ? current.filter((candidate) => candidate !== rowId) : [...current, rowId]
    );
  }

  if (loading) {
    return (
      <section className="card-detail-view">
        <p className="card-detail-loading">Loading…</p>
      </section>
    );
  }

  if (!card) return null;

  return (
    <section className="card-detail-view">
      <nav className="card-detail-breadcrumb">
        <button type="button" className="text-button" onClick={() => onNavigate("/cards")}>
          ← Card Search
        </button>
      </nav>

      <div className="card-detail-layout">
        <div className="card-detail-image-col">
          {card.media.image_url ? (
            <img
              className="card-detail-image"
              src={card.media.image_url}
              alt={card.media.accessibility_text ?? card.riot_name}
            />
          ) : (
            <div className="missing-image card-detail-image">{card.riot_name}</div>
          )}

          {allPrintings.length > 0 && (() => {
            type PrintingRow = { key: string; cardRec: CardRecord; finish: string; variantTags: string[]; isCurrent: boolean };
            const rows: PrintingRow[] = [];
            for (const p of allPrintings) {
              const variantTags: string[] = [];
              if (p.variant.alternate_art) variantTags.push("Alt Art");
              if (p.variant.signed) variantTags.push("Signed");
              if (p.variant.overnumbered) variantTags.push("Overnumbered");
              for (const finish of p.finishes) {
                rows.push({ key: `${p.id}-${finish}`, cardRec: p, finish, variantTags, isCurrent: p.id === card.id });
              }
            }
            function rowLabel(r: PrintingRow) {
              const parts = [r.finish === "foil" ? "Foil" : "Nonfoil", ...r.variantTags];
              return parts.join(", ");
            }
            return (
              <div className="card-detail-versions">
                <p className="card-detail-versions-heading">Printings</p>
                {rows.map((r) => {
                  const barPriceRow = resolveNearMintMarketPrice(
                    getPublishedRowsForCard(publishedPriceIndex, r.cardRec.tcgplayer_id),
                    r.finish
                  );
                  const barPrice = formatUsdPrice(barPriceRow?.currentPrice.amount);
                  if (r.isCurrent) {
                    return (
                      <div key={r.key} className="card-detail-version-bar card-detail-version-bar--active" aria-current="page">
                        <span className="card-detail-version-set">{r.cardRec.set.set_id} #{r.cardRec.collector_number ?? "?"}</span>
                        <span className="card-detail-version-name">{rowLabel(r)}</span>
                        {barPrice ? <span className="card-detail-version-price">{barPrice}</span> : null}
                      </div>
                    );
                  }
                  const href = buildCardDetailPath(r.cardRec.id);
                  return (
                    <a
                      key={r.key}
                      href={href}
                      className="card-detail-version-bar"
                      onClick={(event) => {
                        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
                        event.preventDefault();
                        onNavigate(href);
                      }}
                    >
                      <span className="card-detail-version-set">{r.cardRec.set.set_id} #{r.cardRec.collector_number ?? "?"}</span>
                      <span className="card-detail-version-name">{rowLabel(r)}</span>
                      {barPrice ? <span className="card-detail-version-price">{barPrice}</span> : null}
                    </a>
                  );
                })}
              </div>
            );
          })()}
        </div>

        <div className="card-detail-info-col">
          <div className="card-detail-name-row">
            <h1 className="card-detail-name">{card.riot_name}</h1>
            {currentHeadlinePrice ? <span className="card-detail-price">{currentHeadlinePrice}</span> : null}
          </div>

          <p className="card-detail-typeline">{formatTypeline(card)}</p>

          <div className="card-detail-attrs">
            {formatCostText(card) != null && (
              <div className="card-attr-block">
                <span className="card-attr-label">Cost</span>
                <span className="card-attr-value card-attr-value--symbols">
                  {renderTokenizedText(formatCostText(card) ?? "", { size: "stat" })}
                </span>
              </div>
            )}
            {card.attributes.might != null && (
              <div className="card-attr-block">
                <span className="card-attr-label">Might</span>
                <span className="card-attr-value card-attr-value--symbols">
                  <span className="card-inline-metric">
                    <span>{card.attributes.might}</span>
                    {renderTokenizedText("{T}", { size: "stat" })}
                  </span>
                </span>
              </div>
            )}
            {card.attributes.domain.length > 0 && (
              <div className="card-attr-block">
                <span className="card-attr-label">Domain</span>
                <span className="card-attr-value">{card.attributes.domain.join(", ")}</span>
              </div>
            )}
          </div>

          {card.text.rich && (
            <div className="card-detail-section">
              <p className="card-detail-body-text">{renderTokenizedText(normalizeCardText(card.text.rich))}</p>
            </div>
          )}

          {card.text.flavour && (
            <div className="card-detail-section">
              <p className="card-detail-flavour">"{card.text.flavour}"</p>
            </div>
          )}

          <div className="card-detail-section card-detail-facts">
            <div className="card-fact-row"><span>Set</span><span>{card.set.label} ({card.set.set_id})</span></div>
            <div className="card-fact-row"><span>Number</span><span>{card.collector_number ?? "—"}</span></div>
            {card.rarity && <div className="card-fact-row"><span>Rarity</span><span>{card.rarity}</span></div>}
            <div className="card-fact-row"><span>Finishes</span><span>{card.finishes.join(", ")}</span></div>
            {card.media.artist && <div className="card-fact-row"><span>Artist</span><span>{card.media.artist}</span></div>}
            <div className="card-fact-row"><span>Language</span><span>{card.language}</span></div>
            {card.variant.alternate_art && <div className="card-fact-row"><span>Variant</span><span>Alternate Art</span></div>}
            {card.variant.signed && <div className="card-fact-row"><span>Variant</span><span>Signed</span></div>}
            {card.variant.overnumbered && <div className="card-fact-row"><span>Variant</span><span>Overnumbered</span></div>}
          </div>

          <div className="card-detail-links">
            <a
              className="card-detail-json-link"
              href={`${apiUrl}?pretty=1`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Card JSON ↗
            </a>
            {cardDetailBuyLinks.map((link) => (
              <a
                key={link.key}
                className="card-detail-json-link"
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.finishLabel ? (
                  <>Buy {link.finishLabel} on TCGPlayer ↗</>
                ) : (
                  <>Buy on TCGPlayer ↗</>
                )}
              </a>
            ))}
          </div>

          <div className="card-detail-section card-price-panel">
            <h2 className="card-detail-section-heading">Pricing</h2>
            {pricingGroups.length === 0 ? (
              <p className="price-panel-empty">No published market prices are available for this version yet.</p>
            ) : (
              <>
                {pricingGroups.map((group) => (
                  <div key={group.key} className="price-toggle-group">
                    <p className="price-toggle-group-label">{group.label}</p>
                    <div className="price-toggle-row">
                      {group.rows.map((row) => {
                        const selected = selectedPriceRowIds.includes(row.rowId);
                        return (
                          <button
                            key={row.rowId}
                            type="button"
                            className={selected ? "price-toggle-button price-toggle-button--selected" : "price-toggle-button"}
                            onClick={() => togglePriceRow(row.rowId)}
                            aria-pressed={selected}
                          >
                            {formatSeriesToggleLabel(row)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {selectedPriceRows.length > 0 ? <PriceHistoryChart rows={selectedPriceRows} colorsByRowId={selectedPriceRowColors} /> : null}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
