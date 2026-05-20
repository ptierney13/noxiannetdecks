import { type MouseEvent } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
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
  const {
    location: { pathname },
  } = useRouterState();

  const isActive =
    href !== undefined &&
    (pathname === href || (href !== "/" && pathname.startsWith(href + "/")));

  const highlighted = href !== undefined ? isActive : (selected ?? false);

  const colorClass = highlighted ? "text-accent-warm" : "text-text-secondary";
  const weightClass = highlighted ? "font-bold" : "font-semibold";
  const decorationClass = highlighted ? "underline underline-offset-[3px]" : "no-underline";

  const className =
    `rounded-[12px] bg-transparent border-0 cursor-pointer ${colorClass} ${weightClass} ${decorationClass} ` +
    `hover:text-text-primary hover:bg-[rgba(255,255,255,0.05)] transition-colors duration-[120ms] ${variants[variant]}`;

  if (href !== undefined) {
    return (
      <a
        href={href}
        className={className}
        aria-current={isActive ? "page" : undefined}
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
