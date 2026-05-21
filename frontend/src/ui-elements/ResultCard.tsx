import type { ReactNode } from "react";

export type ResultCardProps = {
  name: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  layout?: string | null;
  footer?: ReactNode;
  onClick: () => void;
};

export function ResultCard({
  name,
  imageUrl,
  imageAlt,
  layout,
  footer,
  onClick,
}: ResultCardProps) {
  const aspectClass = layout === "landscape" ? "aspect-[7/5]" : "aspect-[5/7]";

  return (
    <article className="group overflow-hidden rounded-[18px] border border-border-default bg-surface-2 shadow-surface-1 transition hover:-translate-y-0.5 hover:border-border-strong hover:shadow-surface-2">
      <button
        type="button"
        className="block w-full cursor-pointer border-0 bg-transparent p-0 text-left"
        onClick={onClick}
        aria-label={`Open ${name}`}
      >
        <span className={`grid ${aspectClass} w-full place-items-center overflow-hidden bg-surface-inset`}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={imageAlt ?? name}
              loading="lazy"
              className="h-full w-full object-contain transition duration-200 group-hover:scale-[1.015]"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center p-4 text-center text-sm font-black uppercase tracking-[0.12em] text-text-tertiary">
              {name}
            </span>
          )}
        </span>
        <span className="block border-t border-border-subtle px-3 py-2 text-sm font-black text-text-primary">
          {name}
        </span>
      </button>
      {footer ? <div className="border-t border-border-subtle p-2">{footer}</div> : null}
    </article>
  );
}
