import { useEffect, useRef, useState } from "react";
import { searchCards } from "./api";
import {
  formatUsdPrice,
  getPublishedRowsForCard,
  normalizePrinting,
  usePublishedPriceIndex,
  type PublishedPriceIndex,
  type PublishedPriceRow,
} from "./lib";
import { buildCardDetailPath } from "./routes";
import { useDebounce } from "./lib";
import type { CardRecord } from "./types";

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

function deltaClass(delta: number): string {
  if (delta > 0) return "pos";
  if (delta < 0) return "neg";
  return "even";
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

// ── Search result item ─────────────────────────────────────────────────────

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
    <div className="trade-sr-item">
      <div className="trade-sr-top">
        <span className="trade-sr-name">{card.riot_name}</span>
        {price != null && <span className="trade-sr-price">{formatUsdPrice(price)}</span>}
      </div>
      <div className="trade-sr-meta">
        {card.rarity && <span>{card.rarity}</span>}
        {setLine && <><span>·</span><span>{setLine}</span></>}
        <span>·</span>
        <span>{finishLabel}</span>
        {variantTags.map((t) => (
          <><span key={t}>·</span><span>{t}</span></>
        ))}
      </div>
      <div className="trade-sr-actions">
        <button
          className="trade-sr-btn trade-sr-btn--mine"
          onClick={() => onAdd(card, "mine")}
        >
          + Mine
        </button>
        <button
          className="trade-sr-btn trade-sr-btn--yours"
          onClick={() => onAdd(card, "yours")}
        >
          + Yours
        </button>
      </div>
    </div>
  );
}

