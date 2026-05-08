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
  cost:             { label: "Cost",        query: "cost:5",                                                              description: "Matches by exact play cost. Supports numeric comparisons: cost>=3, cost<=5." },
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

// Hotspot positions as [left%, top%, width%, height%] relative to the 744×1039 card image.
// Zone order matters for z-index: later entries render on top (higher z-index).
const HOTSPOT_DEFS: { id: ZoneId; pos: [number, number, number, number] }[] = [
  // Background zones first (lower z-index)
  { id: "typeline",         pos: [2,   59.5, 96,  7.5] },  // full gold type strip
  { id: "text",             pos: [2,   76.5, 96,  13 ] },  // full rules text area

  // Stats — top corners
  { id: "cost",             pos: [1.5, 1,    15,  13 ] },  // top-left gold circle
  { id: "energy",           pos: [83,  1,    15,  13 ] },  // top-right blue circle

  // Stats — bottom corners (power/might appear as small stat gems)
  { id: "power",            pos: [2,   89,   11,  8  ] },  // bottom-left
  { id: "might",            pos: [87,  89,   11,  8  ] },  // bottom-right

  // Name plate
  { id: "name",             pos: [2,   67.5, 74,  8.5] },

  // Typeline tokens (on top of the typeline background)
  { id: "supertype",        pos: [4,   59.5, 15,  7.5] },  // "CHAMPION"
  { id: "cardtype",         pos: [19,  59.5, 13,  7.5] },  // "UNIT"
  { id: "tag-blitzcrank",   pos: [35,  59.5, 21,  7.5] },  // "BLITZCRANK"
  { id: "tag-zaun",         pos: [58,  59.5, 12,  7.5] },  // "ZAUN"
  { id: "tag-mech",         pos: [72,  59.5, 11,  7.5] },  // "MECH"

  // Keyword (on top of the rules text background)
  { id: "keyword",          pos: [2,   76.5, 17,  5  ] },  // [TANK] highlight

  // Footer metadata
  { id: "set",              pos: [2,   91.5, 12,  6.5] },  // "OGN"
  { id: "number",           pos: [15,  91.5, 19,  6.5] },  // "067/216"
  { id: "rarity",           pos: [42,  90.5, 16,  8  ] },  // centre rarity diamond
  { id: "artist",           pos: [57,  91.5, 40,  6.5] },  // "League Splash Team"
];

const CARD_IMAGE = "https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/654dcc4aef0a0b5a0c6e928d7aae397a52c3ab17-744x1039.png?accountingTag=RB";

export function CardSearchGuide() {
  const [active, setActive] = useState<ZoneId | null>(null);
  const [hovered, setHovered] = useState<ZoneId | null>(null);

  const displayZone = active ?? hovered;
  const zoneInfo = displayZone ? ZONES[displayZone] : null;

  function handleZoneClick(id: ZoneId, e: React.MouseEvent) {
    e.stopPropagation();
    setActive(prev => (prev === id ? null : id));
  }

  function zoneClass(id: ZoneId) {
    const parts = ["csg-hotspot"];
    if (active === id) parts.push("csg-active");
    else if (hovered === id) parts.push("csg-hovered");
    return parts.join(" ");
  }

  return (
    <div className="csg-wrap" onClick={() => setActive(null)}>

      {/* ── CARD IMAGE WITH HOTSPOT OVERLAYS ── */}
      <div className="csg-card-frame">
        <img
          src={CARD_IMAGE}
          alt="Blitzcrank — Impassive card"
          className="csg-card-img"
          draggable={false}
        />

        {HOTSPOT_DEFS.map(({ id, pos: [l, t, w, h] }, index) => (
          <button
            key={id}
            className={zoneClass(id)}
            style={{
              left:   `${l}%`,
              top:    `${t}%`,
              width:  `${w}%`,
              height: `${h}%`,
              zIndex: index + 1,
            }}
            onClick={e => handleZoneClick(id, e)}
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered(null)}
            aria-pressed={active === id}
            aria-label={`${ZONES[id].label}: ${ZONES[id].query}`}
            title={ZONES[id].label}
          />
        ))}
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
                  onClick={e => { e.stopPropagation(); setActive(null); }}
                  aria-label="Dismiss"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" strokeWidth="2.5" stroke="currentColor" fill="none">
                    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
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
