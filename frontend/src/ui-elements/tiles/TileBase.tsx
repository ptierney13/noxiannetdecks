import { type ReactNode } from "react";

const BASE =
  "h-full grid rounded-[22px] border border-[rgba(255,255,255,0.08)] shadow-[var(--shadow-surface-1)] text-inherit no-underline transition-[transform,border-color,box-shadow] duration-[180ms] p-[1.3rem] hover:-translate-y-[2px] hover:border-[rgba(243,198,95,0.54)] hover:shadow-[0_20px_46px_rgba(0,0,0,0.38),0_0_0_1px_rgba(209,53,76,0.28)]";

const BG =
  "bg-[rgba(10,13,20,0.9)] bg-[image:linear-gradient(180deg,rgba(199,45,68,0.14),rgba(216,170,73,0.08))]";

export type TileBaseProps = {
  href?: string;
  onNavigate?: (href: string) => void;
  className?: string;
  children: ReactNode;
};

export function TileBase({ href, onNavigate, className = "", children }: TileBaseProps) {
  const cls = [BASE, BG, className].filter(Boolean).join(" ");

  if (href && onNavigate) {
    return (
      <a
        href={href}
        className={cls}
        onClick={(event) => {
          event.preventDefault();
          onNavigate(href);
        }}
      >
        {children}
      </a>
    );
  }

  return <div className={cls}>{children}</div>;
}
