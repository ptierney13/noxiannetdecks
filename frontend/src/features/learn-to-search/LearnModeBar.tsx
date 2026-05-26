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
    <div
      role="tablist"
      aria-label="Learn to Search mode"
      className="flex w-full flex-wrap gap-1.5 rounded-2xl border border-border-default bg-surface-inset/80 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:w-auto"
    >
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
              "inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border px-[0.95rem] text-sm font-bold sm:flex-none",
              "transition-[background,border-color,box-shadow,transform,color] duration-[140ms]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
              isActive
                ? "border-accent bg-[linear-gradient(180deg,rgba(112,38,51,0.92),rgba(53,17,27,0.96))] text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_0_1px_rgba(197,50,71,0.28),0_8px_18px_rgba(0,0,0,0.24)]"
                : "border-[rgba(255,255,255,0.16)] bg-[linear-gradient(180deg,rgba(36,43,58,0.88),rgba(17,21,31,0.94))] text-text-secondary shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] hover:-translate-y-px hover:border-border-strong hover:text-text-primary",
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
