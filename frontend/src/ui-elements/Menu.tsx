import { forwardRef } from "react";
import { MenuItem } from "./MenuItem";
import type { MenuItemProps } from "./MenuItem";

export type MenuItemData = Pick<MenuItemProps, "href" | "onClick" | "label" | "selected">;

export type MenuSection = {
  title?: string;
  items: MenuItemData[];
};

type MenuProps = {
  sections: MenuSection[];
  className?: string;
  "aria-label"?: string;
  id?: string;
};

const chrome =
  "bg-[var(--color-surface-header)] border border-[rgba(255,255,255,0.08)] shadow-[var(--shadow-surface-2)]";

export const Menu = forwardRef<HTMLDivElement, MenuProps>(function Menu(
  { sections, className = "", "aria-label": ariaLabel, id },
  ref,
) {
  const hasTitles = sections.some((s) => s.title !== undefined);

  const popupClass = hasTitles
    ? `${chrome} p-[0.9rem] grid gap-[0.85rem] rounded-[20px]`
    : `${chrome} p-[0.55rem] grid gap-[0.2rem] rounded-[16px]`;

  return (
    <div
      ref={ref}
      id={id}
      role="menu"
      aria-label={ariaLabel}
      className={`${popupClass} ${className}`}
    >
      {hasTitles
        ? sections.map((section, i) => (
            <div
              key={section.title ?? i}
              role="group"
              aria-label={section.title}
              className="grid gap-[0.2rem]"
            >
              {section.title && (
                <span
                  aria-hidden="true"
                  className="px-[0.95rem] pb-[0.35rem] text-accent-warm uppercase tracking-[0.08em] text-[0.75rem] font-bold"
                >
                  {section.title}
                </span>
              )}
              {section.items.map((item) => (
                <MenuItem key={item.href ?? item.label} variant="menu" {...item} />
              ))}
            </div>
          ))
        : sections
            .flatMap((s) => s.items)
            .map((item) => (
              <MenuItem key={item.href ?? item.label} variant="menu" {...item} />
            ))}
    </div>
  );
});
