import type { MouseEvent } from "react";
import type { LtsDetailItem } from "./GuideDetailCard";
import { guideDetailFor } from "./guideDetails";

type ZoneId =
  | "name" | "cost" | "energy" | "power" | "might"
  | "typeline" | "cardtype" | "supertype" | "tag-mech" | "tag-blitzcrank" | "tag-zaun"
  | "keyword" | "text"
  | "set" | "rarity" | "number" | "artist";

type ZoneInfo = { label: string; detail: LtsDetailItem };

const ZONES: Record<ZoneId, ZoneInfo> = {
  name:             { label: "Name",        detail: guideDetailFor("name") },
  cost:             { label: "Cost",        detail: guideDetailFor("cost") },
  energy:           { label: "Energy",      detail: guideDetailFor("energy") },
  power:            { label: "Power",       detail: guideDetailFor("power") },
  might:            { label: "Might",       detail: guideDetailFor("might") },
  typeline:         { label: "Type line",   detail: guideDetailFor("typeline") },
  cardtype:         { label: "Card type",   detail: guideDetailFor("cardtype") },
  supertype:        { label: "Supertype",   detail: guideDetailFor("supertype") },
  "tag-blitzcrank": { label: "Tag",         detail: guideDetailFor("tag", { query: "tag:blitzcrank", examples: ["tag:blitzcrank", "tag:zaun", "tag:dragon"] }) },
  "tag-zaun":       { label: "Tag",         detail: guideDetailFor("tag", { query: "tag:zaun", examples: ["tag:zaun", "tag:mech", "tag:piltover"] }) },
  "tag-mech":       { label: "Tag",         detail: guideDetailFor("tag", { query: "tag:mech", examples: ["tag:mech", "tag:dragon", "tag:zaun"] }) },
  keyword:          { label: "Keyword",     detail: guideDetailFor("keyword") },
  text:             { label: "Rules text",  detail: guideDetailFor("text") },
  set:              { label: "Set",         detail: guideDetailFor("set") },
  rarity:           { label: "Rarity",      detail: guideDetailFor("rarity") },
  number:           { label: "Collector #", detail: guideDetailFor("number") },
  artist:           { label: "Artist",      detail: guideDetailFor("artist") },
};

const CARD_IMAGE = "https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/654dcc4aef0a0b5a0c6e928d7aae397a52c3ab17-744x1039.png?accountingTag=RB";
const CARD_COST   = "{5}{C}";
const CARD_ENERGY = 5;
const CARD_POWER  = 1;
const CARD_MIGHT  = 5;

const STAT_CELL_CLASSES = "flex min-w-0 flex-col items-center justify-center gap-1 px-2.5 py-3 text-center";
const STAT_LABEL_CLASSES = "text-[0.625rem] font-semibold uppercase leading-none tracking-[0.12em] text-text-tertiary/75";
const STAT_VALUE_CLASSES = "text-[1.25rem] font-black leading-none text-text-primary";

type VisualCardGuideProps = {
  onSelect: (item: LtsDetailItem) => void;
  selectedQueries: ReadonlySet<string>;
};

