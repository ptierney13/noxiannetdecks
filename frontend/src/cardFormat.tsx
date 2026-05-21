import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  buildCardDetailPath,
  buildTcgplayerAffiliateSearchLink,
  domainChipClass,
  formatCostText,
  formatTypeline,
  formatPrintingLabel,
  formatUsdPrice,
  getPublishedRowsForCard,
  normalizePrinting,
  normalizeCardText,
  renderTokenizedText,
  resolveNearMintMarketPrice,
  usePublishedPriceIndex,
  type PublishedPriceRow,
} from "./lib";
import type { CardRecord } from "./types";

// --- Price chart display utilities ---
// These functions support PriceHistoryChart and CardDetailView's price UI.
// Pure string/data helpers that depend on PublishedPriceRow from priceData.

export const PRICE_SERIES_COLORS = [
  "var(--chart-series-1)",
  "var(--chart-series-2)",
  "var(--chart-series-3)",
  "var(--chart-series-4)",
  "var(--chart-series-5)",
  "var(--chart-series-6)",
] as const;

export type PricePrintingGroup = {
  key: string;
  label: string;
  rows: PublishedPriceRow[];
};

export function formatHeadlinePrice(row: PublishedPriceRow | null): string | null {
  const price = formatUsdPrice(row?.currentPrice.amount);
  if (!price || !row?.condition) {
    return null;
  }
  return `${row.condition} ${price}`;
}

export function formatPriceOnly(row: PublishedPriceRow | null): string | null {
  return formatUsdPrice(row?.currentPrice.amount);
}

export function formatSeriesToggleLabel(row: PublishedPriceRow): string {
  const condition = row.condition ?? "Unknown";
  const price = formatUsdPrice(row.currentPrice.amount);
  return price ? `${condition} ${price}` : condition;
}

export function formatSeriesLegendLabel(row: PublishedPriceRow): string {
  const printing = formatPrintingLabel(row.printing);
  const condition = row.condition ?? "Unknown";
  return `${printing} • ${condition}`;
}

