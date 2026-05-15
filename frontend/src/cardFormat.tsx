import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import {
  buildTcgplayerAffiliateSearchLink,
  formatPrintingLabel,
  formatUsdPrice,
  getPublishedRowsForCard,
  normalizePrinting,
  resolveNearMintMarketPrice,
  usePublishedPriceIndex,
  type PublishedPriceRow,
} from "./lib";
import { buildCardDetailPath } from "./routes";
import type { CardRecord } from "./types";

export function cardEnergy(card: CardRecord): number | null {
  return card.attributes.energy;
}

export const RIFTBOUND_REGIONS = new Set([
  "Noxus", "Freljord", "Ionia", "Demacia", "Piltover", "Zaun",
  "Bilgewater", "Shadow Isles", "Shurima", "Mount Targon",
  "Bandle City", "The Void", "Targon"
]);

export function formatTypeline(card: CardRecord): string {
  const { supertype, cardtype, tags } = card.type;
  const baseName = (card.clean_name ?? card.riot_name).toLowerCase();
  const nameTags = tags.filter((t) => baseName.startsWith(t.toLowerCase()));
  const regionTags = tags.filter((t) => RIFTBOUND_REGIONS.has(t) && !nameTags.includes(t));
  const otherTags = tags.filter((t) => !nameTags.includes(t) && !RIFTBOUND_REGIONS.has(t));
  const sortedTags = [...nameTags, ...regionTags, ...otherTags];

  const left = [supertype, cardtype].filter(Boolean).join(" ");
  const right = sortedTags.join(" ");
  return right ? `${left} - ${right}` : left;
}

export const SYMBOL_MAP: Record<string, string> = {
  rb_might: "{T}",
  rb_exhaust: "{E}",
  rb_rune_fury: "{F}",
  rb_rune_calm: "{C}",
  rb_rune_mind: "{M}",
  rb_rune_body: "{B}",
  rb_rune_chaos: "{H}",
  rb_rune_order: "{O}",
  rb_rune_rainbow: "{P}",
};

export type InlineSymbolVariant = "white" | "black";
export type InlineSymbolSize = "text" | "stat" | "chip";

export function inlineSymbolSrc(token: string, variant: InlineSymbolVariant = "white"): string | null {
  switch (token) {
    case "T":
      return `/assets/riftbound/symbols/stats/might-${variant}.png`;
    case "E":
      return `/assets/riftbound/symbols/actions/exhaust-${variant}.png`;
    case "F":
      return "/assets/riftbound/symbols/runes/rune-fury-inline.png";
    case "C":
      return "/assets/riftbound/symbols/runes/rune-calm-inline.png";
    case "M":
      return "/assets/riftbound/symbols/runes/rune-mind-inline.png";
    case "B":
      return "/assets/riftbound/symbols/runes/rune-body-inline.png";
    case "H":
      return "/assets/riftbound/symbols/runes/rune-chaos-inline.png";
    case "O":
      return "/assets/riftbound/symbols/runes/rune-order-inline.png";
    case "P":
      return "/assets/riftbound/symbols/power/wild-power-inline.png";
    default:
      return null;
  }
}

export function renderMultilineText(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const lines = text.split("\n");
  for (const [index, line] of lines.entries()) {
    nodes.push(line);
    if (index < lines.length - 1) {
      nodes.push(<br key={`${keyPrefix}-br-${index}`} />);
    }
  }
  return nodes;
}

export function renderTokenizedText(
  text: string,
  { variant = "white", size = "text" }: { variant?: InlineSymbolVariant; size?: InlineSymbolSize } = {}
): ReactNode[] {
  const nodes: ReactNode[] = [];
  for (const [index, part] of text.split(/(\{[^}]+\})/g).entries()) {
    const tokenMatch = part.match(/^\{([^}]+)\}$/);
    if (!tokenMatch) {
      nodes.push(...renderMultilineText(part, `text-${index}`));
      continue;
    }

    const token = tokenMatch[1];
    if (/^\d+$/.test(token)) {
      nodes.push(...renderMultilineText(token, `number-${index}`));
      continue;
    }

    const src = inlineSymbolSrc(token, variant);
    if (!src) {
      nodes.push(...renderMultilineText(token, `unknown-${index}`));
      continue;
    }

    nodes.push(
      <img
        key={`symbol-${index}-${token}`}
        className={`card-inline-symbol card-inline-symbol--${size}`}
        src={src}
        alt=""
        aria-hidden="true"
        data-symbol-token={token}
        data-symbol-variant={variant}
      />
    );
  }
  return nodes;
}

