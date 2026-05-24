import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CardSearchResultsPane, CardsToolsNav } from "../features";
import { SyntaxQueryChip } from "../ui-elements";
import { useDebounce } from "../lib";
import { renderTokenizedText, raritySymbolSrc } from "../lib";

// ── Data constants ────────────────────────────────────────────────────────────

const DOMAIN_ORDER = ["Fury", "Calm", "Mind", "Body", "Chaos", "Order"] as const;
const CARD_TYPES = ["Unit", "Spell", "Gear", "Rune", "Battlefield", "Legend"] as const;
const RARITIES = ["Common", "Uncommon", "Rare", "Epic", "Showcase", "Promo"] as const;
const QB_SETS = [
  { id: "OGN", label: "Origins" },
  { id: "SFD", label: "Spiritforged" },
  { id: "UNL", label: "Unleashed" },
] as const;
const FINISHES = [
  { value: "foil",          label: "Foil"          },
  { value: "normal",        label: "Normal"        },
  { value: "signed",        label: "Signed"        },
  { value: "altart",        label: "Alt Art"       },
  { value: "overnumbered",  label: "Overnumbered"  },
] as const;
const OPERATORS = [">=", ">", "=", "<", "<="] as const;
const SUPERTYPES = ["Champion", "Signature"] as const;

// Rune token for each domain — used to render the domain pip via renderTokenizedText.
const DOMAIN_RUNE: Record<string, string> = {
  Fury:  "{F}",
  Calm:  "{C}",
  Mind:  "{M}",
  Body:  "{B}",
  Chaos: "{H}",
  Order: "{O}",
};

type RarityPipGeometry = {
  width: number;
  height: number;
  contentWidth: number;
  contentHeight: number;
  minX: number;
  minY: number;
};

const RARITY_PIP_GEOMETRY: Record<(typeof RARITIES)[number], RarityPipGeometry> = {
  Common:   { width: 40, height: 40, contentWidth: 22, contentHeight: 22, minX: 9,  minY: 9  },
  Uncommon: { width: 36, height: 40, contentWidth: 22, contentHeight: 18, minX: 7,  minY: 9  },
  Rare:     { width: 36, height: 36, contentWidth: 22, contentHeight: 21, minX: 7,  minY: 3  },
  Epic:     { width: 52, height: 52, contentWidth: 22, contentHeight: 20, minX: 15, minY: 15 },
  Showcase: { width: 22, height: 24, contentWidth: 22, contentHeight: 24, minX: 0,  minY: 0  },
  Promo:    { width: 86, height: 72, contentWidth: 82, contentHeight: 55, minX: 2,  minY: 3  },
};

function rarityPipImageStyle(rarity: (typeof RARITIES)[number]): CSSProperties {
  const geometry = RARITY_PIP_GEOMETRY[rarity];
  const wrapperWidth = rarity === "Promo" ? 20 : 16;
  const wrapperHeight = 16;
  const scale = 12 / geometry.contentHeight;
  const contentWidth = geometry.contentWidth * scale;
  const contentHeight = geometry.contentHeight * scale;

  return {
    width: `${geometry.width * scale}px`,
    height: `${geometry.height * scale}px`,
    left: `${(wrapperWidth - contentWidth) / 2 - geometry.minX * scale}px`,
    top: `${(wrapperHeight - contentHeight) / 2 - geometry.minY * scale}px`,
  };
}

// ── Query assembly helpers ────────────────────────────────────────────────────

