import { useEffect, useRef, useState } from "react";
import { searchCards } from "../api";
import { CardSummaryPopup } from "../features";
import { normalizeCardFinish } from "../lib";
import {
  formatUsdPrice,
  getPublishedRowsForCard,
  normalizePrinting,
  usePublishedPriceIndex,
  type PublishedPriceIndex,
  type PublishedPriceRow,
} from "../lib";
import { useDebounce } from "../lib";
import type { CardRecord } from "../types";

// ── Types ──────────────────────────────────────────────────────────────────

type TradeSide = "mine" | "yours";

type TradeItem = {
  key: string;
  card: CardRecord;
  qty: number;
  condition: string;
  finish: "foil" | "nonfoil";
};

// ── Constants ──────────────────────────────────────────────────────────────

const CONDITIONS = [
  "near mint",
  "lightly played",
  "moderately played",
  "heavily played",
  "damaged",
] as const;

const CONDITION_LABELS: Record<string, string> = {
  "near mint": "Near Mint",
  "lightly played": "Lightly Played",
  "moderately played": "Mod. Played",
  "heavily played": "Heavily Played",
  "damaged": "Damaged",
};

// ── Local style tokens ─────────────────────────────────────────────────────

const T = {
  // Section containers
  mineSection:
    "flex flex-col rounded-xl overflow-hidden bg-[rgba(13,16,24,0.94)] shadow-[0_0_0_1px_rgba(42,143,82,0.22),inset_3px_0_0_rgba(109,186,138,0.65),0_6px_24px_rgba(0,0,0,0.36)]",
  yoursSection:
    "flex flex-col rounded-xl overflow-hidden bg-[rgba(13,16,24,0.94)] shadow-[0_0_0_1px_rgba(181,32,56,0.22),inset_3px_0_0_rgba(181,32,56,0.65),0_6px_24px_rgba(0,0,0,0.36)]",
  searchSection:
    "flex flex-col rounded-xl overflow-hidden bg-[rgba(13,16,24,0.94)] shadow-[0_0_0_1px_rgba(197,50,71,0.16),0_0_28px_rgba(197,50,71,0.07),0_6px_24px_rgba(0,0,0,0.36)]",

  // Section headers
  mineHeader:
    "flex items-center justify-between px-4 py-3 bg-[rgba(12,38,20,0.55)] border-b border-[rgba(42,143,82,0.22)] shrink-0",
  yoursHeader:
    "flex items-center justify-between px-4 py-3 bg-[rgba(38,10,14,0.55)] border-b border-[rgba(181,32,56,0.22)] shrink-0",
  searchHeader:
    "flex items-center gap-2 px-4 pt-3.5 pb-2 shrink-0",

  // Header labels
  mineLabel:
    "text-[0.72rem] font-bold tracking-[0.09em] uppercase text-[var(--color-positive-strong)]",
  yoursLabel:
    "text-[0.72rem] font-bold tracking-[0.09em] uppercase text-[var(--color-negative)]",
  searchTitle:
    "text-[0.77rem] font-bold tracking-[0.04em] text-[var(--color-accent-warm)] opacity-75 leading-none",

  // Section total display
  sideTotal:
    "font-mono text-base font-semibold text-[var(--color-text-primary)]",

  // Section body
  sideBody: "flex-1 flex flex-col divide-y divide-[rgba(255,255,255,0.05)] overflow-y-auto",
  sideBodyEmpty:
    "flex-1 flex flex-col items-center justify-center gap-2 py-10 px-4 text-center",

  // Card bar
  cardBar:
    "flex items-center gap-3 px-4 py-3 hover:bg-[rgba(255,255,255,0.03)] cursor-grab active:cursor-grabbing transition-colors duration-[120ms] group",
  cardBarExpanded: "bg-[rgba(255,255,255,0.02)]",
  dragHandle:
    "text-[rgba(255,255,255,0.2)] text-lg leading-none select-none group-hover:text-[rgba(255,255,255,0.4)] transition-colors shrink-0",
  cardName:
    "text-sm font-medium text-[var(--color-text-primary)] leading-tight",
  cardTagRow: "flex flex-wrap gap-1 mt-1",

  // Tags
  tagBase: "rounded px-1.5 py-0.5 text-[0.63rem] font-medium leading-none border",
  tagRarity:
    "bg-[rgba(201,129,58,0.1)] text-[var(--color-warning)] border-[rgba(201,129,58,0.28)]",
  tagDomain:
    "bg-[var(--color-info-soft)] text-[var(--color-info)] border-[var(--color-info-border)]",
  tagFoil:
    "bg-[rgba(212,160,240,0.08)] text-[#d4a0f0] border-[rgba(212,160,240,0.28)]",
  tagNonfoil:
    "bg-[rgba(255,255,255,0.04)] text-[var(--color-text-dim)] border-[rgba(255,255,255,0.1)]",

  // Desktop inline controls
  desktopControls: "hidden sm:flex items-center gap-2 shrink-0",

  // Select
  select:
    "text-xs bg-[rgba(8,11,18,0.72)] border border-[rgba(255,255,255,0.1)] text-[var(--color-text-secondary)] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[var(--color-accent)] transition-colors cursor-pointer appearance-none",

  // Qty stepper
  qtyStepper:
    "flex items-center bg-[rgba(8,11,18,0.72)] border border-[rgba(255,255,255,0.1)] rounded-lg overflow-hidden",
  qtyBtn:
    "px-2 h-7 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.07)] transition-colors text-sm leading-none",
  qtyVal:
    "px-2 text-xs text-[var(--color-text-primary)] font-mono min-w-[1.75rem] text-center leading-7",

  // Price
  cardPrice:
    "shrink-0 font-mono text-sm text-[var(--color-price)] min-w-[3.5rem] text-right",
  cardPriceDash:
    "shrink-0 font-mono text-sm text-[var(--color-text-dim)] min-w-[3.5rem] text-right",

  // Remove button
  removeBtn:
    "hidden sm:flex shrink-0 w-6 h-6 items-center justify-center text-[0.7rem] opacity-30 hover:opacity-100 text-[var(--color-negative)] transition-opacity rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",

  // Mobile chevron
  mobileChevron:
    "sm:hidden shrink-0 text-[0.65rem] text-[var(--color-text-tertiary)] opacity-60",

  // Mobile expand panel
  expandPanel:
    "sm:hidden px-4 pb-4 pt-1 bg-[rgba(8,11,18,0.45)] border-t border-[rgba(255,255,255,0.05)]",
  expandGrid: "grid grid-cols-2 gap-3 mb-3",
  expandFieldFull: "col-span-2",
  expandLabel:
    "block text-[0.65rem] font-bold uppercase tracking-[0.09em] text-[var(--color-text-tertiary)] mb-1.5",
  expandQtyRemoveRow: "flex items-center gap-2",
  expandRemoveBtn:
    "ml-auto w-8 h-8 flex items-center justify-center text-xs rounded-lg bg-[rgba(181,32,56,0.1)] text-[var(--color-negative)] border border-[rgba(181,32,56,0.2)] hover:bg-[rgba(181,32,56,0.18)] transition-colors",
  expandPriceRow:
    "flex items-center flex-wrap gap-x-3 gap-y-1.5 pt-2 border-t border-[rgba(255,255,255,0.06)]",
  expandPriceVal:
    "font-mono text-sm font-semibold text-[var(--color-price)]",
  tcgLink:
    "text-[0.72rem] text-[var(--color-accent-warm)] opacity-70 hover:opacity-100 transition-opacity underline-offset-2 hover:underline",
  expandMoveBtn:
    "ml-auto text-[0.72rem] font-medium text-[var(--color-text-secondary)] border border-[rgba(255,255,255,0.12)] rounded-lg px-3 py-1.5 hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--color-text-primary)] transition-colors",

  // Search
  searchBody: "px-3 pb-3 flex flex-col gap-2",
  searchInputWrap: "relative",
  searchInput:
    "w-full bg-[rgba(8,11,18,0.8)] border border-[rgba(255,255,255,0.1)] text-sm text-[var(--color-text-primary)] rounded-xl px-3.5 py-2.5 pr-8 placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[rgba(197,50,71,0.5)] focus:shadow-[0_0_0_2px_var(--color-focus-ring)] transition-all",
  searchSpinner:
    "absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-[rgba(255,255,255,0.08)] border-t-[var(--color-accent)] animate-spin",
  searchClearBtn:
    "absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-[0.65rem] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors rounded focus-visible:outline-none",
  searchResults:
    "flex flex-col divide-y divide-[rgba(255,255,255,0.05)] overflow-y-auto rounded-xl bg-[rgba(8,11,18,0.6)] border border-[rgba(255,255,255,0.07)]",
  searchHint:
    "py-5 text-center text-[0.75rem] text-[var(--color-text-dim)]",

  // Search result item
  srItem:
    "flex flex-col gap-1.5 px-3 py-2.5 hover:bg-[rgba(255,255,255,0.04)] transition-colors cursor-default",
  srTop: "flex items-center justify-between gap-2",
  srName: "text-sm font-medium text-[var(--color-text-primary)] leading-tight",
  srPrice: "shrink-0 font-mono text-xs text-[var(--color-price)]",
  srMeta: "flex flex-wrap items-center gap-1 text-[0.67rem] text-[var(--color-text-tertiary)]",
  srDot: "opacity-40",
  srActions: "flex gap-2",
  srBtnMine:
    "flex-1 py-1.5 rounded-lg text-[0.72rem] font-semibold bg-[rgba(25,65,38,0.6)] text-[var(--color-positive-strong)] border border-[rgba(42,143,82,0.32)] hover:bg-[rgba(25,65,38,0.85)] transition-colors",
  srBtnYours:
    "flex-1 py-1.5 rounded-lg text-[0.72rem] font-semibold bg-[rgba(65,12,18,0.6)] text-[var(--color-negative)] border border-[rgba(181,32,56,0.32)] hover:bg-[rgba(65,12,18,0.85)] transition-colors",

  // Delta bar (desktop)
  deltaBar:
    "sm:col-span-3 hidden sm:flex items-center justify-between px-6 py-5 rounded-xl overflow-hidden border border-[rgba(255,255,255,0.07)]",
  deltaSide: "flex flex-col items-center gap-1 min-w-[6rem]",
  deltaSideLabel: "text-[0.65rem] font-bold tracking-[0.1em] uppercase",
  deltaSideTotal: "font-mono text-xl font-bold text-[var(--color-text-primary)]",
  deltaMid: "flex flex-col items-center gap-1",
  deltaMidLabel:
    "text-[0.65rem] font-bold tracking-[0.1em] uppercase text-[var(--color-text-tertiary)]",
  deltaMidNote: "text-[0.67rem] text-[var(--color-text-dim)]",
  deltaArrow: "text-[var(--color-text-dim)] text-lg opacity-40",

  // Mobile delta
  mobileDelta:
    "sm:hidden rounded-xl px-4 py-3 text-sm font-semibold text-center",
  mobileDeltaEven:
    "bg-[rgba(255,255,255,0.04)] text-[var(--color-text-tertiary)] border border-[rgba(255,255,255,0.07)]",
  mobileDeltaPos:
    "bg-[rgba(42,143,82,0.12)] text-[var(--color-positive-strong)] border border-[rgba(42,143,82,0.2)]",
  mobileDeltaNeg:
    "bg-[rgba(181,32,56,0.12)] text-[var(--color-negative)] border border-[rgba(181,32,56,0.2)]",

  // Mobile compact strip
  compactStrip:
    "sm:hidden flex items-center justify-between px-4 py-2.5 rounded-xl bg-[rgba(13,16,24,0.94)] border border-[rgba(255,255,255,0.08)]",
  compactSide: "flex flex-col gap-0.5",
  compactSideRight: "items-end",
  compactLabel: "text-[0.63rem] font-bold uppercase tracking-[0.08em]",
  compactTotal:
    "font-mono text-sm font-semibold text-[var(--color-text-primary)]",
  compactDeltaPill:
    "px-3 py-1 rounded-full text-xs font-bold",
  compactDeltaEven:
    "bg-[rgba(255,255,255,0.06)] text-[var(--color-text-tertiary)]",
  compactDeltaPos:
    "bg-[rgba(42,143,82,0.18)] text-[var(--color-positive-strong)]",
  compactDeltaNeg:
    "bg-[rgba(181,32,56,0.18)] text-[var(--color-negative)]",

  // Drop target
  dropTarget:
    "ring-2 ring-[rgba(255,255,255,0.2)] ring-inset brightness-110",
} as const;

