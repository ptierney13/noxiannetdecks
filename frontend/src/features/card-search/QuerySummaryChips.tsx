import type { DisplayItem } from "@noxiannet/card-store/query";

export function QuerySummaryChips({ items }: { items: DisplayItem[] }) {
  return (
    <>
      {items.map((item, i) => {
        if (item === "AND" || item === "OR") {
          return (
            <span key={`conn-${i}`} className="text-[0.7rem] font-black uppercase tracking-widest text-text-secondary">
              {item}
            </span>
          );
        }
        return (
          <span
            key={`exec-${i}`}
            className="inline-flex items-center gap-1 rounded-lg border border-[rgba(215,170,73,0.4)] bg-accent-warm-soft px-3 py-1 text-sm"
          >
            {item.prefix ? <span className="font-semibold text-accent-warm">{item.prefix}</span> : null}
            <span className="font-black text-text-primary">{item.value}</span>
            {item.suffix ? <span className="font-semibold text-accent-warm">{item.suffix}</span> : null}
          </span>
        );
      })}
    </>
  );
}