function toggle(set: Set<string>, value: string): Set<string> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function quoteValue(val: string): string {
  return /[\s"():*]/.test(val) ? `"${val}"` : val;
}

function orGroup(items: string[]): string {
  return items.length === 1 ? items[0] : `(${items.join(" or ")})`;
}

// ── Private sub-components ───────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

const QB_TOKENS = {
  layout: "mx-auto grid w-full max-w-[1720px] gap-7 px-4 pb-16 pt-3 lg:grid-cols-[minmax(360px,820px)_minmax(0,1fr)]",
  builderShell: "flex min-w-0 flex-col gap-5 rounded-2xl border border-border-subtle bg-[linear-gradient(180deg,rgba(16,20,30,0.72),rgba(7,9,14,0.46))] p-3 shadow-[0_18px_48px_rgba(0,0,0,0.24)] sm:p-4",
  queryCard: "rounded-xl border border-border-default bg-[linear-gradient(180deg,rgba(25,30,42,0.94),rgba(12,15,23,0.96))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_28px_rgba(0,0,0,0.24)]",
  section: "overflow-hidden rounded-xl border border-[rgba(197,50,71,0.5)] bg-[linear-gradient(180deg,rgba(197,50,71,0.055)_0%,rgba(15,19,29,0.94)_28%,rgba(8,10,16,0.96)_100%)] shadow-[0_0_16px_rgba(197,50,71,0.16),0_8px_20px_rgba(0,0,0,0.18)] transition-[background,border-color,box-shadow] duration-150",
  sectionHeader: "flex items-center gap-2.5 border-b border-border-subtle bg-[linear-gradient(180deg,rgba(25,30,42,0.9),rgba(15,19,29,0.94))] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(197,50,71,0.22)]",
  sectionBody: "flex flex-col gap-3.5 bg-[linear-gradient(180deg,rgba(10,13,20,0.72),rgba(8,10,16,0.88))] px-4 py-4",
  sectionTitle: "text-[0.77rem] font-black uppercase tracking-[0.14em] text-accent-warm leading-none",
  sectionHint: "rounded-md border border-border-default bg-[rgba(8,11,18,0.82)] px-1.5 py-0.5 font-mono text-[0.66rem] text-accent-warm leading-none shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  subsection: "rounded-lg border border-border-subtle bg-[linear-gradient(180deg,rgba(20,25,36,0.72),rgba(10,13,20,0.78))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  subsectionRaised: "border-border-default bg-[linear-gradient(180deg,rgba(25,31,43,0.82),rgba(12,15,23,0.88))]",
  subsectionLabel: "mb-2.5 text-[0.7rem] font-black uppercase tracking-[0.14em] text-text-secondary",
  helperText: "text-xs leading-relaxed text-text-tertiary/78",
  chipBase: "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-[6px] text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.075),0_4px_10px_rgba(0,0,0,0.2)] transition-[background,border-color,box-shadow,transform,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
  chipOff: "border-[rgba(255,255,255,0.18)] bg-[linear-gradient(180deg,rgba(38,45,61,0.96),rgba(18,22,32,0.98))] text-text-secondary hover:-translate-y-px hover:border-border-strong hover:bg-[linear-gradient(180deg,rgba(47,55,72,0.98),rgba(23,28,40,0.98))] hover:text-text-primary hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_8px_20px_rgba(0,0,0,0.28)]",
  chipOn: "border-accent bg-[linear-gradient(180deg,rgba(112,38,51,0.88),rgba(53,17,27,0.96))] text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_0_1px_rgba(197,50,71,0.32),0_0_18px_rgba(197,50,71,0.15),0_10px_24px_rgba(0,0,0,0.3)] hover:-translate-y-px hover:border-accent-hover hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_0_0_1px_rgba(215,66,85,0.38),0_0_20px_rgba(197,50,71,0.2),0_12px_28px_rgba(0,0,0,0.34)]",
  fieldInput: "h-9 w-full rounded-lg border border-[rgba(255,255,255,0.2)] bg-[linear-gradient(180deg,rgba(18,22,32,0.96),rgba(10,13,20,0.98))] px-3 text-sm text-text-primary shadow-[inset_0_1px_2px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.045)] placeholder:text-text-tertiary/55 transition-[background,border-color,box-shadow] duration-150 hover:border-border-strong focus:outline-none focus:border-accent focus:ring-2 focus:ring-[var(--color-focus-ring)]",
  compactField: "h-8 rounded-md border border-[rgba(255,255,255,0.2)] bg-[linear-gradient(180deg,rgba(18,22,32,0.96),rgba(10,13,20,0.98))] font-mono text-sm text-text-primary shadow-[inset_0_1px_2px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.045)] transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-accent focus:ring-2 focus:ring-[var(--color-focus-ring)]",
  statRow: "flex items-center gap-2 rounded-lg border border-border-default bg-[linear-gradient(180deg,rgba(27,33,45,0.88),rgba(13,16,24,0.94))] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.055),0_5px_14px_rgba(0,0,0,0.18)] transition-[background,border-color,box-shadow] duration-150 hover:border-border-strong hover:bg-[linear-gradient(180deg,rgba(35,42,56,0.94),rgba(16,20,30,0.98))] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.075),0_9px_20px_rgba(0,0,0,0.24)]",
  actionButton: "inline-flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,var(--color-accent-hover),var(--color-accent))] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(197,50,71,0.22),inset_0_1px_0_rgba(255,255,255,0.12)] transition-[box-shadow,transform,filter] duration-150 hover:-translate-y-px hover:shadow-[0_14px_30px_rgba(197,50,71,0.28),inset_0_1px_0_rgba(255,255,255,0.14)] hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
  previewFrame: "overflow-hidden rounded-2xl border border-border-default bg-[linear-gradient(180deg,rgba(18,22,32,0.96),rgba(7,9,14,0.98))] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_22px_52px_rgba(0,0,0,0.34)]",
} as const;

type SectionProps = {
  title: string;
  hint?: string;
  children: ReactNode;
};

function Section({ title, hint, children }: SectionProps) {
  return (
    <section className={QB_TOKENS.section}>
      <div className={QB_TOKENS.sectionHeader}>
        <h2 className={QB_TOKENS.sectionTitle}>{title}</h2>
        {hint && <code className={QB_TOKENS.sectionHint}>{hint}</code>}
      </div>
      <div className={QB_TOKENS.sectionBody}>
        {children}
      </div>
    </section>
  );
}

type SubsectionProps = {
  label?: string;
  raised?: boolean;
  children: ReactNode;
};

function Subsection({ label, raised = false, children }: SubsectionProps) {
  return (
    <div className={[QB_TOKENS.subsection, raised ? QB_TOKENS.subsectionRaised : ""].join(" ")}>
      {label && <p className={QB_TOKENS.subsectionLabel}>{label}</p>}
      {children}
    </div>
  );
}

type ChipProps = {
  label: ReactNode;
  isOn: boolean;
  onToggle: () => void;
};

function Chip({ label, isOn, onToggle }: ChipProps) {
  return (
    <button
      type="button"
      className={[
        QB_TOKENS.chipBase,
        isOn ? QB_TOKENS.chipOn : QB_TOKENS.chipOff,
      ].join(" ")}
      onClick={onToggle}
      aria-pressed={isOn}
    >
      {label}
    </button>
  );
}

type StatRowProps = {
  label: string;
  hint: string;
  op: string;
  onOpChange: (v: string) => void;
  val: string;
  onValChange: (v: string) => void;
};

function StatRow({ label, hint, op, onOpChange, val, onValChange }: StatRowProps) {
  return (
    <div className={QB_TOKENS.statRow}>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-text-primary">{label}</span>
        <code className="ml-2 text-[0.64rem] font-mono text-text-tertiary">{hint}</code>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <select
          value={op}
          onChange={(e) => onOpChange(e.target.value)}
          className={`${QB_TOKENS.compactField} px-1.5 text-text-secondary`}
          aria-label={`${label} operator`}
        >
          {OPERATORS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <input
          type="text"
          className={`${QB_TOKENS.compactField} w-20 px-2 placeholder:text-text-tertiary/50`}
          value={val}
          onChange={(e) => onValChange(e.target.value)}
          placeholder="—"
          aria-label={`${label} value`}
        />
      </div>
    </div>
  );
}

type TextFieldProps = {
  label: string;
  hint: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
};

function TextField({ label, hint, placeholder, value, onChange }: TextFieldProps) {
  const id = `qb-field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="grid grid-cols-[100px_1fr_auto] max-[700px]:grid-cols-1 items-center gap-x-2.5 gap-y-1">
      <label htmlFor={id} className="text-sm font-medium text-text-secondary truncate">
        {label}
      </label>
      <input
        id={id}
        type="text"
        className={QB_TOKENS.fieldInput}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
      />
      <code className="text-[0.66rem] font-mono text-text-tertiary leading-none whitespace-nowrap max-[700px]:hidden">
        {hint}
      </code>
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export default function QueryBuilderView() {
  const navigate = useNavigate();

  const [selectedTypes,      setSelectedTypes]      = useState<Set<string>>(new Set());
  const [selectedSupertypes, setSelectedSupertypes] = useState<Set<string>>(new Set());
  const [selectedDomains,    setSelectedDomains]    = useState<Set<string>>(new Set());
  const [selectedRarities,   setSelectedRarities]   = useState<Set<string>>(new Set());
  const [selectedSets,       setSelectedSets]       = useState<Set<string>>(new Set());
  const [selectedFinishes,   setSelectedFinishes]   = useState<Set<string>>(new Set());

  const [typelineText, setTypelineText] = useState("");
  const [tagText,      setTagText]      = useState("");
  const [nameText,     setNameText]     = useState("");
  const [rulesText,    setRulesText]    = useState("");
  const [keywordText,  setKeywordText]  = useState("");
  const [artistText,   setArtistText]   = useState("");

  const [energyOp, setEnergyOp] = useState(">=");
  const [energyVal, setEnergyVal] = useState("");
  const [mightOp,  setMightOp]  = useState(">=");
  const [mightVal,  setMightVal]  = useState("");
  const [powerOp,  setPowerOp]  = useState(">=");
  const [powerVal,  setPowerVal]  = useState("");
  const [costOp,   setCostOp]   = useState(">=");
  const [costVal,   setCostVal]   = useState("");

  const builtQuery = useMemo(() => {
    const parts: string[] = [];
    if (selectedTypes.size > 0)
      parts.push(orGroup([...selectedTypes].map((t) => `ct:${t}`)));
    if (selectedSupertypes.size > 0)
      parts.push(orGroup([...selectedSupertypes].map((u) => `u:${u}`)));
    if (typelineText.trim())
      parts.push(`t:${quoteValue(typelineText.trim())}`);
    if (tagText.trim())
      parts.push(`tag:${quoteValue(tagText.trim())}`);
    if (selectedDomains.size > 0)
      parts.push(orGroup([...selectedDomains].map((d) => `d:${d}`)));
    if (selectedRarities.size > 0)
      parts.push(orGroup([...selectedRarities].map((r) => `rarity:${r}`)));
    if (selectedSets.size > 0)
      parts.push(orGroup([...selectedSets].map((s) => `s:${s}`)));
    if (nameText.trim())
      parts.push(`n:${quoteValue(nameText.trim())}`);
    if (rulesText.trim())
      parts.push(`r:${quoteValue(rulesText.trim())}`);
    if (keywordText.trim())
      parts.push(`kw:${quoteValue(keywordText.trim())}`);
    if (artistText.trim())
      parts.push(`a:${quoteValue(artistText.trim())}`);
    if (energyVal.trim()) parts.push(`e${energyOp}${energyVal.trim()}`);
    if (mightVal.trim())  parts.push(`m${mightOp}${mightVal.trim()}`);
    if (powerVal.trim())  parts.push(`p${powerOp}${powerVal.trim()}`);
    if (costVal.trim())   parts.push(`c${costOp}${costVal.trim()}`);
    for (const finish of selectedFinishes) parts.push(`is:${finish}`);
    return parts.join(" ");
  }, [
    selectedTypes, selectedSupertypes, selectedDomains, selectedRarities, selectedSets, selectedFinishes,
    typelineText, tagText, nameText, rulesText, keywordText, artistText,
    energyOp, energyVal, mightOp, mightVal, powerOp, powerVal, costOp, costVal,
  ]);

  function handleSearch() {
    void navigate({ to: "/cards", search: { q: builtQuery.trim() || undefined } });
  }

  const debouncedBuiltQuery = useDebounce(builtQuery, 180);

  return (
    <div className={QB_TOKENS.layout}>

      {/* ── Builder panel ── */}
      <div className={QB_TOKENS.builderShell} aria-labelledby="qb-heading">

        {/* Live query display */}
        <div className={QB_TOKENS.queryCard}>
          <h1 id="qb-heading" className="mb-2.5 text-[0.74rem] font-black uppercase tracking-[0.16em] text-text-primary">
            Your Query
          </h1>
          <output
            className="block min-h-[1.5rem]"
            aria-live="polite"
            aria-label="Your query"
          >
            {builtQuery
              ? <SyntaxQueryChip query={builtQuery} />
              : <span className="text-sm italic text-text-secondary">Make a selection below to build your query</span>
            }
          </output>
        </div>

        {/* ── Card Type & Tags ── */}
        <Section title="Card Type & Tags" hint="ct:Unit · u:Champion · tag:Dragon">
          <Subsection raised>
            <TextField label="Typeline" hint="t:Champion" placeholder="e.g. Champion Unit, Dragon" value={typelineText} onChange={setTypelineText} />
          </Subsection>
          <Subsection label="Card Type" raised>
            <div className="flex flex-wrap gap-2">
              {CARD_TYPES.map((type) => (
                <Chip key={type} isOn={selectedTypes.has(type)} onToggle={() => setSelectedTypes(toggle(selectedTypes, type))} label={type} />
              ))}
            </div>
          </Subsection>
          <Subsection label="Supertype" raised>
            <div className="flex flex-wrap gap-2">
              {SUPERTYPES.map((st) => (
                <Chip key={st} isOn={selectedSupertypes.has(st)} onToggle={() => setSelectedSupertypes(toggle(selectedSupertypes, st))} label={st} />
              ))}
            </div>
          </Subsection>
          <Subsection raised>
            <TextField label="Tag" hint="tag:Dragon" placeholder="e.g. Dragon, Follower, Celestial" value={tagText} onChange={setTagText} />
          </Subsection>
          <p className={QB_TOKENS.helperText}>
            Tags are subtypes like Dragon or Follower. Supertypes are Champion, Signature, etc.
          </p>
        </Section>

        {/* ── Domain ── */}
        <Section title="Domain" hint="d:Fury">
          <Subsection raised>
            <div className="flex flex-wrap gap-2">
            {DOMAIN_ORDER.map((domain) => {
              const rune = DOMAIN_RUNE[domain] ?? "";
              return (
                <Chip
                  key={domain}
                  isOn={selectedDomains.has(domain)}
                  onToggle={() => setSelectedDomains(toggle(selectedDomains, domain))}
                  label={
                    <>
                      <span className="w-4 h-4 inline-flex items-center justify-center shrink-0" aria-hidden="true">
                        {renderTokenizedText(rune, { size: "chip" })}
                      </span>
                      {domain}
                    </>
                  }
                />
              );
            })}
            </div>
          </Subsection>
        </Section>

        {/* ── Rarity ── */}
        <Section title="Rarity" hint="rarity:Rare">
          <Subsection>
            <div className="flex flex-wrap gap-2">
            {RARITIES.map((rarity) => {
              const pipSrc = raritySymbolSrc(rarity);
              return (
                <Chip
                  key={rarity}
                  isOn={selectedRarities.has(rarity)}
                  onToggle={() => setSelectedRarities(toggle(selectedRarities, rarity))}
                  label={
                    <>
                      {pipSrc && (
                        <span
                          className={[
                            "relative h-4 shrink-0 overflow-visible",
                            rarity === "Promo" ? "w-5" : "w-4",
                          ].join(" ")}
                          aria-hidden="true"
                        >
                          <img
                            src={pipSrc}
                            alt=""
                            className="absolute max-w-none object-contain"
                            style={rarityPipImageStyle(rarity)}
                          />
                        </span>
                      )}
                      {rarity}
                    </>
                  }
                />
              );
            })}
            </div>
          </Subsection>
        </Section>

        {/* ── Set ── */}
        <Section title="Set" hint="s:OGN">
          <Subsection>
            <div className="flex flex-wrap gap-2">
            {QB_SETS.map(({ id, label }) => (
              <Chip
                key={id}
                isOn={selectedSets.has(id)}
                onToggle={() => setSelectedSets(toggle(selectedSets, id))}
                label={
                  <>
                    <span className="rounded-md border border-border-subtle bg-surface-inset px-1.5 py-px font-mono text-[0.68rem] font-bold leading-none text-text-tertiary">
                      {id}
                    </span>
                    {label}
                  </>
                }
              />
            ))}
            </div>
          </Subsection>
        </Section>

        {/* ── Stats ── */}
        <Section title="Stats">
          <Subsection raised>
            <div className="grid grid-cols-2 max-[700px]:grid-cols-1 gap-2.5">
              <StatRow label="Energy" hint="e>=3"       op={energyOp} onOpChange={setEnergyOp} val={energyVal} onValChange={setEnergyVal} />
              <StatRow label="Might"  hint="m>=2"       op={mightOp}  onOpChange={setMightOp}  val={mightVal}  onValChange={setMightVal}  />
              <StatRow label="Power"  hint="p>=1"       op={powerOp}  onOpChange={setPowerOp}  val={powerVal}  onValChange={setPowerVal}  />
              <StatRow label="Cost"   hint="c>=3"       op={costOp}   onOpChange={setCostOp}   val={costVal}   onValChange={setCostVal}   />
            </div>
          </Subsection>
        </Section>

        {/* ── Text Filters ── */}
        <Section title="Text Filters">
          <Subsection>
            <div className="flex flex-col gap-2.5">
              <TextField label="Name"       hint="n:jinx"              placeholder="e.g. Jinx"                    value={nameText}    onChange={setNameText}    />
              <TextField label="Rules Text" hint='r: or o:"draw a card"' placeholder="e.g. draw a card"            value={rulesText}   onChange={setRulesText}   />
              <TextField label="Keyword"    hint="kw:Action"           placeholder="e.g. Action, Resolve"         value={keywordText} onChange={setKeywordText} />
              <TextField label="Artist"     hint='a:"Six More Vodka"'  placeholder="e.g. Six More Vodka"          value={artistText}  onChange={setArtistText}  />
            </div>
          </Subsection>
          <p className={QB_TOKENS.helperText}>
            Keywords are mechanics like Action, Resolve, or Allegiance. Use quotes around multi-word values.
          </p>
        </Section>

        {/* ── Finish ── */}
        <Section title="Finish" hint="is:foil">
          <Subsection>
            <div className="flex flex-wrap gap-2">
              {FINISHES.map(({ value, label }) => (
                <Chip key={value} isOn={selectedFinishes.has(value)} onToggle={() => setSelectedFinishes(toggle(selectedFinishes, value))} label={label} />
              ))}
            </div>
          </Subsection>
        </Section>

        {/* ── Search action ── */}
        <div className="pt-1">
          <button
            type="button"
            className={QB_TOKENS.actionButton}
            onClick={handleSearch}
          >
            <SearchIcon />
            {builtQuery ? "Search with this query" : "Search all cards"}
          </button>
        </div>
      </div>

      {/* ── Live preview aside ── */}
      <aside className="min-w-0 lg:sticky lg:top-[calc(var(--site-header-height)+1rem)] lg:self-start">
        <div className={QB_TOKENS.previewFrame}>
          <CardSearchResultsPane query={debouncedBuiltQuery} />
        </div>
      </aside>

      <CardsToolsNav description="Use the filters to narrow your search. Combining more filters will return more specific results." />
    </div>
  );
}
