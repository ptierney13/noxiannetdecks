import { useEffect, useLayoutEffect, useRef } from "react";
import { CardSearchInput, TileFeature, TilePromo } from "../ui-elements";
import { useHeaderSearch } from "../app/HeaderSearchContext";

export const heroBackgroundAsset = "/design-assets/hero-background.png";

export function HomePage({ onNavigate }: { onNavigate: (href: string) => void }) {
  const { query, setQuery, setHeaderSearchVisible } = useHeaderSearch();
  const heroFormRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    setHeaderSearchVisible(false);
    return () => setHeaderSearchVisible(true);
  }, [setHeaderSearchVisible]);

  useEffect(() => {
    const el = heroFormRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setHeaderSearchVisible(!entry!.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [setHeaderSearchVisible]);

  function handleSearchSubmit(value: string) {
    const next = value.trim();
    onNavigate(next.length > 0 ? `/cards?q=${encodeURIComponent(next)}` : "/cards");
  }

  return (
    <div>
      {/* hero */}
      <div className="relative flex flex-col min-h-[56rem] overflow-hidden isolate bg-[#05060a]">
        <div className="absolute inset-x-0 top-0 z-0 h-[56rem]">
          <div className="relative w-full h-full overflow-hidden">
            <div className="absolute inset-0 z-[1] pointer-events-none bg-[linear-gradient(180deg,rgba(6,8,12,0)_0%,rgba(6,8,12,0.1)_100%)]" />
            <img
              src={heroBackgroundAsset}
              alt=""
              className="relative z-0 w-full h-full object-cover object-[center_bottom] block [filter:saturate(1.05)_brightness(1.15)]"
            />
            <div className="absolute bottom-0 inset-x-0 z-[2] h-[1.1rem] pointer-events-none bg-[image:linear-gradient(to_bottom,transparent,#05060a)]" />
          </div>
        </div>

        {/* copy zone */}
        <div className="relative z-[2] flex-1 flex flex-col items-center justify-center gap-[1.1rem] w-full px-[1.2rem] py-[2rem] lg:p-[3rem_2.5rem] text-center">
          <h1 className="flex flex-col items-center gap-[0.05em] m-0 text-[3.6rem] sm:text-[4.8rem] md:text-[6rem] leading-[0.94] tracking-[-0.055em]">
            <span className="text-text-primary text-[0.68em]">The Complete</span>
            <span className="bg-[linear-gradient(180deg,#fff5ec_0%,#d73c51_18%,#c62f45_88%)] bg-clip-text text-transparent">Riftbound</span>
            <span className="bg-[linear-gradient(180deg,#fdecc2_0%,#d8aa49_84%)] bg-clip-text text-transparent">Archive</span>
          </h1>
          <div ref={heroFormRef} className="mt-[0.3rem] w-[min(100%,40rem)]">
            <CardSearchInput
              value={query}
              onChange={setQuery}
              onSubmit={handleSearchSubmit}
            />
          </div>
        </div>

        {/* feature tiles */}
        <div className="relative z-[4] px-[var(--space-shell-x)] pt-[1rem] pb-[1.5rem]">
          <div className="grid grid-cols-1 gap-[0.85rem] sm:grid-cols-2 md:grid-cols-3">
            <div className="sm:col-span-2 md:col-span-1">
              <TileFeature
                title="Trade Balancer"
                description="Compare offers, price cards, and tune fair swaps."
                href="/tools/trade-balancer"
                icon="trade"
                onNavigate={onNavigate}
              />
            </div>
            <TileFeature
              title="Card Search"
              description="Find cards by name, type, keyword and more."
              href="/cards"
              icon="search"
              onNavigate={onNavigate}
            />
            <TileFeature
              title="Sealed Simulator"
              description="Generate pools and build decks."
              href="/tools/sealed-pools"
              icon="sealed"
              onNavigate={onNavigate}
            />
          </div>
        </div>
      </div>

      {/* promo row */}
      <div className="grid grid-cols-1 gap-[0.85rem] sm:grid-cols-2 pt-[0.85rem] px-[var(--space-shell-x)]">
        <TilePromo
          label="Tool"
          title="Tier List Generator"
          description="Create and share tier lists."
          href="/tools/tier-list"
          onNavigate={onNavigate}
        />
        <TilePromo
          label="Learn"
          title="Learn to Search"
          description="Open the query builder and learn the search language."
          href="/cards/learn-to-search"
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}
