import { type FormEvent, type MouseEvent, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  resolveDesktopHeaderStage,
  resolveHeaderShellMode,
  type DesktopHeaderStage,
  type HeaderShellMode,
} from "../lib";
import { ChevronIcon, MenuIcon, SearchIcon } from "../ui-elements";
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

// Shared Tailwind classes for nav shell elements
const navShellBase = "min-h-[60px] items-center gap-4 px-[var(--space-shell-x)] py-[0.6rem] bg-transparent";

const navLinkBase = "inline-flex items-center justify-between gap-[0.45rem] min-h-[42px] px-[0.95rem] border-0 rounded-[12px] bg-transparent text-text-secondary font-semibold no-underline cursor-pointer hover:text-text-primary hover:bg-[rgba(255,255,255,0.04)]";

const navMenuItemBase = "block w-full rounded-[12px] px-[0.95rem] py-[0.8rem] text-text-secondary no-underline font-semibold border-0 bg-transparent text-left cursor-pointer hover:text-text-primary hover:bg-[rgba(255,255,255,0.05)] aria-[current=page]:text-text-primary aria-[current=page]:bg-[rgba(255,255,255,0.05)]";

const navDrawerLinkBase = "inline-flex w-full min-h-[52px] items-center justify-between px-4 rounded-[14px] bg-[rgba(255,255,255,0.03)] text-text-primary no-underline border-0 text-left cursor-pointer font-[inherit]";

