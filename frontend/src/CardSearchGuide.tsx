import { useState } from "react";

type ZoneId =
  | "name" | "cost" | "energy" | "power" | "might"
  | "typeline" | "cardtype" | "supertype" | "tag-mech" | "tag-blitzcrank" | "tag-zaun"
  | "keyword" | "text"
  | "set" | "rarity" | "number" | "artist";

type ZoneInfo = {
  label: string;
  query: string;
  shorthand?: string;
  description: string;
};

const ZONES: Record<ZoneId, ZoneInfo> = {
  name:             { label: "Name",        query: 'name:"blitzcrank"',            shorthand: 'n:blitzcrank',             description: "Matches cards whose name contains this text." },
  cost:             { label: "Cost",        query: "cost:5",                                                              description: "Matches by exact play cost. Use >=, <=, >, < for ranges (e.g. cost>=3)." },
  energy:           { label: "Energy",      query: "energy:5",                     shorthand: "e:5",                      description: "Matches by energy value. Supports numeric comparisons." },
  power:            { label: "Power",       query: "power:1",                      shorthand: "p:1",                      description: "Matches by power value. Supports numeric comparisons." },
  might:            { label: "Might",       query: "might:5",                      shorthand: "m:5",                      description: "Matches by might value. Supports numeric comparisons." },
  typeline:         { label: "Type line",   query: "t:champion",                                                          description: "Matches any word in the full type line in any order." },
  cardtype:         { label: "Card type",   query: "cardtype:unit",                shorthand: "ct:unit",                  description: "Matches the card type segment (Unit, Event, Landmark, etc.)." },
  supertype:        { label: "Supertype",   query: "supertype:champion",           shorthand: "u:champion",               description: "Matches the supertype segment (Champion, Landmark, etc.)." },
  "tag-blitzcrank": { label: "Tag",         query: "tag:blitzcrank",                                                      description: "Matches a specific type tag. Tags include champions, tribes, and origins." },
  "tag-zaun":       { label: "Tag",         query: "tag:zaun",                                                            description: "Matches a specific type tag. Tags include champions, tribes, and origins." },
  "tag-mech":       { label: "Tag",         query: "tag:mech",                                                            description: "Matches a specific type tag. Tags include champions, tribes, and origins." },
  keyword:          { label: "Keyword",     query: "keyword:tank",                 shorthand: "k:tank",                   description: "Matches cards that have this rules keyword." },
  text:             { label: "Rules text",  query: "text:move",                    shorthand: "o:move",                   description: "Searches within the card's rules text." },
  set:              { label: "Set",         query: "set:OGN",                      shorthand: "s:origins",                description: "Matches by set code or set name." },
  rarity:           { label: "Rarity",      query: "rarity:rare",                                                         description: "Filters by rarity: Common, Uncommon, Rare, Epic, Showcase." },
  number:           { label: "Collector #", query: "number:67",                    shorthand: "c:67",                     description: "Matches by collector number." },
  artist:           { label: "Artist",      query: 'artist:"league splash team"',  shorthand: 'a:"league splash"',        description: "Searches by illustrator name." },
};

// ── Card data constants (sourced from cards.json) ────────────────────────────
// Blitzcrank – Impassive: cost="{5}{C}", energy=5, power=1, might=5, OGN #067/298

const CARD_IMAGE   = "https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/654dcc4aef0a0b5a0c6e928d7aae397a52c3ab17-744x1039.png?accountingTag=RB";
const CARD_COST    = "{5}{C}";  // canonical cost field from cards.json
const CARD_ENERGY  = 5;
const CARD_POWER   = 1;
const CARD_MIGHT   = 5;

// ── Component ─────────────────────────────────────────────────────────────────

