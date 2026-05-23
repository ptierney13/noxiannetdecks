import { useState } from "react";
import type { LtsDetailItem } from "./GuideDetailCard";

type ZoneId =
  | "name" | "cost" | "energy" | "power" | "might"
  | "typeline" | "cardtype" | "supertype" | "tag-mech" | "tag-blitzcrank" | "tag-zaun"
  | "keyword" | "text"
  | "set" | "rarity" | "number" | "artist";

type ZoneInfo = LtsDetailItem & { label: string };

const ZONES: Record<ZoneId, ZoneInfo> = {
  name:             { label: "Name",        category: "NAME",        description: "Matches cards whose name contains this text.", query: "name:blitzcrank", shorthand: "n:blitzcrank",             examples: ['name:jinx', 'n:"loose cannon"', "name:blitz*"] },
  cost:             { label: "Cost",        category: "COST",        description: "Matches by exact play cost. Use >=, <=, >, < for ranges.", query: "cost:5",                                       examples: ["cost:5", "cost>=3", "cost<=2"] },
  energy:           { label: "Energy",      category: "ENERGY",      description: "Matches by energy value. Supports numeric comparisons.", query: "energy:5",          shorthand: "e:5",            examples: ["e:5", "e>=3", "e<=2"] },
  power:            { label: "Power",       category: "POWER",       description: "Matches by power value. Supports numeric comparisons.", query: "power:1",            shorthand: "p:1",            examples: ["p:1", "p>=3", "p=0"] },
  might:            { label: "Might",       category: "MIGHT",       description: "Matches by might value. Supports numeric comparisons.", query: "might:5",            shorthand: "m:5",            examples: ["m:5", "m>=4", "m:none"] },
  typeline:         { label: "Type line",   category: "TYPE LINE",   description: "Matches any word in the full type line in any order.", query: "t:champion",                                      examples: ["t:champion", 't:"champion unit"', "t:mech"] },
  cardtype:         { label: "Card type",   category: "CARD TYPE",   description: "Matches the card type (Unit, Event, Landmark, etc.).", query: "cardtype:unit",     shorthand: "ct:unit",         examples: ["ct:unit", "ct:event", "ct:landmark"] },
  supertype:        { label: "Supertype",   category: "SUPERTYPE",   description: "Matches the supertype segment (Champion, Landmark, etc.).", query: "supertype:champion", shorthand: "u:champion",  examples: ["u:champion", "u:landmark"] },
  "tag-blitzcrank": { label: "Tag",         category: "TAG",         description: "Matches a specific type tag — champions, tribes, and origins.", query: "tag:blitzcrank",                         examples: ["tag:blitzcrank", "tag:zaun", "tag:dragon"] },
  "tag-zaun":       { label: "Tag",         category: "TAG",         description: "Matches a specific type tag — champions, tribes, and origins.", query: "tag:zaun",                               examples: ["tag:zaun", "tag:mech", "tag:piltover"] },
  "tag-mech":       { label: "Tag",         category: "TAG",         description: "Matches a specific type tag — champions, tribes, and origins.", query: "tag:mech",                               examples: ["tag:mech", "tag:dragon", "tag:zaun"] },
  keyword:          { label: "Keyword",     category: "KEYWORD",     description: "Matches cards that have this rules keyword.", query: "keyword:tank",      shorthand: "k:tank",                  examples: ["k:tank", "k:action", "k:overwhelm"] },
  text:             { label: "Rules text",  category: "RULES TEXT",  description: "Searches within the card's rules text.", query: "text:move",          shorthand: "o:move",                     examples: ['o:move', 'o:"draw a card"', "o:battlefield"] },
  set:              { label: "Set",         category: "SET",         description: "Matches by set code or set name.", query: "set:OGN",              shorthand: "s:origins",                       examples: ["s:OGN", "s:unleashed", "s:UNL"] },
  rarity:           { label: "Rarity",      category: "RARITY",      description: "Filters by rarity: Common, Uncommon, Rare, Epic, Showcase.", query: "rarity:rare",                            examples: ["rarity:rare", "rarity:epic", "rarity:common"] },
  number:           { label: "Collector #", category: "COLLECTOR #", description: "Matches by collector number.", query: "number:67",            shorthand: "c:67",                              examples: ["c:67", "number:001", "c:298"] },
  artist:           { label: "Artist",      category: "ARTIST",      description: "Searches by illustrator name.", query: 'artist:"league splash team"', shorthand: 'a:"league splash"',          examples: ['a:"league splash"', "a:sixmorevodka"] },
};

