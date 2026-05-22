import { type MouseEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronIcon } from "./Icon";

export type MenuItemProps = {
  href?: string;
  onClick?: () => void;
  label: string;
  selected?: boolean;
  chevron?: boolean;
  variant?: "inline" | "menu";
  "aria-expanded"?: boolean;
  "aria-haspopup"?: "menu" | "listbox" | "tree" | "grid" | "dialog" | true | false;
};

const variants = {
  inline: "inline-flex items-center justify-between gap-[0.45rem] min-h-[42px] px-[0.95rem]",
  menu: "block w-full px-[0.95rem] py-[0.8rem] text-left",
};

export function MenuItem({
  href,
  onClick,
  label,
  selected,
  chevron,
  variant = "menu",
  "aria-expanded": ariaExpanded,
  "aria-haspopup": ariaHaspopup,
}: MenuItemProps) {
  const navigate = useNavigate();

  const colorClass = selected ? "text-accent-warm" : "text-text-secondary";
  const weightClass = selected ? "font-bold" : "font-semibold";
  const decorationClass = selected ? "underline underline-offset-[3px]" : "no-underline";
  const hoverColorClass = selected ? "hover:text-accent-warm" : "hover:text-text-primary";

  const className =
    `rounded-[12px] bg-[rgba(255,255,255,0.04)] border border-black cursor-pointer ` +
    `${colorClass} ${weightClass} ${decorationClass} ` +
    `${hoverColorClass} hover:bg-[var(--color-accent-soft)] ` +
    `hover:shadow-[0_0_0_2px_rgba(197,50,71,0.55),0_0_16px_rgba(197,50,71,0.18)] ` +
    `transition-[color,background-color,box-shadow] duration-[120ms] ${variants[variant]}`;

  if (href !== undefined) {
    return (
      <a
        href={href}
        className={className}
        aria-current={selected ? "page" : undefined}
        aria-expanded={ariaExpanded}
        onClick={(event: MouseEvent<HTMLAnchorElement>) => {
          if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.altKey ||
            event.shiftKey
          )
            return;
          event.preventDefault();
          void navigate({ href });
        }}
      >
        {label}
        {chevron && <ChevronIcon expanded={ariaExpanded ?? false} />}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHaspopup}
    >
      {label}
      {chevron && <ChevronIcon expanded={ariaExpanded ?? false} />}
    </button>
  );
}
