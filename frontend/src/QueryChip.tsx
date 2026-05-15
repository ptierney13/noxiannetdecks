type QueryChipProps = {
  text: string;
  onAppend: (text: string) => void;
};

export function QueryChip({ text, onAppend }: QueryChipProps) {
  return (
    <button
      type="button"
      className="query-chip"
      data-query-chip
      onClick={(e) => { e.stopPropagation(); onAppend(text); }}
      title={`Add "${text}" to search`}
    >
      {text}
    </button>
  );
}