export function applySymbols(text: string): string {
  return text
    .replace(/:rb_energy_(\d+):/g, (_, n) => `{${n}}`)
    .replace(/:([a-z_]+):/g, (_, key) => SYMBOL_MAP[key] ?? `{${key}}`);
}

export function normalizeCardText(richText: string): string {
  const stripped = richText
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\[>\]/g, "");
  return applySymbols(stripped).trim();
}

export function formatCostText(card: CardRecord): string | null {
  const rawCost = card.attributes.cost;
  if (rawCost) {
    return rawCost.replace(/\{([^}]+)\}/g, (match, token: string) => {
      if (/^\d+$/.test(token)) return match;
      return inlineSymbolSrc(token) ? match : "{P}";
    });
  }

  if (card.attributes.energy != null) {
    return `{${card.attributes.energy}}`;
  }

  return null;
}

export function domainChipClass(domains: string[]): string {
  if (domains.length === 1) {
    return `card-attr-chip card-attr-chip--domain card-attr-chip--domain-${domains[0].toLowerCase()}`;
  }
  return "card-attr-chip card-attr-chip--domain card-attr-chip--domain-multicolor";
}

export const PRICE_SERIES_COLORS = [
  "var(--chart-series-1)",
  "var(--chart-series-2)",
  "var(--chart-series-3)",
  "var(--chart-series-4)",
  "var(--chart-series-5)",
  "var(--chart-series-6)"
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

  const orderedKeys = ["foil", "normal", ...[...groups.keys()].filter((key) => key !== "foil" && key !== "normal").sort()];

  return orderedKeys
    .filter((key) => groups.has(key))
    .map((key) => ({
      key,
      label: formatPrintingLabel(key),
      rows: groups.get(key) ?? []
    }));
}

type ChartTooltip = { cx: number; cy: number; amount: number; date: string };

