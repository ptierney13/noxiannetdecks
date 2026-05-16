import { type FormEvent, type MouseEvent, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  resolveDesktopHeaderStage,
  resolveHeaderShellMode,
  type DesktopHeaderStage,
  type HeaderShellMode,
} from "../lib";
import { ChevronIcon, MenuIcon, SearchIcon } from "../ui";
import { useAppErrorState } from "./ErrorContext";
import { useHeaderSearch } from "./HeaderSearchContext";

function NavLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const { location: { pathname } } = useRouterState();
  const isCurrent = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.shiftKey
    ) {
      return;
    }
    event.preventDefault();
    void navigate({ href });
  }

  return (
    <a
      href={href}
      className={className}
      aria-current={isCurrent ? "page" : undefined}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}

function resolveActiveSection(pathname: string) {
  if (pathname === "/" || pathname === "/home") return "home";
  if (pathname.startsWith("/deck-explorer")) return "deck-explorer";
  if (pathname.startsWith("/cards")) return "cards";
  if (pathname.startsWith("/tools/tier-list")) return "tools-tier-list";
  if (pathname.startsWith("/tools/sealed-pools")) return "tools-sealed-pools";
  if (pathname.startsWith("/tools/trade-balancer")) return "tools-trade-balancer";
  return "not-found";
}

