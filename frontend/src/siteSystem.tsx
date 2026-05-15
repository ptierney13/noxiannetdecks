import { type FormEvent, type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { resolveDesktopHeaderStage, type DesktopHeaderStage } from "./headerLayout";

export const heroBackgroundAsset = "/design-assets/hero-background.png";

function SearchGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <path d="m20 20-4.2-4.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
    </svg>
  );
}

function ChevronGlyph({ expanded = false }: { expanded?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false" className={expanded ? "chevron expanded" : "chevron"}>
      <path d="M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6 1.4-1.4Z" fill="currentColor" />
    </svg>
  );
}

function MenuGlyph({ open = false }: { open?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false" className="menu-icon">
      {open ? (
        <path d="M6 6 18 18M18 6 6 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      )}
    </svg>
  );
}

function CardsGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <rect x="5" y="5" width="11" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="9" y="3" width="11" height="15" rx="2" fill="none" opacity="0.48" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.5 9.5h4.8M8.5 12.5h4.8" fill="none" opacity="0.56" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}

function DeckGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M5.5 8.2 12 5l6.5 3.2v7.6L12 19l-6.5-3.2V8.2Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 5v14M5.5 8.2 12 12l6.5-3.8" fill="none" opacity="0.7" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function SealedGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <rect x="4.5" y="7.5" width="15" height="11.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 7.5c0-1.7 1.6-3 5-3s5 1.3 5 3" fill="none" opacity="0.7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 12h8M12 8.8v6.4" fill="none" opacity="0.7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

type FeatureCardProps = {
  title: string;
  description: string;
  href: string;
  onNavigate: (href: string) => void;
  icon: "search" | "trade" | "sealed";
};

function FeatureCard({ title, description, href, onNavigate, icon }: FeatureCardProps) {
  const glyph = icon === "search"
    ? <SearchGlyph />
    : icon === "trade"
      ? (
        <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
          <path d="M7 7h8.5l-2.7-2.7L14.2 3 19 7.8l-4.8 4.8-1.4-1.3L15.5 9H7V7Zm10 8H8.5l2.7 2.7-1.4 1.3L5 14.2l4.8-4.8 1.4 1.3L8.5 13H17v2Z" fill="currentColor" />
        </svg>
      )
      : <SealedGlyph />;

  return (
    <a
      href={href}
      className="home-feature-card"
      onClick={(event) => {
        event.preventDefault();
        onNavigate(href);
      }}
    >
      <div className="home-feature-icon-row">
        <div className="home-feature-icon-tile">{glyph}</div>
        <span className="home-feature-arrow" aria-hidden="true">→</span>
      </div>
      <div className="home-feature-copy">
        <h3 className="home-feature-title">{title}</h3>
        <p className="home-feature-desc">{description}</p>
      </div>
    </a>
  );
}

type PromoCardProps = {
  label: string;
  title: string;
  description: string;
  href?: string;
  onNavigate?: (href: string) => void;
  muted?: boolean;
};

function PromoCard({ label, title, description, href, onNavigate, muted = false }: PromoCardProps) {
  const className = muted ? "home-promo-card home-promo-card--muted" : "home-promo-card";

  if (!href || !onNavigate) {
    return (
      <div className={className}>
        <div className="home-promo-label">{label}</div>
        <h3>{title}</h3>
        <p>{description}</p>
        <span className="home-promo-arrow" aria-hidden="true">→</span>
      </div>
    );
  }

  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        onNavigate(href);
      }}
    >
      <div className="home-promo-label">{label}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="home-promo-arrow" aria-hidden="true">→</span>
    </a>
  );
}

export function ArtworkShowcasePanel() {
  return (
    <section className="artwork-showcase" aria-labelledby="artwork-showcase-heading">
      <div className="artwork-showcase-header">
        <p id="artwork-showcase-heading">Background Artwork</p>
      </div>
      <div className="artwork-showcase-frame">
        <img src={heroBackgroundAsset} alt="" />
      </div>
    </section>
  );
}

