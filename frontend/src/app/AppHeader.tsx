import { useEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { CardSearchInput, LogoBadge, Menu, MenuItem, MenuIcon } from "../ui-elements";
import type { MenuSection } from "../ui-elements";
import { useHeaderSearch } from "./HeaderSearchContext";

function resolveActiveSection(pathname: string) {
  if (pathname === "/" || pathname === "/home") return "home";
  if (pathname.startsWith("/deck-explorer")) return "deck-explorer";
  if (pathname.startsWith("/cards")) return "cards";
  if (pathname.startsWith("/tools/tier-list")) return "tools-tier-list";
  if (pathname.startsWith("/tools/sealed-pools")) return "tools-sealed-pools";
  if (pathname.startsWith("/tools/trade-balancer")) return "tools-trade-balancer";
  return "not-found";
}

const cardNavItems = [
  { href: "/cards", label: "Card Search" },
  { href: "/cards/learn-to-search", label: "Learn to Search" },
  { href: "/cards/query-builder", label: "Query Builder" },
];

const toolNavItems = [
  { href: "/tools/tier-list", label: "Tier List Generator" },
  { href: "/tools/sealed-pools", label: "Sealed Simulator" },
  { href: "/tools/trade-balancer", label: "Trade Balancer" },
];

export function AppHeader() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const searchStr = routerState.location.searchStr;

  const { query: headerSearchQuery, setQuery: setHeaderSearchQuery, headerSearchVisible } =
    useHeaderSearch();
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement | null>(null);
  const [showCardsMenu, setShowCardsMenu] = useState(false);
  const cardsMenuRef = useRef<HTMLDivElement | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setShowToolsMenu(false);
    setShowCardsMenu(false);
    setShowMenu(false);
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: globalThis.PointerEvent) {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setShowToolsMenu(false);
      }
      if (cardsMenuRef.current && !cardsMenuRef.current.contains(event.target as Node)) {
        setShowCardsMenu(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowToolsMenu(false);
        setShowCardsMenu(false);
        setShowMenu(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (pathname === "/cards") {
      setHeaderSearchQuery(new URLSearchParams(searchStr).get("q") ?? "");
      return;
    }
    if (pathname === "/") {
      setHeaderSearchQuery("");
    }
  }, [pathname, searchStr]);

  const activeSection = resolveActiveSection(pathname);

  const cardItems = cardNavItems.map(item => ({ ...item, selected: pathname === item.href }));
  const toolItems = toolNavItems.map(item => ({ ...item, selected: pathname === item.href }));
  const navSections: MenuSection[] = [
    { title: "Cards", items: cardItems },
    { title: "Explore", items: [{ href: "/deck-explorer", label: "Deck Explorer", selected: pathname === "/deck-explorer" }] },
    { title: "Tools", items: toolItems },
  ];

  function handleHeaderSearchSubmit(value: string) {
    void navigate({
      to: "/cards",
      search: { q: value.trim() || undefined },
    });
  }

  return (
    // @container establishes this element as the container query root.
    // Responsive classes inside use @sm:/@md:/@lg: (container breakpoints),
    // not sm:/md:/lg: (viewport breakpoints). This keeps Storybook width-frame
    // stories correct: the CSS-constrained container drives behavior, not the
    // browser viewport. In production the header is always w-full so the
    // behavior is identical.
    <header className="@container sticky top-0 z-60 [background:linear-gradient(180deg,#5c1623_0%,#3a0c15_100%)] border-b border-[rgba(255,160,160,0.16)] shadow-[0_4px_30px_rgba(255,50,50,0.16)]">
      <nav
        className="flex items-center gap-4 min-h-[60px] w-full px-[var(--space-shell-x)] py-[0.6rem]"
        aria-label="Primary navigation"
      >
        <button
          type="button"
          className="inline-flex items-center gap-[0.8rem] shrink-0 border-0 p-0 bg-transparent text-text-primary cursor-pointer"
          onClick={() => void navigate({ to: "/" })}
          aria-label="Noxian Netdecks home"
        >
          <LogoBadge />
          <span className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap @xl:max-w-[12rem] @xl:opacity-100 transition-[max-width,opacity] duration-[220ms,180ms] ease-[cubic-bezier(0.22,1,0.36,1),ease] text-[1.1rem] font-bold tracking-[-0.02em]">
            Noxian Netdecks
          </span>
        </button>

        {/* Search slot — always flex-1; empty div acts as spacer when search is hidden */}
        <div className="flex-1 min-w-0">
          {headerSearchVisible ? (
            <CardSearchInput
              value={headerSearchQuery}
              onChange={setHeaderSearchQuery}
              onSubmit={handleHeaderSearchSubmit}
              className="animate-[search-grow-in_280ms_cubic-bezier(0.22,1,0.36,1)_forwards] w-full"
            />
          ) : null}
        </div>

        <div className="flex items-center justify-end shrink-0">
          {/* Hamburger wrapper — collapses at @md+.
              No overflow-hidden: absolutely-positioned dropdowns inside must not be clipped. */}
          <div
            className="relative max-w-[3rem] opacity-100 pointer-events-auto transition-[max-width,opacity] duration-[220ms,180ms] ease-[cubic-bezier(0.22,1,0.36,1),ease] @lg:max-w-0 @lg:opacity-0 @lg:pointer-events-none"
            ref={menuRef}
          >
            <button
              type="button"
              className="inline-flex items-center justify-center w-12 h-12 border border-[rgba(255,255,255,0.08)] rounded-[0.95rem] bg-[rgba(255,255,255,0.03)] text-text-primary cursor-pointer"
              aria-expanded={showMenu}
              aria-haspopup="menu"
              aria-label={showMenu ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => { setShowMenu(c => !c); setShowCardsMenu(false); setShowToolsMenu(false); }}
            >
              <MenuIcon open={showMenu} />
            </button>
            {showMenu ? (
              <>
                {/* Backdrop — full-viewport overlay; hidden at @sm+ where the compact
                    absolute dropdown handles its own click-outside via the pointer handler */}
                <button
                  type="button"
                  className="fixed inset-0 border-0 p-0 bg-[rgba(2,3,7,0.48)] z-[69] @sm:hidden"
                  aria-label="Close navigation menu"
                  onClick={() => setShowMenu(false)}
                />
                {/* Dropdown: fixed full-width below @sm; compact absolute at @sm+ */}
                <Menu
                  sections={navSections}
                  aria-label="Navigation"
                  className="fixed left-[var(--space-shell-x)] right-[var(--space-shell-x)] top-[4.5rem] z-70 @sm:absolute @sm:left-auto @sm:right-0 @sm:top-[calc(100%+0.65rem)] @sm:w-[min(22rem,82vw)]"
                />
              </>
            ) : null}
          </div>

          {/* Inline nav wrapper — expands at @md+.
              No overflow-hidden: absolutely-positioned dropdowns inside must not be clipped. */}
          <div
            data-nav-items=""
            className="inline-flex items-center gap-[0.4rem] max-w-0 opacity-0 pointer-events-none transition-[max-width,opacity] duration-[220ms,180ms] ease-[cubic-bezier(0.22,1,0.36,1),ease] @lg:max-w-[34rem] @lg:opacity-100 @lg:pointer-events-auto"
          >
            <div className="relative" ref={cardsMenuRef}>
              <MenuItem
                variant="inline"
                label="Cards"
                chevron
                onClick={() => { setShowCardsMenu(c => !c); setShowToolsMenu(false); setShowMenu(false); }}
                selected={activeSection === "cards"}
                aria-expanded={showCardsMenu}
                aria-haspopup="menu"
              />
              {showCardsMenu ? (
                <Menu
                  sections={[{ items: cardItems }]}
                  aria-label="Cards"
                  className="absolute right-0 top-[calc(100%+0.65rem)] min-w-[14rem] z-10"
                />
              ) : null}
            </div>
            <MenuItem variant="inline" href="/deck-explorer" label="Deck Explorer" />
            <div className="relative" ref={toolsMenuRef}>
              <MenuItem
                variant="inline"
                label="Tools"
                chevron
                onClick={() => { setShowToolsMenu(c => !c); setShowCardsMenu(false); setShowMenu(false); }}
                selected={
                  activeSection === "tools-tier-list" ||
                  activeSection === "tools-sealed-pools" ||
                  activeSection === "tools-trade-balancer"
                }
                aria-expanded={showToolsMenu}
                aria-haspopup="menu"
              />
              {showToolsMenu ? (
                <Menu
                  sections={[{ items: toolItems }]}
                  aria-label="Tools"
                  className="absolute right-0 top-[calc(100%+0.65rem)] min-w-[14rem] z-10"
                />
              ) : null}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
