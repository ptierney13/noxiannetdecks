import { useSearch, Link } from "@tanstack/react-router";
import { CardSearchResultsPane } from "../features";

// Icon-only SVGs kept inline — too small to extract as shared components.
function BookIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
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

const NAV_LINK_CLASS =
  "inline-flex items-center gap-1.5 rounded-lg border border-border-default bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-xs font-bold text-text-secondary transition-[background,border-color,color] duration-150 hover:border-border-strong hover:bg-[rgba(255,255,255,0.07)] hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]";

export default function CardSearchView() {
  const { q = "" } = useSearch({ from: "/cards" });

  return (
    <div className="mx-auto w-full max-w-[1720px] px-4 pb-8 pt-4">
      <CardSearchResultsPane
        query={q}
        navSlot={
          <div className="flex items-center gap-2">
            <Link
              to="/cards/query-builder"
              className={NAV_LINK_CLASS}
            >
              <FilterIcon />
              Query Builder
            </Link>
            <Link
              to="/cards/learn-to-search"
              search={{ mode: "visual-guide" }}
              className={NAV_LINK_CLASS}
            >
              <BookIcon />
              Learn to Search
            </Link>
          </div>
        }
      />
    </div>
  );
}