const CARD_IMAGE = "https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/654dcc4aef0a0b5a0c6e928d7aae397a52c3ab17-744x1039.png?accountingTag=RB";
const CARD_COST   = "{5}{C}";
const CARD_ENERGY = 5;
const CARD_POWER  = 1;
const CARD_MIGHT  = 5;

type VisualCardGuideProps = {
  onSelect: (item: LtsDetailItem) => void;
};

export function VisualCardGuide({ onSelect }: VisualCardGuideProps) {
  const [active, setActive] = useState<ZoneId | null>(null);

  function zoneClass(id: ZoneId, extra: string) {
    const base = [
      extra,
      "relative cursor-pointer rounded transition-[background-color,box-shadow,color] duration-[120ms]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
    ];
    if (active === id) {
      base.push("bg-accent-soft/80 shadow-[0_0_0_2px_rgba(197,50,71,0.6)] text-text-primary");
    } else {
      base.push("hover:bg-accent-soft/40 hover:shadow-[0_0_0_1px_rgba(197,50,71,0.35)] hover:text-text-primary");
    }
    return base.join(" ");
  }

  function zoneHandlers(id: ZoneId) {
    return {
      onClick(e: React.MouseEvent) {
        e.stopPropagation();
        const wasActive = active === id;
        setActive(wasActive ? null : id);
        if (!wasActive) onSelect(ZONES[id]);
      },
    };
  }

  return (
    <div className="flex flex-col gap-3" onClick={() => setActive(null)}>
      <p className="text-sm text-text-secondary">Tap any element to learn how to search for it.</p>

      <div
        className="w-full max-w-[360px] mx-auto rounded-2xl border border-border-strong bg-surface-2 overflow-hidden shadow-lg select-none"
        role="group"
        aria-label="Interactive card diagram — tap any element for its query"
      >
        {/* ── Header: Cost · Energy · Power / Might ── */}
        <div className="grid grid-cols-[1fr_auto] gap-0 border-b border-border-subtle">
          <div className="flex items-stretch divide-x divide-border-subtle">
            <button className={zoneClass("cost",   "flex flex-col items-center justify-center gap-0.5 px-3 py-2.5 text-xs")} {...zoneHandlers("cost")}   aria-pressed={active === "cost"}>
              <span className="font-bold uppercase tracking-wide text-text-tertiary text-[0.6rem]">Cost</span>
              <span className="font-mono font-semibold text-text-primary">{CARD_COST}</span>
            </button>
            <button className={zoneClass("energy", "flex flex-col items-center justify-center gap-0.5 px-3 py-2.5 text-xs")} {...zoneHandlers("energy")} aria-pressed={active === "energy"}>
              <span className="font-bold uppercase tracking-wide text-text-tertiary text-[0.6rem]">Energy</span>
              <span className="font-semibold text-text-primary text-base">{CARD_ENERGY}</span>
            </button>
            <button className={zoneClass("power",  "flex flex-col items-center justify-center gap-0.5 px-3 py-2.5 text-xs")} {...zoneHandlers("power")}  aria-pressed={active === "power"}>
              <span className="font-bold uppercase tracking-wide text-text-tertiary text-[0.6rem]">Power</span>
              <span className="font-semibold text-text-primary text-base">{CARD_POWER}</span>
            </button>
          </div>
          <button className={zoneClass("might", "flex flex-col items-center justify-center gap-0.5 px-3 py-2.5 text-xs border-l border-border-subtle")} {...zoneHandlers("might")} aria-pressed={active === "might"}>
            <span className="font-bold uppercase tracking-wide text-text-tertiary text-[0.6rem]">Might</span>
            <span className="font-semibold text-text-primary text-base">{CARD_MIGHT}</span>
          </button>
        </div>

        {/* ── Card art ── */}
        <div className="relative w-full aspect-[744/500] overflow-hidden bg-surface-1">
          <img
            src={CARD_IMAGE}
            alt="Blitzcrank – Impassive: chrome champion from Zaun"
            className="w-full h-full object-cover object-top"
            loading="lazy"
          />
        </div>

        {/* ── Name ── */}
        <button
          className={zoneClass("name", "block w-full px-4 py-2.5 text-left text-base font-bold text-text-primary border-t border-border-subtle")}
          {...zoneHandlers("name")}
          aria-pressed={active === "name"}
        >
          Blitzcrank – Impassive
        </button>

        {/* ── Type line ── */}
        <div className="border-t border-border-subtle">
          <button
            className={zoneClass("typeline", "block w-full px-4 py-1.5 text-left text-[0.68rem] font-bold uppercase tracking-widest text-text-tertiary")}
            {...zoneHandlers("typeline")}
            aria-pressed={active === "typeline"}
          >
            Type line
          </button>
          <div className="flex flex-wrap items-center gap-1.5 px-4 pb-2.5">
            {(["supertype", "cardtype", "tag-blitzcrank", "tag-zaun", "tag-mech"] as const).map((id, i) => (
              <span key={id} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-text-tertiary/40 text-xs" aria-hidden="true">·</span>}
                <button
                  className={zoneClass(id, "px-2 py-0.5 rounded text-sm font-medium text-text-secondary")}
                  {...zoneHandlers(id)}
                  aria-pressed={active === id}
                >
                  {id === "supertype" ? "Champion" : id === "cardtype" ? "Unit" : id === "tag-blitzcrank" ? "Blitzcrank" : id === "tag-zaun" ? "Zaun" : "Mech"}
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* ── Rules text ── */}
        <div className="border-t border-border-subtle">
          <button
            className={zoneClass("text", "block w-full px-4 py-1.5 text-left text-[0.68rem] font-bold uppercase tracking-widest text-text-tertiary")}
            {...zoneHandlers("text")}
            aria-pressed={active === "text"}
          >
            Rules text
          </button>
          <div className="px-4 pb-2.5 text-sm text-text-secondary leading-relaxed">
            <button
              className={zoneClass("keyword", "inline px-1 font-semibold text-text-primary rounded")}
              {...zoneHandlers("keyword")}
              aria-pressed={active === "keyword"}
            >
              [Tank]
            </button>
            {" "}(I must be assigned combat damage first.) When you play me to a battlefield, you may move an enemy unit to here. When I hold, return me to my owner's hand.
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-border-subtle px-4 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button className={zoneClass("set",    "px-2 py-0.5 font-mono text-xs font-bold")} {...zoneHandlers("set")}    aria-pressed={active === "set"}>OGN</button>
            <button className={zoneClass("number", "px-2 py-0.5 font-mono text-xs")}           {...zoneHandlers("number")} aria-pressed={active === "number"}>067/298</button>
          </div>
          <button className={zoneClass("rarity", "px-2 py-0.5 text-xs font-medium text-text-secondary")} {...zoneHandlers("rarity")} aria-pressed={active === "rarity"}>◆ Rare</button>
          <button className={zoneClass("artist", "flex items-center gap-1 px-2 py-0.5 text-xs text-text-secondary")} {...zoneHandlers("artist")} aria-pressed={active === "artist"}>
            <svg aria-hidden="true" viewBox="0 0 16 16" width="10" height="10" fill="currentColor" className="shrink-0">
              <path d="M11.5 1a3.5 3.5 0 0 1 2.538 5.908L5.414 15.536A2 2 0 0 1 4 16H2a2 2 0 0 1-2-2v-2a2 2 0 0 1 .464-1.278L9.09 1.962A3.5 3.5 0 0 1 11.5 1Zm0 2a1.5 1.5 0 0 0-1.09.474L9.81 4.1l2.09 2.09.626-.59A1.5 1.5 0 0 0 11.5 3ZM8.4 5.5 2.27 12.31A.5.5 0 0 0 2 12.7V14h1.3a.5.5 0 0 0 .39-.192L10.49 7.59 8.4 5.5Z"/>
            </svg>
            League Splash Team
          </button>
        </div>
      </div>
    </div>
  );
}
