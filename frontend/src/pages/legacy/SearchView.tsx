import { useEffect, useMemo, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { searchCards } from "../../api";
import { CardQuickLookModal, VariantButtonRow } from "../../cardFormat";
import {
  cardEnergy,
  domainChipClass,
  formatCostText,
  renderTokenizedText,
  usePublishedPriceIndex,
} from "../../lib";
import { useAppError } from "../../app/ErrorContext";
import type { CardRecord, QueryDiagnostic } from "../../types";

type SortKey = "energy-asc" | "energy-desc" | "name-asc" | "name-desc" | "set";
type VariantMode = "unique-cards" | "unique-printings";

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

function groupCardsByRiftboundId(cards: CardRecord[]): CardRecord[][] {
  const groups = new Map<string, CardRecord[]>();
  for (const card of cards) {
    const key = card.riftbound_id ?? card.id;
    const existing = groups.get(key);
    if (existing) {
      existing.push(card);
    } else {
      groups.set(key, [card]);
    }
  }
  return [...groups.values()];
}

function stripUniqueFromQuery(query: string): string {
  return query.replace(/\bunique:\S+/g, "").trim();
}

function queryRequestsAllPrintings(query: string): boolean {
  return /\bunique:prints\b/.test(query);
}

function stripUniqueFromNormalized(normalized: string): string {
  return normalized.replace(/\bunique:\S+/g, "").trim();
}

function buildApiQuery(rawQuery: string): string {
  const stripped = stripUniqueFromQuery(rawQuery);
  return stripped.length > 0 ? `${stripped} unique:id` : "unique:id";
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

function SearchResultsGrid({
  cards,
  sort,
  showPrice,
  variantMode,
  showVariants,
  onCardClick,
}: {
  cards: CardRecord[];
  sort: SortKey;
  showPrice: boolean;
  variantMode: VariantMode;
  showVariants: boolean;
  onCardClick: (card: CardRecord, group: CardRecord[], finish?: "foil" | "nonfoil") => void;
}) {
  const { index: publishedPriceIndex } = usePublishedPriceIndex();
  const sorted = useMemo(() => sortCardsByKey(cards, sort), [cards, sort]);
  const cardGroups = useMemo(() => {
    if (variantMode === "unique-cards") return groupCardsByRiftboundId(sorted);
    return sorted.map((c) => [c]);
  }, [sorted, variantMode]);

  return (
    <div className="card-grid" data-testid="card-grid" data-columns="4">
      {cardGroups.map((group) => {
        const representative = group[0];
        const priceRepresentative = { ...representative, finishes: [representative.finishes[0]] };
        const buttonCards = showVariants ? group : showPrice ? [priceRepresentative] : [];
        return (
          <article
            className="card-tile card-tile--clickable"
            key={representative.id}
            data-layout={representative.media.layout}
            onClick={() => onCardClick(representative, group)}
          >
            {representative.media.image_url ? (
              <img
                src={representative.media.image_url}
                alt={representative.media.accessibility_text ?? representative.riot_name}
                loading="lazy"
              />
            ) : (
              <div className="missing-image">{representative.riot_name}</div>
            )}
            {buttonCards.length > 0 && (
              <VariantButtonRow
                cards={buttonCards}
                showPrice={showPrice}
                publishedPriceIndex={publishedPriceIndex}
                onVariantClick={(card, finish) => onCardClick(card, group, finish)}
              />
            )}
          </article>
        );
      })}
    </div>
  );
}

export default function SearchView() {
  const setError = useAppError();
  const { q: searchParamQuery = "" } = useSearch({ from: "/cards" });
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [diagnostics, setDiagnostics] = useState<QueryDiagnostic[]>([]);
  const [normalizedQuery, setNormalizedQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [quickLook, setQuickLook] = useState<{ group: CardRecord[]; card: CardRecord; finish: "foil" | "nonfoil" } | null>(null);
  const [sort, setSort] = useState<SortKey>("energy-asc");
  const [showPrice, setShowPrice] = useState(false);
  const [variantMode, setVariantMode] = useState<VariantMode>("unique-cards");
  const [showVariants, setShowVariants] = useState(false);

  useEffect(() => {
    let ignore = false;

    setError(null);
    setVariantMode(queryRequestsAllPrintings(searchParamQuery) ? "unique-printings" : "unique-cards");

    const windowQ = new URLSearchParams(window.location.search).get("q") ?? "";
    if (searchParamQuery !== windowQ) {
      return () => { ignore = true; };
    }

    if (searchParamQuery.trim().length === 0) {
      setCards([]);
      setDiagnostics([]);
      setNormalizedQuery("");
      setHasSearched(false);
      return () => { ignore = true; };
    }

    setHasSearched(true);

    async function syncSearchFromUrl() {
      try {
        const result = await searchCards(buildApiQuery(searchParamQuery));
        if (ignore) return;
        setCards(result.items);
        setDiagnostics(result.diagnostics);
        setNormalizedQuery(result.normalizedQuery);
      } catch (caught) {
        if (!ignore) setError(caught instanceof Error ? caught.message : "Search failed.");
      }
    }

    void syncSearchFromUrl();

    return () => { ignore = true; };
  }, [searchParamQuery, setError]);

  const cardGroups = useMemo(() => groupCardsByRiftboundId(cards), [cards]);
  const resultCount = variantMode === "unique-cards" ? cardGroups.length : cards.length;
  const displayedNormalizedQuery = stripUniqueFromNormalized(normalizedQuery);

  return (
    <>
      <div className="search-controls-panel">
        <div className="search-controls-row">
          <div className="search-control-group">
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
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showPrice}
              onChange={(e) => setShowPrice(e.target.checked)}
            />
            Show Prices
          </label>
          <div className="search-control-group">
            <label htmlFor="variant-mode-select">Variants</label>
            <select
              id="variant-mode-select"
              value={variantMode}
              onChange={(e) => setVariantMode(e.target.value as VariantMode)}
              className="sort-select"
            >
              <option value="unique-cards">Unique Cards</option>
              <option value="unique-printings">Unique Printings</option>
            </select>
          </div>
          {variantMode === "unique-cards" && (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showVariants}
                onChange={(e) => setShowVariants(e.target.checked)}
              />
              Show Variants
            </label>
          )}
        </div>
      </div>

      {hasSearched && (
        <p className="results-summary">
          {resultCount.toLocaleString()} matching card{resultCount !== 1 ? "s" : ""}
          {displayedNormalizedQuery ? ` with "${displayedNormalizedQuery}"${displayedNormalizedQuery.includes(":") ? "" : " anywhere"}` : ""}
        </p>
      )}

      <Diagnostics diagnostics={diagnostics} />
      {hasSearched ? (
        <SearchResultsGrid
          cards={cards}
          sort={sort}
          showPrice={showPrice}
          variantMode={variantMode}
          showVariants={showVariants}
          onCardClick={(card, group, finish) =>
            setQuickLook({ group, card, finish: finish ?? card.finishes[0] ?? "nonfoil" })
          }
        />
      ) : null}
      {quickLook ? (
        <CardQuickLookModal
          group={quickLook.group}
          initialCard={quickLook.card}
          initialFinish={quickLook.finish}
          onClose={() => setQuickLook(null)}
        />
      ) : null}
    </>
  );
}
