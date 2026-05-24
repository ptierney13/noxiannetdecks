import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { ChevronIcon } from "../ui-elements";
import { CardSearchResultsPane, QuerySummaryChips } from "../features";
import { useDebounce } from "../lib";
import { renderTokenizedText, raritySymbolSrc } from "../lib";
import { parseQuery, executedTokensToDisplay, resolveField, type DisplayItem } from "@noxiannet/card-store/query";

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

// Colors for each canonical field — used by the syntax-highlighted query display.
const FIELD_COLOR: Record<string, string> = {
  cardtype:     "#7dd3fc", // sky-300
  supertype:    "#c4b5fd", // violet-300
  t:            "#5eead4", // teal-300
  tag:          "#86efac", // green-300
  domain:       "#fcd34d", // amber-300
  rarity:       "#e879f9", // fuchsia-400
  set:          "#60a5fa", // blue-400
  name:         "#fb923c", // orange-400
  clean_name:   "#fb923c",
  text:         "#fdba74", // orange-300
  keyword:      "#bef264", // lime-300
  artist:       "#d1d5db", // gray-300
  flavour:      "#d1d5db",
  energy:       "#f9a8d4", // pink-300
  might:        "#fda4af", // rose-300
  power:        "#a5b4fc", // indigo-300
  cost:         "#67e8f9", // cyan-300
  is:           "#d4d4d8", // zinc-300
  finish:       "#d4d4d8",
  price:        "#34d399", // emerald-400
  number:       "#94a3b8", // slate-400
  language:     "#94a3b8",
  layout:       "#94a3b8",
  id:           "#94a3b8",
  riftbound_id: "#94a3b8",
  tcgplayer_id: "#94a3b8",
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

// ── Syntax-highlighted query ──────────────────────────────────────────────────

type QuerySpan = {
  text: string;
  kind: "space" | "structural" | "connector" | "predicate" | "error";
  color?: string;
};

function tokenizeQueryString(source: string): QuerySpan[] {
  const spans: QuerySpan[] = [];
  let i = 0;

  while (i < source.length) {
    const rest = source.slice(i);

    // Whitespace
    const ws = rest.match(/^\s+/);
    if (ws) {
      spans.push({ text: ws[0], kind: "space" });
      i += ws[0].length;
      continue;
    }

    // Structural: ( )
    if (rest[0] === "(" || rest[0] === ")") {
      spans.push({ text: rest[0], kind: "structural" });
      i++;
      continue;
    }

    // Connectors: or / and / not — must be followed by space, paren, or end
    const conn = rest.match(/^(or|and|not)(?=[\s()]|$)/i);
    if (conn) {
      spans.push({ text: conn[0], kind: "connector" });
      i += conn[0].length;
      continue;
    }

    // Predicate: optional -, field, op, value (quoted or bare)
    const pred = rest.match(
      /^(-?)([A-Za-z_][A-Za-z0-9_]*)(:|=|>=?|<=?)("(?:[^"\\]|\\.)*"|[^\s()]+)/
    );
    if (pred) {
      const [fullText, , rawField] = pred;
      const defn = resolveField(rawField);
      const color = defn ? (FIELD_COLOR[defn.canonical] ?? "#94a3b8") : undefined;
      spans.push({ text: fullText, kind: defn ? "predicate" : "error", color });
      i += fullText.length;
      continue;
    }

    // Bare unrecognized word
    const bare = rest.match(/^[^\s()]+/);
    if (bare) {
      spans.push({ text: bare[0], kind: "error" });
      i += bare[0].length;
      continue;
    }

    // Fallback: advance one character
    spans.push({ text: rest[0], kind: "structural" });
    i++;
  }

  return spans;
}