// ── Helpers ────────────────────────────────────────────────────────────────

function resolveMatchingRow(
  rows: PublishedPriceRow[],
  finish: "foil" | "nonfoil",
  condition: string
): PublishedPriceRow | null {
  const normalizedPrinting = normalizePrinting(finish);
  const normalizedCondition = condition.toLowerCase().trim();
  return (
    rows.find(
      (r) =>
        normalizePrinting(r.printing) === normalizedPrinting &&
        (r.condition ?? "").toLowerCase().trim() === normalizedCondition
    ) ?? null
  );
}

function resolveItemPrice(
  rows: PublishedPriceRow[],
  finish: "foil" | "nonfoil",
  condition: string
): number | null {
  return resolveMatchingRow(rows, finish, condition)?.currentPrice.amount ?? null;
}

function defaultFinish(card: CardRecord): "foil" | "nonfoil" {
  return card.finishes.includes("foil") ? "foil" : "nonfoil";
}

function makeKey(cardId: string, finish: "foil" | "nonfoil"): string {
  return `${cardId}-${finish}`;
}

function formatDelta(delta: number): string {
  if (delta === 0) return "Even";
  const sign = delta > 0 ? "+" : "−";
  return `${sign}${formatUsdPrice(Math.abs(delta)) ?? ""}`;
}

