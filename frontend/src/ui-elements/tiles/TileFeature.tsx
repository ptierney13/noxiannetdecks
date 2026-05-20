import { SearchIcon, TradeIcon, SealedIcon } from "../Icon";
import { TileBase } from "./TileBase";

export type TileFeatureProps = {
  title: string;
  description: string;
  href: string;
  onNavigate: (href: string) => void;
  icon: "search" | "trade" | "sealed";
};

export function TileFeature({ title, description, href, onNavigate, icon }: TileFeatureProps) {
  const glyph =
    icon === "search" ? <SearchIcon /> : icon === "trade" ? <TradeIcon /> : <SealedIcon />;

  return (
    <TileBase
      href={href}
      onNavigate={onNavigate}
      className="gap-[1rem] justify-items-start text-left"
    >
      <div className="flex justify-between items-start gap-[0.75rem] w-full">
        <div className="w-[3.4rem] h-[3.4rem] rounded-[1rem] grid place-items-center text-[#fff8f2] bg-[linear-gradient(135deg,#bf2b45_0%,#d8aa49_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] [&_svg]:w-[1.45rem] [&_svg]:h-[1.45rem]">
          {glyph}
        </div>
        <span className="text-text-tertiary text-[1.15rem]" aria-hidden="true">→</span>
      </div>
      <div className="grid gap-[0.4rem] w-full min-w-0 justify-items-start">
        <h3 className="m-0 text-text-primary max-w-full text-[1.35rem] leading-[1.12] overflow-anywhere text-balance">{title}</h3>
        <p className="m-0 text-text-secondary leading-[1.55] block text-[0.94rem]">{description}</p>
      </div>
    </TileBase>
  );
}
