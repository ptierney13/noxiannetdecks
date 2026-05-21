import type { CardRecord } from "../types";
import { formatCostText, renderTokenizedText } from "../lib";

export type CardMetaChipsProps = {
  card: CardRecord;
  className?: string;
};

const DOMAIN_CHIP_CLASSES: Record<string, string> = {
  Fury: "border-[color:var(--domain-fury)] bg-[var(--domain-fury-soft)] text-[color:var(--domain-fury)]",
  Calm: "border-[color:var(--domain-calm)] bg-[var(--domain-calm-soft)] text-[color:var(--domain-calm)]",
  Mind: "border-[color:var(--domain-mind)] bg-[var(--domain-mind-soft)] text-[color:var(--domain-mind)]",
  Body: "border-[color:var(--domain-body)] bg-[var(--domain-body-soft)] text-[color:var(--domain-body)]",
  Chaos: "border-[color:var(--domain-chaos)] bg-[var(--domain-chaos-soft)] text-[color:var(--domain-chaos)]",
  Order: "border-[color:var(--domain-order)] bg-[var(--domain-order-soft)] text-[color:var(--domain-order)]",
};

const BASE_CHIP_CLASS =
  "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.08em]";

function domainChipClass(domains: string[]): string {
  if (domains.length === 1) {
    return `${BASE_CHIP_CLASS} ${DOMAIN_CHIP_CLASSES[domains[0] ?? ""] ?? "border-border-default bg-surface-3 text-text-secondary"}`;
  }

  return `${BASE_CHIP_CLASS} border-accent-warm/50 bg-[linear-gradient(135deg,var(--domain-fury-soft),var(--domain-mind-soft),var(--domain-order-soft))] text-accent-warm`;
}

export function CardMetaChips({ card, className }: CardMetaChipsProps) {
  const costText = formatCostText(card);
  const domains = card.attributes.domain;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      {costText ? (
        <span className={`${BASE_CHIP_CLASS} border-border-default bg-surface-3 text-text-primary`}>
          Cost {renderTokenizedText(costText, { size: "chip" })}
        </span>
      ) : null}
      {card.attributes.might != null ? (
        <span className={`${BASE_CHIP_CLASS} border-border-default bg-surface-3 text-text-primary`}>
          Might
          <span className="inline-flex items-center gap-1">
            {card.attributes.might}
            {renderTokenizedText("{T}", { size: "chip" })}
          </span>
        </span>
      ) : null}
      {domains.length > 0 ? (
        <span className={domainChipClass(domains)}>{domains.join(", ")}</span>
      ) : null}
    </div>
  );
}