export function VisualCardGuide({ onSelect, selectedQueries }: VisualCardGuideProps) {
  function isActive(id: ZoneId) {
    return selectedQueries.has(ZONES[id].detail.query ?? ZONES[id].detail.label);
  }

  function zoneClass(id: ZoneId, extra: string) {
    const base = [
      extra,
      "relative cursor-pointer rounded transition-[background,box-shadow,color,transform] duration-[120ms]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
    ];
    if (isActive(id)) {
      base.push("bg-accent-soft-strong shadow-[0_0_0_2px_rgba(197,50,71,0.58),inset_0_1px_0_rgba(255,255,255,0.08)] text-text-primary");
    } else {
      base.push("hover:-translate-y-px hover:bg-accent-soft/45 hover:shadow-[0_0_0_1px_rgba(197,50,71,0.34),0_6px_14px_rgba(0,0,0,0.22)] hover:text-text-primary");
    }
    return base.join(" ");
  }

  function zoneHandlers(id: ZoneId) {
    return {
      onClick(e: MouseEvent) {
        e.stopPropagation();
        onSelect(ZONES[id].detail);
      },
    };
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-xl border border-border-subtle bg-surface-inset/75 px-4 py-3 text-center text-sm font-semibold leading-relaxed text-text-secondary shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] lg:hidden">
        Tap any element to learn how to search for it.
      </p>

      <div
        className="w-full select-none overflow-hidden rounded-2xl border border-border-default bg-[linear-gradient(180deg,rgba(23,28,40,0.96),rgba(8,11,18,0.98))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_46px_rgba(0,0,0,0.34)]"
        role="group"
        aria-label="Interactive card diagram"
      >
        {/* ── Header: Cost · Energy · Power / Might ── */}
        <div className="grid grid-cols-4 divide-x divide-border-subtle border-b border-border-subtle bg-surface-inset/65">
          <button className={zoneClass("cost", STAT_CELL_CLASSES)} {...zoneHandlers("cost")} aria-pressed={isActive("cost")}>
            <span className={STAT_LABEL_CLASSES}>Cost</span>
            <span className={`${STAT_VALUE_CLASSES} font-mono`}>{CARD_COST}</span>
          </button>
          <button className={zoneClass("energy", STAT_CELL_CLASSES)} {...zoneHandlers("energy")} aria-pressed={isActive("energy")}>
            <span className={STAT_LABEL_CLASSES}>Energy</span>
            <span className={STAT_VALUE_CLASSES}>{CARD_ENERGY}</span>
          </button>
          <button className={zoneClass("power", STAT_CELL_CLASSES)} {...zoneHandlers("power")} aria-pressed={isActive("power")}>
            <span className={STAT_LABEL_CLASSES}>Power</span>
            <span className={STAT_VALUE_CLASSES}>{CARD_POWER}</span>
          </button>
          <button className={zoneClass("might", STAT_CELL_CLASSES)} {...zoneHandlers("might")} aria-pressed={isActive("might")}>
            <span className={STAT_LABEL_CLASSES}>Might</span>
            <span className={STAT_VALUE_CLASSES}>{CARD_MIGHT}</span>
          </button>
        </div>

        {/* ── Card art ── */}
        <div className="relative aspect-[744/500] w-full overflow-hidden bg-surface-inset">
          <img
            src={CARD_IMAGE}
            alt="Blitzcrank - Impassive, chrome champion from Zaun"
            className="h-full w-full object-cover object-[center_38%]"
            loading="lazy"
          />
        </div>

        {/* ── Name ── */}
        <button
          className={zoneClass("name", "block w-full px-4 py-2.5 text-left text-base font-bold text-text-primary border-t border-border-subtle")}
          {...zoneHandlers("name")}
          aria-pressed={isActive("name")}
        >
          Blitzcrank - Impassive
        </button>

        {/* ── Type line ── */}
        <div className="border-t border-border-subtle">
          <button
            className={zoneClass("typeline", "block w-full px-4 py-1.5 text-left text-[0.68rem] font-bold uppercase tracking-widest text-text-tertiary")}
            {...zoneHandlers("typeline")}
            aria-pressed={isActive("typeline")}
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
                  aria-pressed={isActive(id)}
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
            aria-pressed={isActive("text")}
          >
            Rules text
          </button>
          <div className="px-4 pb-2.5 text-sm text-text-secondary leading-relaxed">
            <button
              className={zoneClass("keyword", "inline px-1 font-semibold text-text-primary rounded")}
              {...zoneHandlers("keyword")}
              aria-pressed={isActive("keyword")}
            >
              [Tank]
            </button>
            {" "}(I must be assigned combat damage first.) When you play me to a battlefield, you may move an enemy unit to here. When I hold, return me to my owner's hand.
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-border-subtle px-4 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button className={zoneClass("set",    "px-2 py-0.5 font-mono text-xs font-bold")} {...zoneHandlers("set")}    aria-pressed={isActive("set")}>OGN</button>
            <button className={zoneClass("number", "px-2 py-0.5 font-mono text-xs")}           {...zoneHandlers("number")} aria-pressed={isActive("number")}>067/298</button>
          </div>
          <button className={zoneClass("rarity", "px-2 py-0.5 text-xs font-medium text-text-secondary")} {...zoneHandlers("rarity")} aria-pressed={isActive("rarity")}>◆ Rare</button>
          <button className={zoneClass("artist", "flex items-center gap-1 px-2 py-0.5 text-xs text-text-secondary")} {...zoneHandlers("artist")} aria-pressed={isActive("artist")}>
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
