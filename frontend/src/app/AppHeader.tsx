import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  resolveDesktopHeaderStage,
  resolveHeaderShellMode,
  type DesktopHeaderStage,
  type HeaderShellMode,
} from "../lib";
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

const navShellBase =
  "min-h-[60px] items-center gap-4 px-[var(--space-shell-x)] py-[0.6rem] bg-transparent";

const navSections: MenuSection[] = [
  {
    title: "Cards",
    items: [
      { href: "/cards", label: "Card Search" },
      { href: "/cards/learn-to-search", label: "Learn to Search" },
      { href: "/cards/query-builder", label: "Query Builder" },
    ],
  },
  {
    title: "Explore",
    items: [{ href: "/deck-explorer", label: "Deck Explorer" }],
  },
  {
    title: "Tools",
    items: [
      { href: "/tools/tier-list", label: "Tier List Generator" },
      { href: "/tools/sealed-pools", label: "Sealed Simulator" },
      { href: "/tools/trade-balancer", label: "Trade Balancer" },
    ],
  },
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

  function handleHeaderSearchSubmit(value: string) {
    void navigate({
      to: "/cards",
      search: { q: value.trim() || undefined },
    });
  }

  return (
    <header
      ref={headerShellRef}
      className="sticky top-0 z-60 [background:linear-gradient(180deg,#5c1623_0%,#3a0c15_100%)] border-b border-[rgba(255,160,160,0.16)] shadow-[0_4px_30px_rgba(255,50,50,0.16)]"
    >
      {headerShellMode === "desktop" ? (
        <nav
          className={`${navShellBase} grid w-full min-w-0 relative transition-[grid-template-columns,gap] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${!headerSearchVisible ? "grid-cols-[auto_1fr]" : isCompact ? "grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3" : "grid-cols-[auto_minmax(280px,1fr)_auto]"}`}
          aria-label="Primary navigation"
        >
          <button
            type="button"
            className="inline-flex items-center gap-[0.8rem] border-0 p-0 bg-transparent text-text-primary cursor-pointer overflow-hidden ml-[calc(0.6rem_-_var(--space-shell-x))]"
            onClick={() => void navigate({ to: "/" })}
            aria-label="Noxian Netdecks home"
          >
            <LogoBadge />
            <span
              className={`text-[1.1rem] font-bold tracking-[-0.02em] whitespace-nowrap overflow-hidden transition-[max-width,opacity,margin-left] duration-[220ms,180ms,220ms] ease-[cubic-bezier(0.22,1,0.36,1),ease,ease] ${desktopHeaderStage === "full" ? "max-w-[12rem] opacity-100 ml-0" : "max-w-0 opacity-0 -ml-[0.35rem]"}`}
            >
              Noxian Netdecks
            </span>
          </button>
          {headerSearchVisible ? (
            <CardSearchInput
              value={headerSearchQuery}
              onChange={setHeaderSearchQuery}
              onSubmit={handleHeaderSearchSubmit}
              isCompact={isCompact}
              className={`animate-[search-grow-in_280ms_cubic-bezier(0.22,1,0.36,1)_forwards]${isCompact ? " w-full max-w-none self-stretch" : ""}`}
            />
          ) : null}
          <div
            className={`relative inline-flex justify-end items-center transition-[width,min-width,gap] duration-[220ms,220ms,180ms] ease-[cubic-bezier(0.22,1,0.36,1),cubic-bezier(0.22,1,0.36,1),ease] ${isCompact ? "w-12 min-w-12 gap-0 justify-items-end" : "w-auto min-w-0 gap-[0.65rem]"}`}
          >
            <div
              className={`inline-flex justify-end items-center gap-[0.4rem] min-w-0 overflow-hidden transition-[max-width,opacity,transform] duration-[240ms,180ms,220ms] ease-[cubic-bezier(0.22,1,0.36,1),ease,ease] ${isFullNav ? "max-w-[34rem] opacity-100 overflow-visible pointer-events-auto" : "max-w-0 opacity-0 translate-x-[0.35rem] pointer-events-none"}`}
            >
              <div className="relative" ref={cardsMenuRef}>
                <MenuItem
                  variant="inline"
                  label="Cards"
                  chevron
                  onClick={() => {
                    setShowCardsMenu((c) => !c);
                    setShowToolsMenu(false);
                    setShowCompactMenu(false);
                  }}
                  selected={activeSection === "cards"}
                  aria-expanded={showCardsMenu}
                  aria-haspopup="menu"
                />
                {showCardsMenu ? (
                  <Menu
                    sections={[
                      {
                        items: [
                          { href: "/cards", label: "Card Search" },
                          { href: "/cards/learn-to-search", label: "Learn to Search" },
                          { href: "/cards/query-builder", label: "Query Builder" },
                        ],
                      },
                    ]}
                    aria-label="Cards"
                    className="absolute right-0 top-[calc(100%+0.65rem)] min-w-[14rem] z-10"
                  />
                ) : null}
              </div>
              <MenuItem
                variant="inline"
                href="/deck-explorer"
                label="Deck Explorer"
              />
              <div className="relative" ref={toolsMenuRef}>
                <MenuItem
                  variant="inline"
                  label="Tools"
                  chevron
                  onClick={() => {
                    setShowToolsMenu((c) => !c);
                    setShowCardsMenu(false);
                    setShowCompactMenu(false);
                  }}
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
                    sections={[
                      {
                        items: [
                          { href: "/tools/tier-list", label: "Tier List Generator" },
                          { href: "/tools/sealed-pools", label: "Sealed Simulator" },
                          { href: "/tools/trade-balancer", label: "Trade Balancer" },
                        ],
                      },
                    ]}
                    aria-label="Tools"
                    className="absolute right-0 top-[calc(100%+0.65rem)] min-w-[14rem] z-10"
                  />
                ) : null}
              </div>
            </div>
            <div
              className={`relative inline-flex overflow-visible transition-[max-width,opacity,transform] duration-[220ms,180ms,220ms] ease-[cubic-bezier(0.22,1,0.36,1),ease,ease] ${isFullNav ? "max-w-0 opacity-0 translate-x-[0.35rem] pointer-events-none" : "max-w-[3rem] opacity-100 pointer-events-auto"}`}
              ref={compactMenuRef}
            >
              <button
                type="button"
                className="inline-flex items-center justify-center w-12 h-12 border border-[rgba(255,255,255,0.08)] rounded-[0.95rem] bg-[rgba(255,255,255,0.03)] text-text-primary cursor-pointer transition-[opacity,transform,background] duration-[180ms,220ms,180ms]"
                aria-expanded={showCompactMenu}
                aria-haspopup="menu"
                aria-label={
                  showCompactMenu ? "Close compact navigation menu" : "Open compact navigation menu"
                }
                onClick={() => {
                  setShowCompactMenu((c) => !c);
                  setShowCardsMenu(false);
                  setShowToolsMenu(false);
                }}
              >
                <MenuIcon open={showCompactMenu} />
              </button>
              {showCompactMenu ? (
                <Menu
                  sections={navSections}
                  aria-label="Compact navigation"
                  className="absolute top-[calc(100%+0.65rem)] right-0 z-[8] min-w-[min(22rem,82vw)]"
                />
              ) : null}
            </div>
          </div>
        </nav>
      ) : null}
      {headerShellMode === "mobile" ? (
        <div className="grid w-full">
          <div className={`${navShellBase} flex w-full`}>
            <button
              type="button"
              className="inline-flex items-center gap-[0.8rem] border-0 p-0 bg-transparent text-text-primary cursor-pointer overflow-hidden"
              onClick={() => void navigate({ to: "/" })}
              aria-label="Noxian Netdecks home"
            >
              <LogoBadge />
              <span className="text-[1.1rem] font-bold tracking-[-0.02em] whitespace-nowrap overflow-hidden max-w-0 opacity-0 -ml-[0.35rem]">
                Noxian Netdecks
              </span>
            </button>
            <div className="flex-1 min-w-0 mx-3">
              {headerSearchVisible ? (
                <CardSearchInput
                  value={headerSearchQuery}
                  onChange={setHeaderSearchQuery}
                  onSubmit={handleHeaderSearchSubmit}
                  isCompact={true}
                  className="animate-[search-grow-in_280ms_cubic-bezier(0.22,1,0.36,1)_forwards] w-full"
                />
              ) : null}
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center w-12 h-12 border border-[rgba(255,255,255,0.08)] rounded-[0.95rem] bg-[rgba(255,255,255,0.03)] text-text-primary cursor-pointer"
              aria-expanded={showMobileMenu}
              aria-controls="mobile-primary-navigation"
              aria-label={showMobileMenu ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => setShowMobileMenu((c) => !c)}
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
              <Menu
                ref={mobileMenuRef}
                id="mobile-primary-navigation"
                sections={navSections}
                aria-label="Navigation"
                className="fixed top-[9.5rem] right-[var(--space-shell-x)] left-[var(--space-shell-x)] z-70"
              />
            </>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
