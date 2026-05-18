import { SearchIcon } from "./Icon";

function TradeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M7 7h8.5l-2.7-2.7L14.2 3 19 7.8l-4.8 4.8-1.4-1.3L15.5 9H7V7Zm10 8H8.5l2.7 2.7-1.4 1.3L5 14.2l4.8-4.8 1.4 1.3L8.5 13H17v2Z" fill="currentColor" />
    </svg>
  );
}

function SealedIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <rect x="4.5" y="7.5" width="15" height="11.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 7.5c0-1.7 1.6-3 5-3s5 1.3 5 3" fill="none" opacity="0.7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 12h8M12 8.8v6.4" fill="none" opacity="0.7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

export type FeatureCardProps = {
  title: string;
  description: string;
  href: string;
  onNavigate: (href: string) => void;
  icon: "search" | "trade" | "sealed";
};

export function FeatureCard({ title, description, href, onNavigate, icon }: FeatureCardProps) {
  const glyph =
    icon === "search" ? <SearchIcon /> : icon === "trade" ? <TradeIcon /> : <SealedIcon />;

  return (
    <a
      href={href}
      className="grid gap-[0.8rem] @[768px]:gap-[1rem] justify-items-start p-[1.05rem_0.95rem_1rem] @[640px]:p-[1.15rem] @[768px]:p-[1.25rem] @[1280px]:p-[1.35rem] rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(196,44,67,0.12),rgba(216,170,73,0.06)),rgba(10,13,20,0.9)] shadow-[var(--shadow-surface-1)] no-underline text-inherit text-left transition-[transform,border-color,box-shadow] duration-[180ms] hover:-translate-y-[2px] hover:border-[rgba(243,198,95,0.54)] hover:shadow-[0_20px_46px_rgba(0,0,0,0.38),0_0_0_1px_rgba(209,53,76,0.28)]"
      onClick={(event) => {
        event.preventDefault();
        onNavigate(href);
      }}
    >
      <div className="flex justify-between items-start gap-[0.75rem] w-full">
        <div className="w-[3.4rem] h-[3.4rem] rounded-[1rem] grid place-items-center text-[#fff8f2] bg-[linear-gradient(135deg,#bf2b45_0%,#d8aa49_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] [&_svg]:w-[1.45rem] [&_svg]:h-[1.45rem]">
          {glyph}
        </div>
        <span className="hidden @[768px]:inline text-text-tertiary text-[1.15rem]" aria-hidden="true">→</span>
      </div>
      <div className="grid gap-0 @[768px]:gap-[0.4rem] w-full min-w-0 justify-items-start">
        <h3 className="m-0 text-text-primary max-w-full text-[1.08rem] @[768px]:text-[1.22rem] @[1280px]:text-[1.45rem] leading-[1.12] overflow-anywhere text-balance">{title}</h3>
        <p className="m-0 text-text-secondary leading-[1.55] block text-[0.94rem]">{description}</p>
      </div>
    </a>
  );
}
