import { type FormEvent, type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { resolveDesktopHeaderStage, type DesktopHeaderStage } from "./lib";
import { ChevronIcon, MenuIcon, SearchIcon } from "./ui";
import { FeatureCard } from "./ui/FeatureCard";
import { PromoCard } from "./ui/PromoCard";

export const heroBackgroundAsset = "/design-assets/hero-background.png";


export function StorybookViewportFrame({
  mode,
  mobileWidth = 393,
  desktopWidth,
  children
}: {
  mode: "desktop" | "mobile";
  mobileWidth?: number;
  desktopWidth?: number;
  children: ReactNode;
}) {
  const widthStyle = mode === "mobile"
    ? { width: "100%", maxWidth: `${mobileWidth}px` }
    : desktopWidth
      ? { width: `${desktopWidth}px`, maxWidth: `${desktopWidth}px` }
      : undefined;

  const outerClass = mode === "mobile"
    ? "min-h-screen p-[1.5rem_1rem_2.5rem] overflow-auto grid justify-center content-start overflow-x-auto"
    : "min-h-screen p-6 overflow-auto";

  const innerClass = mode === "mobile"
    ? "w-full max-w-[393px] min-h-[852px] flex-none mx-auto"
    : "w-[min(100%,1280px)] mx-auto";

  return (
    <div className={outerClass}>
      <div className={innerClass} style={widthStyle}>
        {children}
      </div>
    </div>
  );
}

export function HomePage({ onNavigate }: { onNavigate: (href: string) => void }) {
  const [query, setQuery] = useState("");

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = query.trim();
    onNavigate(next.length > 0 ? `/cards?q=${encodeURIComponent(next)}` : "/cards");
  }

  return (
    <div className="p-[0.8rem_var(--space-shell-x)_3rem]">
      {/* grid shell — container for all home content */}
      <div className="w-[min(100%,var(--content-max-width))] mx-auto [container-type:inline-size] [container-name:home-shell]">
        {/* hero shell */}
        <div className="pt-[0.2rem]">
          {/* hero card — inner container for hero-specific breakpoints */}
          <div className="relative grid min-h-[min(35rem,calc(100svh-6.85rem))] @[768px]:min-h-[35rem] items-end rounded-[32px] overflow-hidden isolate bg-[#080b11] border border-[rgba(255,255,255,0.08)] shadow-[var(--shadow-surface-2)] [container-type:inline-size] [container-name:hero-shell]">
            {/* background art */}
            <div className="absolute inset-0 z-0">
              <div className="relative w-full h-full overflow-hidden">
                <div className="absolute inset-0 z-[1] transition-[background,transform] duration-[180ms] bg-[linear-gradient(180deg,rgba(4,6,10,0.04)_0%,rgba(4,6,10,0.14)_32%,rgba(4,6,10,0.46)_100%),linear-gradient(180deg,rgba(5,7,11,0.04)_0%,rgba(5,7,11,0.24)_100%)] @[640px]:bg-[linear-gradient(180deg,rgba(4,6,10,0.03)_0%,rgba(4,6,10,0.1)_24%,rgba(4,6,10,0.34)_100%),linear-gradient(90deg,rgba(5,7,11,0)_0%,rgba(5,7,11,0.03)_82%,rgba(5,7,11,0.14)_112%)] @[768px]:bg-[linear-gradient(180deg,rgba(4,6,10,0.05)_0%,rgba(4,6,10,0.12)_24%,rgba(4,6,10,0.42)_100%),linear-gradient(180deg,rgba(5,7,11,0.04)_0%,rgba(5,7,11,0.24)_100%)]" />
                <div className="absolute inset-0 z-[2] pointer-events-none transition-[background,transform] duration-[180ms] bg-[radial-gradient(circle_at_72%_18%,rgba(215,170,73,0.12),transparent_18%),radial-gradient(circle_at_64%_34%,rgba(202,45,63,0.2),transparent_38%),linear-gradient(180deg,rgba(6,8,12,0)_0%,rgba(6,8,12,0.18)_100%)] @[640px]:bg-[radial-gradient(circle_at_74%_16%,rgba(215,170,73,0.14),transparent_18%),radial-gradient(circle_at_66%_30%,rgba(202,45,63,0.2),transparent_36%),linear-gradient(180deg,rgba(6,8,12,0)_0%,rgba(6,8,12,0.14)_100%)]" />
                <img
                  src={heroBackgroundAsset}
                  alt=""
                  className="relative z-0 w-full h-full object-cover object-[62%_top] @[768px]:object-[center_22%] @[1024px]:object-[center_24%] block [filter:saturate(1.08)_brightness(0.98)] min-h-[min(35rem,calc(100svh-6.85rem))] @[768px]:min-h-[35rem] @[1024px]:min-h-[35rem]"
                />
              </div>
            </div>
            {/* copy */}
            <div className="relative z-[2] flex flex-col items-center justify-center gap-[1.05rem] @[640px]:gap-[1.1rem] @[768px]:gap-[1.15rem] w-full @[768px]:w-[min(100%,46rem)] min-h-[min(35rem,calc(100svh-6.85rem))] @[768px]:min-h-[35rem] px-[1.2rem] py-[1.85rem_1.55rem] @[640px]:p-[1.9rem_1.35rem_1.7rem] @[768px]:p-[2.2rem_2rem] @[1024px]:p-[2.5rem_2.5rem_3rem] text-center @[1024px]:translate-y-[2rem] transition-[width,min-height,padding,transform] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] bg-[linear-gradient(180deg,rgba(8,11,18,0.04)_0%,rgba(8,11,18,0.22)_26%,rgba(8,11,18,0.82)_62%,rgba(8,11,18,0.96)_100%)] @[768px]:bg-[linear-gradient(180deg,rgba(8,11,18,0.04)_0%,rgba(8,11,18,0.16)_20%,rgba(8,11,18,0.64)_56%,rgba(8,11,18,0.92)_100%)]">
              <p className="eyebrow">Noxian Netdecks</p>
              <h1 className="flex flex-col items-center gap-[0.05em] m-0 text-[clamp(4.65rem,17cqi,6.8rem)] @[640px]:text-[clamp(3.1rem,8.4vw,4.25rem)] @[768px]:text-[4.75rem] @[1024px]:text-[4.75rem] leading-[0.94] tracking-[-0.055em] transition-[font-size,transform] duration-[180ms]">
                <span className="text-text-primary text-[0.68em] @[768px]:text-[0.7em]">The Complete</span>
                <span className="bg-[linear-gradient(180deg,#fff5ec_0%,#d73c51_18%,#c62f45_88%)] bg-clip-text text-transparent">Riftbound</span>
                <span className="bg-[linear-gradient(180deg,#fdecc2_0%,#d8aa49_84%)] bg-clip-text text-transparent">Archive</span>
              </h1>
              <p className="hidden @[768px]:block max-w-[30rem] @[1024px]:max-w-[26rem] @[1024px]:text-[1.15rem] m-0 text-text-secondary text-base leading-[1.55]">Search cards, understand price trends.</p>
              <form
                className="grid [grid-template-columns:minmax(0,1fr)_auto] gap-[0.7rem] mt-[0.3rem] w-full max-w-full @[640px]:w-[min(100%,34rem)] @[768px]:w-[min(100%,40rem)] @[1024px]:w-[min(100%,50rem)] transition-[width] duration-[180ms]"
                onSubmit={handleSearchSubmit}
              >
                <label
                  className="flex items-center gap-[0.7rem] min-h-[58px] px-4 rounded-[16px] bg-[rgba(11,14,22,0.48)] border border-[rgba(255,219,155,0.18)] backdrop-blur-[12px] focus-within:border-[rgba(247,198,91,0.72)] focus-within:shadow-[0_0_0_3px_rgba(215,170,73,0.2)]"
                  aria-label="Search cards, decks, pools"
                >
                  <span className="grid place-items-center text-text-tertiary [&_svg]:w-4 [&_svg]:h-4" aria-hidden="true">
                    <SearchIcon />
                  </span>
                  <input
                    className="flex-1 w-full min-w-0 border-0 bg-transparent text-text-primary outline-none placeholder:text-text-tertiary"
                    type="text"
                    placeholder="Search cards, decks, pools..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center min-h-[42px] border-0 rounded-[12px] px-[1.2rem] bg-[var(--gradient-accent-button)] text-[#fff9f5] font-bold cursor-pointer whitespace-nowrap shadow-[0_10px_24px_rgba(133,18,32,0.32),inset_0_1px_0_rgba(255,242,218,0.28)] hover:brightness-[1.08] hover:saturate-[1.04]"
                >
                  Search
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* content section */}
        <div className="grid gap-[0.85rem] @[768px]:gap-4 @[1280px]:gap-[1.1rem] pt-[0.9rem] @[768px]:pt-4">
          {/* feature grid */}
          <div className="grid gap-[0.85rem] [grid-template-columns:1fr] @[768px]:grid-cols-2 @[1024px]:grid-cols-3 [container-type:inline-size]">
            <FeatureCard
              title="Trade Balancer"
              description="Compare offers, price cards, and tune fair swaps."
              href="/tools/trade-balancer"
              icon="trade"
              onNavigate={onNavigate}
            />
            <FeatureCard
              title="Card Search"
              description="Find cards by name, type, keyword and more."
              href="/cards"
              icon="search"
              onNavigate={onNavigate}
            />
            <FeatureCard
              title="Sealed Simulator"
              description="Generate pools from any format. Build and save decks."
              href="/tools/sealed-pools"
              icon="sealed"
              onNavigate={onNavigate}
            />
          </div>

          {/* promo grid */}
          <div className="grid gap-[0.85rem] [grid-template-columns:1fr] @[640px]:grid-cols-2 [container-type:inline-size]">
            <PromoCard
              label="Tool"
              title="Tier List Generator"
              description="Create and share tier lists."
              href="/tools/tier-list"
              onNavigate={onNavigate}
            />
            <PromoCard
              label="Learn"
              title="Learn to Search"
              description="Open the query builder and learn the search language."
              href="/cards/learn-to-search"
              onNavigate={onNavigate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function StorybookHeaderPreview({ mode = "desktop" }: { mode?: "desktop" | "mobile" }) {
  const [showCardsMenu, setShowCardsMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showCompactMenu, setShowCompactMenu] = useState(false);
  const desktopPreviewRef = useRef<HTMLDivElement | null>(null);
  const [desktopHeaderStage, setDesktopHeaderStage] = useState<DesktopHeaderStage>("full");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileCardsMenu, setShowMobileCardsMenu] = useState(false);
  const [showMobileToolsMenu, setShowMobileToolsMenu] = useState(false);

  useLayoutEffect(() => {
    if (mode !== "desktop" || !desktopPreviewRef.current || typeof ResizeObserver === "undefined") {
      return;
    }

    function updateHeaderStage(nextWidth: number) {
      setDesktopHeaderStage((currentStage) => resolveDesktopHeaderStage(nextWidth, currentStage));
    }

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? 0;
      updateHeaderStage(nextWidth);
    });

    updateHeaderStage(desktopPreviewRef.current.getBoundingClientRect().width);
    observer.observe(desktopPreviewRef.current);
    return () => observer.disconnect();
  }, [mode]);

  if (mode === "mobile") {
    return (
      <div className="storybook-header-demo storybook-mobile-shell">
        <div className="storybook-mobile-inline site-nav-mobile-inline">
          <div className="site-nav-brand">
            <div className="site-nav-logo">N</div>
            <span className="site-nav-wordmark">Noxian Netdecks</span>
          </div>
          <div className="site-nav-search-form site-nav-search-form--static site-nav-search-form--mobile-inline mobile-nav-search">
            <span className="site-nav-search-icon" aria-hidden="true">
              <SearchIcon />
            </span>
            <input className="site-nav-search-input" readOnly placeholder="Search" />
            <button type="button" className="site-nav-search-btn">Search</button>
          </div>
          <button
            type="button"
            className="site-nav-mobile-toggle nav-mobile-toggle--storybook"
            aria-expanded={showMobileMenu}
            onClick={() => setShowMobileMenu((current) => !current)}
          >
            <MenuIcon open={showMobileMenu} />
          </button>
        </div>
        {showMobileMenu ? (
          <div className="storybook-mobile-menu">
            <div className="mobile-nav-links">
              <button
                type="button"
                className="mobile-nav-link mobile-nav-link--button"
                aria-expanded={showMobileCardsMenu}
                onClick={() => {
                  setShowMobileCardsMenu((current) => !current);
                  setShowMobileToolsMenu(false);
                }}
              >
                <span>Cards</span>
                <ChevronIcon expanded={showMobileCardsMenu} />
              </button>
              {showMobileCardsMenu ? (
                <div className="storybook-mobile-submenu">
                  <button type="button" className="mobile-nav-link mobile-nav-link--subtle">Search</button>
                  <button type="button" className="mobile-nav-link mobile-nav-link--subtle">Query Builder</button>
                </div>
              ) : null}
              <span className="mobile-nav-link">Deck Explorer</span>
              <button
                type="button"
                className="mobile-nav-link mobile-nav-link--button"
                aria-expanded={showMobileToolsMenu}
                onClick={() => {
                  setShowMobileToolsMenu((current) => !current);
                  setShowMobileCardsMenu(false);
                }}
              >
                <span>Tools</span>
                <ChevronIcon expanded={showMobileToolsMenu} />
              </button>
              {showMobileToolsMenu ? (
                <div className="storybook-mobile-submenu">
                  <button type="button" className="mobile-nav-link mobile-nav-link--subtle">Tier List Generator</button>
                  <button type="button" className="mobile-nav-link mobile-nav-link--subtle">Sealed Simulator</button>
                  <button type="button" className="mobile-nav-link mobile-nav-link--subtle">Trade Balancer</button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  const useCompactInlineHeader = desktopHeaderStage === "compact" || desktopHeaderStage === "search";
  return (
    <div className="storybook-header-demo">
      <div
        ref={desktopPreviewRef}
        className={`storybook-header-preview site-nav site-nav--stage-${desktopHeaderStage}`}
      >
        <div className="site-nav-brand">
          <div className="site-nav-logo">N</div>
          <span className="site-nav-wordmark">Noxian Netdecks</span>
        </div>
        <div className={`site-nav-search-form site-nav-search-form--static${useCompactInlineHeader ? " site-nav-search-form--mobile-inline mobile-nav-search" : ""}`}>
          <span className="site-nav-search-icon" aria-hidden="true">
            <SearchIcon />
          </span>
          <input className="site-nav-search-input" readOnly placeholder={desktopHeaderStage === "full" ? "Search for Riftbound Cards" : "Search"} />
          <button type="button" className="site-nav-search-btn">Search</button>
        </div>
        <div className="site-nav-shell-actions">
          <div className="storybook-header-links site-nav-links">
            <div className="site-nav-tools-menu">
              <button
                type="button"
                className={`site-nav-link${showCardsMenu ? " active" : ""}`}
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
                  <button type="button" className="storybook-menu-item">Search</button>
                  <button type="button" className="storybook-menu-item">Learn to Search</button>
                  <button type="button" className="storybook-menu-item">Query Builder</button>
                </div>
              ) : null}
            </div>
            <span className="site-nav-link">Deck Explorer</span>
            <div className="site-nav-tools-menu">
              <button
                type="button"
                className={`site-nav-link${showToolsMenu ? " active" : ""}`}
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
                  <button type="button" className="storybook-menu-item">Tier List Generator</button>
                  <button type="button" className="storybook-menu-item">Sealed Simulator</button>
                  <button type="button" className="storybook-menu-item">Trade Balancer</button>
                </div>
              ) : null}
            </div>
          </div>
          <div className="site-nav-compact-menu-wrap">
            <button
              type="button"
              className="site-nav-compact-toggle"
              aria-expanded={showCompactMenu}
              aria-haspopup="menu"
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
                <section className="nav-drawer-section" aria-labelledby="storybook-compact-cards-heading">
                  <p id="storybook-compact-cards-heading" className="nav-drawer-heading">Cards</p>
                  <button type="button" className="nav-drawer-link">Card Search</button>
                  <button type="button" className="nav-drawer-link">Learn to Search</button>
                  <button type="button" className="nav-drawer-link">Query Builder</button>
                </section>
                <section className="nav-drawer-section" aria-labelledby="storybook-compact-explore-heading">
                  <p id="storybook-compact-explore-heading" className="nav-drawer-heading">Explore</p>
                  <button type="button" className="nav-drawer-link">Deck Explorer</button>
                </section>
                <section className="nav-drawer-section" aria-labelledby="storybook-compact-tools-heading">
                  <p id="storybook-compact-tools-heading" className="nav-drawer-heading">Tools</p>
                  <button type="button" className="nav-drawer-link">Tier List Generator</button>
                  <button type="button" className="nav-drawer-link">Sealed Simulator</button>
                  <button type="button" className="nav-drawer-link">Trade Balancer</button>
                </section>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
