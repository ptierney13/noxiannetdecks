import { QuerySyntaxText } from "./QuerySyntaxText";

type QueryChipProps = {
  text: string;
  onAppend: (text: string) => void;
};

export function QueryChip({ text, onAppend }: QueryChipProps) {
  return (
    <button
      type="button"
      data-query-chip
      className="inline-flex min-h-8 items-center rounded-md border border-border-default bg-[linear-gradient(180deg,rgba(31,37,52,0.94),rgba(15,18,28,0.98))] px-2 py-0.5 text-[0.8rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.055),0_3px_8px_rgba(0,0,0,0.18)] transition-[background,border-color,box-shadow,transform] duration-[120ms] hover:-translate-y-px hover:border-[rgba(215,170,73,0.42)] hover:bg-[linear-gradient(180deg,rgba(44,42,28,0.86),rgba(27,22,18,0.94))] focus-visible:border-[rgba(215,170,73,0.48)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
      onClick={(e) => { e.stopPropagation(); onAppend(text); }}
      title={`Add "${text}" to search`}
    >
      <QuerySyntaxText query={text} className="text-[0.8rem] leading-snug" />
    </button>
  );
}
