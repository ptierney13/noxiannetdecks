import { QueryChip } from "../../ui-elements";

export type LtsDetailItem = {
  label: string;
  category?: string;
  description: string;
  query?: string;
  shorthand?: string;
  examples?: string[];
};

type GuideDetailCardProps = {
  item: LtsDetailItem;
  onAppend: (text: string) => void;
  onRemove?: () => void;
};

export function GuideDetailCard({ item, onAppend, onRemove }: GuideDetailCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-default bg-[linear-gradient(180deg,rgba(24,30,42,0.96),rgba(12,15,23,0.98))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.055),0_12px_28px_rgba(0,0,0,0.24)]">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="flex flex-col gap-0.5 min-w-0">
          {item.category && item.category.toLowerCase() !== item.label.toLowerCase() && (
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-text-tertiary leading-none">
              {item.category}
            </span>
          )}
          <span className="text-lg font-black leading-snug text-text-primary">{item.label}</span>
        </div>
        {onRemove && (
          <button
            type="button"
            className="shrink-0 mt-0.5 grid place-items-center w-7 h-7 rounded-full border border-border-subtle bg-surface-1 text-text-tertiary transition-[background-color,color] duration-[100ms] hover:bg-accent-soft hover:border-accent/30 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
            onClick={onRemove}
            aria-label={`Remove ${item.label}`}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" width="13" height="13" strokeWidth="2.5" stroke="currentColor" fill="none">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-text-secondary leading-relaxed">{item.description}</p>

      {/* Syntax + shorthand chips */}
      {(item.query || item.shorthand) && (
        <div className="flex flex-col gap-2">
          {item.query && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-text-tertiary shrink-0">Syntax</span>
              <QueryChip text={item.query} onAppend={onAppend} />
            </div>
          )}
          {item.shorthand && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-text-tertiary shrink-0">Shorthand</span>
              {item.shorthand.split(/\s+or\s+/i).map((token) => (
                <QueryChip key={token} text={token.trim()} onAppend={onAppend} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Examples */}
      {item.examples && item.examples.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-text-tertiary shrink-0">Examples</span>
          {item.examples.map((ex) => (
            <QueryChip key={ex} text={ex} onAppend={onAppend} />
          ))}
        </div>
      )}
    </div>
  );
}
