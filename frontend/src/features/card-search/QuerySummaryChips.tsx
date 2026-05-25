import type { DisplayItem } from "@noxiannet/card-store/query";
import { FIELD_COLOR, hexToRgba } from "../../lib";

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

        if (item.state === "dropped") {
          return (
            <span
              key={`drop-${i}`}
              className="inline-flex items-center gap-1 rounded-lg border border-negative-border bg-negative-soft px-3 py-1 text-sm"
            >
              {item.prefix ? (
                <span className="font-semibold text-red-400">{item.prefix}</span>
              ) : null}
              <span className="font-black text-red-300">{item.value}</span>
            </span>
          );
        }

        // Executed chip — color derived from canonical field.
        // Falls back to amber/gold when field is null (bare-text search).
        const fieldColor = item.canonicalField ? FIELD_COLOR[item.canonicalField] : undefined;

        const chipStyle = fieldColor
          ? {
              borderColor: hexToRgba(fieldColor, 0.30),
              backgroundColor: hexToRgba(fieldColor, 0.08),
            }
          : {
              borderColor: "rgba(215,170,73,0.4)",
              backgroundColor: "var(--color-accent-warm-soft)",
            };

        const labelColor = fieldColor ?? "var(--color-accent-warm)";

        return (
          <span
            key={`exec-${i}`}
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-sm"
            style={chipStyle}
          >
            {item.prefix ? (
              <span className="font-semibold" style={{ color: labelColor }}>
                {item.prefix}
              </span>
            ) : null}
            <span className="font-black text-text-primary">{item.value}</span>
            {item.suffix ? (
              <span className="font-semibold" style={{ color: labelColor }}>
                {item.suffix}
              </span>
            ) : null}
          </span>
        );
      })}
    </>
  );
}
