export type PromoCardProps = {
  label: string;
  title: string;
  description: string;
  href?: string;
  onNavigate?: (href: string) => void;
  muted?: boolean;
};

export function PromoCard({ label, title, description, href, onNavigate, muted = false }: PromoCardProps) {
  const baseClass = [
    "relative grid gap-[0.7rem] min-h-0 p-[1rem_1.05rem_1.05rem] @[640px]:p-[1.15rem] @[768px]:p-[1.25rem] @[1280px]:p-[1.35rem] rounded-[22px] border border-[rgba(255,255,255,0.08)] shadow-[var(--shadow-surface-1)] text-inherit no-underline transition-[transform,border-color,box-shadow] duration-[180ms]",
    "hover:-translate-y-[2px] hover:border-[rgba(243,198,95,0.54)] hover:shadow-[0_20px_46px_rgba(0,0,0,0.38),0_0_0_1px_rgba(209,53,76,0.28)]",
    muted
      ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.016),rgba(255,255,255,0)),rgba(8,10,16,0.94)]"
      : "bg-[linear-gradient(180deg,rgba(199,45,68,0.14),rgba(216,170,73,0.08)),rgba(10,13,20,0.9)]",
  ].join(" ");

  const inner = (
    <>
      <div className="m-0 text-accent-warm uppercase tracking-[0.08em] text-[0.76rem] font-bold">{label}</div>
      <h3 className="m-0 text-text-primary max-w-full text-[1.08rem] @[768px]:text-[1.22rem] @[1280px]:text-[1.45rem] leading-[1.12] overflow-anywhere text-balance">{title}</h3>
      <p className="m-0 text-text-secondary leading-[1.55] text-[0.94rem]">{description}</p>
      <span className="absolute top-[1.35rem] right-[1.35rem] text-text-tertiary text-[1.15rem]" aria-hidden="true">→</span>
    </>
  );

  if (!href || !onNavigate) {
    return <div className={baseClass}>{inner}</div>;
  }

  return (
    <a
      href={href}
      className={baseClass}
      onClick={(event) => {
        event.preventDefault();
        onNavigate(href);
      }}
    >
      {inner}
    </a>
  );
}
