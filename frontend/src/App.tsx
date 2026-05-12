import { type CSSProperties, type FormEvent, type MouseEvent, type PointerEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { generateSealedPool, getCard, loadPackGeneratorOptions, loadQueryFeatures, searchCards } from "./api";
import { CardSearchGuide } from "./CardSearchGuide";
import DeckExplorerView from "./DeckExplorerView";
import {
  formatPrintingLabel,
  formatUsdPrice,
  getPublishedRowsForCard,
  normalizePrinting,
  resolveNearMintMarketPrice,
  sortPriceRows,
  usePublishedPriceIndex,
  type PublishedPriceRow
} from "./priceData";
import QueryBuilderView from "./QueryBuilderView";
import TradeBalancerView from "./TradeBalancerView";
import { buildCardDetailPath, buildCardsSearchPath, normalizePathname, parseAppRoute, routeSection } from "./routes";
import TierListView from "./TierListView";
import type {
  CardRecord,
  GeneratedPoolCard,
  GeneratedSealedPool,
  GenerateSealedPoolRequest,
  PackGeneratorOptions,
  PackSetId,
  QueryDiagnostic,
  QueryFieldGuide,
  QuerySyntaxGuide,
} from "./types";

const domainOrder = ["Fury", "Calm", "Mind", "Body", "Chaos", "Order"] as const;
const domainSectionOrder = [...domainOrder, "Multicolor", "Other"] as const;
const fallbackPackSets: Array<{ id: PackSetId; label: string; supportsPreRift: boolean }> = [
  { id: "OGN", label: "Origins", supportsPreRift: false },
  { id: "SFD", label: "Spiritforged", supportsPreRift: true },
  { id: "UNL", label: "Unleashed", supportsPreRift: true }
];

type PoolView = "packs" | "domain" | "champions" | "units" | "spells" | "gear";
type SealedMode = "standard-OGN" | "standard-SFD" | "pre-rift-SFD" | "standard-UNL" | "pre-rift-UNL" | "custom";
type PreRiftSetId = Extract<PackSetId, "SFD" | "UNL">;
type BlockEntryGroup = {
  key: string;
  entries: GeneratedPoolCard[];
};
type CardPreviewState = {
  entry: GeneratedPoolCard;
  x: number;
  y: number;
};
type CardPreviewHandler = (entry: GeneratedPoolCard, event: PointerEvent<HTMLButtonElement>) => void;
type CardLayout = "portrait" | "landscape";
type DeckSnapshot = {
  id: string;
  name: string;
  mainDeckCards: GeneratedPoolCard[];
  battlefieldEntryIds: Array<string | null>;
  legendEntryId: string | null;
  championEntryId: string | null;
};

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path
        d="m20.7 19.3-4.2-4.2a7.5 7.5 0 1 0-1.4 1.4l4.2 4.2a1 1 0 0 0 1.4-1.4ZM5 10.5a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CardsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M6 3h10a2 2 0 0 1 2 2v13H8a2 2 0 0 1-2-2V3Zm2 2v11h8V5H8Zm-2 15h12v2H6a4 4 0 0 1-4-4V7h2v11a2 2 0 0 0 2 2Z" fill="currentColor" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false" className={expanded ? "chevron expanded" : "chevron"}>
      <path d="M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6 1.4-1.4Z" fill="currentColor" />
    </svg>
  );
}