export function groupRowsByPrinting(rows: PublishedPriceRow[]): PricePrintingGroup[] {
  const groups = new Map<string, PublishedPriceRow[]>();

  for (const row of rows) {
    const key = normalizePrinting(row.printing) || "other";
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  const orderedKeys = [
    "foil",
    "normal",
    ...[...groups.keys()].filter((key) => key !== "foil" && key !== "normal").sort(),
  ];

  return orderedKeys
    .filter((key) => groups.has(key))
    .map((key) => ({
      key,
      label: formatPrintingLabel(key),
      rows: groups.get(key) ?? [],
    }));
}

// --- Price history chart component ---

type ChartTooltip = { cx: number; cy: number; amount: number; date: string };

export function PriceHistoryChart({
  rows,
  colorsByRowId,
}: {
  rows: PublishedPriceRow[];
  colorsByRowId: Record<string, string>;
}) {
  const [tooltip, setTooltip] = useState<ChartTooltip | null>(null);
  const series = rows
    .map((row, index) => ({
      row,
      color: colorsByRowId[row.rowId] ?? PRICE_SERIES_COLORS[index % PRICE_SERIES_COLORS.length],
      points: [...row.priceHistory].sort((left, right) =>
        left.observedAt.localeCompare(right.observedAt)
      ),
    }))
    .filter((entry) => entry.points.length > 0);

  if (series.length === 0) {
    return (
      <div className="price-chart-empty">
        Selected price rows do not have enough 7-day history to plot yet.
      </div>
    );
  }

  const allDates = [
    ...new Set(series.flatMap((entry) => entry.points.map((point) => point.observedAt))),
  ].sort();
  const allAmounts = series.flatMap((entry) => entry.points.map((point) => point.amount));
  const minAmount = Math.min(...allAmounts);
  const maxAmount = Math.max(...allAmounts);
  const padding =
    minAmount === maxAmount
      ? Math.max(minAmount * 0.1, 1)
      : (maxAmount - minAmount) * 0.12;
  const chartMin = Math.max(0, minAmount - padding);
  const chartMax = maxAmount + padding;
  const width = 680;
  const height = 240;
  const margin = { top: 20, right: 20, bottom: 34, left: 54 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const dateSpan = Math.max(allDates.length - 1, 1);
  const amountSpan = Math.max(chartMax - chartMin, 1);

  function xForDate(observedAt: string): number {
    const index = allDates.indexOf(observedAt);
    return margin.left + (chartWidth * (index < 0 ? 0 : index)) / dateSpan;
  }

  function yForAmount(amount: number): number {
    return margin.top + chartHeight - ((amount - chartMin) / amountSpan) * chartHeight;
  }

  const axisLabels = [chartMin, chartMax].map((value) => ({
    value,
    label: formatUsdPrice(value) ?? "$0.00",
    y: yForAmount(value),
  }));
  const dateLabels = allDates.map((value, index) => {
    const parsed = new Date(value);
    const label = Number.isNaN(parsed.getTime())
      ? value
      : new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        }).format(parsed);

    return {
      key: value,
      label,
      x: margin.left + (chartWidth * index) / dateSpan,
    };
  });

  return (
    <div className="price-chart" data-testid="price-history-chart">
      <div className="price-chart-legend">
        {series.map((entry) => (
          <div key={entry.row.rowId} className="price-chart-legend-item">
            <span
              className="price-chart-legend-swatch"
              style={{ backgroundColor: entry.color }}
            />
            <span>{formatSeriesLegendLabel(entry.row)}</span>
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Seven day market price history chart"
      >
        <rect
          x={margin.left}
          y={margin.top}
          width={chartWidth}
          height={chartHeight}
          className="price-chart-frame"
        />

        {axisLabels.map((label) => (
          <g key={label.label}>
            <line
              x1={margin.left}
              y1={label.y}
              x2={margin.left + chartWidth}
              y2={label.y}
              className="price-chart-gridline"
            />
            <text
              x={margin.left - 10}
              y={label.y + 4}
              textAnchor="end"
              className="price-chart-axis-label"
            >
              {label.label}
            </text>
          </g>
        ))}

        {dateLabels.map((label) => (
          <text
            key={label.key}
            x={label.x}
            y={height - 10}
            textAnchor="middle"
            className="price-chart-axis-label"
          >
            {label.label}
          </text>
        ))}

        {series.map((entry) => {
          const polylinePoints = entry.points
            .map((point) => `${xForDate(point.observedAt)},${yForAmount(point.amount)}`)
            .join(" ");

          return (
            <g key={entry.row.rowId}>
              {entry.points.length > 1 ? (
                <polyline
                  fill="none"
                  stroke={entry.color}
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={polylinePoints}
                />
              ) : null}
              {entry.points.map((point) => {
                const cx = xForDate(point.observedAt);
                const cy = yForAmount(point.amount);
                return (
                  <circle
                    key={`${entry.row.rowId}-${point.observedAt}`}
                    cx={cx}
                    cy={cy}
                    r="5"
                    fill={entry.color}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() =>
                      setTooltip({ cx, cy, amount: point.amount, date: point.observedAt })
                    }
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </g>
          );
        })}

        {tooltip &&
          (() => {
            const label = formatUsdPrice(tooltip.amount) ?? "";
            const parsed = new Date(tooltip.date);
            const dateLabel = Number.isNaN(parsed.getTime())
              ? tooltip.date
              : new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC",
                }).format(parsed);
            const text = `${dateLabel}: ${label}`;
            const tooltipWidth = text.length * 7.2 + 16;
            const tooltipHeight = 24;
            const tx = Math.min(tooltip.cx - tooltipWidth / 2, width - tooltipWidth - 4);
            const ty =
              tooltip.cy - tooltipHeight - 8 < margin.top
                ? tooltip.cy + 10
                : tooltip.cy - tooltipHeight - 8;
            return (
              <g style={{ pointerEvents: "none" }}>
                <rect
                  x={tx}
                  y={ty}
                  width={tooltipWidth}
                  height={tooltipHeight}
                  rx="4"
                  className="price-chart-tooltip-bg"
                />
                <text
                  x={tx + tooltipWidth / 2}
                  y={ty + 15.5}
                  textAnchor="middle"
                  className="price-chart-tooltip-text"
                >
                  {text}
                </text>
              </g>
            );
          })()}
      </svg>
    </div>
  );
}

// --- Legacy card interaction components ---
// VariantButtonRow is slated for retirement in the card-search-results-pane
// initiative. VariantSelectorRow (features/VariantSelectorRow.tsx) will replace
// it. Do not add new call sites for VariantButtonRow.

function variantButtonLabel(card: CardRecord, finish: string): string {
  const parts: string[] = [card.set.set_id];
  if (card.variant.alternate_art) parts.push("AA");
  if (card.variant.signed) parts.push("SIG");
  else if (card.variant.overnumbered) parts.push("ON");
  if (finish === "foil" && card.finishes.includes("nonfoil")) parts.push("FOIL");
  return parts.join(" ");
}

export function VariantButtonRow({
  cards,
  showPrice,
  publishedPriceIndex,
  onVariantClick,
  activeKey,
}: {
  cards: CardRecord[];
  showPrice: boolean;
  publishedPriceIndex: ReturnType<typeof usePublishedPriceIndex>["index"];
  onVariantClick: (card: CardRecord, finish: "foil" | "nonfoil") => void;
  activeKey?: string;
}) {
  return (
    <div className="variant-buttons" onClick={(e) => e.stopPropagation()}>
      {cards.flatMap((card) =>
        card.finishes.map((finish) => {
          const key = `${card.id}-${finish}`;
          const label = variantButtonLabel(card, finish);
          const priceRows = getPublishedRowsForCard(publishedPriceIndex, card.tcgplayer_id);
          const priceRow = showPrice ? resolveNearMintMarketPrice(priceRows, finish) : null;
          const priceStr = showPrice ? formatPriceOnly(priceRow) : null;
          return (
            <button
              key={key}
              type="button"
              className={`variant-btn${activeKey === key ? " variant-btn--active" : ""}`}
              onClick={() => onVariantClick(card, finish)}
            >
              <span className="variant-btn-label">{label}</span>
              {priceStr && <span className="variant-btn-price">{priceStr}</span>}
            </button>
          );
        })
      )}
    </div>
  );
}

export function CardQuickLookModal({
  group,
  initialCard,
  initialFinish,
  onClose,
}: {
  group: CardRecord[];
  initialCard: CardRecord;
  initialFinish: "foil" | "nonfoil";
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { index: publishedPriceIndex } = usePublishedPriceIndex();
  const [activeCard, setActiveCard] = useState(initialCard);
  const [activeFinish, setActiveFinish] = useState(initialFinish);

  useEffect(() => {
    setActiveCard(initialCard);
    setActiveFinish(initialFinish);
  }, [initialCard, initialFinish]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  function handleViewDetails() {
    onClose();
    navigate({ href: buildCardDetailPath(activeCard.id) });
  }

  const quickViewBuyHref = useMemo(
    () =>
      buildTcgplayerAffiliateSearchLink({
        query: activeCard.riot_name,
        gameSlug: "riftbound-league-of-legends-trading-card-game",
        productLineName: "riftbound-league-of-legends-trading-card-game",
      }),
    [activeCard.riot_name]
  );

  return (
    <div
      className="card-quick-look-backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className="card-quick-look-dialog"
        role="dialog"
        aria-label={activeCard.riot_name}
        aria-modal="true"
      >
        <div className="card-quick-look-image-col">
          {activeCard.media.image_url ? (
            <img
              src={activeCard.media.image_url}
              alt={activeCard.media.accessibility_text ?? activeCard.riot_name}
            />
          ) : (
            <div className="missing-image">{activeCard.riot_name}</div>
          )}
        </div>
        <div className="card-quick-look-info-col">
          <div className="card-quick-look-header">
            <h2 className="card-quick-look-name">{activeCard.riot_name}</h2>
            <button
              type="button"
              className="card-quick-look-close"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <p className="card-quick-look-typeline">{formatTypeline(activeCard)}</p>
          <div className="card-quick-look-attrs">
            {formatCostText(activeCard) != null && (
              <span className="card-attr-chip card-attr-chip--symbolic">
                {renderTokenizedText(formatCostText(activeCard) ?? "", { size: "chip" })}
              </span>
            )}
            {activeCard.attributes.might != null && (
              <span className="card-attr-chip card-attr-chip--symbolic">
                <span className="card-inline-metric">
                  <span>{activeCard.attributes.might}</span>
                  {renderTokenizedText("{T}", { size: "chip" })}
                </span>
              </span>
            )}
            {activeCard.attributes.domain.length > 0 && (
              <span className={domainChipClass(activeCard.attributes.domain)}>
                {activeCard.attributes.domain.join(", ")}
              </span>
            )}
          </div>
          {activeCard.text.rich && (
            <p className="card-quick-look-text">
              {renderTokenizedText(normalizeCardText(activeCard.text.rich))}
            </p>
          )}
          <VariantButtonRow
            cards={group}
            showPrice={true}
            publishedPriceIndex={publishedPriceIndex}
            onVariantClick={(card, finish) => {
              setActiveCard(card);
              setActiveFinish(finish);
            }}
            activeKey={`${activeCard.id}-${activeFinish}`}
          />
          <div className="card-quick-view-actions">
            {quickViewBuyHref ? (
              <a
                className="card-quick-look-detail-link"
                href={quickViewBuyHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                Buy on TCGPlayer ↗
              </a>
            ) : null}
            <button
              type="button"
              className="card-quick-look-detail-link"
              onClick={handleViewDetails}
            >
              View full details →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