// ── Card bar ───────────────────────────────────────────────────────────────

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
  onNavigate,
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
      className={`trade-card-bar${isExpanded ? " trade-card-bar--expanded" : ""}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
    >
      {/* ── Collapsed row (always visible) ── */}
      <div className="trade-card-bar-row" onClick={onToggleExpand}>
        <span className="trade-drag-handle" aria-hidden="true">⠿</span>

        <div className="trade-card-info">
          <div className="trade-card-name">{card.riot_name}</div>
          <div className="trade-card-tags">
            {card.rarity && (
              <span className="trade-tag trade-tag--rarity">{card.rarity}</span>
            )}
            {domains.map((d) => (
              <span key={d} className="trade-tag trade-tag--domain">{d}</span>
            ))}
            <span className={`trade-tag trade-tag--finish trade-tag--${item.finish}`}>
              {item.finish === "foil" ? "Foil" : "Non-foil"}
            </span>
          </div>
        </div>

        {/* Desktop controls — hidden on mobile via CSS */}
        <div className="trade-desktop-controls" onClick={(e) => e.stopPropagation()}>
          <select
            className="trade-select"
            value={item.condition}
            onChange={(e) => onCondition(e.target.value)}
          >
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>{CONDITION_LABELS[c]}</option>
            ))}
          </select>

          {hasBothFinishes && (
            <select
              className="trade-select"
              value={item.finish}
              onChange={(e) => onFinish(e.target.value as "foil" | "nonfoil")}
            >
              <option value="foil">Foil</option>
              <option value="nonfoil">Non-foil</option>
            </select>
          )}

          <div className="trade-qty-stepper">
            <button className="trade-qty-btn" onClick={() => onQty(-1)}>−</button>
            <span className="trade-qty-val">{item.qty}</span>
            <button className="trade-qty-btn" onClick={() => onQty(1)}>+</button>
          </div>
        </div>

        <span className="trade-card-price">
          {lineTotal != null ? formatUsdPrice(lineTotal) : "—"}
        </span>

        <button
          className="trade-card-remove trade-desktop-only"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          aria-label="Remove card"
        >
          ✕
        </button>

        <span className="trade-expand-chevron trade-mobile-only" aria-hidden="true">
          {isExpanded ? "▲" : "▼"}
        </span>
      </div>

      {/* ── Expanded panel (mobile) ── */}
      {isExpanded && (
        <div className="trade-card-expand trade-mobile-only">
          {card.media.image_url && (
            <div className="trade-card-expand-art">
              <img
                src={card.media.image_url}
                alt={card.media.accessibility_text ?? card.riot_name}
                loading="lazy"
                className="trade-card-expand-image"
                onClick={() => onQuickLook(card)}
              />
            </div>
          )}

          <div className="trade-card-expand-content">
            {/* Row 1: Condition | Qty + Remove inline */}
            <div className="trade-card-expand-controls">
              <div className="trade-expand-field">
                <label className="trade-expand-label">Condition</label>
                <select
                  className="trade-select trade-select--expand"
                  value={item.condition}
                  onChange={(e) => onCondition(e.target.value)}
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>{CONDITION_LABELS[c]}</option>
                  ))}
                </select>
              </div>

              <div className="trade-expand-field">
                <label className="trade-expand-label">Qty</label>
                <div className="trade-expand-qty-remove">
                  <div className="trade-qty-stepper trade-qty-stepper--expand">
                    <button className="trade-qty-btn" onClick={() => onQty(-1)}>−</button>
                    <span className="trade-qty-val">{item.qty}</span>
                    <button className="trade-qty-btn" onClick={() => onQty(1)}>+</button>
                  </div>
                  <button
                    className="trade-expand-remove-inline"
                    onClick={onRemove}
                    aria-label="Remove card"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Finish — spans full width, only when card has both */}
              {hasBothFinishes && (
                <div className="trade-expand-field trade-expand-field--span2">
                  <label className="trade-expand-label">Finish</label>
                  <select
                    className="trade-select trade-select--expand"
                    value={item.finish}
                    onChange={(e) => onFinish(e.target.value as "foil" | "nonfoil")}
                  >
                    <option value="foil">Foil</option>
                    <option value="nonfoil">Non-foil</option>
                  </select>
                </div>
              )}
            </div>

            {/* Row 2: Price · View on TCGPlayer · Move to side */}
            <div className="trade-expand-price-row">
              <span className="trade-expand-price-val">
                {lineTotal != null ? formatUsdPrice(lineTotal) : "—"}
              </span>
              {tcgUrl && (
                <a
                  className="trade-tcg-link"
                  href={tcgUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  View on TCGPlayer ↗
                </a>
              )}
              <button className="trade-expand-move-btn" onClick={onMove}>
                {moveLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────

export default function TradeBalancerView({ onNavigate, onQuickLook }: { onNavigate: (path: string) => void; onQuickLook: (card: CardRecord) => void }) {
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

  const searchInputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(searchQuery, 150);

  // ── Debounced search ──
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

    return () => {
      cancelled = true;
    };
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
      prev.map((i) =>
        i.key === key ? { ...i, qty: Math.max(1, i.qty + delta) } : i
      );
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
          .map((i) =>
            i.key === newKey ? { ...i, qty: i.qty + item.qty } : i
          );
      }
      return prev.map((i) =>
        i.key === key ? { ...i, key: newKey, finish: newFinish } : i
      );
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

    if (fromSide === "mine") {
      setMine(fromUpdater);
      setYours(toUpdater);
    } else {
      setYours(fromUpdater);
      setMine(toUpdater);
    }
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

  const tradeRatio = (mineTotal + yoursTotal) > 0
    ? Math.min(0.99, Math.max(0.01, mineTotal / (mineTotal + yoursTotal)))
    : 0.5;
  const splitPct = (tradeRatio * 100).toFixed(2);
  const deltaBarStyle = {
    background: `linear-gradient(90deg, var(--color-positive-emphasis) 0%, var(--color-positive-emphasis) ${splitPct}%, var(--color-negative-emphasis) ${splitPct}%, var(--color-negative-emphasis) 100%)`
  };

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

  // ── Search state ──
  const showSearchHint = debouncedQuery.trim().length < 2 && !searching;
  const showNoResults =
    debouncedQuery.trim().length >= 2 && !searching && searchResults.length === 0;

  function handleSearchFocus() {
    setSearchFocused(true);
  }

  function handleSearchBlur() {
    // Delay so button clicks in results still fire
    setTimeout(() => setSearchFocused(false), 200);
  }

  function clearSearch() {
    setSearchQuery("");
    setSearchResults([]);
    searchInputRef.current?.focus();
  }

  // ── Shared search panel ──
  const searchPanel = (
    <>
      <div className="trade-search-input-wrap">
        <input
          ref={searchInputRef}
          className="trade-search-input"
          type="text"
          placeholder="Search by name…"
          value={searchQuery}
          autoComplete="off"
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
        />
        {searching && <span className="trade-search-spinner" aria-hidden="true" />}
        {searchQuery && !searching && (
          <button
            className="trade-search-clear"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clearSearch}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      <div className="trade-search-results">
        {showSearchHint && (
          <p className="trade-search-hint">Type at least 2 characters to search</p>
        )}
        {showNoResults && (
          <p className="trade-search-hint">No cards found for "{debouncedQuery}"</p>
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
    </>
  );

  // ── Render ──
  return (
    <div className={`trade-page${searchFocused ? " trade-page--search-open" : ""}`}>

      {/* Mobile compact total strip — only visible when search is open */}
      <div className="trade-compact-strip trade-mobile-only">
        <div className="trade-compact-side">
          <span className="trade-compact-label trade-compact-label--mine">Mine</span>
          <span className="trade-compact-total">{formatUsdPrice(mineTotal) ?? "$0.00"}</span>
        </div>
        <div className={`trade-compact-delta trade-compact-delta--${deltaClass(delta)}`}>
          {formatDelta(delta)}
        </div>
        <div className="trade-compact-side trade-compact-side--right">
          <span className="trade-compact-label trade-compact-label--yours">Yours</span>
          <span className="trade-compact-total">{formatUsdPrice(yoursTotal) ?? "$0.00"}</span>
        </div>
      </div>

      {/* ── Mine side ── */}
      <div
        className={`trade-side trade-side--mine${dragOverSide === "mine" ? " trade-side--drop-target" : ""}`}
        onDragOver={(e) => handleDragOver(e, "mine")}
        onDragLeave={() => setDragOverSide(null)}
        onDrop={() => handleDrop("mine")}
      >
        <div className="trade-side-header trade-side-header--mine">
          <span className="trade-side-label trade-side-label--mine">Mine</span>
          <span className="trade-side-total">{formatUsdPrice(mineTotal) ?? "$0.00"}</span>
        </div>
        <div className="trade-side-body">
          {mine.length === 0 ? (
            <p className="trade-side-empty">Search to add your cards</p>
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
                onQuickLook={onQuickLook}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Search column (desktop center / mobile middle) ── */}
      <div className="trade-search-col">
        <p className="trade-search-heading trade-desktop-only">Add Cards</p>
        {searchPanel}
      </div>

      {/* ── Yours side ── */}
      <div
        className={`trade-side trade-side--yours${dragOverSide === "yours" ? " trade-side--drop-target" : ""}`}
        onDragOver={(e) => handleDragOver(e, "yours")}
        onDragLeave={() => setDragOverSide(null)}
        onDrop={() => handleDrop("yours")}
      >
        <div className="trade-side-header trade-side-header--yours">
          <span className="trade-side-label trade-side-label--yours">Yours</span>
          <span className="trade-side-total">{formatUsdPrice(yoursTotal) ?? "$0.00"}</span>
        </div>
        <div className="trade-side-body">
          {yours.length === 0 ? (
            <p className="trade-side-empty">Search to add their cards</p>
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
                onQuickLook={onQuickLook}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Delta bar (desktop) ── */}
      <div className="trade-delta-bar trade-desktop-only" style={deltaBarStyle}>
        <div className="trade-delta-side">
          <div className="trade-delta-label">Mine</div>
          <div className="trade-delta-total">{formatUsdPrice(mineTotal) ?? "$0.00"}</div>
        </div>
        <div className="trade-delta-arrow" aria-hidden="true">⟵</div>
        <div className="trade-delta-mid">
          <div className="trade-delta-label">Difference</div>
          <div className={`trade-delta-value trade-delta-value--${deltaClass(delta)}`}>
            {formatDelta(delta)}
          </div>
          {delta !== 0 && (
            <div className="trade-delta-note">
              {delta > 0 ? "You're offering more" : "You're offering less"}
            </div>
          )}
        </div>
        <div className="trade-delta-arrow" aria-hidden="true">⟶</div>
        <div className="trade-delta-side">
          <div className="trade-delta-label">Yours</div>
          <div className="trade-delta-total">{formatUsdPrice(yoursTotal) ?? "$0.00"}</div>
        </div>
      </div>

      {/* ── Mobile delta strip (always visible, bottom of page) ── */}
      <div className={`trade-mobile-delta trade-mobile-only trade-mobile-delta--${deltaClass(delta)}`}>
        {delta === 0
          ? "Trade is even"
          : delta > 0
          ? `You're offering ${formatUsdPrice(Math.abs(delta))} more`
          : `You're offering ${formatUsdPrice(Math.abs(delta))} less`}
      </div>

    </div>
  );
}