function CollapsibleFeatureTable({
  title,
  expanded,
  onToggle,
  children
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const contentId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-table`;

  return (
    <div className="feature-table-group">
      <div className="feature-table-heading">
        <h3>{title}</h3>
        <button
          type="button"
          className="icon-button"
          aria-controls={contentId}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Hide" : "Show"} ${title}`}
          title={`${expanded ? "Hide" : "Show"} ${title}`}
          onClick={onToggle}
        >
          <ChevronIcon expanded={expanded} />
        </button>
      </div>
      {expanded ? (
        <div id={contentId} className="feature-table-wrap">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function QueryLanguageTables({
  fields,
  syntax
}: {
  fields: QueryFieldGuide[];
  syntax: QuerySyntaxGuide[];
}) {
  const [showGuide, setShowGuide] = useState(false);
  const [showFields, setShowFields] = useState(false);
  const [showSyntax, setShowSyntax] = useState(false);

  return (
    <section className="feature-section" aria-labelledby="query-language-heading">
      <div className="section-heading">
        <h2 id="query-language-heading">Query Language</h2>
        <p>Find cards by property, then combine searches with syntax operations.</p>
      </div>
      <CollapsibleFeatureTable title="Search by Card Element" expanded={showGuide} onToggle={() => setShowGuide((current) => !current)}>
        <CardSearchGuide />
      </CollapsibleFeatureTable>
      <CollapsibleFeatureTable title="Searchable Fields" expanded={showFields} onToggle={() => setShowFields((current) => !current)}>
        <table className="feature-table">
          <thead>
            <tr>
              <th>I want cards with...</th>
              <th>Use this query</th>
              <th>Shorthand</th>
              <th>Searches</th>
              <th>Example</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => (
              <tr key={field.property}>
                <td>{field.property}</td>
                <td><code>{field.query}</code></td>
                <td>{field.shorthand ? <code>{field.shorthand}</code> : "None"}</td>
                <td>{field.searches}</td>
                <td><code>{field.example}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CollapsibleFeatureTable>
      <CollapsibleFeatureTable title="Query Syntax" expanded={showSyntax} onToggle={() => setShowSyntax((current) => !current)}>
        <table className="feature-table">
          <thead>
            <tr>
              <th>Operation</th>
              <th>Syntax Examples</th>
              <th>Behavior</th>
            </tr>
          </thead>
          <tbody>
            {syntax.map((operation) => (
              <tr key={operation.operation}>
                <td>{operation.operation}</td>
                <td>
                  <div className="example-list">
                    {operation.examples.map((example) => (
                      <code key={example}>{example}</code>
                    ))}
                  </div>
                </td>
                <td>{operation.behavior}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CollapsibleFeatureTable>
    </section>
  );
}

function Diagnostics({ diagnostics }: { diagnostics: QueryDiagnostic[] }) {
  if (diagnostics.length === 0) return null;

  return (
    <div className="diagnostics" role="alert">
      <strong>Query needs attention</strong>
      <ul>
        {diagnostics.map((diagnostic, index) => (
          <li key={`${diagnostic.message}-${index}`}>{diagnostic.message}</li>
        ))}
      </ul>
    </div>
  );
}

type SortKey = "energy-asc" | "energy-desc" | "name-asc" | "name-desc" | "set";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "energy-asc", label: "Energy ↑" },
  { value: "energy-desc", label: "Energy ↓" },
  { value: "name-asc", label: "Name A→Z" },
  { value: "name-desc", label: "Name Z→A" },
  { value: "set", label: "Set order" },
];

function sortCardsByKey(cards: CardRecord[], sort: SortKey): CardRecord[] {
  if (sort === "set") return cards;
  return [...cards].sort((a, b) => {
    switch (sort) {
      case "energy-asc": {
        const eA = cardEnergy(a) ?? Infinity;
        const eB = cardEnergy(b) ?? Infinity;
        if (eA !== eB) return eA - eB;
        return (a.attributes.power ?? Infinity) - (b.attributes.power ?? Infinity);
      }
      case "energy-desc": {
        const eA = cardEnergy(a) ?? -Infinity;
        const eB = cardEnergy(b) ?? -Infinity;
        if (eA !== eB) return eB - eA;
        return (b.attributes.power ?? -Infinity) - (a.attributes.power ?? -Infinity);
      }
      case "name-asc":
        return a.riot_name.localeCompare(b.riot_name);
      case "name-desc":
        return b.riot_name.localeCompare(a.riot_name);
    }
  });
}

const RIFTBOUND_REGIONS = new Set([
  "Noxus", "Freljord", "Ionia", "Demacia", "Piltover", "Zaun",
  "Bilgewater", "Shadow Isles", "Shurima", "Mount Targon",
  "Bandle City", "The Void", "Targon"
]);

function formatTypeline(card: CardRecord): string {
  const { supertype, cardtype, tags } = card.type;
  // A tag is a "name tag" if it matches the start of the card's clean_name
  // (e.g. "Vex" in "Vex Apathetic", "Heimerdinger" in "Heimerdinger Inventor")
  const baseName = (card.clean_name ?? card.riot_name).toLowerCase();
  const nameTags = tags.filter((t) => baseName.startsWith(t.toLowerCase()));
  const regionTags = tags.filter((t) => RIFTBOUND_REGIONS.has(t) && !nameTags.includes(t));
  const otherTags = tags.filter((t) => !nameTags.includes(t) && !RIFTBOUND_REGIONS.has(t));
  const sortedTags = [...nameTags, ...regionTags, ...otherTags];

  const left = [supertype, cardtype].filter(Boolean).join(" ");
  const right = sortedTags.join(" ");
  return right ? `${left} - ${right}` : left;
}

const SYMBOL_MAP: Record<string, string> = {
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

type InlineSymbolVariant = "white" | "black";
type InlineSymbolSize = "text" | "stat" | "chip";

function inlineSymbolSrc(token: string, variant: InlineSymbolVariant = "white"): string | null {
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

function renderMultilineText(text: string, keyPrefix: string): ReactNode[] {
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

function renderTokenizedText(
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

function applySymbols(text: string): string {
  return text
    // Energy costs: :rb_energy_N: → {N}
    .replace(/:rb_energy_(\d+):/g, (_, n) => `{${n}}`)
    // Known named symbols
    .replace(/:([a-z_]+):/g, (_, key) => SYMBOL_MAP[key] ?? `{${key}}`);
}

function normalizeCardText(richText: string): string {
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

function formatCostText(card: CardRecord): string | null {
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

function domainChipClass(domains: string[]): string {
  if (domains.length === 1) {
    return `card-attr-chip card-attr-chip--domain card-attr-chip--domain-${domains[0].toLowerCase()}`;
  }
  return "card-attr-chip card-attr-chip--domain card-attr-chip--domain-multicolor";
}

const PRICE_SERIES_COLORS = ["#f59e0b", "#ef4444", "#38bdf8", "#a78bfa", "#34d399", "#f472b6"] as const;

type PricePrintingGroup = {
  key: string;
  label: string;
  rows: PublishedPriceRow[];
};

function formatHeadlinePrice(row: PublishedPriceRow | null): string | null {
  const price = formatUsdPrice(row?.currentPrice.amount);
  if (!price || !row?.condition) {
    return null;
  }

  return `${row.condition} ${price}`;
}

function formatPriceOnly(row: PublishedPriceRow | null): string | null {
  return formatUsdPrice(row?.currentPrice.amount);
}

function formatSeriesToggleLabel(row: PublishedPriceRow): string {
  const condition = row.condition ?? "Unknown";
  const price = formatUsdPrice(row.currentPrice.amount);
  return price ? `${condition} ${price}` : condition;
}

function formatSeriesLegendLabel(row: PublishedPriceRow): string {
  const printing = formatPrintingLabel(row.printing);
  const condition = row.condition ?? "Unknown";
  return `${printing} • ${condition}`;
}

function groupRowsByPrinting(rows: PublishedPriceRow[]): PricePrintingGroup[] {
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

function PriceHistoryChart({ rows, colorsByRowId }: { rows: PublishedPriceRow[]; colorsByRowId: Record<string, string> }) {
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

function CardGrid({ cards, onCardClick }: { cards: CardRecord[]; onCardClick?: (card: CardRecord) => void }) {
  const [sort, setSort] = useState<SortKey>("energy-asc");
  const sorted = useMemo(() => sortCardsByKey(cards, sort), [cards, sort]);

  return (
    <section className="results-section" aria-labelledby="results-heading">
      <div className="section-heading compact">
        <h2 id="results-heading">Results</h2>
        <div className="results-controls">
          <p>{cards.length.toLocaleString()} matching cards</p>
          <label htmlFor="sort-select" className="sort-label">Sort</label>
          <select
            id="sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="sort-select"
          >
            {SORT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="card-grid" data-testid="card-grid" data-columns="4">
        {sorted.map((card) => (
          <article
            className={`card-tile${onCardClick ? " card-tile--clickable" : ""}`}
            key={card.id}
            data-layout={card.media.layout}
            onClick={onCardClick ? () => onCardClick(card) : undefined}
          >
            {card.media.image_url ? (
              <img
                src={card.media.image_url}
                alt={card.media.accessibility_text ?? card.riot_name}
                loading="lazy"
              />
            ) : (
              <div className="missing-image">{card.riot_name}</div>
            )}
            <div className="card-caption">
              <strong>{card.riot_name}</strong>
              <span>
                {card.set.set_id} {card.collector_number ?? "?"}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CardQuickLookModal({ card, onClose, onNavigate }: { card: CardRecord; onClose: () => void; onNavigate: (path: string) => void }) {
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
          <button type="button" className="card-quick-look-detail-link" onClick={handleViewDetails}>
            View full details →
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchView({
  onError,
  locationSearch,
  onNavigate
}: {
  onError: (message: string | null) => void;
  locationSearch: string;
  onNavigate: (nextPath: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [diagnostics, setDiagnostics] = useState<QueryDiagnostic[]>([]);
  const [fieldGuides, setFieldGuides] = useState<QueryFieldGuide[]>([]);
  const [syntaxGuides, setSyntaxGuides] = useState<QuerySyntaxGuide[]>([]);
  const [normalizedQuery, setNormalizedQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [quickLookCard, setQuickLookCard] = useState<CardRecord | null>(null);
  const searchParamQuery = new URLSearchParams(locationSearch).get("q") ?? "";

  async function runSearch(nextQuery: string) {
    setIsSearching(true);
    onError(null);
    setHasSearched(true);
    try {
      const result = await searchCards(nextQuery);
      setCards(result.items);
      setDiagnostics(result.diagnostics);
      setNormalizedQuery(result.normalizedQuery);
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Search failed.");
    } finally {
      setIsSearching(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function boot() {
      try {
        const featureResult = await loadQueryFeatures();
        if (!ignore) {
          setFieldGuides(featureResult.fields);
          setSyntaxGuides(featureResult.syntax);
        }
      } catch (caught) {
        if (!ignore) {
          onError(caught instanceof Error ? caught.message : "Unable to load card search.");
        }
      }
    }

    void boot();

    return () => {
      ignore = true;
    };
  }, [onError]);

  useEffect(() => {
    let ignore = false;

    setQuery(searchParamQuery);
    onError(null);

    if (searchParamQuery.trim().length === 0) {
      setCards([]);
      setDiagnostics([]);
      setNormalizedQuery("");
      setHasSearched(false);
      return () => {
        ignore = true;
      };
    }

    setIsSearching(true);
    setHasSearched(true);

    async function syncSearchFromUrl() {
      try {
        const result = await searchCards(searchParamQuery);
        if (ignore) {
          return;
        }

        setCards(result.items);
        setDiagnostics(result.diagnostics);
        setNormalizedQuery(result.normalizedQuery);
      } catch (caught) {
        if (!ignore) {
          onError(caught instanceof Error ? caught.message : "Search failed.");
        }
      } finally {
        if (!ignore) {
          setIsSearching(false);
        }
      }
    }

    void syncSearchFromUrl();

    return () => {
      ignore = true;
    };
  }, [locationSearch, onError, searchParamQuery]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    const nextPath = trimmedQuery.length > 0 ? `/cards?q=${encodeURIComponent(query)}` : "/cards";
    const currentPath = `${normalizePathname(window.location.pathname)}${window.location.search}`;

    if (nextPath === currentPath) {
      void runSearch(query);
      return;
    }

    onNavigate(nextPath);
  }

  return (
    <>
      <section className="search-panel" aria-labelledby="search-heading">
        <div className="search-copy">
          <p className="eyebrow">Noxian Netdecks</p>
          <h1 id="search-heading">Riftbound Card Search</h1>
        </div>
        <form className="search-form" onSubmit={handleSubmit}>
          <label htmlFor="query-input">Query</label>
          <div className="search-row">
            <input
              id="query-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='t:unit d:body e>=3'
              autoComplete="off"
              autoCapitalize="none"
            />
            <button type="submit" disabled={isSearching}>
              <SearchIcon />
              <span>{isSearching ? "Searching" : "Search"}</span>
            </button>
          </div>
          <output className="normalized-query" aria-live="polite">
            {normalizedQuery ? `Normalized: ${normalizedQuery}` : "Run a search to show matching cards."}
          </output>
        </form>
      </section>

      <Diagnostics diagnostics={diagnostics} />
      <QueryLanguageTables fields={fieldGuides} syntax={syntaxGuides} />
      {hasSearched ? <CardGrid cards={cards} onCardClick={setQuickLookCard} /> : null}
      {quickLookCard ? (
        <CardQuickLookModal card={quickLookCard} onClose={() => setQuickLookCard(null)} onNavigate={onNavigate} />
      ) : null}
    </>
  );
}

function cardEnergy(card: CardRecord): number | null {
  return card.attributes.energy;
}

function legalCardKey(entry: GeneratedPoolCard): string {
  return entry.card.riftbound_id ?? entry.card.clean_name ?? entry.card.id;
}

function cardNameKey(entry: GeneratedPoolCard): string {
  return entry.card.riot_name.toLocaleLowerCase();
}

function domainSection(card: CardRecord): (typeof domainSectionOrder)[number] {
  const matchingDomains = domainOrder.filter((domain) => card.attributes.domain.includes(domain));

  if (matchingDomains.length > 1) return "Multicolor";
  return matchingDomains[0] ?? "Other";
}

function isLegend(entry: GeneratedPoolCard): boolean {
  return entry.card.type.cardtype === "Legend";
}

function isChampionUnit(entry: GeneratedPoolCard): boolean {
  return entry.card.type.cardtype === "Unit" && entry.card.type.supertype === "Champion";
}

function isBattlefield(entry: GeneratedPoolCard): boolean {
  return entry.card.type.cardtype === "Battlefield";
}

function isMainDeckEntry(entry: GeneratedPoolCard): boolean {
  return !isBattlefield(entry) && !isLegend(entry);
}

function cardDisplayLayout(card: CardRecord): CardLayout {
  return card.type.cardtype === "Battlefield" || card.media.layout === "landscape" ? "landscape" : "portrait";
}

function allPoolCards(pool: GeneratedSealedPool | null): GeneratedPoolCard[] {
  return pool?.packs.flatMap((pack) => pack.cards) ?? [];
}

function packSetLabel(packSets: Array<{ id: PackSetId; label: string }>, setId: PackSetId): string {
  return packSets.find((set) => set.id === setId)?.label ?? setId;
}

function groupedByEnergy(cards: GeneratedPoolCard[]): Array<{ energy: number | null; groups: BlockEntryGroup[]; hasLandscape: boolean }> {
  const energyGroups = new Map<string, GeneratedPoolCard[]>();

  for (const card of cards) {
    const energy = cardEnergy(card.card);
    const key = energy === null ? "none" : String(energy);
    energyGroups.set(key, [...(energyGroups.get(key) ?? []), card]);
  }

  return [...energyGroups.entries()]
    .map(([key, entries]) => ({
      energy: key === "none" ? null : Number(key),
      groups: groupedByLegalCard(entries),
      hasLandscape: entries.some((entry) => cardDisplayLayout(entry.card) === "landscape")
    }))
    .sort((left, right) => {
      if (left.energy === null && right.energy === null) return 0;
      if (left.energy === null) return 1;
      if (right.energy === null) return -1;
      return left.energy - right.energy;
    });
}

function groupedByLegalCard(cards: GeneratedPoolCard[]): BlockEntryGroup[] {
  const groups = new Map<string, GeneratedPoolCard[]>();

  for (const card of [...cards].sort((left, right) => cardNameKey(left).localeCompare(cardNameKey(right)))) {
    const key = legalCardKey(card);
    groups.set(key, [...(groups.get(key) ?? []), card]);
  }

  return [...groups.entries()].map(([key, entries]) => ({ key, entries }));
}

function PoolCard({
  entry,
  onClick,
  inDeck = false,
  onPreview,
  onPreviewEnd,
  labelPrefix = "Add"
}: {
  entry: GeneratedPoolCard;
  onClick?: () => void;
  inDeck?: boolean;
  onPreview?: CardPreviewHandler;
  onPreviewEnd?: () => void;
  labelPrefix?: string;
}) {
  const image = entry.card.media.image_url;
  const label = `${labelPrefix} ${entry.card.riot_name}`;
  const layout = cardDisplayLayout(entry.card);

  return (
    <button
      type="button"
      className={inDeck ? "pool-card in-deck" : "pool-card"}
      aria-label={label}
      data-entry-id={entry.id}
      data-in-deck={inDeck ? "true" : "false"}
      data-layout={layout}
      title={entry.card.riot_name}
      onClick={onClick}
      onPointerEnter={onPreview ? (event) => onPreview(entry, event) : undefined}
      onPointerMove={onPreview ? (event) => onPreview(entry, event) : undefined}
      onPointerLeave={onPreviewEnd}
      onPointerCancel={onPreviewEnd}
    >
      {image ? (
        <img src={image} alt={entry.card.media.accessibility_text ?? entry.card.riot_name} loading="lazy" />
      ) : (
        <span className="missing-image">{entry.card.riot_name}</span>
      )}
      <span className="foil-mark" data-finish={entry.finish}>{entry.finish === "foil" ? "F" : ""}</span>
    </button>
  );
}

function CardBlock({
  title,
  cards,
  deckEntryIds,
  onCardClick,
  onPreview,
  onPreviewEnd
}: {
  title: string;
  cards: GeneratedPoolCard[];
  deckEntryIds: Set<string>;
  onCardClick: (entry: GeneratedPoolCard) => void;
  onPreview: CardPreviewHandler;
  onPreviewEnd: () => void;
}) {
  const columns = groupedByEnergy(cards);

  return (
    <section className="pool-block" aria-label={title}>
      <header className="pool-block-header">
        <h3>{title}</h3>
        <span>{cards.length}</span>
      </header>
      {cards.length === 0 ? (
        <div className="empty-block">Empty</div>
      ) : (
        <div className="energy-board">
          {columns.map((column) => (
            <div
              className="energy-column"
              key={column.energy ?? "none"}
              data-testid="energy-column"
              data-energy={column.energy ?? "none"}
              data-wide={column.hasLandscape ? "true" : "false"}
            >
              <div className="energy-label">{column.energy ?? "No Cost"}</div>
              {column.groups.map((group) => {
                const layout = group.entries.some((entry) => cardDisplayLayout(entry.card) === "landscape") ? "landscape" : "portrait";
                const baseHeight = layout === "landscape" ? "var(--sealed-landscape-card-height)" : "var(--sealed-card-height)";

                return (
                  <div
                    className="distinct-card-group"
                    key={group.key}
                    data-layout={layout}
                    style={{
                      "--copy-count": String(group.entries.length),
                      height: `calc(${baseHeight} + ${(group.entries.length - 1) * 14}px)`
                    } as CSSProperties}
                  >
                    {group.entries.map((entry, copyIndex) => (
                      <div
                        className="copy-card"
                        key={entry.id}
                        style={{ "--copy-index": String(copyIndex) } as CSSProperties}
                      >
                        <PoolCard
                          entry={entry}
                          inDeck={deckEntryIds.has(entry.id)}
                          onClick={() => onCardClick(entry)}
                          onPreview={onPreview}
                          onPreviewEnd={onPreviewEnd}
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function DeckZone({
  title,
  selectedEntryId,
  options,
  onChange,
  onPreview,
  onPreviewEnd
}: {
  title: string;
  selectedEntryId: string | null;
  options: GeneratedPoolCard[];
  onChange: (entryId: string | null) => void;
  onPreview: CardPreviewHandler;
  onPreviewEnd: () => void;
}) {
  const entry = options.find((candidate) => candidate.id === selectedEntryId) ?? null;
  const controlId = `${title.toLowerCase()}-selection`;

  return (
    <div
      className="deck-zone"
      data-filled={entry ? "true" : "false"}
      aria-label={`${title} zone`}
    >
      <div className="deck-zone-title">
        <span>{title}</span>
      </div>
      <label className="zone-select-label" htmlFor={controlId}>{title} selection</label>
      <select
        id={controlId}
        value={selectedEntryId ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">No {title}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.card.riot_name}
          </option>
        ))}
      </select>
      {entry ? (
        <PoolCard
          entry={entry}
          labelPrefix={`${title}:`}
          onPreview={onPreview}
          onPreviewEnd={onPreviewEnd}
        />
      ) : (
        <div className="zone-placeholder" data-accepts={title.toLowerCase()}>Empty</div>
      )}
    </div>
  );
}

function BattlefieldBack({ slotNumber }: { slotNumber: number }) {
  return (
    <div className="battlefield-back" role="img" aria-label={`Empty battlefield slot ${slotNumber}`}>
      <span>Battlefield</span>
    </div>
  );
}

function BattlefieldSlot({
  slotNumber,
  selectedEntryId,
  options,
  unavailableEntryIds,
  onChange,
  onPreview,
  onPreviewEnd
}: {
  slotNumber: number;
  selectedEntryId: string | null;
  options: GeneratedPoolCard[];
  unavailableEntryIds: Set<string>;
  onChange: (entryId: string | null) => void;
  onPreview: CardPreviewHandler;
  onPreviewEnd: () => void;
}) {
  const entry = options.find((candidate) => candidate.id === selectedEntryId) ?? null;
  const controlId = `battlefield-${slotNumber}-selection`;

  return (
    <div className="battlefield-slot" data-filled={entry ? "true" : "false"}>
      <label className="zone-select-label" htmlFor={controlId}>Battlefield {slotNumber}</label>
      <select
        id={controlId}
        value={selectedEntryId ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">No Battlefield</option>
        {options
          .filter((option) => option.id === selectedEntryId || !unavailableEntryIds.has(option.id))
          .map((option) => (
            <option key={option.id} value={option.id}>
              {option.card.riot_name}
            </option>
          ))}
      </select>
      {entry ? (
        <PoolCard
          entry={entry}
          labelPrefix={`Battlefield ${slotNumber}:`}
          onPreview={onPreview}
          onPreviewEnd={onPreviewEnd}
        />
      ) : (
        <BattlefieldBack slotNumber={slotNumber} />
      )}
    </div>
  );
}

function DeckCountChip({
  label,
  value,
  target,
  valid
}: {
  label: string;
  value: number;
  target: string;
  valid: boolean;
}) {
  return (
    <span className="deck-count-chip" data-testid={`${label.toLowerCase()}-deck-count`} data-valid={valid ? "true" : "false"}>
      <span>{label}</span>
      <strong>{value}</strong>
      <span>/{target}</span>
    </span>
  );
}

function DeckCardBoard({
  cards,
  onRemove,
  onPreview,
  onPreviewEnd
}: {
  cards: GeneratedPoolCard[];
  onRemove: (entryId: string) => void;
  onPreview: CardPreviewHandler;
  onPreviewEnd: () => void;
}) {
  const columns = groupedByEnergy(cards);

  return (
    <div className="energy-board deck-energy-board" data-testid="decklist-strip">
      {columns.map((column) => (
        <div
          className="energy-column"
          key={column.energy ?? "none"}
          data-testid="energy-column"
          data-energy={column.energy ?? "none"}
          data-wide={column.hasLandscape ? "true" : "false"}
        >
          <div className="energy-label">{column.energy ?? "No Cost"}</div>
          {column.groups.map((group) => {
            const layout = group.entries.some((entry) => cardDisplayLayout(entry.card) === "landscape") ? "landscape" : "portrait";
            const baseHeight = layout === "landscape" ? "var(--sealed-landscape-card-height)" : "var(--sealed-card-height)";

            return (
              <div
                className="distinct-card-group"
                key={group.key}
                data-layout={layout}
                style={{
                  "--copy-count": String(group.entries.length),
                  height: `calc(${baseHeight} + ${(group.entries.length - 1) * 14}px)`
                } as CSSProperties}
              >
                {group.entries.map((entry, copyIndex) => (
                  <div
                    className="copy-card"
                    key={entry.id}
                    style={{ "--copy-index": String(copyIndex) } as CSSProperties}
                  >
                    <PoolCard
                      entry={entry}
                      onClick={() => onRemove(entry.id)}
                      onPreview={onPreview}
                      onPreviewEnd={onPreviewEnd}
                      labelPrefix="Remove"
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function DecklistPanel({
  poolCards,
  mainDeckCards,
  battlefieldEntryIds,
  legendEntryId,
  championEntryId,
  snapshots,
  onRemove,
  onAssignBattlefield,
  onAssignLegend,
  onAssignChampion,
  onOpenSnapshot,
  onRestoreSnapshot,
  onClearDeck,
  onPreview,
  onPreviewEnd
}: {
  poolCards: GeneratedPoolCard[];
  mainDeckCards: GeneratedPoolCard[];
  battlefieldEntryIds: Array<string | null>;
  legendEntryId: string | null;
  championEntryId: string | null;
  snapshots: DeckSnapshot[];
  onRemove: (entryId: string) => void;
  onAssignBattlefield: (slotIndex: number, entryId: string | null) => void;
  onAssignLegend: (entryId: string | null) => void;
  onAssignChampion: (entryId: string | null) => void;
  onOpenSnapshot: () => void;
  onRestoreSnapshot: (snapshot: DeckSnapshot) => void;
  onClearDeck: () => void;
  onPreview: CardPreviewHandler;
  onPreviewEnd: () => void;
}) {
  const legendOptions = poolCards.filter(isLegend);
  const championOptions = poolCards.filter(isChampionUnit);
  const battlefieldOptions = poolCards.filter(isBattlefield);
  const selectedBattlefieldIds = new Set(battlefieldEntryIds.filter((entryId): entryId is string => Boolean(entryId)));
  const battlefieldCount = selectedBattlefieldIds.size;
  const legendCount = legendEntryId ? 1 : 0;
  const championCount = championEntryId ? 1 : 0;
  const unitCount = mainDeckCards.filter((entry) => entry.card.type.cardtype === "Unit").length;
  const spellCount = mainDeckCards.filter((entry) => entry.card.type.cardtype === "Spell").length;
  const gearCount = mainDeckCards.filter((entry) => entry.card.type.cardtype === "Gear").length;
  const hasDeckSelection = mainDeckCards.length > 0 || battlefieldCount > 0 || legendCount > 0 || championCount > 0;

  return (
    <section className="decklist-panel" aria-labelledby="decklist-heading">
      <div className="decklist-toolbar">
        <div className="decklist-title-stack">
          <div className="decklist-title-row">
            <h2 id="decklist-heading">Decklist</h2>
            <button type="button" className="text-button strong" onClick={onOpenSnapshot} disabled={!hasDeckSelection}>
              Snapshot
            </button>
          </div>
          <div className="deck-counts" aria-label="Deck counts">
            <DeckCountChip label="Main" value={mainDeckCards.length} target="25" valid={mainDeckCards.length === 25} />
            <DeckCountChip label="Battlefields" value={battlefieldCount} target="3" valid={battlefieldCount >= 0 && battlefieldCount <= 3} />
            <DeckCountChip label="Legend" value={legendCount} target="1" valid={legendCount >= 0 && legendCount <= 1} />
            <DeckCountChip label="Champion" value={championCount} target="1" valid={championCount >= 0 && championCount <= 1} />
          </div>
          <div className="deck-type-summary" aria-label="Deck type summary">
            <span>Units {unitCount}</span>
            <span>Spells {spellCount}</span>
            <span>Gear {gearCount}</span>
          </div>

        </div>
        <button type="button" className="text-button strong" onClick={onClearDeck} disabled={!hasDeckSelection}>
          Clear
        </button>
      </div>
      <div
        className="snapshot-strip"
        data-testid="snapshot-strip"
        data-snapshot-count={snapshots.length}
        aria-label="Saved snapshots"
      >
        {snapshots.map((snapshot) => (
          <button
            key={snapshot.id}
            type="button"
            className="snapshot-button"
            onClick={() => onRestoreSnapshot(snapshot)}
          >
            {snapshot.name}
          </button>
        ))}
      </div>
      <div className="decklist-main">
        {mainDeckCards.length === 0 ? (
          <div className="empty-block">Empty</div>
        ) : (
          <DeckCardBoard
            cards={mainDeckCards}
            onRemove={onRemove}
            onPreview={onPreview}
            onPreviewEnd={onPreviewEnd}
          />
        )}
      </div>
      <div className="deck-zones">
        <div className="battlefield-slots" aria-label="Battlefield slots">
          {battlefieldEntryIds.map((entryId, index) => (
            <BattlefieldSlot
              key={`battlefield-slot-${index + 1}`}
              slotNumber={index + 1}
              selectedEntryId={entryId}
              options={battlefieldOptions}
              unavailableEntryIds={new Set([...selectedBattlefieldIds].filter((selectedId) => selectedId !== entryId))}
              onChange={(nextEntryId) => onAssignBattlefield(index, nextEntryId)}
              onPreview={onPreview}
              onPreviewEnd={onPreviewEnd}
            />
          ))}
        </div>
        <div className="deck-role-zones">
          <DeckZone
            title="Legend"
            selectedEntryId={legendEntryId}
            options={legendOptions}
            onChange={onAssignLegend}
            onPreview={onPreview}
            onPreviewEnd={onPreviewEnd}
          />
          <DeckZone
            title="Champion"
            selectedEntryId={championEntryId}
            options={championOptions}
            onChange={onAssignChampion}
            onPreview={onPreview}
            onPreviewEnd={onPreviewEnd}
          />
        </div>
      </div>
    </section>
  );
}

function domainBlocks(
  cards: GeneratedPoolCard[],
  deckEntryIds: Set<string>,
  onCardClick: (entry: GeneratedPoolCard) => void,
  onPreview: CardPreviewHandler,
  onPreviewEnd: () => void
) {
  const grouped = new Map<(typeof domainSectionOrder)[number], GeneratedPoolCard[]>();

  for (const domain of domainSectionOrder) {
    grouped.set(domain, []);
  }

  for (const card of cards) {
    const domain = domainSection(card.card);
    grouped.set(domain, [...(grouped.get(domain) ?? []), card]);
  }

  return [...grouped.entries()]
    .filter(([, entries], index) => index < domainOrder.length || entries.length > 0)
    .map(([domain, entries]) => (
      <CardBlock
        key={domain}
        title={domain}
        cards={entries}
        deckEntryIds={deckEntryIds}
        onCardClick={onCardClick}
        onPreview={onPreview}
        onPreviewEnd={onPreviewEnd}
      />
    ));
}

function PoolDisplay({
  pool,
  view,
  deckEntryIds,
  onCardClick,
  onPreview,
  onPreviewEnd
}: {
  pool: GeneratedSealedPool | null;
  view: PoolView;
  deckEntryIds: Set<string>;
  onCardClick: (entry: GeneratedPoolCard) => void;
  onPreview: CardPreviewHandler;
  onPreviewEnd: () => void;
}) {
  if (!pool) {
    return (
      <section className="pool-display">
        <div className="empty-pool">No Pool</div>
      </section>
    );
  }

  const cards = allPoolCards(pool);

  if (view === "packs") {
    return (
      <section className="pool-display pack-view" aria-label="Generated packs">
        {pool.packs.map((pack) => (
          <div className="pack-window" key={pack.id}>
            <CardBlock
              title={pack.label}
              cards={pack.cards}
              deckEntryIds={deckEntryIds}
              onCardClick={onCardClick}
              onPreview={onPreview}
              onPreviewEnd={onPreviewEnd}
            />
          </div>
        ))}
      </section>
    );
  }

  if (view === "champions") {
    return (
      <section className="pool-display grouped-view" aria-label="Champions and legends">
        <CardBlock
          title="Champion Units"
          cards={cards.filter(isChampionUnit)}
          deckEntryIds={deckEntryIds}
          onCardClick={onCardClick}
          onPreview={onPreview}
          onPreviewEnd={onPreviewEnd}
        />
        <CardBlock
          title="Legends"
          cards={cards.filter(isLegend)}
          deckEntryIds={deckEntryIds}
          onCardClick={onCardClick}
          onPreview={onPreview}
          onPreviewEnd={onPreviewEnd}
        />
      </section>
    );
  }

  const filteredCards =
    view === "units"
      ? cards.filter((entry) => entry.card.type.cardtype === "Unit")
      : view === "spells"
        ? cards.filter((entry) => entry.card.type.cardtype === "Spell")
        : view === "gear"
          ? cards.filter((entry) => entry.card.type.cardtype === "Gear")
          : cards;

  return (
    <section className="pool-display grouped-view" aria-label={`${view} view`}>
      {domainBlocks(filteredCards, deckEntryIds, onCardClick, onPreview, onPreviewEnd)}
    </section>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function CardZoomPreview({ preview }: { preview: CardPreviewState | null }) {
  if (!preview?.entry.card.media.image_url) return null;

  const layout = cardDisplayLayout(preview.entry.card);
  const width = layout === "landscape" ? 420 : 300;
  const height = Math.round(width * (layout === "landscape" ? 744 / 1039 : 1039 / 744));
  const viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 800 : window.innerHeight;
  const leftCandidate = preview.x + width + 28 > viewportWidth ? preview.x - width - 18 : preview.x + 18;
  const topCandidate = preview.y + 18;
  const left = clamp(leftCandidate, 12, viewportWidth - width - 12);
  const top = clamp(topCandidate, 12, viewportHeight - height - 12);

  return (
    <div
      className="card-zoom-preview"
      data-testid="card-zoom-preview"
      data-layout={layout}
      style={{ left, top, width } as CSSProperties}
    >
      <img src={preview.entry.card.media.image_url} alt={preview.entry.card.media.accessibility_text ?? preview.entry.card.riot_name} />
    </div>
  );
}

function SnapshotDialog({
  name,
  onNameChange,
  onSave,
  onClose
}: {
  name: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const trimmedName = name.trim();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (trimmedName) onSave();
  }

  return (
    <div className="snapshot-dialog-backdrop">
      <form className="snapshot-dialog" role="dialog" aria-label="Name snapshot" onSubmit={handleSubmit}>
        <h2>Name Snapshot</h2>
        <label>
          Snapshot name
          <input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Build 1"
            autoFocus
          />
        </label>
        <div className="snapshot-dialog-actions">
          <button type="button" className="text-button strong" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-action compact" disabled={!trimmedName}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

function SelectorLayer({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="selector-layer" role="dialog" aria-label={label}>
      {children}
    </div>
  );
}

function PackRecipeMenu({
  packSets,
  recipe,
  onChange
}: {
  packSets: Array<{ id: PackSetId; label: string }>;
  recipe: PackSetId[];
  onChange: (nextRecipe: PackSetId[]) => void;
}) {
  return (
    <SelectorLayer label="Choose packs">
      <div className="pack-menu-grid">
        {recipe.map((setId, index) => (
          <label key={`pack-${index + 1}`}>
            Pack {index + 1}
            <select
              value={setId}
              onChange={(event) => {
                const nextRecipe = [...recipe];
                nextRecipe[index] = event.target.value as PackSetId;
                onChange(nextRecipe);
              }}
            >
              {packSets.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </SelectorLayer>
  );
}

function PreRiftSeedMenu({
  packs,
  seededPackId,
  onChange
}: {
  packs: Array<{ id: string; label: string }>;
  seededPackId: string;
  onChange: (seededPackId: string) => void;
}) {
  return (
    <SelectorLayer label="Choose pre-rift seed">
      <div className="seed-menu-grid">
        <label>
          Seed
          <select value={seededPackId} onChange={(event) => onChange(event.target.value)}>
            <option value="random">Random</option>
            {packs.map((pack) => (
              <option key={pack.id} value={pack.id}>
                {pack.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </SelectorLayer>
  );
}

function SealedSimulator({ onError }: { onError: (message: string | null) => void }) {
  const [options, setOptions] = useState<PackGeneratorOptions | null>(null);
  const [sealedMode, setSealedMode] = useState<SealedMode>("pre-rift-UNL");
  const [seededPackId, setSeededPackId] = useState("random");
  const [packRecipe, setPackRecipe] = useState<PackSetId[]>(["OGN", "OGN", "SFD", "SFD", "UNL", "UNL"]);
  const [poolView, setPoolView] = useState<PoolView>("packs");
  const [pool, setPool] = useState<GeneratedSealedPool | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mainDeckCards, setMainDeckCards] = useState<GeneratedPoolCard[]>([]);
  const [battlefieldEntryIds, setBattlefieldEntryIds] = useState<Array<string | null>>([null, null, null]);
  const [legendEntryId, setLegendEntryId] = useState<string | null>(null);
  const [championEntryId, setChampionEntryId] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<DeckSnapshot[]>([]);
  const [isSnapshotDialogOpen, setIsSnapshotDialogOpen] = useState(false);
  const [snapshotName, setSnapshotName] = useState("");
  const [cardPreview, setCardPreview] = useState<CardPreviewState | null>(null);

  const packSets = options?.sets ?? fallbackPackSets.map((set) => ({ ...set, supportsStandard: true }));
  const sealedModeOptions: Array<{ id: SealedMode; label: string }> = [
    { id: "standard-OGN", label: packSetLabel(packSets, "OGN") },
    { id: "standard-SFD", label: packSetLabel(packSets, "SFD") },
    { id: "pre-rift-SFD", label: `${packSetLabel(packSets, "SFD")} Pre-Rift` },
    { id: "standard-UNL", label: packSetLabel(packSets, "UNL") },
    { id: "pre-rift-UNL", label: `${packSetLabel(packSets, "UNL")} Pre-Rift` },
    { id: "custom", label: "Custom" }
  ];
  const selectedPreRiftSet: PreRiftSetId | null =
    sealedMode === "pre-rift-SFD" ? "SFD" : sealedMode === "pre-rift-UNL" ? "UNL" : null;
  const poolCards = useMemo(() => allPoolCards(pool), [pool]);
  const deckEntryIds = useMemo(() => {
    const ids = new Set(mainDeckCards.map((entry) => entry.id));
    for (const entryId of battlefieldEntryIds) {
      if (entryId) ids.add(entryId);
    }
    if (legendEntryId) ids.add(legendEntryId);
    if (championEntryId) ids.add(championEntryId);
    return ids;
  }, [mainDeckCards, battlefieldEntryIds, legendEntryId, championEntryId]);
  const preRiftPacks = useMemo(
    () => selectedPreRiftSet ? (options?.seededPacks ?? []).filter((pack) => pack.setId === selectedPreRiftSet) : [],
    [options, selectedPreRiftSet]
  );

  useEffect(() => {
    let ignore = false;

    async function boot() {
      try {
        const loadedOptions = await loadPackGeneratorOptions();
        if (!ignore) setOptions(loadedOptions);
      } catch (caught) {
        if (!ignore) onError(caught instanceof Error ? caught.message : "Unable to load pack generator.");
      }
    }

    void boot();

    return () => {
      ignore = true;
    };
  }, [onError]);

  useEffect(() => {
    setSeededPackId("random");
  }, [selectedPreRiftSet]);

  function requestForMode(): GenerateSealedPoolRequest {
    switch (sealedMode) {
      case "standard-OGN":
        return { format: "standard", setId: "OGN" };
      case "standard-SFD":
        return { format: "standard", setId: "SFD" };
      case "standard-UNL":
        return { format: "standard", setId: "UNL" };
      case "pre-rift-SFD":
        return { format: "pre-rift", setId: "SFD", seededPackId };
      case "pre-rift-UNL":
        return { format: "pre-rift", setId: "UNL", seededPackId };
      case "custom":
        return { format: "custom", packs: packRecipe };
    }
  }

  async function newPool() {
    setIsGenerating(true);
    onError(null);

    try {
      const generated = await generateSealedPool(requestForMode());
      setPool(generated);
      setPoolView("packs");
      setMainDeckCards([]);
      setBattlefieldEntryIds([null, null, null]);
      setLegendEntryId(null);
      setChampionEntryId(null);
      setSnapshots([]);
      setIsSnapshotDialogOpen(false);
      setSnapshotName("");
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Pool generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  function addToMainDeck(entry: GeneratedPoolCard) {
    if (championEntryId === entry.id) return;
    setMainDeckCards((current) => current.some((card) => card.id === entry.id) ? current : [...current, entry]);
  }

  function removeFromDeck(entryId: string) {
    setMainDeckCards((current) => current.filter((entry) => entry.id !== entryId));
    setBattlefieldEntryIds((current) => current.map((candidate) => candidate === entryId ? null : candidate));
    setLegendEntryId((current) => current === entryId ? null : current);
    setChampionEntryId((current) => current === entryId ? null : current);
  }

  function clearDeck() {
    setMainDeckCards([]);
    setBattlefieldEntryIds([null, null, null]);
    setLegendEntryId(null);
    setChampionEntryId(null);
  }

  function assignBattlefield(slotIndex: number, entryId: string | null) {
    if (!entryId) {
      setBattlefieldEntryIds((current) => current.map((candidate, index) => index === slotIndex ? null : candidate));
      return;
    }

    const entry = poolCards.find((candidate) => candidate.id === entryId);
    if (!entry || !isBattlefield(entry)) return;

    setBattlefieldEntryIds((current) => {
      const next = current.map((candidate) => candidate === entryId ? null : candidate);
      next[slotIndex] = entryId;
      return next;
    });
  }

  function assignBattlefieldToNextOpen(entry: GeneratedPoolCard) {
    setBattlefieldEntryIds((current) => {
      if (current.includes(entry.id)) return current;
      const next = [...current];
      const openIndex = next.findIndex((candidate) => candidate === null);
      next[openIndex === -1 ? 0 : openIndex] = entry.id;
      return next;
    });
  }

  function assignLegend(entryId: string | null) {
    if (!entryId) {
      setLegendEntryId(null);
      return;
    }

    const entry = poolCards.find((candidate) => candidate.id === entryId);
    if (entry && isLegend(entry)) {
      setLegendEntryId(entryId);
    }
  }

  function assignChampion(entryId: string | null) {
    if (!entryId) {
      setChampionEntryId(null);
      return;
    }

    const entry = poolCards.find((candidate) => candidate.id === entryId);
    if (entry && isChampionUnit(entry)) {
      setMainDeckCards((current) => current.filter((candidate) => candidate.id !== entryId));
      setChampionEntryId(entryId);
    }
  }

  function addToDeck(entry: GeneratedPoolCard) {
    if (isBattlefield(entry)) {
      assignBattlefieldToNextOpen(entry);
    } else if (isLegend(entry)) {
      assignLegend(entry.id);
    } else if (isMainDeckEntry(entry)) {
      addToMainDeck(entry);
    }
  }

  function togglePoolCard(entry: GeneratedPoolCard) {
    if (deckEntryIds.has(entry.id)) {
      removeFromDeck(entry.id);
      return;
    }

    addToDeck(entry);
  }

  function openSnapshotDialog() {
    setSnapshotName("");
    setIsSnapshotDialogOpen(true);
  }

  function saveSnapshot() {
    const trimmedName = snapshotName.trim();
    if (!trimmedName) return;

    setSnapshots((current) => [
      ...current,
      {
        id: `snapshot-${current.length + 1}-${Date.now()}`,
        name: trimmedName,
        mainDeckCards,
        battlefieldEntryIds,
        legendEntryId,
        championEntryId
      }
    ]);
    setIsSnapshotDialogOpen(false);
    setSnapshotName("");
  }

  function restoreSnapshot(snapshot: DeckSnapshot) {
    const poolEntryIds = new Set(poolCards.map((entry) => entry.id));
    const restoredBattlefields = snapshot.battlefieldEntryIds.map((entryId) => entryId && poolEntryIds.has(entryId) ? entryId : null).slice(0, 3);
    while (restoredBattlefields.length < 3) restoredBattlefields.push(null);
    setMainDeckCards(snapshot.mainDeckCards);
    setBattlefieldEntryIds(restoredBattlefields);
    setLegendEntryId(snapshot.legendEntryId && poolEntryIds.has(snapshot.legendEntryId) ? snapshot.legendEntryId : null);
    setChampionEntryId(snapshot.championEntryId && poolEntryIds.has(snapshot.championEntryId) ? snapshot.championEntryId : null);
  }

  function showPreview(entry: GeneratedPoolCard, event: PointerEvent<HTMLButtonElement>) {
    setCardPreview({ entry, x: event.clientX, y: event.clientY });
  }

  function hidePreview() {
    setCardPreview(null);
  }

  return (
    <>
      <section className="simulator-hero" aria-labelledby="simulator-heading">
        <div className="search-copy">
          <p className="eyebrow">Noxian Netdecks</p>
          <h1 id="simulator-heading">Sealed Simulator</h1>
        </div>
        <div className="simulator-actions">
          <label className="pool-mode-select">
            Pool type
            <select value={sealedMode} onChange={(event) => setSealedMode(event.target.value as SealedMode)}>
              {sealedModeOptions.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="primary-action" onClick={() => void newPool()} disabled={isGenerating}>
            <CardsIcon />
            <span>{isGenerating ? "Generating" : "New Pool"}</span>
          </button>
        </div>
      </section>

      {selectedPreRiftSet ? (
        <PreRiftSeedMenu
          packs={preRiftPacks}
          seededPackId={seededPackId}
          onChange={setSeededPackId}
        />
      ) : null}

      {sealedMode === "custom" ? (
        <PackRecipeMenu
          packSets={packSets}
          recipe={packRecipe}
          onChange={setPackRecipe}
        />
      ) : null}

      <DecklistPanel
        poolCards={poolCards}
        mainDeckCards={mainDeckCards}
        battlefieldEntryIds={battlefieldEntryIds}
        legendEntryId={legendEntryId}
        championEntryId={championEntryId}
        snapshots={snapshots}
        onRemove={removeFromDeck}
        onAssignBattlefield={assignBattlefield}
        onAssignLegend={assignLegend}
        onAssignChampion={assignChampion}
        onOpenSnapshot={openSnapshotDialog}
        onRestoreSnapshot={restoreSnapshot}
        onClearDeck={clearDeck}
        onPreview={showPreview}
        onPreviewEnd={hidePreview}
      />

      {isSnapshotDialogOpen ? (
        <SnapshotDialog
          name={snapshotName}
          onNameChange={setSnapshotName}
          onSave={saveSnapshot}
          onClose={() => setIsSnapshotDialogOpen(false)}
        />
      ) : null}

      <nav className="view-tabs" aria-label="Pool views">
        {[
          ["packs", "Packs"],
          ["domain", "Domain"],
          ["champions", "Champions & Legends"],
          ["units", "Units"],
          ["spells", "Spells"],
          ["gear", "Gear"]
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={poolView === id}
            onClick={() => setPoolView(id as PoolView)}
          >
            {label}
          </button>
        ))}
      </nav>

      <PoolDisplay
        pool={pool}
        view={poolView}
        deckEntryIds={deckEntryIds}
        onCardClick={togglePoolCard}
        onPreview={showPreview}
        onPreviewEnd={hidePreview}
      />
      <CardZoomPreview preview={cardPreview} />
    </>
  );
}

function ProjectNavLink({
  href,
  current,
  onNavigate,
  children
}: {
  href: string;
  current: boolean;
  onNavigate: (href: string) => void;
  children: ReactNode;
}) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();
    onNavigate(href);
  }

  return (
    <a href={href} aria-current={current ? "page" : undefined} onClick={handleClick}>
      {children}
    </a>
  );
}

function HomePage({ onNavigate }: { onNavigate: (href: string) => void }) {
  const [query, setQuery] = useState("");

  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    onNavigate(q ? `/cards?q=${encodeURIComponent(q)}` : "/cards");
  }

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-bg-wrap">
          <svg className="hero-bg" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g transform="rotate(45, 200, 200)">
              <polygon points="200,18 193,55 207,55" fill="#c9813a"/>
              <rect x="195" y="55" width="10" height="220" fill="#c9813a"/>
              <rect x="155" y="268" width="90" height="12" rx="6" fill="#c9813a"/>
              <rect x="193" y="280" width="14" height="48" rx="7" fill="#c9813a"/>
            </g>
            <g transform="rotate(-45, 200, 200)">
              <polygon points="200,18 193,55 207,55" fill="#b52038"/>
              <rect x="195" y="55" width="10" height="220" fill="#b52038"/>
              <rect x="155" y="268" width="90" height="12" rx="6" fill="#b52038"/>
              <rect x="193" y="280" width="14" height="48" rx="7" fill="#b52038"/>
            </g>
            <circle cx="200" cy="200" r="22" stroke="#c9813a" strokeWidth="5" fill="none"/>
            <circle cx="200" cy="200" r="10" fill="#c9813a"/>
          </svg>
        </div>
        <div className="hero-content">
          <h1 className="hero-heading">
            <span className="plain">The complete</span><br/>
            <span className="gradient">Riftbound archive.</span>
          </h1>
          <p className="hero-sub">Search cards, study tournament decks, simulate sealed pools.</p>
          <form className="hero-search-box" onSubmit={handleSearch}>
            <div className="hero-search-icon">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="7"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <input
              className="hero-search-input"
              placeholder="Search for cards…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoCapitalize="none"
            />
            <button type="submit" className="hero-search-btn">Search</button>
          </form>
        </div>
      </section>

      <hr className="home-divider" />

      <div className="home-section">
        <div className="home-feature-grid">
          <a
            href="/cards"
            className="home-feature-card"
            onClick={(e) => { e.preventDefault(); onNavigate("/cards"); }}
          >
            <div className="home-feature-icon-row">
              <div className="home-feature-icon-tile">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="11" cy="11" rx="7.5" ry="7.5" stroke="white" strokeWidth="2"/>
                  <path d="M7.5 8.5 Q9 7 11.5 7.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" fill="none"/>
                  <line x1="16.5" y1="16.5" x2="24" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="18.8" y1="18.2" x2="20.4" y2="19.8" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2"/>
                  <line x1="20.5" y1="19.9" x2="22.1" y2="21.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2"/>
                </svg>
              </div>
              <span className="home-feature-arrow">→</span>
            </div>
            <div className="home-feature-title">Card Search</div>
            <div className="home-feature-desc">Full database. Filter by cost, domain, type, and more.</div>
          </a>

          <a
            href="/deck-explorer"
            className="home-feature-card"
            onClick={(e) => { e.preventDefault(); onNavigate("/deck-explorer"); }}
          >
            <div className="home-feature-icon-row">
              <div className="home-feature-icon-tile">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="7" width="14" height="18" rx="2" transform="rotate(-14 10 16)" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" fill="rgba(255,255,255,0.06)"/>
                  <rect x="5" y="6" width="14" height="18" rx="2" transform="rotate(-5 12 15)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" fill="rgba(255,255,255,0.08)"/>
                  <rect x="9" y="5" width="14" height="18" rx="2" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.10)"/>
                  <line x1="12" y1="9" x2="20" y2="9" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2"/>
                  <line x1="12" y1="12" x2="20" y2="12" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                </svg>
              </div>
              <span className="home-feature-arrow">→</span>
            </div>
            <div className="home-feature-title">Deck Explorer</div>
            <div className="home-feature-desc">Tournament decks by event, legend, and player.</div>
          </a>

          <a
            href="/tools/sealed-pools"
            className="home-feature-card"
            onClick={(e) => { e.preventDefault(); onNavigate("/tools/sealed-pools"); }}
          >
            <div className="home-feature-icon-row">
              <div className="home-feature-icon-tile">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="10" width="9" height="13" rx="1.5" transform="rotate(-28 6.5 16.5)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.6" fill="rgba(255,255,255,0.05)"/>
                  <rect x="5" y="9" width="9" height="13" rx="1.5" transform="rotate(-12 9.5 15.5)" stroke="rgba(255,255,255,0.65)" strokeWidth="1.8" fill="rgba(255,255,255,0.07)"/>
                  <rect x="9" y="8" width="9" height="13" rx="1.5" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.10)"/>
                  <rect x="7" y="18" width="14" height="8" rx="2" stroke="rgba(255,255,255,0.85)" strokeWidth="2" fill="rgba(255,255,255,0.12)"/>
                  <line x1="9" y1="20.5" x2="19" y2="20.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
                  <path d="M7 18 Q10 16.5 14 18 Q18 16.5 21 18" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" fill="none"/>
                </svg>
              </div>
              <span className="home-feature-arrow">→</span>
            </div>
            <div className="home-feature-title">Sealed Simulator</div>
            <div className="home-feature-desc">Generate pools from any format. Build and save decks.</div>
          </a>
        </div>
      </div>

      <hr className="home-divider" />

      <div className="home-section" style={{ paddingTop: "48px" }}>
        <div className="home-promo-grid">
          <a
            href="/tools/tier-list"
            className="home-promo-card"
            onClick={(e) => { e.preventDefault(); onNavigate("/tools/tier-list"); }}
          >
            <div className="home-promo-label">Tool</div>
            <h3>Tier List Generator</h3>
            <p>Rank any card set by dragging into tiers.</p>
          </a>
          <div className="home-promo-card" style={{ cursor: "default", opacity: 0.6 }}>
            <div className="home-promo-label">Archive</div>
            <h3>Tournament Results</h3>
            <p>Events, legend win rates, top-placing decks.</p>
          </div>
        </div>
      </div>

      <footer className="home-footer">Noxian Netdecks · Riftbound</footer>
    </div>
  );
}

function CardDetailView({
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

        // Use riftbound_id (exact legal identity) to find all printings.
        // Falling back to exact clean_name match avoids substring false-positives.
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
            {card.tcgplayer_id && (
              <a
                className="card-detail-json-link"
                href={`https://www.tcgplayer.com/product/${card.tcgplayer_id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                TCGPlayer ↗
              </a>
            )}
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

function TradeBalancerQuickLookWrapper({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [quickLookCard, setQuickLookCard] = useState<CardRecord | null>(null);
  return (
    <>
      <TradeBalancerView onNavigate={onNavigate} onQuickLook={setQuickLookCard} />
      {quickLookCard && (
        <CardQuickLookModal card={quickLookCard} onClose={() => setQuickLookCard(null)} onNavigate={onNavigate} />
      )}
    </>
  );
}

export default function App() {
  const [route, setRoute] = useState(() => parseAppRoute(window.location.pathname));
  const [locationSearch, setLocationSearch] = useState(() => window.location.search);
  const [error, setError] = useState<string | null>(null);
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement | null>(null);
  const [showCardsMenu, setShowCardsMenu] = useState(false);
  const cardsMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePopState() {
      setRoute(parseAppRoute(window.location.pathname));
      setLocationSearch(window.location.search);
      setError(null);
      setShowToolsMenu(false);
      setShowCardsMenu(false);
    }

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(event: globalThis.PointerEvent) {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setShowToolsMenu(false);
      }
      if (cardsMenuRef.current && !cardsMenuRef.current.contains(event.target as Node)) {
        setShowCardsMenu(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowToolsMenu(false);
        setShowCardsMenu(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (route.kind === "cards") {
      setHeaderSearchQuery(new URLSearchParams(locationSearch).get("q") ?? "");
      return;
    }

    if (route.kind === "home") {
      setHeaderSearchQuery("");
    }
  }, [locationSearch, route.kind]);

  function navigate(nextPath: string) {
    const normalizedPath = normalizePathname(nextPath.split("?")[0]);
    const search = nextPath.includes("?") ? nextPath.slice(nextPath.indexOf("?")) : "";
    const fullPath = normalizedPath + search;

    if (fullPath !== window.location.pathname + window.location.search) {
      window.history.pushState({}, "", fullPath);
      setRoute(parseAppRoute(normalizedPath));
      setLocationSearch(search);
    }

    setError(null);
    setShowToolsMenu(false);
    setShowCardsMenu(false);
  }

  const activeSection = routeSection(route);
  const isHome = route.kind === "home";

  function handleHeaderSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(buildCardsSearchPath(headerSearchQuery));
  }

  const navContent = (
    <nav className="nav" aria-label="Primary navigation">
      <button
        type="button"
        className="nav-brand"
        onClick={() => navigate("/")}
        aria-label="Noxian Netdecks home"
      >
        <div className="nav-logo">N</div>
        <span className="nav-wordmark">Noxian Netdecks</span>
      </button>
      <form className="nav-search-form" onSubmit={handleHeaderSearchSubmit} role="search" aria-label="Site card search">
        <div className="nav-search-icon" aria-hidden="true">
          <SearchIcon />
        </div>
        <input
          className="nav-search-input"
          type="search"
          placeholder="Search cards..."
          value={headerSearchQuery}
          onChange={(event) => setHeaderSearchQuery(event.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Search cards"
        />
        <button type="submit" className="nav-search-btn">Search</button>
      </form>
      <div className="nav-links">
        <div className="nav-tools-menu" ref={cardsMenuRef}>
          <button
            type="button"
            className={`nav-link${activeSection === "cards" ? " active" : ""}`}
            aria-expanded={showCardsMenu}
            aria-haspopup="menu"
            onClick={() => setShowCardsMenu((current) => !current)}
          >
            Cards
            <ChevronIcon expanded={showCardsMenu} />
          </button>
          {showCardsMenu ? (
            <div className="nav-tools-popover" role="menu" aria-label="Cards">
              <ProjectNavLink href="/cards" current={route.kind === "cards"} onNavigate={navigate}>
                Search
              </ProjectNavLink>
              <ProjectNavLink href="/cards/query-builder" current={route.kind === "cards-query-builder"} onNavigate={navigate}>
                Query Builder
              </ProjectNavLink>
            </div>
          ) : null}
        </div>
        <ProjectNavLink
          href="/deck-explorer"
          current={activeSection === "deck-explorer"}
          onNavigate={navigate}
        >
          <span className={`nav-link${activeSection === "deck-explorer" ? " active" : ""}`}>Deck Explorer</span>
        </ProjectNavLink>
        <div className="nav-tools-menu" ref={toolsMenuRef}>
          <button
            type="button"
            className={`nav-link${activeSection === "tools-tier-list" || activeSection === "tools-sealed-pools" || activeSection === "tools-trade-balancer" ? " active" : ""}`}
            aria-expanded={showToolsMenu}
            aria-haspopup="menu"
            onClick={() => setShowToolsMenu((current) => !current)}
          >
            Tools
            <ChevronIcon expanded={showToolsMenu} />
          </button>
          {showToolsMenu ? (
            <div className="nav-tools-popover" role="menu" aria-label="Tools">
              <ProjectNavLink href="/tools/tier-list" current={activeSection === "tools-tier-list"} onNavigate={navigate}>
                Tier List Generator
              </ProjectNavLink>
              <ProjectNavLink href="/tools/sealed-pools" current={activeSection === "tools-sealed-pools"} onNavigate={navigate}>
                Sealed Simulator
              </ProjectNavLink>
              <ProjectNavLink href="/tools/trade-balancer" current={activeSection === "tools-trade-balancer"} onNavigate={navigate}>
                Trade Balancer
              </ProjectNavLink>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );

  if (isHome) {
    return (
      <>
        {navContent}
        <HomePage onNavigate={navigate} />
      </>
    );
  }

  return (
    <>
      {navContent}
      <main className="app-shell">
        {error ? <div className="error-banner">{error}</div> : null}
        {route.kind === "cards" ? (
          <SearchView onError={setError} locationSearch={locationSearch} onNavigate={navigate} />
        ) : route.kind === "cards-query-builder" ? (
          <QueryBuilderView onNavigate={navigate} />
        ) : route.kind === "card-detail" ? (
          <CardDetailView cardId={route.cardId} onError={setError} onNavigate={navigate} />
        ) : route.kind === "tools-tier-list" ? (
          <TierListView onError={setError} />
        ) : route.kind === "tools-sealed-pools" ? (
          <SealedSimulator onError={setError} />
        ) : route.kind === "tools-trade-balancer" ? (
          <TradeBalancerQuickLookWrapper onNavigate={navigate} />
        ) : route.kind.startsWith("deck-explorer") ? (
          <DeckExplorerView route={route} onError={setError} onNavigate={navigate} />
        ) : (
          <section className="route-panel route-panel--not-found">
            <div className="section-heading">
              <p className="eyebrow">Not Found</p>
              <h1>That page does not exist</h1>
              <p>The current URL is not mapped to Cards, Deck Explorer, or one of the Tools routes.</p>
            </div>
            <nav className="view-tabs" aria-label="Recovery navigation">
              <ProjectNavLink href="/cards" current={false} onNavigate={navigate}>
                Back to Cards
              </ProjectNavLink>
              <ProjectNavLink href="/deck-explorer" current={false} onNavigate={navigate}>
                Open Deck Explorer
              </ProjectNavLink>
            </nav>
          </section>
        )}
      </main>
    </>
  );
}
