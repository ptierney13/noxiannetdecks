import { useMemo } from "react";
import { parseQuery } from "@noxiannet/card-store/query";
import { executedTokensToDisplay } from "@noxiannet/card-store/query";
import { SyntaxQueryChip } from "../../ui-elements";

type SyntaxSandboxProps = {
  query: string;
  onChange: (query: string) => void;
};

/**
 * Editable query sandbox with live syntax highlighting and semantic breakdown.
 * Uses parseQuery() from card-store so the explanation matches real search behavior.
 */
export function SyntaxSandbox({ query, onChange }: SyntaxSandboxProps) {
  const parsed = useMemo(
    () => (query.trim() ? parseQuery(query) : null),
    [query]
  );

  const displayItems = useMemo(
    () => (parsed ? executedTokensToDisplay(parsed.executedTokens, { includeDropped: true }) : []),
    [parsed]
  );

  return (
    <div className="rounded-2xl border border-border-strong bg-surface-2 overflow-hidden shadow-md">
      {/* Input row */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border-subtle">
        <svg aria-hidden="true" className="shrink-0 text-text-tertiary" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="flex-1 bg-transparent font-mono text-base text-text-primary placeholder:text-text-tertiary/50 focus:outline-none"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="t:unit c>=3 -tag:dragon"
          aria-label="Query sandbox input"
          spellCheck={false}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            className="shrink-0 text-text-tertiary/50 hover:text-text-secondary transition-colors duration-[100ms] focus-visible:outline-none"
            onClick={() => onChange("")}
            aria-label="Clear query"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" strokeWidth="2.5" stroke="currentColor" fill="none">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Semantic breakdown */}
      <div className="px-5 py-4 min-h-[80px]">
        {!query.trim() && (
          <p className="text-sm text-text-tertiary/60 italic">Type a query above to see how it's interpreted.</p>
        )}

        {query.trim() && displayItems.length === 0 && parsed?.diagnostics.length === 0 && (
          <p className="text-sm text-text-tertiary/60 italic">Matches all cards.</p>
        )}

        {displayItems.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {displayItems.map((item, i) => {
              if (item === "AND" || item === "OR") return null;
              return (
                <li key={i} className="flex items-baseline gap-2">
                  <span className={[
                    "shrink-0 text-xs font-bold",
                    item.state === "dropped" ? "text-accent" : "text-accent-warm",
                  ].join(" ")}>
                    {item.state === "dropped" ? "—" : "OK"}
                  </span>
                  <span className={[
                    "text-sm leading-snug",
                    item.state === "dropped" ? "text-text-tertiary line-through" : "text-text-secondary",
                  ].join(" ")}>
                    {item.prefix && <span className="text-text-tertiary">{item.prefix} </span>}
                    <span className={item.state === "dropped" ? "" : "text-text-primary font-medium"}>{item.value}</span>
                    {item.suffix && <span className="text-text-tertiary"> {item.suffix}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {parsed && parsed.diagnostics.length > 0 && (
          <ul className="flex flex-col gap-1 mt-2">
            {parsed.diagnostics.map((d, i) => (
              <li key={i} className="flex items-baseline gap-2">
                <span className="shrink-0 text-xs font-bold text-text-tertiary">?</span>
                <span className="text-xs text-text-tertiary leading-snug">{d.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