function SyntaxHighlightedQuery({ query }: { query: string }) {
  const spans = useMemo(() => tokenizeQueryString(query), [query]);

  if (!query.trim()) {
    return (
      <span className="text-sm font-mono text-text-tertiary">
        Select one or more filters to build a query.
      </span>
    );
  }

  return (
    <code className="text-sm font-mono break-all leading-relaxed">
      {spans.map((span, idx) => {
        switch (span.kind) {
          case "space":
            return <span key={idx}>{span.text}</span>;
          case "structural":
            return (
              <span key={idx} style={{ color: "rgba(255,255,255,0.3)" }}>
                {span.text}
              </span>
            );
          case "connector":
            return (
              <span key={idx} style={{ color: "rgba(255,255,255,0.42)", fontStyle: "italic" }}>
                {span.text}
              </span>
            );
          case "error":
            return (
              <span key={idx} style={{ color: "#f87171" }}>
                {span.text}
              </span>
            );
          case "predicate":
            return (
              <span key={idx} style={{ color: span.color ?? "#94a3b8" }}>
                {span.text}
              </span>
            );
        }
      })}
    </code>
  );
}

// ── Private sub-components ───────────────────────────────────────────────────

function BookIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

const QB_TOKENS = {
  builderShell: "flex min-w-0 flex-col gap-5 rounded-2xl border border-border-subtle bg-[linear-gradient(180deg,rgba(16,20,30,0.72),rgba(7,9,14,0.46))] p-3 shadow-[0_18px_48px_rgba(0,0,0,0.24)] sm:p-4",
  section: "overflow-hidden rounded-xl bg-[rgba(14,18,28,0.92)] shadow-[0_0_0_1px_rgba(197,50,71,0.14),0_0_28px_rgba(197,50,71,0.08),0_4px_14px_rgba(0,0,0,0.28)]",
  sectionHeader: "flex items-center gap-2.5 px-4 pt-3.5 pb-2",
  sectionBody: "flex flex-col gap-3.5 px-4 pb-4",
  sectionTitle: "text-[0.77rem] font-black uppercase tracking-[0.14em] text-accent-warm leading-none",
  sectionHint: "rounded-md border border-border-default bg-[rgba(8,11,18,0.82)] px-1.5 py-0.5 font-mono text-[0.66rem] text-accent-warm leading-none shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  subsection: "rounded-lg border border-border-subtle bg-[linear-gradient(180deg,rgba(20,25,36,0.72),rgba(10,13,20,0.78))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  subsectionRaised: "border-border-default bg-[linear-gradient(180deg,rgba(25,31,43,0.82),rgba(12,15,23,0.88))]",
  subsectionLabel: "mb-2.5 text-[0.7rem] font-black uppercase tracking-[0.14em] text-accent-warm",
  helperText: "text-xs leading-relaxed text-text-tertiary/78",
  chipBase: "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-[6px] text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.075),0_4px_10px_rgba(0,0,0,0.2)] transition-[background,border-color,box-shadow,transform,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
  chipOff: "border-[rgba(255,255,255,0.18)] bg-[linear-gradient(180deg,rgba(38,45,61,0.96),rgba(18,22,32,0.98))] text-text-secondary hover:-translate-y-px hover:border-border-strong hover:bg-[linear-gradient(180deg,rgba(47,55,72,0.98),rgba(23,28,40,0.98))] hover:text-text-primary hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_8px_20px_rgba(0,0,0,0.28)]",
  chipOn: "border-accent bg-[linear-gradient(180deg,rgba(112,38,51,0.88),rgba(53,17,27,0.96))] text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_0_1px_rgba(197,50,71,0.32),0_0_18px_rgba(197,50,71,0.15),0_10px_24px_rgba(0,0,0,0.3)] hover:-translate-y-px hover:border-accent-hover hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_0_0_1px_rgba(215,66,85,0.38),0_0_20px_rgba(197,50,71,0.2),0_12px_28px_rgba(0,0,0,0.34)]",
  fieldInput: "h-9 w-full rounded-lg border border-[rgba(255,255,255,0.2)] bg-[linear-gradient(180deg,rgba(18,22,32,0.96),rgba(10,13,20,0.98))] px-3 text-sm text-text-primary shadow-[inset_0_1px_2px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.045)] placeholder:text-text-tertiary/55 transition-[background,border-color,box-shadow] duration-150 hover:border-border-strong focus:outline-none focus:border-accent focus:ring-2 focus:ring-[var(--color-focus-ring)]",
  compactField: "h-8 rounded-md border border-[rgba(255,255,255,0.2)] bg-[linear-gradient(180deg,rgba(18,22,32,0.96),rgba(10,13,20,0.98))] font-mono text-sm text-text-primary shadow-[inset_0_1px_2px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.045)] transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-accent focus:ring-2 focus:ring-[var(--color-focus-ring)]",
  statRow: "flex items-center gap-2 rounded-lg border border-border-default bg-[linear-gradient(180deg,rgba(27,33,45,0.88),rgba(13,16,24,0.94))] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.055),0_5px_14px_rgba(0,0,0,0.18)] transition-[background,border-color,box-shadow] duration-150 hover:border-border-strong hover:bg-[linear-gradient(180deg,rgba(35,42,56,0.94),rgba(16,20,30,0.98))] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.075),0_9px_20px_rgba(0,0,0,0.24)]",
  previewFrame: "flex flex-col flex-1 overflow-hidden rounded-2xl border border-border-default bg-[linear-gradient(180deg,rgba(18,22,32,0.96),rgba(7,9,14,0.98))] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_22px_52px_rgba(0,0,0,0.34)]",
} as const;

type SectionProps = {
  title: string;
  hint?: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
};

function Section({ title, hint, children, collapsible = false, defaultOpen = true }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const headerContent = (
    <>
      <h2 className={QB_TOKENS.sectionTitle}>{title}</h2>
      {hint ? <code className={QB_TOKENS.sectionHint}>{hint}</code> : null}
      {collapsible ? (
        <span className="ml-auto text-text-tertiary opacity-60">
          <ChevronIcon expanded={isOpen} />
        </span>
      ) : null}
    </>
  );

  return (
    <section className={QB_TOKENS.section}>
      {collapsible ? (
        <button
          type="button"
          className={`w-full flex ${QB_TOKENS.sectionHeader} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-inset`}
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
        >
          {headerContent}
        </button>
      ) : (
        <div className={QB_TOKENS.sectionHeader}>{headerContent}</div>
      )}
      {isOpen ? (
        <div className={QB_TOKENS.sectionBody}>{children}</div>
      ) : null}
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

  const [copied, setCopied] = useState(false);

  function handleSearch() {
    void navigate({ to: "/cards", search: { q: builtQuery.trim() || undefined } });
  }

  function handleReset() {
    setSelectedTypes(new Set());
    setSelectedSupertypes(new Set());
    setSelectedDomains(new Set());
    setSelectedRarities(new Set());
    setSelectedSets(new Set());
    setSelectedFinishes(new Set());
    setTypelineText(""); setTagText(""); setNameText("");
    setRulesText(""); setKeywordText(""); setArtistText("");
    setEnergyOp(">="); setEnergyVal("");
    setMightOp(">=");  setMightVal("");
    setPowerOp(">=");  setPowerVal("");
    setCostOp(">=");   setCostVal("");
  }

  function handleCopy() {
    if (!builtQuery) return;
    void navigator.clipboard.writeText(builtQuery).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const debouncedBuiltQuery = useDebounce(builtQuery, 180);

  const queryDisplayBlocks = useMemo((): DisplayItem[] => {
    if (!debouncedBuiltQuery.trim()) return [];
    return executedTokensToDisplay(parseQuery(debouncedBuiltQuery).executedTokens);
  }, [debouncedBuiltQuery]);

  const NAV_BTN = "inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border-default px-3 py-1.5 text-xs font-bold text-text-secondary transition-[background,border-color,color] duration-150 hover:border-border-strong hover:text-text-primary disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]";

  return (
    <div>
      {/* ── Sticky Query bar — floating card, not a full-width banner ── */}
      <div className="sticky top-[var(--site-header-height)] z-20 px-4 py-2.5">
        <div className="mx-auto max-w-[1720px]">
          <div className="rounded-xl border border-[rgba(197,50,71,0.28)] bg-[rgba(10,13,20,0.98)] shadow-[0_0_0_1px_rgba(197,50,71,0.12),0_0_40px_rgba(197,50,71,0.12),0_12px_32px_rgba(0,0,0,0.56)] backdrop-blur-md flex items-start gap-4 px-4 py-3">

            {/* Color-coded query + human-readable chips */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <output aria-live="polite" aria-label="Your query" className="block">
                <SyntaxHighlightedQuery query={builtQuery} />
              </output>
              {queryDisplayBlocks.length > 0 ? (
                <div className="hidden md:flex flex-wrap items-center gap-x-2 gap-y-1">
                  <QuerySummaryChips items={queryDisplayBlocks} />
                </div>
              ) : null}
            </div>

            {/* Action buttons — stacked vertically */}
            <div className="shrink-0 flex flex-col gap-1 min-w-[7.5rem]">
              <button type="button" onClick={handleCopy} disabled={!builtQuery} className={NAV_BTN}>
                <CopyIcon />
                {copied ? "Copied!" : "Copy"}
              </button>
              <button type="button" onClick={handleReset} className={NAV_BTN}>
                <XIcon />
                Reset Filters
              </button>
              {/* Search — only visible below lg where the results panel isn't alongside */}
              <button
                type="button"
                onClick={handleSearch}
                className="lg:hidden inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,var(--color-accent-hover),var(--color-accent))] px-3 py-1.5 text-xs font-bold text-white shadow-[0_4px_12px_rgba(197,50,71,0.22)] transition-[box-shadow,filter] duration-150 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
              >
                <SearchIcon />
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column grid ── */}
      <div className="mx-auto grid w-full max-w-[1720px] gap-7 px-4 pb-10 pt-4 lg:grid-cols-[minmax(360px,820px)_minmax(0,1fr)]">

      {/* ── Builder panel ── */}
      <div className={QB_TOKENS.builderShell} aria-label="Query builder filters">

        {/* ── Card Type & Tags ── */}
        <Section title="Card Type & Tags" hint="ct:Unit · u:Champion · tag:Dragon" collapsible>
          <Subsection raised>
            <TextField label="TYPELINE" hint="t:Champion" placeholder="e.g. Champion Unit, Dragon" value={typelineText} onChange={setTypelineText} />
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
        <Section title="Domain" hint="d:Fury" collapsible>
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
        <Section title="Rarity" hint="rarity:Rare" collapsible>
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
        <Section title="Set" hint="s:OGN" collapsible>
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
        <Section title="Stats" collapsible>
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
        <Section title="Text Filters" collapsible>
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
        <Section title="Finish" hint="is:foil" collapsible>
          <Subsection>
            <div className="flex flex-wrap gap-2">
              {FINISHES.map(({ value, label }) => (
                <Chip key={value} isOn={selectedFinishes.has(value)} onToggle={() => setSelectedFinishes(toggle(selectedFinishes, value))} label={label} />
              ))}
            </div>
          </Subsection>
        </Section>

      </div>

      {/* ── Live preview aside ── */}
      <aside className="min-w-0 flex flex-col">
        <div className={QB_TOKENS.previewFrame}>
          <CardSearchResultsPane
            query={debouncedBuiltQuery}
            hideSummary
            navSlot={
              <Link
                to="/cards/learn-to-search"
                search={{ mode: "visual-guide" }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border-default bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-xs font-bold text-text-secondary transition-[background,border-color,color] duration-150 hover:border-border-strong hover:bg-[rgba(255,255,255,0.07)] hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
              >
                <BookIcon />
                Learn to Search
              </Link>
            }
          />
        </div>
      </aside>

      </div>
    </div>
  );
}
