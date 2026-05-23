import { GuideDetailCard, type LtsDetailItem } from "./GuideDetailCard";

type GuideDetailStreamProps = {
  items: LtsDetailItem[];
  onRemove: (item: LtsDetailItem) => void;
  onAppend: (text: string) => void;
};

export function GuideDetailStream({ items, onRemove, onAppend }: GuideDetailStreamProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-subtle px-6 py-12 text-center">
        <p className="text-xl font-black leading-snug text-text-primary">Click any element to see details here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div
          key={`${item.label}-${item.category ?? ""}`}
          className="animate-[lts-detail-enter_150ms_ease-out_both] motion-reduce:animate-none"
        >
          <GuideDetailCard
            item={item}
            onAppend={onAppend}
            onRemove={() => onRemove(item)}
          />
        </div>
      ))}
    </div>
  );
}