export function RouteSurfacePreview() {
  return (
    <section className="route-surface-preview" aria-labelledby="route-surface-preview-heading">
      <div className="section-heading section-heading--compact">
        <p className="eyebrow">Design System</p>
        <h2 id="route-surface-preview-heading">Shared route surfaces</h2>
        <p>Standard pages inherit atmosphere, panel treatment, and spacing from the top-level shell.</p>
      </div>
      <div className="route-surface-preview-grid">
        <article className="route-surface-card">
          <p className="route-surface-kicker">Cards</p>
          <h3>Search workflow</h3>
          <p>Hero panel, content shelves, and inputs all align to the same system tokens.</p>
        </article>
        <article className="route-surface-card">
          <p className="route-surface-kicker">Explorer</p>
          <h3>Data-rich views</h3>
          <p>Dense tools keep their behavior while inheriting a more atmospheric shell and stronger hierarchy.</p>
        </article>
      </div>
    </section>
  );
}

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

  return (
    <div className={`storybook-viewport storybook-viewport--${mode}`}>
      <div
        className={`storybook-viewport-inner storybook-viewport-inner--${mode}`}
        style={widthStyle}
      >
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
    <div className="home-page">
      <section className="home-hero-shell">
        <div className="home-hero home-grid-shell">
          <div className="home-hero-art">
            <div className="home-hero-art-frame">
              <img src={heroBackgroundAsset} alt="" className="home-hero-art-image" />
            </div>
          </div>
          <div className="home-hero-copy">
            <p className="eyebrow">Noxian Netdecks</p>
            <h1 className="hero-heading">
              <span className="hero-heading-plain">The Complete</span>
              <span className="hero-heading-accent">Riftbound</span>
              <span className="hero-heading-warm">Archive</span>
            </h1>
            <p className="hero-sub">Search cards, understand price trends.</p>
            <form className="hero-search-box" onSubmit={handleSearchSubmit}>
              <label className="hero-search-field" aria-label="Search cards, decks, pools">
                <span className="hero-search-icon">
                  <SearchGlyph />
                </span>
                <input
                  className="hero-search-input"
                  type="text"
                  placeholder="Search cards, decks, pools..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </label>
              <button type="submit" className="hero-search-btn">Search</button>
            </form>
          </div>
        </div>
      </section>

      <section className="home-content home-grid-shell" aria-label="Primary features">
        <div className="home-feature-grid">
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

        <div className="home-promo-grid">
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
      </section>
    </div>
  );
}

export function StorybookFeatureCardsPreview() {
  return (
    <div className="home-grid-shell">
      <div className="home-feature-grid">
        <FeatureCard title="Trade Balancer" description="Compare offers, price cards, and tune fair swaps." href="/tools/trade-balancer" icon="trade" onNavigate={() => undefined} />
        <FeatureCard title="Card Search" description="Find cards by name, type, keyword and more." href="/cards" icon="search" onNavigate={() => undefined} />
        <FeatureCard title="Sealed Simulator" description="Generate pools from any format. Build and save decks." href="/tools/sealed-pools" icon="sealed" onNavigate={() => undefined} />
      </div>
    </div>
  );
}

export function StorybookPromoCardsPreview() {
  return (
    <div className="home-grid-shell">
      <div className="home-promo-grid">
        <PromoCard label="Tool" title="Tier List Generator" description="Create and share tier lists." muted />
        <PromoCard label="Learn" title="Learn to Search" description="Open the query builder and learn the search language." muted />
      </div>
    </div>
  );
}

export function StorybookSurfaceGallery() {
  return (
    <div className="storybook-surface-gallery home-grid-shell">
      <StorybookFeatureCardsPreview />
      <StorybookPromoCardsPreview />
      <RouteSurfacePreview />
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
              <SearchGlyph />
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
            <MenuGlyph open={showMobileMenu} />
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
                <ChevronGlyph expanded={showMobileCardsMenu} />
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
                <ChevronGlyph expanded={showMobileToolsMenu} />
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
            <SearchGlyph />
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
                <ChevronGlyph expanded={showCardsMenu} />
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
                <ChevronGlyph expanded={showToolsMenu} />
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
              <MenuGlyph open={showCompactMenu} />
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

export { CardsGlyph, SearchGlyph };
