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
      {/* grid shell — container for all home content */}
      <div className="w-full [container-type:inline-size] [container-name:home-shell]">
        {/* hero — full-bleed, no card border */}
        <div>
          {/* hero card — flex-col so copy zone fills space above pinned tile row */}
          <div className="relative flex flex-col min-h-[min(44rem,calc(100svh-2rem))] @[768px]:min-h-[50rem] overflow-hidden isolate bg-[#05060a] [container-type:inline-size] [container-name:hero-shell]">
            {/* background art */}
            <div className="absolute inset-0 z-0">
              <div className="relative w-full h-full overflow-hidden">
                <div className="absolute inset-0 z-[1] transition-[background,transform] duration-[180ms] bg-[linear-gradient(180deg,rgba(4,6,10,0.04)_0%,rgba(4,6,10,0.14)_32%,rgba(4,6,10,0.46)_100%),linear-gradient(180deg,rgba(5,7,11,0.04)_0%,rgba(5,7,11,0.24)_100%)] @[640px]:bg-[linear-gradient(180deg,rgba(4,6,10,0.03)_0%,rgba(4,6,10,0.1)_24%,rgba(4,6,10,0.34)_100%),linear-gradient(90deg,rgba(5,7,11,0)_0%,rgba(5,7,11,0.03)_82%,rgba(5,7,11,0.14)_112%)] @[768px]:bg-[linear-gradient(180deg,rgba(4,6,10,0.05)_0%,rgba(4,6,10,0.12)_24%,rgba(4,6,10,0.42)_100%),linear-gradient(180deg,rgba(5,7,11,0.04)_0%,rgba(5,7,11,0.24)_100%)]" />
                <div className="absolute inset-0 z-[2] pointer-events-none transition-[background,transform] duration-[180ms] bg-[radial-gradient(circle_at_72%_18%,rgba(215,170,73,0.12),transparent_18%),radial-gradient(circle_at_64%_34%,rgba(202,45,63,0.2),transparent_38%),linear-gradient(180deg,rgba(6,8,12,0)_0%,rgba(6,8,12,0.18)_100%)] @[640px]:bg-[radial-gradient(circle_at_74%_16%,rgba(215,170,73,0.14),transparent_18%),radial-gradient(circle_at_66%_30%,rgba(202,45,63,0.2),transparent_36%),linear-gradient(180deg,rgba(6,8,12,0)_0%,rgba(6,8,12,0.14)_100%)]" />
                <img
                  src={heroBackgroundAsset}
                  alt=""
                  className="relative z-0 w-full h-full object-cover object-[center_top] block [filter:saturate(1.08)_brightness(0.98)] min-h-[min(44rem,calc(100svh-2rem))] @[768px]:min-h-[50rem]"
                />
                {/* atmospheric fade — blends art into page background */}
                <div className="absolute bottom-0 inset-x-0 z-[3] h-[32%] pointer-events-none bg-[image:linear-gradient(to_bottom,transparent,#05060a)]" />
              </div>
            </div>
            {/* copy zone — flex-1 so it fills all space above the tile row */}
            <div className="relative z-[2] flex-1 flex flex-col items-center justify-center gap-[1.05rem] @[640px]:gap-[1.1rem] @[768px]:gap-[1.15rem] w-full @[768px]:w-[min(100%,46rem)] self-center px-[1.2rem] py-[2rem] @[640px]:p-[2rem_1.35rem] @[768px]:p-[2.5rem_2rem] @[1024px]:p-[3rem_2.5rem] text-center transition-[width,padding] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)]">
              <p className="eyebrow">Noxian Netdecks</p>
              <h1 className="flex flex-col items-center gap-[0.05em] m-0 text-[clamp(4.65rem,17cqi,6.8rem)] @[640px]:text-[clamp(3.1rem,8.4vw,4.25rem)] @[768px]:text-[4.75rem] @[1024px]:text-[4.75rem] leading-[0.94] tracking-[-0.055em] transition-[font-size,transform] duration-[180ms]">
                <span className="text-text-primary text-[0.68em] @[768px]:text-[0.7em]">The Complete</span>
                <span className="bg-[linear-gradient(180deg,#fff5ec_0%,#d73c51_18%,#c62f45_88%)] bg-clip-text text-transparent">Riftbound</span>
                <span className="bg-[linear-gradient(180deg,#fdecc2_0%,#d8aa49_84%)] bg-clip-text text-transparent">Archive</span>
              </h1>
              <p className="hidden @[768px]:block max-w-[30rem] @[1024px]:max-w-[26rem] @[1024px]:text-[1.15rem] m-0 text-text-secondary text-base leading-[1.55]">Search cards, understand price trends.</p>
              <div
                ref={heroFormRef}
                className="mt-[0.3rem] w-full max-w-full @[640px]:w-[min(100%,34rem)] @[768px]:w-[min(100%,40rem)] @[1024px]:w-[min(100%,50rem)] transition-[width] duration-[180ms]"
              >
                <CardSearchInput
                  value={query}
                  onChange={setQuery}
                  onSubmit={handleSearchSubmit}
                />
              </div>
            </div>
            {/* feature tile row — pinned to hero bottom, sits above atmospheric fade */}
            <div className="relative z-[4] px-[var(--space-shell-x)] pt-[1rem] pb-[1.5rem] @[768px]:pb-[2rem]">
              <div className="grid gap-[0.85rem] [grid-template-columns:1fr] @[768px]:grid-cols-2 @[1024px]:grid-cols-3 [container-type:inline-size]">
                <TileFeature
                  title="Trade Balancer"
                  description="Compare offers, price cards, and tune fair swaps."
                  href="/tools/trade-balancer"
                  icon="trade"
                  onNavigate={onNavigate}
                />
                <TileFeature
                  title="Card Search"
                  description="Find cards by name, type, keyword and more."
                  href="/cards"
                  icon="search"
                  onNavigate={onNavigate}
                />
                <TileFeature
                  title="Sealed Simulator"
                  description="Generate pools from any format. Build and save decks."
                  href="/tools/sealed-pools"
                  icon="sealed"
                  onNavigate={onNavigate}
                />
              </div>
            </div>
          </div>
        </div>

        {/* content section */}
        <div className="grid gap-[0.85rem] @[768px]:gap-4 @[1280px]:gap-[1.1rem] pt-[0.85rem] @[768px]:pt-4 px-[var(--space-shell-x)]">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="grid gap-[0.85rem] @[768px]:gap-4">
              {/* promo grid */}
              <div className="grid gap-[0.85rem] [grid-template-columns:1fr] @[640px]:grid-cols-2 [container-type:inline-size]">
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
          ))}
        </div>
      </div>
    </div>
  );
}
