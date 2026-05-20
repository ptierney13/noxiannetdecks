import { TileBase } from "./TileBase";

export type TilePromoProps = {
  label: string;
  title: string;
  description: string;
  href?: string;
  onNavigate?: (href: string) => void;
};

export function TilePromo({ label, title, description, href, onNavigate }: TilePromoProps) {
  return (
    <TileBase
      href={href}
      onNavigate={onNavigate}
      className="relative gap-[0.7rem] min-h-0 p-[1rem_1.05rem_1.05rem]"
    >
      <div className="m-0 text-accent-warm uppercase tracking-[0.08em] text-[0.76rem] font-bold">{label}</div>
      <h3 className="m-0 text-text-primary max-w-full text-[1.08rem] @md:text-[1.35rem] leading-[1.12] overflow-anywhere text-balance">{title}</h3>
      <p className="m-0 text-text-secondary leading-[1.55] text-[0.94rem]">{description}</p>
      <span className="absolute top-[1.35rem] right-[1.35rem] text-text-tertiary text-[1.15rem]" aria-hidden="true">→</span>
    </TileBase>
  );
}