export default function AppShell() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const searchStr = routerState.location.searchStr;
  const error = useAppErrorState();

  const { query: headerSearchQuery, setQuery: setHeaderSearchQuery } = useHeaderSearch();
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement | null>(null);
  const [showCardsMenu, setShowCardsMenu] = useState(false);
  const cardsMenuRef = useRef<HTMLDivElement | null>(null);
  const headerShellRef = useRef<HTMLElement | null>(null);
  const [desktopHeaderStage, setDesktopHeaderStage] = useState<DesktopHeaderStage>("full");
  const [headerShellMode, setHeaderShellMode] = useState<HeaderShellMode>("mobile");
  const [showCompactMenu, setShowCompactMenu] = useState(false);
  const compactMenuRef = useRef<HTMLDivElement | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setShowToolsMenu(false);
    setShowCardsMenu(false);
    setShowCompactMenu(false);
    setShowMobileMenu(false);
  }, [pathname]);

  useLayoutEffect(() => {
    if (!headerShellRef.current || typeof ResizeObserver === "undefined") {
      return;
    }

    function updateHeaderLayout(nextWidth: number) {
      setHeaderShellMode((currentMode) => resolveHeaderShellMode(nextWidth, currentMode));
      setDesktopHeaderStage((currentStage) => resolveDesktopHeaderStage(nextWidth, currentStage));
    }

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? 0;
      updateHeaderLayout(nextWidth);
    });

    updateHeaderLayout(headerShellRef.current.getBoundingClientRect().width);
    observer.observe(headerShellRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function handlePointerDown(event: globalThis.PointerEvent) {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setShowToolsMenu(false);
      }
      if (cardsMenuRef.current && !cardsMenuRef.current.contains(event.target as Node)) {
        setShowCardsMenu(false);
      }
      if (compactMenuRef.current && !compactMenuRef.current.contains(event.target as Node)) {
        setShowCompactMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowToolsMenu(false);
        setShowCardsMenu(false);
        setShowCompactMenu(false);
        setShowMobileMenu(false);
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
  const useCompactInlineHeader = desktopHeaderStage === "compact" || desktopHeaderStage === "search";

  function handleHeaderSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void navigate({
      to: "/cards",
      search: { q: headerSearchQuery.trim() || undefined },
    });
  }

  return (
    <>
      <header ref={headerShellRef} className="site-header">
        {headerShellMode === "desktop" ? (
          <nav
            className={`site-nav site-nav--desktop site-nav--stage-${desktopHeaderStage}`}
            aria-label="Primary navigation"
          >
          <button
            type="button"
            className="site-nav-brand"
            onClick={() => void navigate({ to: "/" })}
            aria-label="Noxian Netdecks home"
          >
            <div className="site-nav-logo">N</div>
            <span className="site-nav-wordmark">Noxian Netdecks</span>
          </button>
          <form
            className={`site-nav-search-form${useCompactInlineHeader ? " site-nav-search-form--mobile-inline mobile-nav-search" : ""}`}
            onSubmit={handleHeaderSearchSubmit}
            role="search"
            aria-label="Site card search"
          >
            <div className="site-nav-search-icon" aria-hidden="true">
              <SearchIcon />
            </div>
            <input
              className="site-nav-search-input"
              type="search"
              placeholder={desktopHeaderStage === "full" ? "Search for Riftbound Cards" : "Search"}
              value={headerSearchQuery}
              onChange={(event) => setHeaderSearchQuery(event.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Search cards"
            />
            <button type="submit" className="site-nav-search-btn">Search</button>
          </form>
          <div className="site-nav-shell-actions">
            <div className="site-nav-links">
              <div className="site-nav-tools-menu" ref={cardsMenuRef}>
                <button
                  type="button"
                  className={`site-nav-link${activeSection === "cards" ? " active" : ""}`}
                  aria-expanded={showCardsMenu}
                  aria-haspopup="menu"
                  onClick={() => {
                    setShowCardsMenu((current) => !current);
                    setShowToolsMenu(false);
                    setShowCompactMenu(false);
                  }}
                >
                  Cards
                  <ChevronIcon expanded={showCardsMenu} />
                </button>
                {showCardsMenu ? (
                  <div className="site-nav-tools-popover" role="menu" aria-label="Cards">
                    <NavLink className="site-nav-menu-item" href="/cards">
                      Search
                    </NavLink>
                    <NavLink className="site-nav-menu-item" href="/cards/learn-to-search">
                      Learn to Search
                    </NavLink>
                    <NavLink className="site-nav-menu-item" href="/cards/query-builder">
                      Query Builder
                    </NavLink>
                  </div>
                ) : null}
              </div>
              <NavLink
                href="/deck-explorer"
                className={`site-nav-link${activeSection === "deck-explorer" ? " active" : ""}`}
              >
                Deck Explorer
              </NavLink>
              <div className="site-nav-tools-menu" ref={toolsMenuRef}>
                <button
                  type="button"
                  className={`site-nav-link${activeSection === "tools-tier-list" || activeSection === "tools-sealed-pools" || activeSection === "tools-trade-balancer" ? " active" : ""}`}
                  aria-expanded={showToolsMenu}
                  aria-haspopup="menu"
                  onClick={() => {
                    setShowToolsMenu((current) => !current);
                    setShowCardsMenu(false);
                    setShowCompactMenu(false);
                  }}
                >
                  Tools
                  <ChevronIcon expanded={showToolsMenu} />
                </button>
                {showToolsMenu ? (
                  <div className="site-nav-tools-popover" role="menu" aria-label="Tools">
                    <NavLink className="site-nav-menu-item" href="/tools/tier-list">
                      Tier List Generator
                    </NavLink>
                    <NavLink className="site-nav-menu-item" href="/tools/sealed-pools">
                      Sealed Simulator
                    </NavLink>
                    <NavLink className="site-nav-menu-item" href="/tools/trade-balancer">
                      Trade Balancer
                    </NavLink>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="site-nav-compact-menu-wrap" ref={compactMenuRef}>
              <button
                type="button"
                className="site-nav-compact-toggle"
                aria-expanded={showCompactMenu}
                aria-haspopup="menu"
                aria-label={showCompactMenu ? "Close compact navigation menu" : "Open compact navigation menu"}
                onClick={() => {
                  setShowCompactMenu((current) => !current);
                  setShowCardsMenu(false);
                  setShowToolsMenu(false);
                }}
              >
                <MenuIcon open={showCompactMenu} />
              </button>
              {showCompactMenu ? (
                <div className="site-nav-compact-popover" role="menu" aria-label="Compact navigation">
                  <section className="nav-drawer-section" aria-labelledby="compact-nav-cards-heading">
                    <p id="compact-nav-cards-heading" className="nav-drawer-heading">Cards</p>
                    <NavLink href="/cards">
                      <span className="nav-drawer-link">Card Search</span>
                    </NavLink>
                    <NavLink href="/cards/learn-to-search">
                      <span className="nav-drawer-link">Learn to Search</span>
                    </NavLink>
                    <NavLink href="/cards/query-builder">
                      <span className="nav-drawer-link">Query Builder</span>
                    </NavLink>
                  </section>
                  <section className="nav-drawer-section" aria-labelledby="compact-nav-explore-heading">
                    <p id="compact-nav-explore-heading" className="nav-drawer-heading">Explore</p>
                    <NavLink href="/deck-explorer">
                      <span className="nav-drawer-link">Deck Explorer</span>
                    </NavLink>
                  </section>
                  <section className="nav-drawer-section" aria-labelledby="compact-nav-tools-heading">
                    <p id="compact-nav-tools-heading" className="nav-drawer-heading">Tools</p>
                    <NavLink href="/tools/sealed-pools">
                      <span className="nav-drawer-link">Sealed Simulator</span>
                    </NavLink>
                    <NavLink href="/tools/tier-list">
                      <span className="nav-drawer-link">Tier List Generator</span>
                    </NavLink>
                    <NavLink href="/tools/trade-balancer">
                      <span className="nav-drawer-link">Trade Balancer</span>
                    </NavLink>
                  </section>
                </div>
              ) : null}
            </div>
          </div>
          </nav>
        ) : null}
        {headerShellMode === "mobile" ? (
          <div className="site-nav-mobile-shell">
          <div className="site-nav-mobile-inline">
            <button
              type="button"
              className="site-nav-brand"
              onClick={() => void navigate({ to: "/" })}
              aria-label="Noxian Netdecks home"
            >
              <div className="site-nav-logo">N</div>
              <span className="site-nav-wordmark">Noxian Netdecks</span>
            </button>
            <form className="site-nav-search-form site-nav-search-form--mobile-inline mobile-nav-search" onSubmit={handleHeaderSearchSubmit} role="search" aria-label="Mobile site card search">
              <div className="site-nav-search-icon" aria-hidden="true">
                <SearchIcon />
              </div>
              <input
                className="site-nav-search-input"
                type="search"
                placeholder="Search"
                value={headerSearchQuery}
                onChange={(event) => setHeaderSearchQuery(event.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                aria-label="Search cards"
              />
              <button type="submit" className="site-nav-search-btn">Search</button>
            </form>
            <button
              type="button"
              className="site-nav-mobile-toggle"
              aria-expanded={showMobileMenu}
              aria-controls="mobile-primary-navigation"
              aria-label={showMobileMenu ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => setShowMobileMenu((current) => !current)}
            >
              <MenuIcon open={showMobileMenu} />
            </button>
          </div>
          {showMobileMenu ? (
            <>
              <button
                type="button"
                className="mobile-nav-backdrop mobile-nav-backdrop--visible"
                aria-label="Close navigation menu"
                onClick={() => setShowMobileMenu(false)}
              />
              <div
                id="mobile-primary-navigation"
                ref={mobileMenuRef}
                className="mobile-nav-panel mobile-nav-panel--open"
              >
                <div className="nav-drawer-links">
                  <section className="nav-drawer-section" aria-labelledby="mobile-nav-cards-heading">
                    <p id="mobile-nav-cards-heading" className="nav-drawer-heading">Cards</p>
                    <NavLink href="/cards">
                      <span className="nav-drawer-link">Card Search</span>
                    </NavLink>
                    <NavLink href="/cards/learn-to-search">
                      <span className="nav-drawer-link">Learn to Search</span>
                    </NavLink>
                    <NavLink href="/cards/query-builder">
                      <span className="nav-drawer-link">Query Builder</span>
                    </NavLink>
                  </section>
                  <section className="nav-drawer-section" aria-labelledby="mobile-nav-explore-heading">
                    <p id="mobile-nav-explore-heading" className="nav-drawer-heading">Explore</p>
                    <NavLink href="/deck-explorer">
                      <span className="nav-drawer-link">Deck Explorer</span>
                    </NavLink>
                  </section>
                  <section className="nav-drawer-section" aria-labelledby="mobile-nav-tools-heading">
                    <p id="mobile-nav-tools-heading" className="nav-drawer-heading">Tools</p>
                    <NavLink href="/tools/sealed-pools">
                      <span className="nav-drawer-link">Sealed Simulator</span>
                    </NavLink>
                    <NavLink href="/tools/tier-list">
                      <span className="nav-drawer-link">Tier List Generator</span>
                    </NavLink>
                    <NavLink href="/tools/trade-balancer">
                      <span className="nav-drawer-link">Trade Balancer</span>
                    </NavLink>
                  </section>
                </div>
              </div>
            </>
          ) : null}
          </div>
        ) : null}
      </header>
      {error ? (
        <div className="mt-[18px] rounded-2xl border border-[var(--color-negative-border)] bg-[var(--color-negative-soft)] text-[var(--color-text-primary)] px-4 py-[14px]">
          {error}
        </div>
      ) : null}
      <Outlet />
    </>
  );
}
