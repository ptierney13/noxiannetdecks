import { type FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { loadQueryFeatures, searchCards } from "../../api";
import { CardSearchGuide } from "./CardSearchGuide";
import {
  CardQuickLookModal,
  VariantButtonRow,
  cardEnergy,
  domainChipClass,
  formatCostText,
  renderTokenizedText,
} from "../../cardFormat";
import { usePublishedPriceIndex } from "../../lib";
import { SearchIcon } from "../../ui-elements";
import { useAppError } from "../../app/ErrorContext";
import type { CardRecord, QueryDiagnostic, QueryFieldGuide, QuerySyntaxGuide } from "../../types";

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
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            focusable="false"
            className={expanded ? "chevron expanded" : "chevron"}
          >
            <path d="M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6 1.4-1.4Z" fill="currentColor" />
          </svg>
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
  const navigate = useNavigate();
  const setError = useAppError();
  const { q: searchParamQuery = "" } = useSearch({ from: "/cards" });
  const [query, setQuery] = useState("");
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [diagnostics, setDiagnostics] = useState<QueryDiagnostic[]>([]);
  const [fieldGuides, setFieldGuides] = useState<QueryFieldGuide[]>([]);
  const [syntaxGuides, setSyntaxGuides] = useState<QuerySyntaxGuide[]>([]);
  const [normalizedQuery, setNormalizedQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [quickLook, setQuickLook] = useState<{ group: CardRecord[]; card: CardRecord; finish: "foil" | "nonfoil" } | null>(null);
  const [sort, setSort] = useState<SortKey>("energy-asc");
  const [showPrice, setShowPrice] = useState(false);
  const [variantMode, setVariantMode] = useState<VariantMode>("unique-cards");
  const [showVariants, setShowVariants] = useState(false);

  async function runSearch(rawQuery: string) {
    setIsSearching(true);
    setError(null);
    setHasSearched(true);
    try {
      const result = await searchCards(buildApiQuery(rawQuery));
      setCards(result.items);
      setDiagnostics(result.diagnostics);
      setNormalizedQuery(result.normalizedQuery);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Search failed.");
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
          setError(caught instanceof Error ? caught.message : "Unable to load card search.");
        }
      }
    }

    void boot();

    return () => {
      ignore = true;
    };
  }, [setError]);

  useEffect(() => {
    let ignore = false;

    setQuery(searchParamQuery);
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

    setIsSearching(true);
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
      } finally {
        if (!ignore) setIsSearching(false);
      }
    }

    void syncSearchFromUrl();

    return () => { ignore = true; };
  }, [searchParamQuery, setError]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();

    if (trimmedQuery === searchParamQuery) {
      void runSearch(query);
      return;
    }

    navigate({ to: "/cards", search: { q: trimmedQuery.length > 0 ? trimmedQuery : undefined } });
  }

  const cardGroups = useMemo(() => groupCardsByRiftboundId(cards), [cards]);
  const resultCount = variantMode === "unique-cards" ? cardGroups.length : cards.length;
  const displayedNormalizedQuery = stripUniqueFromNormalized(normalizedQuery);

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
      <QueryLanguageTables fields={fieldGuides} syntax={syntaxGuides} />
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
