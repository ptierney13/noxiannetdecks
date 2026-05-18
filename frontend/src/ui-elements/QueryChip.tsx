type QueryChipProps = {
  text: string;
  onAppend: (text: string) => void;
};

export function QueryChip({ text, onAppend }: QueryChipProps) {
  return (
    <button
      type="button"
      data-query-chip
      className="inline-flex items-center px-2 py-0.5 bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-md font-mono text-[0.8rem] text-[var(--color-accent-warm)] cursor-pointer transition-[background-color,border-color,color] duration-[120ms] hover:bg-[var(--color-accent-warm-soft)] hover:border-[rgba(215,170,73,0.4)] focus-visible:bg-[var(--color-accent-warm-soft)] focus-visible:border-[rgba(215,170,73,0.4)] focus-visible:outline-none"
      onClick={(e) => { e.stopPropagation(); onAppend(text); }}
      title={`Add "${text}" to search`}
    >
      {text}
    </button>
  );
}
