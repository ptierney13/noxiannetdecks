import { useRef, useState } from "react";
import { CardSummaryPopup, VariantSelectorRow, type VariantSelection } from "../features";
import { normalizeCardFinish } from "../lib";
import { ResultCard } from "../ui-elements";
import {
  buildCardSearchResultGroups,
  formatUsdPrice,
  getPublishedRowsForCard,
  normalizePrinting,
  usePublishedPriceIndex,
  type PublishedPriceIndex,
  type PublishedPriceRow,
} from "../lib";
import { useDebounce } from "../lib";
import { useCardSearchResults } from "../data/cards";
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

const CONDITION_CODES: Record<string, string> = {
  "near mint": "NM",
  "lightly played": "LP",
  "moderately played": "MP",
  "heavily played": "HP",
  "damaged": "DMG",
};

// ── Style tokens ───────────────────────────────────────────────────────────

const T = {
  // Section containers
  mineSection:
    "rounded-xl overflow-hidden flex flex-col bg-[rgba(13,16,24,0.94)] border-t-[3px] border-t-[var(--color-positive-strong)] shadow-[0_0_0_1px_rgba(42,143,82,0.18),0_6px_24px_rgba(0,0,0,0.34)]",
  yoursSection:
    "rounded-xl overflow-hidden flex flex-col bg-[rgba(13,16,24,0.94)] border-t-[3px] border-t-[var(--color-negative)] shadow-[0_0_0_1px_rgba(181,32,56,0.18),0_6px_24px_rgba(0,0,0,0.34)]",
  searchSection:
    "rounded-xl overflow-hidden flex flex-col bg-[rgba(13,16,24,0.94)] shadow-[0_0_0_1px_rgba(197,50,71,0.16),0_0_28px_rgba(197,50,71,0.07),0_6px_24px_rgba(0,0,0,0.34)]",

  // Section headers
  sectionHeader:
    "flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.06)] shrink-0",
  mineLabel:
    "text-[0.72rem] font-bold tracking-[0.09em] uppercase text-[var(--color-positive-strong)]",
  yoursLabel:
    "text-[0.72rem] font-bold tracking-[0.09em] uppercase text-[var(--color-negative)]",
  sideTotal:
    "font-mono text-base font-semibold text-[var(--color-text-primary)]",

  // Search header
  searchHeader: "flex items-center gap-3 px-4 pt-3.5 pb-3 border-b border-[rgba(255,255,255,0.06)] shrink-0",
  searchTitle:
    "text-[0.77rem] font-bold tracking-[0.04em] text-[var(--color-accent-warm)] opacity-75 leading-none",
  searchInputWrap: "relative flex-1",
  searchInput:
    "w-full bg-[rgba(8,11,18,0.8)] border border-[rgba(255,255,255,0.1)] text-sm text-[var(--color-text-primary)] rounded-xl px-3.5 py-2 pr-8 placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[rgba(197,50,71,0.5)] focus:shadow-[0_0_0_2px_var(--color-focus-ring)] transition-all",
  searchSpinner:
    "absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-[rgba(255,255,255,0.08)] border-t-[var(--color-accent)] animate-spin",
  searchClearBtn:
    "absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-[0.65rem] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors rounded focus-visible:outline-none",

  // Search results
  searchBody:
    "flex-1 overflow-y-auto p-3",
  searchHint:
    "py-8 text-center text-[0.75rem] text-[var(--color-text-dim)]",
  resultsGrid:
    "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3",

  // ── Trade search card footer (add buttons) ────────────────────────────

  srFooter: "flex flex-col gap-2 pt-1",
  srBtnRow: "grid grid-cols-2 gap-1.5",
  srBtnMine:
    "py-1.5 rounded-xl text-[0.72rem] font-semibold bg-[rgba(25,65,38,0.65)] text-[var(--color-positive-strong)] border border-[rgba(42,143,82,0.32)] hover:bg-[rgba(25,65,38,0.9)] transition-colors",
  srBtnYours:
    "py-1.5 rounded-xl text-[0.72rem] font-semibold bg-[rgba(65,12,18,0.65)] text-[var(--color-negative)] border border-[rgba(181,32,56,0.32)] hover:bg-[rgba(65,12,18,0.9)] transition-colors",

  // ── Trade item row — sized ~30% larger than baseline ──────────────────

  sideBody:
    "flex-1 flex flex-col overflow-y-auto divide-y divide-[rgba(255,255,255,0.05)]",
  sideBodyEmpty:
    "flex-1 flex flex-col items-center justify-center gap-2 py-10 px-4 text-center",

  itemRow:
    "flex items-center gap-3 px-3 py-2.5 hover:bg-[rgba(255,255,255,0.025)] transition-colors duration-[120ms]",
  artWrap:
    "shrink-0 w-[46px] h-[67px] rounded-md overflow-hidden bg-[rgba(255,255,255,0.05)] cursor-pointer",
  artImg: "w-full h-full object-cover hover:opacity-85 transition-opacity",
  artPlaceholder: "w-full h-full bg-[rgba(255,255,255,0.03)]",

  cardInfo: "flex-1 min-w-0",
  cardName:
    "text-[1.0rem] font-medium text-[var(--color-text-primary)] leading-tight truncate",
  cardTags: "flex flex-wrap gap-1 mt-0.5",
  tagBase: "rounded px-2 py-[3px] text-[0.72rem] font-medium leading-none border",
  tagRarity:
    "bg-[rgba(201,129,58,0.1)] text-[var(--color-warning)] border-[rgba(201,129,58,0.28)]",
  tagFoil:
    "bg-[rgba(212,160,240,0.08)] text-[#d4a0f0] border-[rgba(212,160,240,0.28)]",
  tagNonfoil:
    "bg-[rgba(255,255,255,0.04)] text-[var(--color-text-dim)] border-[rgba(255,255,255,0.1)]",

  conditionBtn:
    "shrink-0 text-[0.8rem] font-bold tracking-wide text-[var(--color-accent-warm)] bg-[rgba(215,170,73,0.1)] border border-[rgba(215,170,73,0.25)] rounded-md px-2 py-[5px] hover:bg-[rgba(215,170,73,0.18)] transition-colors cursor-pointer min-w-[2.6rem] text-center leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
  finishBtnFoil:
    "shrink-0 text-[0.75rem] font-medium text-[#d4a0f0] bg-[rgba(212,160,240,0.08)] border border-[rgba(212,160,240,0.22)] rounded-md px-2 py-[5px] hover:bg-[rgba(212,160,240,0.16)] transition-colors cursor-pointer leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
  finishBtnNF:
    "shrink-0 text-[0.75rem] font-medium text-[var(--color-text-dim)] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-md px-2 py-[5px] hover:bg-[rgba(255,255,255,0.08)] transition-colors cursor-pointer leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",

  qtyWrap: "shrink-0 flex flex-col items-center",
  qtyBtn:
    "w-[26px] h-[24px] flex items-center justify-center text-[0.9rem] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.07)] rounded transition-colors leading-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-focus-ring)]",
  qtyVal:
    "text-[1.0rem] font-mono font-bold text-[var(--color-text-primary)] min-w-[1.6rem] text-center leading-tight py-[2px]",

  itemPrice:
    "shrink-0 font-mono text-[1.0rem] text-[var(--color-price)] min-w-[4.25rem] text-right",
  itemPriceDash:
    "shrink-0 font-mono text-[1.0rem] text-[var(--color-text-dim)] min-w-[4.25rem] text-right",

  removeBtn:
    "shrink-0 w-5 h-5 flex items-center justify-center text-[0.65rem] opacity-25 hover:opacity-90 text-[var(--color-negative)] transition-opacity rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-focus-ring)]",

  // ── Delta bar — shown at all sizes, gradient always on ────────────────

  deltaBar:
    "flex items-center justify-between px-3 py-3 lg:px-6 lg:py-5 rounded-xl overflow-hidden border border-[rgba(255,255,255,0.07)]",
  deltaSide: "flex flex-col items-center gap-0.5 min-w-[4.5rem] lg:min-w-[6rem]",
  deltaSideLabel: "text-[0.6rem] lg:text-[0.65rem] font-bold tracking-[0.1em] uppercase",
  deltaSideTotal:
    "font-mono text-base lg:text-xl font-bold text-[var(--color-text-primary)]",
  deltaMid: "flex flex-col items-center gap-0.5 lg:gap-1",
  deltaMidLabel:
    "text-[0.6rem] lg:text-[0.65rem] font-bold tracking-[0.1em] uppercase text-[var(--color-text-tertiary)]",
  deltaMidNote: "hidden lg:block text-[0.67rem] text-[var(--color-text-dim)]",
  deltaArrow: "text-[var(--color-text-dim)] text-base lg:text-lg opacity-40",
  deltaValue: "font-mono text-xl lg:text-2xl font-bold",

  dropTarget: "ring-2 ring-inset ring-[rgba(255,255,255,0.2)] brightness-110",
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

function cycleCondition(current: string): string {
  const idx = CONDITIONS.indexOf(current as (typeof CONDITIONS)[number]);
  return CONDITIONS[(idx + 1) % CONDITIONS.length];
}

// ── TradeSearchResultCard — ResultCard + grouped VariantSelectorRow ────────

function TradeSearchResultCard({
  cards,
  priceIndex,
  onAdd,
  onQuickLook,
}: {
  cards: CardRecord[];
  priceIndex: PublishedPriceIndex | null;
  onAdd: (card: CardRecord, finish: "foil" | "nonfoil", side: TradeSide) => void;
  onQuickLook: (card: CardRecord) => void;
}) {
  const representative = cards[0]!;
  const initFinish = defaultFinish(representative);
  const [activeKey, setActiveKey] = useState(`${representative.id}-${initFinish}`);
  const [selected, setSelected] = useState<{ card: CardRecord; finish: "foil" | "nonfoil" }>({
    card: representative,
    finish: initFinish,
  });

  function handleVariantSelect({ card, finish, key }: VariantSelection) {
    setSelected({ card, finish: finish as "foil" | "nonfoil" });
    setActiveKey(key);
  }

  const footer = (
    <div className={T.srFooter}>
      <VariantSelectorRow
        cards={cards}
        activeKey={activeKey}
        showPrice={true}
        publishedPriceIndex={priceIndex}
        onVariantSelect={handleVariantSelect}
      />
      <div className={T.srBtnRow}>
        <button
          className={T.srBtnMine}
          onClick={() => onAdd(selected.card, selected.finish, "mine")}
        >
          + Mine
        </button>
        <button
          className={T.srBtnYours}
          onClick={() => onAdd(selected.card, selected.finish, "yours")}
        >
          + Yours
        </button>
      </div>
    </div>
  );

  return (
    <ResultCard
      name={representative.riot_name}
      imageUrl={representative.media.image_url}
      imageAlt={representative.media.accessibility_text ?? representative.riot_name}
      footer={footer}
      onClick={() => onQuickLook(selected.card)}
    />
  );
}

// ── TradeItemRow — unified row for Mine and Yours lists ────────────────────

function TradeItemRow({
  item,
  itemPrice,
  onQty,
  onCondition,
  onFinish,
  onRemove,
  onDragStart,
  onDragEnd,
  onNavigate,
  onQuickLook,
}: {
  item: TradeItem;
  itemPrice: number | null;
  onQty: (delta: number) => void;
  onCondition: (c: string) => void;
  onFinish: (f: "foil" | "nonfoil") => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onNavigate: (path: string) => void;
  onQuickLook: (card: CardRecord) => void;
}) {
  const { card } = item;
  const hasBothFinishes = card.finishes.length > 1;
  const lineTotal = itemPrice != null ? itemPrice * item.qty : null;
  void onNavigate;

  return (
    <div
      className={T.itemRow}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
    >
      {/* Card art */}
      <div className={T.artWrap} onClick={() => onQuickLook(card)}>
        {card.media.image_url ? (
          <img
            src={card.media.image_url}
            alt={card.media.accessibility_text ?? card.riot_name}
            loading="lazy"
            className={T.artImg}
          />
        ) : (
          <div className={T.artPlaceholder} />
        )}
      </div>

      {/* Name + tags */}
      <div className={T.cardInfo}>
        <div className={T.cardName}>{card.riot_name}</div>
        <div className={T.cardTags}>
          {card.rarity && (
            <span className={`${T.tagBase} ${T.tagRarity}`}>{card.rarity}</span>
          )}
          <span className={`${T.tagBase} ${item.finish === "foil" ? T.tagFoil : T.tagNonfoil}`}>
            {item.finish === "foil" ? "Foil" : "NF"}
          </span>
        </div>
      </div>

      {/* Condition — click to cycle */}
      <button
        className={T.conditionBtn}
        onClick={() => onCondition(cycleCondition(item.condition))}
        title={item.condition}
      >
        {CONDITION_CODES[item.condition] ?? "NM"}
      </button>

      {/* Finish toggle — dual-finish cards only */}
      {hasBothFinishes && (
        <button
          className={item.finish === "foil" ? T.finishBtnFoil : T.finishBtnNF}
          onClick={() => onFinish(item.finish === "foil" ? "nonfoil" : "foil")}
        >
          {item.finish === "foil" ? "Foil" : "NF"}
        </button>
      )}

      {/* Vertical qty stepper */}
      <div className={T.qtyWrap}>
        <button className={T.qtyBtn} onClick={() => onQty(1)}>+</button>
        <span className={T.qtyVal}>{item.qty}</span>
        <button className={T.qtyBtn} onClick={() => onQty(-1)}>−</button>
      </div>

      {/* Price */}
      <span className={lineTotal != null ? T.itemPrice : T.itemPriceDash}>
        {lineTotal != null ? formatUsdPrice(lineTotal) : "—"}
      </span>

      {/* Remove */}
      <button
        className={T.removeBtn}
        onClick={onRemove}
        aria-label={`Remove ${card.riot_name}`}
      >
        ✕
      </button>
    </div>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────

export default function TradeBalancerView({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { index: priceIndex } = usePublishedPriceIndex();

  const [mine, setMine] = useState<TradeItem[]>([]);
  const [yours, setYours] = useState<TradeItem[]>([]);

  const [searchQuery, setSearchQuery] = useState("");

  const [dragOverSide, setDragOverSide] = useState<TradeSide | null>(null);
  const [activeDrag, setActiveDrag] = useState<{ key: string; fromSide: TradeSide } | null>(null);

  const [quickLookCard, setQuickLookCard] = useState<CardRecord | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(searchQuery, 300);
  const activeQuery = debouncedQuery.trim().length >= 2 ? debouncedQuery.trim() : "";
  const { data: searchData, isFetching: searching } = useCardSearchResults(activeQuery);
  const searchResults = searchData?.items ?? [];
  const searchGroups = buildCardSearchResultGroups(searchResults, "unique-cards");

  // ── Item mutations ──

  function addCard(card: CardRecord, side: TradeSide, finish?: "foil" | "nonfoil") {
    const resolvedFinish = finish ?? defaultFinish(card);
    const key = makeKey(card.id, resolvedFinish);
    const updater = (prev: TradeItem[]): TradeItem[] => {
      const idx = prev.findIndex((i) => i.key === key);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { key, card, qty: 1, condition: "near mint", finish: resolvedFinish }];
    };
    if (side === "mine") setMine(updater);
    else setYours(updater);
  }

  function removeItem(key: string, side: TradeSide) {
    const updater = (prev: TradeItem[]) => prev.filter((i) => i.key !== key);
    if (side === "mine") setMine(updater);
    else setYours(updater);
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
  }

  // ── Price helpers ──

  function getItemPrice(item: TradeItem): number | null {
    const rows = getPublishedRowsForCard(priceIndex, item.card.tcgplayer_id);
    return resolveItemPrice(rows, item.finish, item.condition);
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

  const showSearchHint = activeQuery.length === 0 && !searching;
  const showNoResults = activeQuery.length > 0 && !searching && searchGroups.length === 0;

  function clearSearch() {
    setSearchQuery("");
    searchInputRef.current?.focus();
  }

  // ── Shared section renderers ──

  function renderSideItems(items: TradeItem[], side: TradeSide) {
    return items.map((item) => (
      <TradeItemRow
        key={item.key}
        item={item}
        itemPrice={getItemPrice(item)}
        onQty={(d) => updateQty(item.key, side, d)}
        onCondition={(c) => updateCondition(item.key, side, c)}
        onFinish={(f) => updateFinish(item.key, side, f)}
        onRemove={() => removeItem(item.key, side)}
        onDragStart={() => handleDragStart(item.key, side)}
        onDragEnd={handleDragEnd}
        onNavigate={onNavigate}
        onQuickLook={setQuickLookCard}
      />
    ));
  }

  // ── Delta bar — shown at all sizes with runtime gradient ──

  const deltaBar = (
    <div className={T.deltaBar} style={deltaBarStyle}>
      <div className={T.deltaSide}>
        <span className={`${T.deltaSideLabel} text-[var(--color-positive-strong)] opacity-75`}>Mine</span>
        <span className={T.deltaSideTotal}>{formatUsdPrice(mineTotal) ?? "$0.00"}</span>
      </div>
      <span className={T.deltaArrow} aria-hidden="true">⟵</span>
      <div className={T.deltaMid}>
        <span className={T.deltaMidLabel}>Difference</span>
        <span className={`${T.deltaValue} ${deltaValueClass}`}>{formatDelta(delta)}</span>
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
  );

  const mineSection = (
    <div
      className={`${T.mineSection} ${dragOverSide === "mine" ? T.dropTarget : ""} min-h-[120px]`}
      onDragOver={(e) => handleDragOver(e, "mine")}
      onDragLeave={() => setDragOverSide(null)}
      onDrop={() => handleDrop("mine")}
    >
      <div className={T.sectionHeader}>
        <span className={T.mineLabel}>Mine</span>
        <span className={T.sideTotal}>{formatUsdPrice(mineTotal) ?? "$0.00"}</span>
      </div>
      <div className={T.sideBody}>
        {mine.length === 0 ? (
          <div className={T.sideBodyEmpty}>
            <span className="text-2xl opacity-20" aria-hidden="true">+</span>
            <span className="text-[0.75rem] text-[var(--color-text-dim)]">
              Search and add your cards
            </span>
          </div>
        ) : renderSideItems(mine, "mine")}
      </div>
    </div>
  );

  const yoursSection = (
    <div
      className={`${T.yoursSection} ${dragOverSide === "yours" ? T.dropTarget : ""} min-h-[120px]`}
      onDragOver={(e) => handleDragOver(e, "yours")}
      onDragLeave={() => setDragOverSide(null)}
      onDrop={() => handleDrop("yours")}
    >
      <div className={T.sectionHeader}>
        <span className={T.yoursLabel}>Yours</span>
        <span className={T.sideTotal}>{formatUsdPrice(yoursTotal) ?? "$0.00"}</span>
      </div>
      <div className={T.sideBody}>
        {yours.length === 0 ? (
          <div className={T.sideBodyEmpty}>
            <span className="text-2xl opacity-20" aria-hidden="true">+</span>
            <span className="text-[0.75rem] text-[var(--color-text-dim)]">
              Search and add their cards
            </span>
          </div>
        ) : renderSideItems(yours, "yours")}
      </div>
    </div>
  );

  const searchSection = (
    <div className={T.searchSection}>
      <div className={T.searchHeader}>
        <h2 className={T.searchTitle}>Add Cards</h2>
        <div className={T.searchInputWrap}>
          <input
            ref={searchInputRef}
            className={T.searchInput}
            type="text"
            placeholder="Search by name…"
            value={searchQuery}
            autoComplete="off"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searching && <span className={T.searchSpinner} aria-hidden="true" />}
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
      </div>

      <div className={T.searchBody}>
        {showSearchHint && (
          <p className={T.searchHint}>Type at least 2 characters to search</p>
        )}
        {showNoResults && (
          <p className={T.searchHint}>No cards found for "{debouncedQuery}"</p>
        )}
        {searchGroups.length > 0 && (
          <div className={T.resultsGrid}>
            {searchGroups.map((group) => (
              <TradeSearchResultCard
                key={group.key}
                cards={group.cards}
                priceIndex={priceIndex}
                onAdd={(c, finish, side) => addCard(c, side, finish)}
                onQuickLook={setQuickLookCard}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── Render ──
  // Delta bar at top for all sizes.
  // Mobile (< lg): delta → Mine → Search (fixed-height scrollable) → Yours
  // Desktop (lg+): delta (col-span-2) → Mine | Yours → Search (col-span-2)

  return (
    <>
      <div className="px-4 pb-12 pt-4 min-h-screen">
        <div className="mx-auto max-w-[1240px] flex flex-col gap-3 lg:gap-4">

          {/* ── Mobile layout (< lg) ── */}
          <div className="flex flex-col gap-3 lg:hidden">
            {deltaBar}
            {mineSection}
            <div className="h-[440px] flex flex-col">
              {searchSection}
            </div>
            {yoursSection}
          </div>

          {/* ── Desktop layout (lg+) ── */}
          <div className="hidden lg:grid lg:grid-cols-2 lg:gap-4">
            {/* Row 1: Delta bar (full width) */}
            <div className="lg:col-span-2">{deltaBar}</div>

            {/* Row 2: Mine | Yours */}
            <div className="min-h-[200px]">{mineSection}</div>
            <div className="min-h-[200px]">{yoursSection}</div>

            {/* Row 3: Search (full width) */}
            <div className="lg:col-span-2 min-h-[320px] flex flex-col">
              {searchSection}
            </div>
          </div>

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
