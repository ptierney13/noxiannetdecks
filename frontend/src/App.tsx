import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { loadQueryFeatures, searchCards } from "./api";
import type { CardRecord, QueryDiagnostic, QueryFieldGuide, QuerySyntaxGuide } from "./types";

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
  const [showFields, setShowFields] = useState(true);
  const [showSyntax, setShowSyntax] = useState(true);

  return (
    <section className="feature-section" aria-labelledby="query-language-heading">
      <div className="section-heading">
        <h2 id="query-language-heading">Query Language</h2>
        <p>Find cards by property, then combine searches with syntax operations.</p>
      </div>
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

function CardGrid({ cards }: { cards: CardRecord[] }) {
  return (
    <section className="results-section" aria-labelledby="results-heading">
      <div className="section-heading compact">
        <h2 id="results-heading">Results</h2>
        <p>{cards.length.toLocaleString()} matching cards</p>
      </div>
      <div className="card-grid" data-testid="card-grid" data-columns="4">
        {cards.map((card) => (
          <article className="card-tile" key={card.id}>
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

export default function App() {
  const [query, setQuery] = useState("");
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [diagnostics, setDiagnostics] = useState<QueryDiagnostic[]>([]);
  const [fieldGuides, setFieldGuides] = useState<QueryFieldGuide[]>([]);
  const [syntaxGuides, setSyntaxGuides] = useState<QuerySyntaxGuide[]>([]);
  const [normalizedQuery, setNormalizedQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(nextQuery: string) {
    setIsSearching(true);
    setError(null);
    setHasSearched(true);
    try {
      const result = await searchCards(nextQuery);
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
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch(query);
  }

  return (
    <main className="app-shell">
      <section className="search-panel" aria-labelledby="search-heading">
        <div className="search-copy">
          <p className="eyebrow">Noxiannet Decks</p>
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

      {error ? <div className="error-banner">{error}</div> : null}
      <Diagnostics diagnostics={diagnostics} />
      <QueryLanguageTables fields={fieldGuides} syntax={syntaxGuides} />
      {hasSearched ? <CardGrid cards={cards} /> : null}
    </main>
  );
}
