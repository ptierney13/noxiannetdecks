import { useRef } from "react";

export type LearnTab = "visual-guide" | "text-guide" | "syntax-guide";

const TABS: { value: LearnTab; label: string }[] = [
  { value: "visual-guide", label: "Visual Guide" },
  { value: "text-guide",   label: "Text Guide"   },
  { value: "syntax-guide", label: "Syntax Guide" },
];

type LearnModeBarProps = {
  active: LearnTab;
  onChange: (tab: LearnTab) => void;
};

/**
 * Three-tab mode selector. Visually matches MenuItem — same color, weight,
 * underline, hover-glow, and transition. Renders buttons (not links) since
 * these are same-page mode switches, not navigation.
 */
export function LearnModeBar({ active, onChange }: LearnModeBarProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = tabRefs.current[(index + 1) % TABS.length];
      next?.focus();
      onChange(TABS[(index + 1) % TABS.length]!.value);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = tabRefs.current[(index - 1 + TABS.length) % TABS.length];
      prev?.focus();
      onChange(TABS[(index - 1 + TABS.length) % TABS.length]!.value);
    }
  }

  return (
    <div role="tablist" aria-label="Learn to Search mode" className="flex gap-1.5">
      {TABS.map(({ value, label }, i) => {
        const isActive = active === value;
        return (
          <button
            key={value}
            ref={(el) => { tabRefs.current[i] = el; }}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            className={[
              "min-h-[44px] px-[0.95rem] inline-flex items-center rounded-xl border text-sm font-bold cursor-pointer",
              "transition-[color,background-color,border-color] duration-[120ms]",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-focus-ring)]",
              isActive
                ? "bg-accent border-accent text-white"
                : "border-border-default bg-[rgba(255,255,255,0.12)] text-text-primary hover:bg-[var(--color-accent-soft)] hover:border-[var(--color-accent)]",
            ].join(" ")}
            onClick={() => onChange(value)}
            onKeyDown={(e) => handleKeyDown(e, i)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
