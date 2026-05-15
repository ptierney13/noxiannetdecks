import { type FormEvent, type MouseEvent, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  buildCardsSearchPath,
  normalizePathname,
  parseAppRoute,
  routeSection,
  type AppRoute,
} from "../routes";
import {
  resolveDesktopHeaderStage,
  resolveHeaderShellMode,
  type DesktopHeaderStage,
  type HeaderShellMode,
} from "../lib";
import { ChevronIcon, MenuIcon, SearchIcon } from "../ui";
import RouteRenderer from "./RouteRenderer";

function ProjectNavLink({
  href,
  current,
  onNavigate,
  className,
  children
}: {
  href: string;
  current: boolean;
  onNavigate: (href: string) => void;
  className?: string;
  children: ReactNode;
}) {
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
    onNavigate(href);
  }

  return (
    <a href={href} className={className} aria-current={current ? "page" : undefined} onClick={handleClick}>
      {children}
    </a>
  );
}

export default function AppShell() {
  const [route, setRoute] = useState<AppRoute>(() => parseAppRoute(window.location.pathname));
  const [locationSearch, setLocationSearch] = useState(() => window.location.search);
  const [error, setError] = useState<string | null>(null);
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
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
    function handlePopState() {
      setRoute(parseAppRoute(window.location.pathname));
      setLocationSearch(window.location.search);
      setError(null);
      setShowToolsMenu(false);
      setShowCardsMenu(false);
      setShowCompactMenu(false);
      setShowMobileMenu(false);
    }

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

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
    if (route.kind === "cards") {
      setHeaderSearchQuery(new URLSearchParams(locationSearch).get("q") ?? "");
      return;
    }

    if (route.kind === "home") {
      setHeaderSearchQuery("");
    }
  }, [locationSearch, route.kind]);

  function navigate(nextPath: string) {
    const normalizedPath = normalizePathname(nextPath.split("?")[0]);
    const search = nextPath.includes("?") ? nextPath.slice(nextPath.indexOf("?")) : "";
    const fullPath = normalizedPath + search;

    if (fullPath !== window.location.pathname + window.location.search) {
      window.history.pushState({}, "", fullPath);
      setRoute(parseAppRoute(normalizedPath));
      setLocationSearch(search);
    }

    setError(null);
    setShowToolsMenu(false);
    setShowCardsMenu(false);
    setShowCompactMenu(false);
    setShowMobileMenu(false);
  }

  function handleAppendToSearch(fragment: string) {
    setHeaderSearchQuery((prev) => prev ? `${prev} ${fragment}` : fragment);
  }

  const activeSection = routeSection(route);
  const useCompactInlineHeader = desktopHeaderStage === "compact" || desktopHeaderStage === "search";

  function handleHeaderSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(buildCardsSearchPath(headerSearchQuery));
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
            onClick={() => navigate("/")}
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
                    <ProjectNavLink className="site-nav-menu-item" href="/cards" current={route.kind === "cards"} onNavigate={navigate}>
                      Search
                    </ProjectNavLink>
                    <ProjectNavLink className="site-nav-menu-item" href="/cards/learn-to-search" current={route.kind === "cards-learn-to-search"} onNavigate={navigate}>
                      Learn to Search
                    </ProjectNavLink>
                    <ProjectNavLink className="site-nav-menu-item" href="/cards/query-builder" current={route.kind === "cards-query-builder"} onNavigate={navigate}>
                      Query Builder
                    </ProjectNavLink>
                  </div>
                ) : null}
              </div>
              <ProjectNavLink
                href="/deck-explorer"
                current={activeSection === "deck-explorer"}
                onNavigate={navigate}
              >
                <span className={`site-nav-link${activeSection === "deck-explorer" ? " active" : ""}`}>Deck Explorer</span>
              </ProjectNavLink>
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
                    <ProjectNavLink className="site-nav-menu-item" href="/tools/tier-list" current={activeSection === "tools-tier-list"} onNavigate={navigate}>
                      Tier List Generator
                    </ProjectNavLink>
                    <ProjectNavLink className="site-nav-menu-item" href="/tools/sealed-pools" current={activeSection === "tools-sealed-pools"} onNavigate={navigate}>
                      Sealed Simulator
                    </ProjectNavLink>
                    <ProjectNavLink className="site-nav-menu-item" href="/tools/trade-balancer" current={activeSection === "tools-trade-balancer"} onNavigate={navigate}>
                      Trade Balancer
                    </ProjectNavLink>
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
                    <ProjectNavLink href="/cards" current={route.kind === "cards"} onNavigate={navigate}>
                      <span className="nav-drawer-link">Card Search</span>
                    </ProjectNavLink>
                    <ProjectNavLink href="/cards/learn-to-search" current={route.kind === "cards-learn-to-search"} onNavigate={navigate}>
                      <span className="nav-drawer-link">Learn to Search</span>
                    </ProjectNavLink>
                    <ProjectNavLink href="/cards/query-builder" current={route.kind === "cards-query-builder"} onNavigate={navigate}>
                      <span className="nav-drawer-link">Query Builder</span>
                    </ProjectNavLink>
                  </section>
                  <section className="nav-drawer-section" aria-labelledby="compact-nav-explore-heading">
                    <p id="compact-nav-explore-heading" className="nav-drawer-heading">Explore</p>
                    <ProjectNavLink href="/deck-explorer" current={activeSection === "deck-explorer"} onNavigate={navigate}>
                      <span className="nav-drawer-link">Deck Explorer</span>
                    </ProjectNavLink>
                  </section>
                  <section className="nav-drawer-section" aria-labelledby="compact-nav-tools-heading">
                    <p id="compact-nav-tools-heading" className="nav-drawer-heading">Tools</p>
                    <ProjectNavLink href="/tools/sealed-pools" current={activeSection === "tools-sealed-pools"} onNavigate={navigate}>
                      <span className="nav-drawer-link">Sealed Simulator</span>
                    </ProjectNavLink>
                    <ProjectNavLink href="/tools/tier-list" current={activeSection === "tools-tier-list"} onNavigate={navigate}>
                      <span className="nav-drawer-link">Tier List Generator</span>
                    </ProjectNavLink>
                    <ProjectNavLink href="/tools/trade-balancer" current={activeSection === "tools-trade-balancer"} onNavigate={navigate}>
                      <span className="nav-drawer-link">Trade Balancer</span>
                    </ProjectNavLink>
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
              onClick={() => navigate("/")}
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
                    <ProjectNavLink href="/cards" current={route.kind === "cards"} onNavigate={navigate}>
                      <span className="nav-drawer-link">Card Search</span>
                    </ProjectNavLink>
                    <ProjectNavLink href="/cards/learn-to-search" current={route.kind === "cards-learn-to-search"} onNavigate={navigate}>
                      <span className="nav-drawer-link">Learn to Search</span>
                    </ProjectNavLink>
                    <ProjectNavLink href="/cards/query-builder" current={route.kind === "cards-query-builder"} onNavigate={navigate}>
                      <span className="nav-drawer-link">Query Builder</span>
                    </ProjectNavLink>
                  </section>
                  <section className="nav-drawer-section" aria-labelledby="mobile-nav-explore-heading">
                    <p id="mobile-nav-explore-heading" className="nav-drawer-heading">Explore</p>
                    <ProjectNavLink href="/deck-explorer" current={activeSection === "deck-explorer"} onNavigate={navigate}>
                      <span className="nav-drawer-link">Deck Explorer</span>
                    </ProjectNavLink>
                  </section>
                  <section className="nav-drawer-section" aria-labelledby="mobile-nav-tools-heading">
                    <p id="mobile-nav-tools-heading" className="nav-drawer-heading">Tools</p>
                    <ProjectNavLink href="/tools/sealed-pools" current={activeSection === "tools-sealed-pools"} onNavigate={navigate}>
                      <span className="nav-drawer-link">Sealed Simulator</span>
                    </ProjectNavLink>
                    <ProjectNavLink href="/tools/tier-list" current={activeSection === "tools-tier-list"} onNavigate={navigate}>
                      <span className="nav-drawer-link">Tier List Generator</span>
                    </ProjectNavLink>
                    <ProjectNavLink href="/tools/trade-balancer" current={activeSection === "tools-trade-balancer"} onNavigate={navigate}>
                      <span className="nav-drawer-link">Trade Balancer</span>
                    </ProjectNavLink>
                  </section>
                </div>
              </div>
            </>
          ) : null}
          </div>
        ) : null}
      </header>
      {error ? <div className="error-banner">{error}</div> : null}
      <RouteRenderer
        route={route}
        locationSearch={locationSearch}
        onError={setError}
        onNavigate={navigate}
        onAppendToSearch={handleAppendToSearch}
      />
    </>
  );
}
