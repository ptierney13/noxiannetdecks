import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

const DOMAIN_ORDER = ["Fury", "Calm", "Mind", "Body", "Chaos", "Order"] as const;
const CARD_TYPES = ["Unit", "Spell", "Gear", "Rune", "Battlefield", "Legend"] as const;
const RARITIES = ["Common", "Uncommon", "Rare", "Epic", "Showcase", "Promo"] as const;
const QB_SETS = [
  { id: "OGN", label: "Origins" },
  { id: "SFD", label: "Spiritforged" },
  { id: "UNL", label: "Unleashed" },
] as const;
const FINISHES = [
  { value: "foil", label: "Foil" },
  { value: "normal", label: "Normal" },
  { value: "signed", label: "Signed" },
  { value: "altart", label: "Alt Art" },
  { value: "overnumbered", label: "Overnumbered" },
] as const;
const OPERATORS = [">=", ">", "=", "<", "<="] as const;
const SUPERTYPES = ["Champion", "Signature"] as const;

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

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
    <div className="qb-stat-row">
      <div className="qb-stat-label">
        {label}
        <code className="qb-hint-inline">{hint}</code>
      </div>
      <div className="qb-stat-controls">
        <select
          value={op}
          onChange={(e) => onOpChange(e.target.value)}
          className="qb-op-select"
          aria-label={`${label} operator`}
        >
          {OPERATORS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <input
          type="text"
          className="qb-stat-input"
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
    <div className="qb-text-row">
      <label htmlFor={id} className="qb-text-label">{label}</label>
      <input
        id={id}
        type="text"
        className="qb-text-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
      />
      <code className="qb-text-hint">{hint}</code>
    </div>
  );
}