export function CardSearchGuide() {
  const [active, setActive] = useState<ZoneId | null>(null);
  const [hovered, setHovered] = useState<ZoneId | null>(null);

  const displayZone = active ?? hovered;
  const zoneInfo = displayZone ? ZONES[displayZone] : null;

  function zc(id: ZoneId, extra?: string) {
    const parts = ["csg-zone"];
    if (extra) parts.push(extra);
    if (active === id) parts.push("csg-active");
    else if (hovered === id) parts.push("csg-hovered");
    return parts.join(" ");
  }

  function zh(id: ZoneId) {
    return {
      onClick(e: React.MouseEvent) {
        e.stopPropagation();
        setActive(prev => (prev === id ? null : id));
      },
      onMouseEnter() { setHovered(id); },
      onMouseLeave() { setHovered(null); },
    };
  }

  return (
    <div className="csg-wrap" onClick={() => setActive(null)}>

      {/* ── CARD DIAGRAM ── */}
      <div className="csg-card" role="group" aria-label="Interactive card diagram — click any element for its query">

        {/* Header: Cost · Energy · Power on the left, Might on the right */}
        <div className="csg-card-header">
          <div className="csg-stat-row">
            <button className={zc("cost", "csg-cost")} {...zh("cost")} aria-pressed={active === "cost"}>
              <span className="csg-stat-key">Cost</span>
              <span className="csg-stat-num">{CARD_COST}</span>
            </button>
            <button className={zc("energy", "csg-energy")} {...zh("energy")} aria-pressed={active === "energy"}>
              <span className="csg-stat-key">Energy</span>
              <span className="csg-stat-num">{CARD_ENERGY}</span>
            </button>
            <button className={zc("power", "csg-power")} {...zh("power")} aria-pressed={active === "power"}>
              <span className="csg-stat-key">Power</span>
              <span className="csg-stat-num">{CARD_POWER}</span>
            </button>
          </div>
          <button className={zc("might", "csg-might")} {...zh("might")} aria-pressed={active === "might"}>
            <span className="csg-stat-key">Might</span>
            <span className="csg-stat-num">{CARD_MIGHT}</span>
          </button>
        </div>

        {/* Card art */}
        <div className="csg-art">
          <img
            src={CARD_IMAGE}
            alt="Blitzcrank — Impassive: a chrome mechanical champion from Zaun"
            loading="lazy"
          />
        </div>

        {/* Name */}
        <div className="csg-name-row">
          <button className={zc("name", "csg-name")} {...zh("name")} aria-pressed={active === "name"}>
            Blitzcrank – Impassive
          </button>
        </div>

        {/* Type line section */}
        <div className="csg-section">
          <button className={zc("typeline", "csg-section-bar")} {...zh("typeline")} aria-pressed={active === "typeline"}>
            Type line
          </button>
          <div className="csg-typeline-tokens">
            <button className={zc("supertype", "csg-token")} {...zh("supertype")} aria-pressed={active === "supertype"}>Champion</button>
            <span className="csg-sep" aria-hidden="true">·</span>
            <button className={zc("cardtype", "csg-token")} {...zh("cardtype")} aria-pressed={active === "cardtype"}>Unit</button>
            <span className="csg-sep" aria-hidden="true">·</span>
            <button className={zc("tag-blitzcrank", "csg-token")} {...zh("tag-blitzcrank")} aria-pressed={active === "tag-blitzcrank"}>Blitzcrank</button>
            <span className="csg-sep" aria-hidden="true">·</span>
            <button className={zc("tag-zaun", "csg-token")} {...zh("tag-zaun")} aria-pressed={active === "tag-zaun"}>Zaun</button>
            <span className="csg-sep" aria-hidden="true">·</span>
            <button className={zc("tag-mech", "csg-token")} {...zh("tag-mech")} aria-pressed={active === "tag-mech"}>Mech</button>
          </div>
        </div>

        {/* Rules text section */}
        <div className="csg-section">
          <button className={zc("text", "csg-section-bar")} {...zh("text")} aria-pressed={active === "text"}>
            Rules text
          </button>
          <div className="csg-text-body">
            <button className={zc("keyword", "csg-keyword")} {...zh("keyword")} aria-pressed={active === "keyword"}>[Tank]</button>
            {" "}(I must be assigned combat damage first.) When you play me to a battlefield, you may move an enemy unit to here. When I hold, return me to my owner's hand.
          </div>
        </div>

        {/* Footer: [Set · #/total] [◆ Rarity] [Artist →] */}
        <div className="csg-footer">
          <div className="csg-footer-row">
            <div className="csg-footer-left">
              <button className={zc("set", "csg-set")} {...zh("set")} aria-pressed={active === "set"}>OGN</button>
              <button className={zc("number", "csg-number")} {...zh("number")} aria-pressed={active === "number"}>067/298</button>
            </div>
            <button className={zc("rarity", "csg-rarity")} {...zh("rarity")} aria-pressed={active === "rarity"}>◆ Rare</button>
            <button className={zc("artist", "csg-artist")} {...zh("artist")} aria-pressed={active === "artist"}>
              <svg aria-hidden="true" viewBox="0 0 16 16" width="11" height="11" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M11.5 1a3.5 3.5 0 0 1 2.538 5.908L5.414 15.536A2 2 0 0 1 4 16H2a2 2 0 0 1-2-2v-2a2 2 0 0 1 .464-1.278L9.09 1.962A3.5 3.5 0 0 1 11.5 1Zm0 2a1.5 1.5 0 0 0-1.09.474L9.81 4.1l2.09 2.09.626-.59A1.5 1.5 0 0 0 11.5 3ZM8.4 5.5 2.27 12.31A.5.5 0 0 0 2 12.7V14h1.3a.5.5 0 0 0 .39-.192L10.49 7.59 8.4 5.5Z"/>
              </svg>
              League Splash Team
            </button>
          </div>
        </div>
      </div>

      {/* ── QUERY PANEL ── */}
      <div className="csg-panel" aria-live="polite" aria-atomic="true">
        {zoneInfo ? (
          <>
            <div className="csg-panel-header">
              <span className="csg-panel-label">{zoneInfo.label}</span>
              {active && (
                <button
                  className="csg-panel-close"
                  onClick={(e) => { e.stopPropagation(); setActive(null); }}
                  aria-label="Dismiss"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" strokeWidth="2.5" stroke="currentColor" fill="none">
                    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
            <div className="csg-panel-query">
              <code>{zoneInfo.query}</code>
            </div>
            {zoneInfo.shorthand && (
              <div className="csg-panel-short">
                or <code>{zoneInfo.shorthand}</code>
              </div>
            )}
            <p className="csg-panel-desc">{zoneInfo.description}</p>
          </>
        ) : (
          <p className="csg-panel-idle">Hover or click any part of the card to see its query.</p>
        )}
      </div>

    </div>
  );
}
