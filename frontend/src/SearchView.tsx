import { type FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadQueryFeatures, searchCards } from "./api";
import { CardSearchGuide } from "./CardSearchGuide";
import {
  CardQuickLookModal,
  cardEnergy,
  domainChipClass,
  formatCostText,
  renderTokenizedText,
} from "./cardFormat";
import { SearchIcon } from "./ui";
import { normalizePathname } from "./routes";
import type { CardRecord, QueryDiagnostic, QueryFieldGuide, QuerySyntaxGuide } from "./types";

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

export default function SearchView({
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
