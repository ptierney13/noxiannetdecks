import type { ReactNode } from "react";
import { SyntaxQueryChip } from "../../ui-elements";

type ComparisonSide = {
  query: string;
  label: string;
  description: string;
  visual?: ReactNode;
};

type SyntaxComparisonCardProps = {
  left: ComparisonSide;
  right: ComparisonSide;
  onClick: (query: string) => void;
};

function Side({ side, onClick }: { side: ComparisonSide; onClick: (q: string) => void }) {
  return (
    <button
      type="button"
      className="group flex w-full flex-col gap-2 rounded-xl border border-border-default bg-[linear-gradient(180deg,rgba(25,31,43,0.86),rgba(12,15,23,0.92))] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] transition-[background,border-color,box-shadow,transform] duration-[140ms] hover:-translate-y-px hover:border-accent/40 hover:bg-[linear-gradient(180deg,rgba(34,39,52,0.92),rgba(16,20,30,0.96))] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.065),0_0_0_1px_rgba(197,50,71,0.22),0_10px_22px_rgba(0,0,0,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
      onClick={() => onClick(side.query)}
      title={`Try: ${side.query}`}
    >
      <SyntaxQueryChip query={side.query} />
      <p className="text-sm font-semibold text-text-primary leading-snug">{side.label}</p>
      <p className="text-xs text-text-secondary leading-relaxed">{side.description}</p>
      {side.visual && (
        <div className="mt-1">{side.visual}</div>
      )}
    </button>
  );
}

export function SyntaxComparisonCard({ left, right, onClick }: SyntaxComparisonCardProps) {
  return (
    <div className="grid grid-cols-2 max-[560px]:grid-cols-1 gap-3">
      <Side side={left}  onClick={onClick} />
      <Side side={right} onClick={onClick} />
    </div>
  );
}
