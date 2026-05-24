import { Link, useRouterState } from "@tanstack/react-router";

function InfoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

const NAV_LINK =
  "inline-flex items-center gap-1.5 rounded-lg border border-border-default bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-xs font-bold text-text-secondary transition-[background,border-color,color] duration-150 hover:border-border-strong hover:bg-[rgba(255,255,255,0.07)] hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]";

type CardsToolsNavProps = {
  description: string;
};

export function CardsToolsNav({ description }: CardsToolsNavProps) {
  const { location } = useRouterState();
  const isOnQB = location.pathname === "/cards/query-builder";
  const isOnLTS = location.pathname === "/cards/learn-to-search";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border-subtle bg-[rgba(7,9,14,0.94)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1720px] items-center gap-3 px-4 py-3">
        <InfoIcon />
        <p className="min-w-0 flex-1 text-xs leading-relaxed text-text-tertiary">{description}</p>
        <div className="flex shrink-0 items-center gap-2">
          {!isOnQB && (
            <Link to="/cards/query-builder" className={NAV_LINK}>
              <FilterIcon />
              Query Builder
            </Link>
          )}
          {!isOnLTS && (
            <Link to="/cards/learn-to-search" className={NAV_LINK}>
              <BookIcon />
              Learn to Search
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
