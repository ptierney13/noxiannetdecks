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
      className="group flex flex-col gap-2 p-4 rounded-xl border border-border-default bg-surface-2 text-left transition-[background-color,border-color,box-shadow] duration-[120ms] hover:bg-accent-soft/30 hover:border-accent/40 hover:shadow-[0_0_0_1px_rgba(197,50,71,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] w-full"
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
