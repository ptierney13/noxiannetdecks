import { GuideDetailCard, type LtsDetailItem } from "./GuideDetailCard";

type GuideDetailStreamProps = {
  items: LtsDetailItem[];
  onRemove: (item: LtsDetailItem) => void;
  onAppend: (text: string) => void;
};

export function GuideDetailStream({ items, onRemove, onAppend }: GuideDetailStreamProps) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border-default bg-surface-inset/70 px-6 py-12 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
        <p className="max-w-[18rem] text-xl font-black leading-snug text-text-primary">Select a field to build its guide card here</p>
        <p className="mt-2 max-w-[20rem] text-sm leading-relaxed text-text-tertiary">
          Details stack on desktop and open as a focused card on smaller screens.
        </p>
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
