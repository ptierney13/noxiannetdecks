import { QuerySyntaxText } from "./QuerySyntaxText";

export type SyntaxQueryChipProps = {
  query: string;
  onClick?: (query: string) => void;
};

/**
 * Renders the original query string with per-token syntax highlighting.
 * When `onClick` is provided, renders as an interactive button matching QueryChip sizing.
 * When `onClick` is omitted, renders as a non-interactive <code> element (e.g. QB built query display).
 */
export function SyntaxQueryChip({ query, onClick }: SyntaxQueryChipProps) {
  const content = <QuerySyntaxText query={query} className="text-sm leading-relaxed" />;

  if (onClick) {
    return (
      <button
        type="button"
        className="inline-flex min-h-9 items-center rounded-lg border border-border-default bg-[linear-gradient(180deg,rgba(31,37,52,0.96),rgba(15,18,28,0.98))] px-2.5 py-1 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_10px_rgba(0,0,0,0.18)] transition-[background,border-color,box-shadow,transform] duration-[140ms] hover:-translate-y-px hover:border-border-strong hover:bg-[linear-gradient(180deg,rgba(41,49,66,0.98),rgba(20,24,35,0.98))] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_18px_rgba(0,0,0,0.26)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
        onClick={() => onClick(query)}
        title={`Use query: ${query}`}
      >
        {content}
      </button>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-baseline gap-0">{content}</span>
  );
}