export default function QueryBuilderView() {
  const navigate = useNavigate();
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedSupertypes, setSelectedSupertypes] = useState<Set<string>>(new Set());
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());
  const [selectedRarities, setSelectedRarities] = useState<Set<string>>(new Set());
  const [selectedSets, setSelectedSets] = useState<Set<string>>(new Set());
  const [typelineText, setTypelineText] = useState("");
  const [tagText, setTagText] = useState("");
  const [nameText, setNameText] = useState("");
  const [rulesText, setRulesText] = useState("");
  const [keywordText, setKeywordText] = useState("");
  const [artistText, setArtistText] = useState("");
  const [energyOp, setEnergyOp] = useState(">=");
  const [energyVal, setEnergyVal] = useState("");
  const [mightOp, setMightOp] = useState(">=");
  const [mightVal, setMightVal] = useState("");
  const [powerOp, setPowerOp] = useState(">=");
  const [powerVal, setPowerVal] = useState("");
  const [costOp, setCostOp] = useState(">=");
  const [costVal, setCostVal] = useState("");
  const [selectedFinishes, setSelectedFinishes] = useState<Set<string>>(new Set());

  const builtQuery = useMemo(() => {
    const parts: string[] = [];

    if (selectedTypes.size > 0) {
      parts.push(orGroup([...selectedTypes].map((t) => `ct:${t}`)));
    }
    if (selectedSupertypes.size > 0) {
      parts.push(orGroup([...selectedSupertypes].map((u) => `u:${u}`)));
    }
    if (typelineText.trim()) parts.push(`t:${quoteValue(typelineText.trim())}`);
    if (tagText.trim()) parts.push(`tag:${quoteValue(tagText.trim())}`);
    if (selectedDomains.size > 0) {
      parts.push(orGroup([...selectedDomains].map((d) => `d:${d}`)));
    }
    if (selectedRarities.size > 0) {
      parts.push(orGroup([...selectedRarities].map((r) => `rarity:${r}`)));
    }
    if (selectedSets.size > 0) {
      parts.push(orGroup([...selectedSets].map((s) => `s:${s}`)));
    }
    if (nameText.trim()) parts.push(`n:${quoteValue(nameText.trim())}`);
    if (rulesText.trim()) parts.push(`r:${quoteValue(rulesText.trim())}`);
    if (keywordText.trim()) parts.push(`kw:${quoteValue(keywordText.trim())}`);
    if (artistText.trim()) parts.push(`a:${quoteValue(artistText.trim())}`);
    if (energyVal.trim()) parts.push(`e${energyOp}${energyVal.trim()}`);
    if (mightVal.trim()) parts.push(`m${mightOp}${mightVal.trim()}`);
    if (powerVal.trim()) parts.push(`p${powerOp}${powerVal.trim()}`);
    if (costVal.trim()) parts.push(`c${costOp}${costVal.trim()}`);
    for (const finish of selectedFinishes) parts.push(`is:${finish}`);

    return parts.join(" ");
  }, [
    selectedTypes, selectedSupertypes, selectedDomains, selectedRarities, selectedSets,
    typelineText, tagText, nameText, rulesText, keywordText, artistText,
    energyOp, energyVal, mightOp, mightVal, powerOp, powerVal, costOp, costVal,
    selectedFinishes,
  ]);

  function handleSearch() {
    const trimmed = builtQuery.trim();
    navigate({ to: "/cards", search: { q: trimmed || undefined } });
  }

  return (
    <div className="qb-panel" aria-labelledby="qb-heading">
      <div className="qb-header">
        <p className="eyebrow">Cards</p>
        <h1 id="qb-heading">Query Builder</h1>
        <p className="qb-description">
          Click options below to build a search query. Multiple selections within a group are combined with OR — combine groups to narrow with AND.
        </p>
      </div>

      {/* Live query preview */}
      <div className="qb-query-box">
        <div className="qb-query-box-label">Built Query</div>
        <output className="qb-query-output" aria-live="polite" aria-label="Built query">
          {builtQuery || <span className="qb-query-empty">Make a selection below to build your query</span>}
        </output>
      </div>

      {/* Card Type, Supertype & Tag */}
      <div className="qb-section">
        <h2 className="qb-section-title">
          Card Type &amp; Tags
          <code className="qb-hint">ct:Unit · u:Champion · tag:Dragon</code>
        </h2>

        {/* Typeline search at top of section */}
        <div className="qb-text-fields qb-text-fields--spaced">
          <TextField
            label="Typeline"
            hint="t:Champion"
            placeholder="e.g. Champion Unit, Dragon"
            value={typelineText}
            onChange={setTypelineText}
          />
        </div>

        <p className="qb-subsection-label">Card Type</p>
        <div className="qb-chips">
          {CARD_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={`qb-chip${selectedTypes.has(type) ? " qb-chip--on" : ""}`}
              onClick={() => setSelectedTypes(toggle(selectedTypes, type))}
              aria-pressed={selectedTypes.has(type)}
            >
              {type}
            </button>
          ))}
        </div>

        <p className="qb-subsection-label qb-subsection-label--spaced">Supertype</p>
        <div className="qb-chips">
          {SUPERTYPES.map((st) => (
            <button
              key={st}
              type="button"
              className={`qb-chip${selectedSupertypes.has(st) ? " qb-chip--on" : ""}`}
              onClick={() => setSelectedSupertypes(toggle(selectedSupertypes, st))}
              aria-pressed={selectedSupertypes.has(st)}
            >
              {st}
            </button>
          ))}
        </div>

        <p className="qb-subsection-label qb-subsection-label--spaced">Tag</p>
        <div className="qb-text-fields">
          <TextField
            label="Tag"
            hint="tag:Dragon"
            placeholder="e.g. Dragon, Follower, Celestial"
            value={tagText}
            onChange={setTagText}
          />
        </div>
        <p className="qb-note">Tags are subtypes like Dragon or Follower. Supertypes are Champion, Signature, etc.</p>
      </div>

      {/* Domain */}
      <div className="qb-section">
        <h2 className="qb-section-title">
          Domain
          <code className="qb-hint">d:Fury</code>
        </h2>
        <div className="qb-chips">
          {DOMAIN_ORDER.map((domain) => {
            const on = selectedDomains.has(domain);
            return (
              <button
                key={domain}
                type="button"
                className={`qb-chip qb-domain-chip${on ? " qb-chip--on" : ""}`}
                data-domain={domain}
                onClick={() => setSelectedDomains(toggle(selectedDomains, domain))}
                aria-pressed={on}
              >
                <span className="qb-domain-pip" aria-hidden="true" />
                {domain}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rarity */}
      <div className="qb-section">
        <h2 className="qb-section-title">
          Rarity
          <code className="qb-hint">rarity:Rare</code>
        </h2>
        <div className="qb-chips">
          {RARITIES.map((rarity) => {
            const on = selectedRarities.has(rarity);
            return (
              <button
                key={rarity}
                type="button"
                className={`qb-chip qb-rarity-chip${on ? " qb-chip--on" : ""}`}
                data-rarity={rarity}
                onClick={() => setSelectedRarities(toggle(selectedRarities, rarity))}
                aria-pressed={on}
              >
                <span className="qb-rarity-pip" aria-hidden="true" />
                {rarity}
              </button>
            );
          })}
        </div>
      </div>

      {/* Set */}
      <div className="qb-section">
        <h2 className="qb-section-title">
          Set
          <code className="qb-hint">s:OGN</code>
        </h2>
        <div className="qb-chips">
          {QB_SETS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`qb-chip${selectedSets.has(id) ? " qb-chip--on" : ""}`}
              onClick={() => setSelectedSets(toggle(selectedSets, id))}
              aria-pressed={selectedSets.has(id)}
            >
              <span className="qb-set-code">{id}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="qb-section">
        <h2 className="qb-section-title">Stats</h2>
        <div className="qb-stats-grid">
          <StatRow label="Energy" hint="e>=3" op={energyOp} onOpChange={setEnergyOp} val={energyVal} onValChange={setEnergyVal} />
          <StatRow label="Might"  hint="m>=2" op={mightOp}  onOpChange={setMightOp}  val={mightVal}  onValChange={setMightVal}  />
          <StatRow label="Power"  hint="p>=1 or p=ff" op={powerOp}  onOpChange={setPowerOp}  val={powerVal}  onValChange={setPowerVal}  />
          <StatRow label="Cost"   hint="c>=3" op={costOp}   onOpChange={setCostOp}   val={costVal}   onValChange={setCostVal}   />
        </div>
      </div>

      {/* Text Filters */}
      <div className="qb-section">
        <h2 className="qb-section-title">Text Filters</h2>
        <div className="qb-text-fields">
          <TextField
            label="Name"
            hint="n:jinx"
            placeholder="e.g. Jinx"
            value={nameText}
            onChange={setNameText}
          />
          <TextField
            label="Rules Text"
            hint='r: or o:"draw a card"'
            placeholder='e.g. draw a card'
            value={rulesText}
            onChange={setRulesText}
          />
          <TextField
            label="Keyword"
            hint="kw:Action or k:Action"
            placeholder="e.g. Action, Resolve, Allegiance"
            value={keywordText}
            onChange={setKeywordText}
          />
          <TextField
            label="Artist"
            hint='a:"Six More Vodka"'
            placeholder="e.g. Six More Vodka"
            value={artistText}
            onChange={setArtistText}
          />
        </div>
        <p className="qb-note">
          Keywords are mechanics like Action, Resolve, or Allegiance. Use quotes around multi-word values.
        </p>
      </div>

      {/* Finish */}
      <div className="qb-section">
        <h2 className="qb-section-title">
          Finish
          <code className="qb-hint">is:foil</code>
        </h2>
        <div className="qb-chips">
          {FINISHES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={`qb-chip${selectedFinishes.has(value) ? " qb-chip--on" : ""}`}
              onClick={() => setSelectedFinishes(toggle(selectedFinishes, value))}
              aria-pressed={selectedFinishes.has(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Search action */}
      <div className="qb-actions">
        <button type="button" className="qb-search-main" onClick={handleSearch}>
          <SearchIcon />
          {builtQuery ? "Search with this query" : "Search all cards"}
        </button>
      </div>
    </div>
  );
}