export function AppHeader() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const searchStr = routerState.location.searchStr;

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
  const isCompact = desktopHeaderStage === "compact" || desktopHeaderStage === "search";
  const isFullNav = desktopHeaderStage === "nav" || desktopHeaderStage === "full";

  function handleHeaderSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void navigate({
      to: "/cards",
      search: { q: headerSearchQuery.trim() || undefined },
    });
  }

  return (
    <header
      ref={headerShellRef}
      className="sticky top-0 z-60 bg-[rgba(5,6,10,0.92)] backdrop-blur-[16px] border-b border-[rgba(255,255,255,0.06)]"
    >
      {headerShellMode === "desktop" ? (
        <nav
          className={`${navShellBase} grid w-full min-w-0 relative transition-[grid-template-columns,gap] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isCompact ? "grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3" : "grid-cols-[auto_minmax(280px,1fr)_auto]"}`}
          aria-label="Primary navigation"
        >
          <button
            type="button"
            className={`inline-flex items-center gap-[0.8rem] border-0 p-0 bg-transparent text-text-primary cursor-pointer overflow-hidden min-w-0 transition-[max-width,opacity,transform] duration-[220ms,180ms,220ms] ease-[cubic-bezier(0.22,1,0.36,1),ease,ease] ${isCompact ? "max-w-[2.2rem]" : "max-w-[18rem]"}`}
            onClick={() => void navigate({ to: "/" })}
            aria-label="Noxian Netdecks home"
          >
            <div className="w-[2.2rem] h-[2.2rem] shrink-0 rounded-[0.7rem] grid place-items-center bg-[image:var(--gradient-accent-hero)] text-[#fff8f3] text-[1.3rem] font-extrabold shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
              N
            </div>
            <span className={`text-[1.1rem] font-bold tracking-[-0.02em] whitespace-nowrap overflow-hidden transition-[max-width,opacity,margin-left] duration-[220ms,180ms,220ms] ease-[cubic-bezier(0.22,1,0.36,1),ease,ease] ${desktopHeaderStage === "full" ? "max-w-[12rem] opacity-100 ml-0" : "max-w-0 opacity-0 -ml-[0.35rem]"}`}>
              Noxian Netdecks
            </span>
          </button>
          <form
            className={`flex items-center gap-[0.65rem] min-h-[50px] p-[0.35rem_0.4rem_0.35rem_0.85rem] rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] min-w-0 transition-[gap,padding,border-color,box-shadow] duration-[180ms,220ms,180ms,180ms] ease-[ease,cubic-bezier(0.22,1,0.36,1),ease,ease] focus-within:border-border-accent focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),var(--shadow-focus)] ${isCompact ? "w-full max-w-none self-stretch gap-[0.5rem] px-[0.75rem]" : ""}`}
            onSubmit={handleHeaderSearchSubmit}
            role="search"
            aria-label="Site card search"
          >
            <div className="grid place-items-center text-text-tertiary [&_svg]:w-4 [&_svg]:h-4" aria-hidden="true">
              <SearchIcon />
            </div>
            <input
              className="flex-1 w-full min-w-0 border-0 bg-transparent text-text-primary outline-none placeholder:text-text-tertiary"
              type="search"
              placeholder={desktopHeaderStage === "full" ? "Search for Riftbound Cards" : "Search"}
              value={headerSearchQuery}
              onChange={(event) => setHeaderSearchQuery(event.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Search cards"
            />
            <button
              type="submit"
              className={`inline-flex items-center justify-center min-h-[42px] border-0 rounded-[12px] px-[1.2rem] bg-[image:var(--gradient-accent-button)] text-[#fff9f5] font-bold cursor-pointer whitespace-nowrap shadow-[0_10px_24px_rgba(133,18,32,0.32),inset_0_1px_0_rgba(255,242,218,0.28)] overflow-hidden transition-[max-width,opacity,padding,margin,filter] duration-[220ms,180ms,220ms,220ms,180ms] ease-[cubic-bezier(0.22,1,0.36,1),ease,cubic-bezier(0.22,1,0.36,1),ease,ease] hover:brightness-[1.08] hover:saturate-[1.04] max-w-[8rem] opacity-100 pointer-events-auto w-auto`}
            >
              Search
            </button>
          </form>
          <div className={`relative inline-flex justify-end items-center transition-[width,min-width,gap] duration-[220ms,220ms,180ms] ease-[cubic-bezier(0.22,1,0.36,1),cubic-bezier(0.22,1,0.36,1),ease] ${isCompact ? "w-12 min-w-12 gap-0 justify-items-end" : "w-auto min-w-0 gap-[0.65rem]"}`}>
            <div className={`inline-flex justify-end items-center gap-[0.4rem] min-w-0 overflow-hidden transition-[max-width,opacity,transform] duration-[240ms,180ms,220ms] ease-[cubic-bezier(0.22,1,0.36,1),ease,ease] ${isFullNav ? "max-w-[34rem] opacity-100 overflow-visible pointer-events-auto" : "max-w-0 opacity-0 translate-x-[0.35rem] pointer-events-none"}`}>
              <div className="relative" ref={cardsMenuRef}>
                <button
                  type="button"
                  className={`${navLinkBase}${activeSection === "cards" ? " text-text-primary bg-[rgba(255,255,255,0.06)]" : ""}`}
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
                  <div className="absolute right-0 top-[calc(100%+0.65rem)] min-w-[14rem] p-[0.55rem] grid gap-[0.2rem] rounded-[16px] bg-[rgba(10,13,20,0.96)] border border-[rgba(255,255,255,0.08)] shadow-[var(--shadow-surface-2)] z-10" role="menu" aria-label="Cards">
                    <NavLink className={navMenuItemBase} href="/cards">Search</NavLink>
                    <NavLink className={navMenuItemBase} href="/cards/learn-to-search">Learn to Search</NavLink>
                    <NavLink className={navMenuItemBase} href="/cards/query-builder">Query Builder</NavLink>
                  </div>
                ) : null}
              </div>
              <NavLink
                href="/deck-explorer"
                className={`${navLinkBase}${activeSection === "deck-explorer" ? " text-text-primary bg-[rgba(255,255,255,0.06)]" : ""}`}
              >
                Deck Explorer
              </NavLink>
              <div className="relative" ref={toolsMenuRef}>
                <button
                  type="button"
                  className={`${navLinkBase}${activeSection === "tools-tier-list" || activeSection === "tools-sealed-pools" || activeSection === "tools-trade-balancer" ? " text-text-primary bg-[rgba(255,255,255,0.06)]" : ""}`}
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
                  <div className="absolute right-0 top-[calc(100%+0.65rem)] min-w-[14rem] p-[0.55rem] grid gap-[0.2rem] rounded-[16px] bg-[rgba(10,13,20,0.96)] border border-[rgba(255,255,255,0.08)] shadow-[var(--shadow-surface-2)] z-10" role="menu" aria-label="Tools">
                    <NavLink className={navMenuItemBase} href="/tools/tier-list">Tier List Generator</NavLink>
                    <NavLink className={navMenuItemBase} href="/tools/sealed-pools">Sealed Simulator</NavLink>
                    <NavLink className={navMenuItemBase} href="/tools/trade-balancer">Trade Balancer</NavLink>
                  </div>
                ) : null}
              </div>
            </div>
            <div className={`relative inline-flex overflow-visible transition-[max-width,opacity,transform] duration-[220ms,180ms,220ms] ease-[cubic-bezier(0.22,1,0.36,1),ease,ease] ${isFullNav ? "max-w-0 opacity-0 translate-x-[0.35rem] pointer-events-none" : "max-w-[3rem] opacity-100 pointer-events-auto"}`} ref={compactMenuRef}>
              <button
                type="button"
                className="inline-flex items-center justify-center w-12 h-12 border border-[rgba(255,255,255,0.08)] rounded-[0.95rem] bg-[rgba(255,255,255,0.03)] text-text-primary cursor-pointer transition-[opacity,transform,background] duration-[180ms,220ms,180ms]"
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
                <div className="absolute top-[calc(100%+0.65rem)] right-0 z-[8] min-w-[min(22rem,82vw)] p-[0.9rem] grid gap-[0.85rem] rounded-[20px] bg-[rgba(8,11,18,0.97)] border border-[rgba(255,255,255,0.08)] shadow-[var(--shadow-surface-2)]" role="menu" aria-label="Compact navigation">
                  <section className="grid gap-[0.55rem]" aria-labelledby="compact-nav-cards-heading">
                    <p id="compact-nav-cards-heading" className="m-0 px-[0.2rem] text-accent-warm uppercase tracking-[0.08em] text-[0.75rem] font-bold">Cards</p>
                    <NavLink href="/cards"><span className={navDrawerLinkBase}>Card Search</span></NavLink>
                    <NavLink href="/cards/learn-to-search"><span className={navDrawerLinkBase}>Learn to Search</span></NavLink>
                    <NavLink href="/cards/query-builder"><span className={navDrawerLinkBase}>Query Builder</span></NavLink>
                  </section>
                  <section className="grid gap-[0.55rem]" aria-labelledby="compact-nav-explore-heading">
                    <p id="compact-nav-explore-heading" className="m-0 px-[0.2rem] text-accent-warm uppercase tracking-[0.08em] text-[0.75rem] font-bold">Explore</p>
                    <NavLink href="/deck-explorer"><span className={navDrawerLinkBase}>Deck Explorer</span></NavLink>
                  </section>
                  <section className="grid gap-[0.55rem]" aria-labelledby="compact-nav-tools-heading">
                    <p id="compact-nav-tools-heading" className="m-0 px-[0.2rem] text-accent-warm uppercase tracking-[0.08em] text-[0.75rem] font-bold">Tools</p>
                    <NavLink href="/tools/sealed-pools"><span className={navDrawerLinkBase}>Sealed Simulator</span></NavLink>
                    <NavLink href="/tools/tier-list"><span className={navDrawerLinkBase}>Tier List Generator</span></NavLink>
                    <NavLink href="/tools/trade-balancer"><span className={navDrawerLinkBase}>Trade Balancer</span></NavLink>
                  </section>
                </div>
              ) : null}
            </div>
          </div>
        </nav>
      ) : null}
      {headerShellMode === "mobile" ? (
        <div className="grid w-full">
          <div className={`${navShellBase} grid w-full grid-cols-[auto_minmax(0,1fr)_auto]`}>
            <button
              type="button"
              className="inline-flex items-center gap-[0.8rem] border-0 p-0 bg-transparent text-text-primary cursor-pointer overflow-hidden min-w-0 max-w-[2.2rem]"
              onClick={() => void navigate({ to: "/" })}
              aria-label="Noxian Netdecks home"
            >
              <div className="w-[2.2rem] h-[2.2rem] shrink-0 rounded-[0.7rem] grid place-items-center bg-[image:var(--gradient-accent-hero)] text-[#fff8f3] text-[1.3rem] font-extrabold shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
                N
              </div>
              <span className="text-[1.1rem] font-bold tracking-[-0.02em] whitespace-nowrap overflow-hidden max-w-0 opacity-0 -ml-[0.35rem]">
                Noxian Netdecks
              </span>
            </button>
            <form
              className="flex items-center gap-[0.5rem] min-h-[50px] p-[0.35rem_0.4rem_0.35rem_0.75rem] rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] min-w-0 w-full self-stretch focus-within:border-border-accent focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),var(--shadow-focus)]"
              onSubmit={handleHeaderSearchSubmit}
              role="search"
              aria-label="Mobile site card search"
            >
              <div className="grid place-items-center text-text-tertiary [&_svg]:w-4 [&_svg]:h-4" aria-hidden="true">
                <SearchIcon />
              </div>
              <input
                className="flex-1 w-full min-w-0 border-0 bg-transparent text-text-primary outline-none placeholder:text-text-tertiary"
                type="search"
                placeholder="Search"
                value={headerSearchQuery}
                onChange={(event) => setHeaderSearchQuery(event.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                aria-label="Search cards"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center min-h-[42px] border-0 rounded-[12px] px-[1.2rem] bg-[image:var(--gradient-accent-button)] text-[#fff9f5] font-bold cursor-pointer whitespace-nowrap shadow-[0_10px_24px_rgba(133,18,32,0.32),inset_0_1px_0_rgba(255,242,218,0.28)] hover:brightness-[1.08] hover:saturate-[1.04] w-auto"
              >
                Search
              </button>
            </form>
            <button
              type="button"
              className="inline-flex items-center justify-center w-12 h-12 border border-[rgba(255,255,255,0.08)] rounded-[0.95rem] bg-[rgba(255,255,255,0.03)] text-text-primary cursor-pointer"
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
                className="fixed inset-0 border-0 p-0 bg-[rgba(2,3,7,0.48)] opacity-100 pointer-events-auto transition-opacity duration-[180ms] z-[69]"
                aria-label="Close navigation menu"
                onClick={() => setShowMobileMenu(false)}
              />
              <div
                id="mobile-primary-navigation"
                ref={mobileMenuRef}
                className="fixed top-[9.5rem] right-[var(--space-shell-x)] left-[var(--space-shell-x)] z-70 grid gap-4 p-4 rounded-3xl bg-[rgba(8,11,18,0.97)] border border-[rgba(255,255,255,0.08)] shadow-[var(--shadow-surface-2)]"
              >
                <div className="grid gap-[0.85rem]">
                  <section className="grid gap-[0.55rem]" aria-labelledby="mobile-nav-cards-heading">
                    <p id="mobile-nav-cards-heading" className="m-0 px-[0.2rem] text-accent-warm uppercase tracking-[0.08em] text-[0.75rem] font-bold">Cards</p>
                    <NavLink href="/cards"><span className={navDrawerLinkBase}>Card Search</span></NavLink>
                    <NavLink href="/cards/learn-to-search"><span className={navDrawerLinkBase}>Learn to Search</span></NavLink>
                    <NavLink href="/cards/query-builder"><span className={navDrawerLinkBase}>Query Builder</span></NavLink>
                  </section>
                  <section className="grid gap-[0.55rem]" aria-labelledby="mobile-nav-explore-heading">
                    <p id="mobile-nav-explore-heading" className="m-0 px-[0.2rem] text-accent-warm uppercase tracking-[0.08em] text-[0.75rem] font-bold">Explore</p>
                    <NavLink href="/deck-explorer"><span className={navDrawerLinkBase}>Deck Explorer</span></NavLink>
                  </section>
                  <section className="grid gap-[0.55rem]" aria-labelledby="mobile-nav-tools-heading">
                    <p id="mobile-nav-tools-heading" className="m-0 px-[0.2rem] text-accent-warm uppercase tracking-[0.08em] text-[0.75rem] font-bold">Tools</p>
                    <NavLink href="/tools/sealed-pools"><span className={navDrawerLinkBase}>Sealed Simulator</span></NavLink>
                    <NavLink href="/tools/tier-list"><span className={navDrawerLinkBase}>Tier List Generator</span></NavLink>
                    <NavLink href="/tools/trade-balancer"><span className={navDrawerLinkBase}>Trade Balancer</span></NavLink>
                  </section>
                </div>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
