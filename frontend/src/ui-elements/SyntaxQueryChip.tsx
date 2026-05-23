import { useMemo } from "react";
import { parseQuery } from "@noxiannet/card-store/query";
import type { ExecutedCondition, ExecutedQueryItem } from "@noxiannet/card-store/query";

export type SyntaxQueryChipProps = {
  query: string;
  onClick?: (query: string) => void;
};

function ConditionSpans({ cond }: { cond: ExecutedCondition }) {
  const dropped = cond.state === "dropped";
  const cls = (color: string) =>
    dropped ? "font-mono text-text-tertiary/40 line-through" : `font-mono ${color}`;

  return (
    <>
      {cond.negated && <span className={cls("text-accent")}>-</span>}
      {cond.field !== null && (
        <>
          <span className={cls("text-accent-warm")}>{cond.field}</span>
          <span className={cls("text-text-tertiary")}>{cond.op}</span>
        </>
      )}
      <span className={cls("text-text-primary")}>{cond.value}</span>
    </>
  );
}

function TokenList({ items }: { items: ExecutedQueryItem[] }) {
  return (
    <>
      {items.map((item, i) => {
        if (item === "AND") {
          return <span key={i} className="font-mono"> </span>;
        }
        if (item === "OR") {
          return (
            <span key={i} className="font-mono text-accent-warm"> or </span>
          );
        }
        return <ConditionSpans key={i} cond={item} />;
      })}
    </>
  );
}

/**
 * Renders a query string with per-token syntax highlighting.
 * When `onClick` is provided, renders as an interactive button matching QueryChip sizing.
 * When `onClick` is omitted, renders as a non-interactive <code> element (e.g. QB built query display).
 */
export function SyntaxQueryChip({ query, onClick }: SyntaxQueryChipProps) {
  const tokens = useMemo(
    () => (query.trim() ? parseQuery(query).executedTokens : []),
    [query]
  );

  const content = <TokenList items={tokens} />;

  if (onClick) {
    return (
      <button
        type="button"
        className="inline-flex items-center px-2.5 py-1 bg-surface-2 border border-border-default rounded-lg text-sm transition-[background-color,border-color] duration-[120ms] hover:bg-accent-soft hover:border-[rgba(197,50,71,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
        onClick={() => onClick(query)}
        title={`Use query: ${query}`}
      >
        {content}
      </button>
    );
  }

  return (
    <code className="inline-flex flex-wrap items-baseline gap-0 text-sm leading-relaxed">
      {content}
    </code>
  );
}