export function PriceHistoryChart({ rows, colorsByRowId }: { rows: PublishedPriceRow[]; colorsByRowId: Record<string, string> }) {
  const [tooltip, setTooltip] = useState<ChartTooltip | null>(null);
  const series = rows
    .map((row, index) => ({
      row,
      color: colorsByRowId[row.rowId] ?? PRICE_SERIES_COLORS[index % PRICE_SERIES_COLORS.length],
      points: [...row.priceHistory].sort((left, right) => left.observedAt.localeCompare(right.observedAt))
    }))
    .filter((entry) => entry.points.length > 0);

  if (series.length === 0) {
    return (
      <div className="price-chart-empty">
        Selected price rows do not have enough 7-day history to plot yet.
      </div>
    );
  }

  const allDates = [...new Set(series.flatMap((entry) => entry.points.map((point) => point.observedAt)))].sort();
  const allAmounts = series.flatMap((entry) => entry.points.map((point) => point.amount));
  const minAmount = Math.min(...allAmounts);
  const maxAmount = Math.max(...allAmounts);
  const padding = minAmount === maxAmount ? Math.max(minAmount * 0.1, 1) : (maxAmount - minAmount) * 0.12;
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
    y: yForAmount(value)
  }));
  const dateLabels = allDates.map((value, index) => {
    const parsed = new Date(value);
    const label = Number.isNaN(parsed.getTime())
      ? value
      : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(parsed);

    return {
      key: value,
      label,
      x: margin.left + (chartWidth * index) / dateSpan
    };
  });

  return (
    <div className="price-chart" data-testid="price-history-chart">
      <div className="price-chart-legend">
        {series.map((entry) => (
          <div key={entry.row.rowId} className="price-chart-legend-item">
            <span className="price-chart-legend-swatch" style={{ backgroundColor: entry.color }} />
            <span>{formatSeriesLegendLabel(entry.row)}</span>
          </div>
        ))}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Seven day market price history chart">
        <rect x={margin.left} y={margin.top} width={chartWidth} height={chartHeight} className="price-chart-frame" />

        {axisLabels.map((label) => (
          <g key={label.label}>
            <line
              x1={margin.left}
              y1={label.y}
              x2={margin.left + chartWidth}
              y2={label.y}
              className="price-chart-gridline"
            />
            <text x={margin.left - 10} y={label.y + 4} textAnchor="end" className="price-chart-axis-label">
              {label.label}
            </text>
          </g>
        ))}

        {dateLabels.map((label) => (
          <text key={label.key} x={label.x} y={height - 10} textAnchor="middle" className="price-chart-axis-label">
            {label.label}
          </text>
        ))}

        {series.map((entry) => {
          const polylinePoints = entry.points.map((point) => `${xForDate(point.observedAt)},${yForAmount(point.amount)}`).join(" ");

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
                    onMouseEnter={() => setTooltip({ cx, cy, amount: point.amount, date: point.observedAt })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </g>
          );
        })}

        {tooltip && (() => {
          const label = formatUsdPrice(tooltip.amount) ?? "";
          const parsed = new Date(tooltip.date);
          const dateLabel = Number.isNaN(parsed.getTime())
            ? tooltip.date
            : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(parsed);
          const text = `${dateLabel}: ${label}`;
          const tooltipWidth = text.length * 7.2 + 16;
          const tooltipHeight = 24;
          const tx = Math.min(tooltip.cx - tooltipWidth / 2, width - tooltipWidth - 4);
          const ty = tooltip.cy - tooltipHeight - 8 < margin.top
            ? tooltip.cy + 10
            : tooltip.cy - tooltipHeight - 8;
          return (
            <g style={{ pointerEvents: "none" }}>
              <rect x={tx} y={ty} width={tooltipWidth} height={tooltipHeight} rx="4" className="price-chart-tooltip-bg" />
              <text x={tx + tooltipWidth / 2} y={ty + 15.5} textAnchor="middle" className="price-chart-tooltip-text">{text}</text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

export function CardQuickLookModal({
  card,
  onClose,
  onNavigate
}: {
  card: CardRecord;
  onClose: () => void;
  onNavigate: (path: string) => void;
}) {
  const { index: publishedPriceIndex } = usePublishedPriceIndex();
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
    onNavigate(buildCardDetailPath(card.id));
  }

  const priceRows = useMemo(
    () => getPublishedRowsForCard(publishedPriceIndex, card.tcgplayer_id),
    [publishedPriceIndex, card.tcgplayer_id]
  );
  const nearMintPrice = useMemo(
    () => resolveNearMintMarketPrice(priceRows),
    [priceRows]
  );
  const headlinePrice = formatPriceOnly(nearMintPrice);
  const quickViewBuyHref = useMemo(
    () =>
      buildTcgplayerAffiliateSearchLink({
        query: card.riot_name,
        gameSlug: "riftbound-league-of-legends-trading-card-game",
        productLineName: "riftbound-league-of-legends-trading-card-game"
      }),
    [card.riot_name]
  );

  return (
    <div className="card-quick-look-backdrop" onClick={handleBackdropClick} role="presentation">
      <div className="card-quick-look-dialog" role="dialog" aria-label={card.riot_name} aria-modal="true">
        <div className="card-quick-look-image-col">
          {card.media.image_url ? (
            <img src={card.media.image_url} alt={card.media.accessibility_text ?? card.riot_name} />
          ) : (
            <div className="missing-image">{card.riot_name}</div>
          )}
        </div>
        <div className="card-quick-look-info-col">
          <div className="card-quick-look-header">
            <h2 className="card-quick-look-name">{card.riot_name}</h2>
            <button type="button" className="card-quick-look-close" onClick={onClose} aria-label="Close">✕</button>
          </div>
          <p className="card-quick-look-typeline">{formatTypeline(card)}</p>
          <div className="card-quick-look-attrs">
            {formatCostText(card) != null && (
              <span className="card-attr-chip card-attr-chip--symbolic">
                {renderTokenizedText(formatCostText(card) ?? "", { size: "chip" })}
              </span>
            )}
            {card.attributes.might != null && (
              <span className="card-attr-chip card-attr-chip--symbolic">
                <span className="card-inline-metric">
                  <span>{card.attributes.might}</span>
                  {renderTokenizedText("{T}", { size: "chip" })}
                </span>
              </span>
            )}
            {card.attributes.domain.length > 0 && (
              <span className={domainChipClass(card.attributes.domain)}>{card.attributes.domain.join(", ")}</span>
            )}
          </div>
          {card.text.rich && <p className="card-quick-look-text">{renderTokenizedText(normalizeCardText(card.text.rich))}</p>}
          <div className="card-quick-look-meta">
            <span>{card.set.label} · {card.set.set_id} {card.collector_number ?? "?"}</span>
            {card.rarity && <span>{card.rarity}</span>}
            {headlinePrice ? <span className="card-quick-look-price">{headlinePrice}</span> : null}
          </div>
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
            <button type="button" className="card-quick-look-detail-link" onClick={handleViewDetails}>
              View full details →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