function nearMintPrice(
  index: PublishedPriceIndex | null,
  card: CardRecord
): number | null {
  const rows = getPublishedRowsForCard(index, card.tcgplayer_id);
  const foilRow = resolveItemPrice(rows, "foil", "near mint");
  const nonfoilRow = resolveItemPrice(rows, "nonfoil", "near mint");
  const def = defaultFinish(card);
  return (def === "foil" ? foilRow : nonfoilRow) ?? foilRow ?? nonfoilRow;
}

// ── SearchResultItem ───────────────────────────────────────────────────────

function SearchResultItem({
  card,
  priceIndex,
  onAdd,
}: {
  card: CardRecord;
  priceIndex: PublishedPriceIndex | null;
  onAdd: (card: CardRecord, side: TradeSide) => void;
}) {
  const price = nearMintPrice(priceIndex, card);
  const finishLabel = card.finishes.includes("foil") ? "Foil" : "Non-foil";
  const variantTags: string[] = [];
  if (card.variant.alternate_art) variantTags.push("Alt Art");
  if (card.variant.signed) variantTags.push("Signed");
  else if (card.variant.overnumbered) variantTags.push("Overnumbered");

  const setLine = [
    card.set.label,
    card.collector_number ? `#${card.collector_number}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={T.srItem}>
      <div className={T.srTop}>
        <span className={T.srName}>{card.riot_name}</span>
        {price != null && <span className={T.srPrice}>{formatUsdPrice(price)}</span>}
      </div>
      <div className={T.srMeta}>
        {card.rarity && <span>{card.rarity}</span>}
        {setLine && <><span className={T.srDot}>·</span><span>{setLine}</span></>}
        <span className={T.srDot}>·</span>
        <span>{finishLabel}</span>
        {variantTags.map((t) => (
          <span key={t}><span className={T.srDot}>·</span> {t}</span>
        ))}
      </div>
      <div className={T.srActions}>
        <button className={T.srBtnMine} onClick={() => onAdd(card, "mine")}>
          + Mine
        </button>
        <button className={T.srBtnYours} onClick={() => onAdd(card, "yours")}>
          + Yours
        </button>
      </div>
    </div>
  );
}

// ── TradeCardBar ───────────────────────────────────────────────────────────

function TradeCardBar({
  item,
  side,
  itemPrice,
  tcgUrl,
  isExpanded,
  onToggleExpand,
  onQty,
  onCondition,
  onFinish,
  onRemove,
  onMove,
  onDragStart,
  onDragEnd,
  onQuickLook,
}: {
  item: TradeItem;
  side: TradeSide;
  itemPrice: number | null;
  tcgUrl: string | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onQty: (delta: number) => void;
  onCondition: (c: string) => void;
  onFinish: (f: "foil" | "nonfoil") => void;
  onRemove: () => void;
  onMove: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onNavigate: (path: string) => void;
  onQuickLook: (card: CardRecord) => void;
}) {
  const { card } = item;
  const hasBothFinishes = card.finishes.length > 1;
  const lineTotal = itemPrice != null ? itemPrice * item.qty : null;
  const domains = card.attributes.domain;
  const moveLabel = side === "mine" ? "Move to Yours →" : "← Move to Mine";

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
    >
      {/* Collapsed row */}
      <div
        className={`${T.cardBar} ${isExpanded ? T.cardBarExpanded : ""}`}
        onClick={onToggleExpand}
      >
        <span className={T.dragHandle} aria-hidden="true">⠿</span>

        <div className="flex-1 min-w-0">
          <div className={T.cardName}>{card.riot_name}</div>
          <div className={T.cardTagRow}>
            {card.rarity && (
              <span className={`${T.tagBase} ${T.tagRarity}`}>{card.rarity}</span>
            )}
            {domains.map((d) => (
              <span key={d} className={`${T.tagBase} ${T.tagDomain}`}>{d}</span>
            ))}
            <span className={`${T.tagBase} ${item.finish === "foil" ? T.tagFoil : T.tagNonfoil}`}>
              {item.finish === "foil" ? "Foil" : "Non-foil"}
            </span>
          </div>
        </div>

        {/* Desktop inline controls */}
        <div className={T.desktopControls} onClick={(e) => e.stopPropagation()}>
          <select
            className={T.select}
            value={item.condition}
            onChange={(e) => onCondition(e.target.value)}
          >
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>{CONDITION_LABELS[c]}</option>
            ))}
          </select>

          {hasBothFinishes && (
            <select
              className={T.select}
              value={item.finish}
              onChange={(e) => onFinish(e.target.value as "foil" | "nonfoil")}
            >
              <option value="foil">Foil</option>
              <option value="nonfoil">Non-foil</option>
            </select>
          )}

          <div className={T.qtyStepper}>
            <button className={T.qtyBtn} onClick={() => onQty(-1)}>−</button>
            <span className={T.qtyVal}>{item.qty}</span>
            <button className={T.qtyBtn} onClick={() => onQty(1)}>+</button>
          </div>
        </div>

        <span className={lineTotal != null ? T.cardPrice : T.cardPriceDash}>
          {lineTotal != null ? formatUsdPrice(lineTotal) : "—"}
        </span>

        <button
          className={T.removeBtn}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          aria-label="Remove card"
        >
          ✕
        </button>

        <span className={T.mobileChevron} aria-hidden="true">
          {isExpanded ? "▲" : "▼"}
        </span>
      </div>

      {/* Mobile expanded panel */}
      {isExpanded && (
        <div className={T.expandPanel}>
          {/* Card art */}
          {card.media.image_url && (
            <div className="mb-3 flex justify-center">
              <img
                src={card.media.image_url}
                alt={card.media.accessibility_text ?? card.riot_name}
                loading="lazy"
                className="h-28 rounded-lg object-cover shadow-[0_4px_16px_rgba(0,0,0,0.5)] cursor-pointer"
                onClick={() => onQuickLook(card)}
              />
            </div>
          )}

          {/* Controls grid */}
          <div className={T.expandGrid}>
            <div>
              <label className={T.expandLabel}>Condition</label>
              <select
                className={`${T.select} w-full`}
                value={item.condition}
                onChange={(e) => onCondition(e.target.value)}
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>{CONDITION_LABELS[c]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={T.expandLabel}>Qty</label>
              <div className={T.expandQtyRemoveRow}>
                <div className={T.qtyStepper}>
                  <button className={T.qtyBtn} onClick={() => onQty(-1)}>−</button>
                  <span className={T.qtyVal}>{item.qty}</span>
                  <button className={T.qtyBtn} onClick={() => onQty(1)}>+</button>
                </div>
                <button
                  className={T.expandRemoveBtn}
                  onClick={onRemove}
                  aria-label="Remove card"
                >
                  ✕
                </button>
              </div>
            </div>

            {hasBothFinishes && (
              <div className={T.expandFieldFull}>
                <label className={T.expandLabel}>Finish</label>
                <select
                  className={`${T.select} w-full`}
                  value={item.finish}
                  onChange={(e) => onFinish(e.target.value as "foil" | "nonfoil")}
                >
                  <option value="foil">Foil</option>
                  <option value="nonfoil">Non-foil</option>
                </select>
              </div>
            )}
          </div>

          {/* Price row */}
          <div className={T.expandPriceRow}>
            <span className={T.expandPriceVal}>
              {lineTotal != null ? formatUsdPrice(lineTotal) : "—"}
            </span>
            {tcgUrl && (
              <a
                className={T.tcgLink}
                href={tcgUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                TCGPlayer ↗
              </a>
            )}
            <button className={T.expandMoveBtn} onClick={onMove}>
              {moveLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────

export default function TradeBalancerView({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { index: priceIndex } = usePublishedPriceIndex();

  const [mine, setMine] = useState<TradeItem[]>([]);
  const [yours, setYours] = useState<TradeItem[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CardRecord[]>([]);
  const [searching, setSearching] = useState(false);

  const [dragOverSide, setDragOverSide] = useState<TradeSide | null>(null);
  const [activeDrag, setActiveDrag] = useState<{ key: string; fromSide: TradeSide } | null>(null);

  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [quickLookCard, setQuickLookCard] = useState<CardRecord | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(searchQuery, 150);

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);

    searchCards(`${debouncedQuery} unique:id`)
      .then((resp) => {
        if (!cancelled) {
          setSearchResults(resp.items.slice(0, 15));
          setSearching(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSearchResults([]);
          setSearching(false);
        }
      });

    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // ── Item mutations ──

  function addCard(card: CardRecord, side: TradeSide) {
    const finish = defaultFinish(card);
    const key = makeKey(card.id, finish);
    const updater = (prev: TradeItem[]): TradeItem[] => {
      const idx = prev.findIndex((i) => i.key === key);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { key, card, qty: 1, condition: "near mint", finish }];
    };
    if (side === "mine") setMine(updater);
    else setYours(updater);
  }

  function removeItem(key: string, side: TradeSide) {
    const updater = (prev: TradeItem[]) => prev.filter((i) => i.key !== key);
    if (side === "mine") setMine(updater);
    else setYours(updater);
    if (expandedKey === key) setExpandedKey(null);
  }

  function updateQty(key: string, side: TradeSide, delta: number) {
    const updater = (prev: TradeItem[]): TradeItem[] =>
      prev.map((i) => i.key === key ? { ...i, qty: Math.max(1, i.qty + delta) } : i);
    if (side === "mine") setMine(updater);
    else setYours(updater);
  }

  function updateCondition(key: string, side: TradeSide, condition: string) {
    const updater = (prev: TradeItem[]) =>
      prev.map((i) => (i.key === key ? { ...i, condition } : i));
    if (side === "mine") setMine(updater);
    else setYours(updater);
  }

  function updateFinish(key: string, side: TradeSide, newFinish: "foil" | "nonfoil") {
    const list = side === "mine" ? mine : yours;
    const item = list.find((i) => i.key === key);
    if (!item || item.finish === newFinish) return;

    const newKey = makeKey(item.card.id, newFinish);
    const updater = (prev: TradeItem[]): TradeItem[] => {
      const existingIdx = prev.findIndex((i) => i.key === newKey);
      if (existingIdx !== -1) {
        return prev
          .filter((i) => i.key !== key)
          .map((i) => i.key === newKey ? { ...i, qty: i.qty + item.qty } : i);
      }
      return prev.map((i) => i.key === key ? { ...i, key: newKey, finish: newFinish } : i);
    };

    if (side === "mine") setMine(updater);
    else setYours(updater);
    if (expandedKey === key) setExpandedKey(newKey);
  }

  function moveItem(key: string, fromSide: TradeSide) {
    const fromList = fromSide === "mine" ? mine : yours;
    const item = fromList.find((i) => i.key === key);
    if (!item) return;

    const toSide: TradeSide = fromSide === "mine" ? "yours" : "mine";
    const fromUpdater = (prev: TradeItem[]) => prev.filter((i) => i.key !== key);
    const toUpdater = (prev: TradeItem[]): TradeItem[] => {
      const existing = prev.findIndex((i) => i.key === key);
      if (existing !== -1) {
        const next = [...prev];
        next[existing] = { ...next[existing], qty: next[existing].qty + item.qty };
        return next;
      }
      return [...prev, { ...item }];
    };

    if (fromSide === "mine") { setMine(fromUpdater); setYours(toUpdater); }
    else { setYours(fromUpdater); setMine(toUpdater); }
    setExpandedKey(null);
  }

  // ── Price helpers ──

  function getItemPrice(item: TradeItem): number | null {
    const rows = getPublishedRowsForCard(priceIndex, item.card.tcgplayer_id);
    return resolveItemPrice(rows, item.finish, item.condition);
  }

  function getItemTcgUrl(item: TradeItem): string | null {
    if (!item.card.tcgplayer_id) return null;
    const rows = getPublishedRowsForCard(priceIndex, item.card.tcgplayer_id);
    const row = resolveMatchingRow(rows, item.finish, item.condition);
    const skuId = row?.externalIds.tcgplayerSkuId;
    const base = `https://www.tcgplayer.com/product/${item.card.tcgplayer_id}`;
    return skuId ? `${base}?skuId=${skuId}` : base;
  }

  function sideTotal(items: TradeItem[]): number {
    return items.reduce((sum, item) => {
      const price = getItemPrice(item);
      return sum + (price ?? 0) * item.qty;
    }, 0);
  }

  const mineTotal = sideTotal(mine);
  const yoursTotal = sideTotal(yours);
  const delta = mineTotal - yoursTotal;

  const tradeRatio =
    mineTotal + yoursTotal > 0
      ? Math.min(0.99, Math.max(0.01, mineTotal / (mineTotal + yoursTotal)))
      : 0.5;
  const splitPct = (tradeRatio * 100).toFixed(2);

  const deltaBarStyle = {
    background: `linear-gradient(90deg, rgba(30,90,52,0.28) 0%, rgba(30,90,52,0.28) ${splitPct}%, rgba(90,18,28,0.28) ${splitPct}%, rgba(90,18,28,0.28) 100%)`,
  };

  const deltaSign = delta > 0 ? "pos" : delta < 0 ? "neg" : "even";
  const deltaValueClass =
    deltaSign === "pos"
      ? "text-[var(--color-positive-strong)]"
      : deltaSign === "neg"
      ? "text-[var(--color-negative)]"
      : "text-[var(--color-text-tertiary)]";

  // ── Drag handlers ──

  function handleDragStart(key: string, side: TradeSide) {
    setActiveDrag({ key, fromSide: side });
  }

  function handleDragOver(e: React.DragEvent, side: TradeSide) {
    if (activeDrag && activeDrag.fromSide !== side) {
      e.preventDefault();
      setDragOverSide(side);
    }
  }

  function handleDrop(toSide: TradeSide) {
    if (activeDrag && activeDrag.fromSide !== toSide) {
      moveItem(activeDrag.key, activeDrag.fromSide);
    }
    setActiveDrag(null);
    setDragOverSide(null);
  }

  function handleDragEnd() {
    setActiveDrag(null);
    setDragOverSide(null);
  }

  const showSearchHint = debouncedQuery.trim().length < 2 && !searching;
  const showNoResults =
    debouncedQuery.trim().length >= 2 && !searching && searchResults.length === 0;

  function clearSearch() {
    setSearchQuery("");
    setSearchResults([]);
    searchInputRef.current?.focus();
  }

  // ── Render ──

  return (
    <>
      <div className="px-4 pb-12 pt-4 min-h-screen">
        <div className="mx-auto max-w-[1240px] flex flex-col gap-4">

          {/* Page header */}
          <div className="px-1">
            <h1 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
              Trade Balancer
            </h1>
            <p className="text-[0.75rem] text-[var(--color-text-tertiary)] mt-0.5">
              Compare card values to find a fair trade
            </p>
          </div>

          {/* Mobile compact strip — visible when search open */}
          {searchFocused && (
            <div className={T.compactStrip}>
              <div className={T.compactSide}>
                <span className={`${T.compactLabel} text-[var(--color-positive-strong)]`}>Mine</span>
                <span className={T.compactTotal}>{formatUsdPrice(mineTotal) ?? "$0.00"}</span>
              </div>
              <span className={`${T.compactDeltaPill} ${
                deltaSign === "pos" ? T.compactDeltaPos
                : deltaSign === "neg" ? T.compactDeltaNeg
                : T.compactDeltaEven
              }`}>
                {formatDelta(delta)}
              </span>
              <div className={`${T.compactSide} ${T.compactSideRight}`}>
                <span className={`${T.compactLabel} text-[var(--color-negative)]`}>Yours</span>
                <span className={T.compactTotal}>{formatUsdPrice(yoursTotal) ?? "$0.00"}</span>
              </div>
            </div>
          )}

          {/* Main 3-col grid */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_280px_1fr] gap-3 sm:gap-4">

            {/* ── Mine ── */}
            <div
              className={`${T.mineSection} ${dragOverSide === "mine" ? T.dropTarget : ""} ${searchFocused ? "hidden sm:flex" : ""} min-h-[160px] sm:min-h-0`}
              onDragOver={(e) => handleDragOver(e, "mine")}
              onDragLeave={() => setDragOverSide(null)}
              onDrop={() => handleDrop("mine")}
            >
              <div className={T.mineHeader}>
                <span className={T.mineLabel}>Mine</span>
                <span className={T.sideTotal}>{formatUsdPrice(mineTotal) ?? "$0.00"}</span>
              </div>
              <div className={T.sideBody}>
                {mine.length === 0 ? (
                  <div className={T.sideBodyEmpty}>
                    <span className="text-2xl opacity-20" aria-hidden="true">+</span>
                    <span className="text-[0.75rem] text-[var(--color-text-dim)]">
                      Search for cards to add yours
                    </span>
                  </div>
                ) : (
                  mine.map((item) => (
                    <TradeCardBar
                      key={item.key}
                      item={item}
                      side="mine"
                      itemPrice={getItemPrice(item)}
                      tcgUrl={getItemTcgUrl(item)}
                      isExpanded={expandedKey === item.key}
                      onToggleExpand={() =>
                        setExpandedKey(expandedKey === item.key ? null : item.key)
                      }
                      onQty={(d) => updateQty(item.key, "mine", d)}
                      onCondition={(c) => updateCondition(item.key, "mine", c)}
                      onFinish={(f) => updateFinish(item.key, "mine", f)}
                      onRemove={() => removeItem(item.key, "mine")}
                      onMove={() => moveItem(item.key, "mine")}
                      onDragStart={() => handleDragStart(item.key, "mine")}
                      onDragEnd={handleDragEnd}
                      onNavigate={onNavigate}
                      onQuickLook={setQuickLookCard}
                    />
                  ))
                )}
              </div>
            </div>

            {/* ── Search ── */}
            <div className={`${T.searchSection} ${searchFocused ? "flex-1 sm:flex-none" : ""}`}>
              <div className={T.searchHeader}>
                <h2 className={T.searchTitle}>Add Cards</h2>
              </div>
              <div className={`${T.searchBody} flex-1`}>
                <div className={T.searchInputWrap}>
                  <input
                    ref={searchInputRef}
                    className={T.searchInput}
                    type="text"
                    placeholder="Search by name…"
                    value={searchQuery}
                    autoComplete="off"
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  />
                  {searching && (
                    <span className={T.searchSpinner} aria-hidden="true" />
                  )}
                  {searchQuery && !searching && (
                    <button
                      className={T.searchClearBtn}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={clearSearch}
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {(showSearchHint || showNoResults || searchResults.length > 0) && (
                  <div className={`${T.searchResults} ${searchFocused ? "max-h-[55vh]" : "max-h-[360px]"}`}>
                    {showSearchHint && (
                      <p className={T.searchHint}>Type at least 2 characters to search</p>
                    )}
                    {showNoResults && (
                      <p className={T.searchHint}>No cards found for "{debouncedQuery}"</p>
                    )}
                    {searchResults.map((card) => (
                      <SearchResultItem
                        key={card.id}
                        card={card}
                        priceIndex={priceIndex}
                        onAdd={addCard}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Yours ── */}
            <div
              className={`${T.yoursSection} ${dragOverSide === "yours" ? T.dropTarget : ""} ${searchFocused ? "hidden sm:flex" : ""} min-h-[160px] sm:min-h-0`}
              onDragOver={(e) => handleDragOver(e, "yours")}
              onDragLeave={() => setDragOverSide(null)}
              onDrop={() => handleDrop("yours")}
            >
              <div className={T.yoursHeader}>
                <span className={T.yoursLabel}>Yours</span>
                <span className={T.sideTotal}>{formatUsdPrice(yoursTotal) ?? "$0.00"}</span>
              </div>
              <div className={T.sideBody}>
                {yours.length === 0 ? (
                  <div className={T.sideBodyEmpty}>
                    <span className="text-2xl opacity-20" aria-hidden="true">+</span>
                    <span className="text-[0.75rem] text-[var(--color-text-dim)]">
                      Search for cards to add theirs
                    </span>
                  </div>
                ) : (
                  yours.map((item) => (
                    <TradeCardBar
                      key={item.key}
                      item={item}
                      side="yours"
                      itemPrice={getItemPrice(item)}
                      tcgUrl={getItemTcgUrl(item)}
                      isExpanded={expandedKey === item.key}
                      onToggleExpand={() =>
                        setExpandedKey(expandedKey === item.key ? null : item.key)
                      }
                      onQty={(d) => updateQty(item.key, "yours", d)}
                      onCondition={(c) => updateCondition(item.key, "yours", c)}
                      onFinish={(f) => updateFinish(item.key, "yours", f)}
                      onRemove={() => removeItem(item.key, "yours")}
                      onMove={() => moveItem(item.key, "yours")}
                      onDragStart={() => handleDragStart(item.key, "yours")}
                      onDragEnd={handleDragEnd}
                      onNavigate={onNavigate}
                      onQuickLook={setQuickLookCard}
                    />
                  ))
                )}
              </div>
            </div>

            {/* ── Delta bar (desktop) ── */}
            <div
              className={`${T.deltaBar} ${searchFocused ? "hidden" : ""}`}
              style={deltaBarStyle}
            >
              <div className={T.deltaSide}>
                <span className={`${T.deltaSideLabel} text-[var(--color-positive-strong)] opacity-75`}>Mine</span>
                <span className={T.deltaSideTotal}>{formatUsdPrice(mineTotal) ?? "$0.00"}</span>
              </div>
              <span className={T.deltaArrow} aria-hidden="true">⟵</span>
              <div className={T.deltaMid}>
                <span className={T.deltaMidLabel}>Difference</span>
                <span className={`font-mono text-2xl font-bold ${deltaValueClass}`}>
                  {formatDelta(delta)}
                </span>
                {delta !== 0 && (
                  <span className={T.deltaMidNote}>
                    {delta > 0 ? "You're offering more" : "You're offering less"}
                  </span>
                )}
              </div>
              <span className={T.deltaArrow} aria-hidden="true">⟶</span>
              <div className={T.deltaSide}>
                <span className={`${T.deltaSideLabel} text-[var(--color-negative)] opacity-75`}>Yours</span>
                <span className={T.deltaSideTotal}>{formatUsdPrice(yoursTotal) ?? "$0.00"}</span>
              </div>
            </div>
          </div>

          {/* Mobile delta strip */}
          {!searchFocused && (
            <div className={`${T.mobileDelta} ${
              deltaSign === "pos" ? T.mobileDeltaPos
              : deltaSign === "neg" ? T.mobileDeltaNeg
              : T.mobileDeltaEven
            }`}>
              {delta === 0
                ? "Trade is even"
                : delta > 0
                ? `You're offering ${formatUsdPrice(Math.abs(delta))} more`
                : `You're offering ${formatUsdPrice(Math.abs(delta))} less`}
            </div>
          )}
        </div>
      </div>

      {quickLookCard && (
        <CardSummaryPopup
          group={[quickLookCard]}
          initialCard={quickLookCard}
          initialFinish={normalizeCardFinish(quickLookCard.finishes[0])}
          onClose={() => setQuickLookCard(null)}
        />
      )}
    </>
  );
}
