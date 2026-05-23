import { GuideDetailCard, type LtsDetailItem } from "./GuideDetailCard";

type GuideDetailStreamProps = {
  items: LtsDetailItem[];
  onRemove: (item: LtsDetailItem) => void;
  onAppend: (text: string) => void;
};

export function GuideDetailStream({ items, onRemove, onAppend }: GuideDetailStreamProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-subtle px-6 py-10 text-center">
        <p className="text-sm font-medium text-text-tertiary">Click any element to see details here</p>
        <p className="text-xs text-text-tertiary/60">Most recent selections appear at the top</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <GuideDetailCard
          key={`${item.label}-${item.category ?? ""}`}
          item={item}
          onAppend={onAppend}
          onRemove={() => onRemove(item)}
        />
      ))}
    </div>
  );
}
