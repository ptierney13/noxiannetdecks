// Card Search — Scryfall-style: search bar + filter rail + fluid grid.

function SearchView({ query: initialQuery, onNavigate, tweaks }) {
  const [query, setQuery] = React.useState(initialQuery ?? "");
  const [submitted, setSubmitted] = React.useState(initialQuery ?? "");
  const [view, setView] = React.useState(tweaks.tileStyle ?? "grid"); // grid | compact | list
  const [sort, setSort] = React.useState("energy-asc");
  const [filters, setFilters] = React.useState({
    domains: new Set(),
    types: new Set(),
    energyMin: "",
    energyMax: "",
    rarity: new Set(),
    showcase: false,
  });

  React.useEffect(() => {
    setQuery(initialQuery ?? "");
    setSubmitted(initialQuery ?? "");
  }, [initialQuery]);

  React.useEffect(() => {
    if (tweaks.tileStyle) setView(tweaks.tileStyle);
  }, [tweaks.tileStyle]);

  const toggleSet = (group, value) => {
    setFilters((f) => {
      const next = new Set(f[group]);
      if (next.has(value)) next.delete(value); else next.add(value);
      return { ...f, [group]: next };
    });
  };

  const results = React.useMemo(() => {
    const q = submitted.trim().toLowerCase();
    let list = window.CARDS.filter((c) => {
      // text q: name match or fielded
      if (q) {
        // very lightweight fake parser for the demo
        const tokens = q.split(/\s+/);
        for (const t of tokens) {
          const [k, v] = t.includes(":") ? t.split(":") : [null, t];
          if (k === "t" || k === "type") {
            if (c.type.toLowerCase() !== v) return false;
          } else if (k === "d" || k === "domain") {
            if (!c.domains.map((x) => x.toLowerCase()).includes(v)) return false;
          } else if (k === "set") {
            if (c.set.toLowerCase() !== v) return false;
          } else if (k === "name" || k === "n") {
            if (!c.name.toLowerCase().includes(v)) return false;
          } else if (k === "is" && v === "foil") {
            // accept any card
          } else if (t.includes(">=") || t.includes("<=") || t.startsWith("energy>") || t.startsWith("energy<")) {
            const m = t.match(/^energy([<>]=?|=)(\d+)$/);
            if (m) {
              const op = m[1], n = Number(m[2]), e = c.energy ?? -1;
              if (op === ">=" && !(e >= n)) return false;
              if (op === "<=" && !(e <= n)) return false;
              if (op === ">"  && !(e >  n)) return false;
              if (op === "<"  && !(e <  n)) return false;
              if (op === "="  && !(e === n)) return false;
            }
          } else if (!k) {
            if (!c.name.toLowerCase().includes(t) && !(c.tags ?? []).join(" ").toLowerCase().includes(t)) return false;
          }
        }
      }
      // filters
      if (filters.domains.size && !c.domains.some((d) => filters.domains.has(d))) return false;
      if (filters.types.size && !filters.types.has(c.type)) return false;
      if (filters.rarity.size && !filters.rarity.has(c.rarity)) return false;
      if (filters.energyMin !== "" && (c.energy ?? -1) < Number(filters.energyMin)) return false;
      if (filters.energyMax !== "" && (c.energy ?? 999) > Number(filters.energyMax)) return false;
      return true;
    });

    // sort
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "energy-asc":  return (a.energy ?? 999) - (b.energy ?? 999) || a.name.localeCompare(b.name);
        case "energy-desc": return (b.energy ?? -1)  - (a.energy ?? -1)  || a.name.localeCompare(b.name);
        case "name-asc":    return a.name.localeCompare(b.name);
        case "price-desc":  return (b.price?.nm ?? 0) - (a.price?.nm ?? 0);
        case "price-asc":   return (a.price?.nm ?? 0) - (b.price?.nm ?? 0);
        default: return 0;
      }
    });
    return list;
  }, [submitted, filters, sort]);

  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitted(query);
    onNavigate(`/cards?q=${encodeURIComponent(query)}`, true);
  };

  const allDomains = ["Fury", "Calm", "Mind", "Body", "Chaos", "Order"];
  const allTypes = ["Unit", "Spell", "Gear", "Legend", "Rune", "Battlefield"];
  const allRarities = ["Common", "Uncommon", "Rare", "Epic", "Promo"];

  return (
    <div className="page" data-tile={view}>
      <section className="section" style={{ paddingTop: 32 }}>
        <div className="section-head">
          <div className="section-head__title">
            <span className="eyebrow">Search · Card index</span>
            <h2>The <em>card</em> library.</h2>
          </div>
          <span className="mono faint">{results.length} of {window.CARDS.length}</span>
        </div>

        <form className="search-bar" onSubmit={onSubmit}>
          <span className="search-bar__icon"><IconSearch size={18} /></span>
          <input
            className="search-bar__input"
            placeholder="t:champion d:fury energy>=4    (try name:darius, set:OGN, is:foil)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button type="button" onClick={() => { setQuery(""); setSubmitted(""); }} style={{ background: "transparent", border: 0, color: "var(--bone-1)", padding: "0 8px", cursor: "pointer" }}>
              <IconX />
            </button>
          )}
          <button type="submit" className="search-bar__btn">Search</button>
        </form>

        <div className="search-shell">
          {/* FILTER RAIL */}
          <aside className="filters" aria-label="Filters">
            <div className="filters__group">
              <span className="filters__label">Domain</span>
              <div className="filters__chips">
                {allDomains.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className="chip"
                    aria-pressed={filters.domains.has(d)}
                    onClick={() => toggleSet("domains", d)}
                  >
                    <Rune domain={d} />
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="filters__group">
              <span className="filters__label">Type</span>
              <div className="filters__chips">
                {allTypes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="chip"
                    aria-pressed={filters.types.has(t)}
                    onClick={() => toggleSet("types", t)}
                  >{t}</button>
                ))}
              </div>
            </div>

            <div className="filters__group">
              <span className="filters__label">Energy</span>
              <div className="range-row">
                <input
                  inputMode="numeric"
                  placeholder="min"
                  value={filters.energyMin}
                  onChange={(e) => setFilters((f) => ({ ...f, energyMin: e.target.value.replace(/\D/g, "") }))}
                />
                <span style={{ color: "var(--bone-1)", fontFamily: "var(--mono)", fontSize: 11 }}>—</span>
                <input
                  inputMode="numeric"
                  placeholder="max"
                  value={filters.energyMax}
                  onChange={(e) => setFilters((f) => ({ ...f, energyMax: e.target.value.replace(/\D/g, "") }))}
                />
              </div>
            </div>

            <div className="filters__group">
              <span className="filters__label">Rarity</span>
              <div className="filters__chips">
                {allRarities.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className="chip"
                    aria-pressed={filters.rarity.has(r)}
                    onClick={() => toggleSet("rarity", r)}
                  >{r}</button>
                ))}
              </div>
            </div>

            <div className="filters__group">
              <span className="filters__label">Saved searches</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Fury aggro budget", q: "d:fury energy<=3" },
                  { label: "Champions only", q: "t:champion" },
                  { label: "Foils > $20", q: "is:foil" },
                ].map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => { setQuery(s.q); setSubmitted(s.q); }}
                    style={{
                      textAlign: "left",
                      background: "transparent",
                      border: 0,
                      color: "var(--bone-2)",
                      padding: "6px 0",
                      fontSize: 12.5,
                      cursor: "pointer",
                      borderBottom: "1px dashed var(--line-1)",
                      display: "flex", justifyContent: "space-between", gap: 10,
                    }}
                  >
                    <span>{s.label}</span>
                    <span className="mono faint" style={{ fontSize: 10.5 }}>{s.q}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* RESULTS */}
          <div>
            <div className="results-bar">
              <span className="results-bar__count"><strong>{results.length}</strong> matching cards</span>
              {submitted && (
                <span className="mono faint" title="Normalized query">→ {submitted}</span>
              )}
              <div className="results-bar__spacer" />
              <span className="results-bar__count" style={{ marginRight: 4 }}>Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="energy-asc">Energy ↑</option>
                <option value="energy-desc">Energy ↓</option>
                <option value="name-asc">Name A→Z</option>
                <option value="price-desc">Price ↓</option>
                <option value="price-asc">Price ↑</option>
              </select>
              <div className="view-toggle">
                <button type="button" aria-pressed={view === "grid"} onClick={() => setView("grid")} title="Grid"><IconGrid /></button>
                <button type="button" aria-pressed={view === "compact"} onClick={() => setView("compact")} title="Image only"><IconImage /></button>
                <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")} title="List"><IconList /></button>
              </div>
            </div>

            {results.length === 0 ? (
              <div style={{
                padding: "60px 20px",
                textAlign: "center",
                color: "var(--bone-2)",
                background: "var(--ink-2)",
                border: "1px dashed var(--line-1)",
                borderRadius: "var(--radius-lg)",
              }}>
                <div style={{ fontFamily: "var(--serif)", fontSize: 28, fontStyle: "italic", color: "var(--bone-3)", marginBottom: 8 }}>Nothing in the vault.</div>
                <div className="mono faint">Loosen a filter, or clear the query.</div>
              </div>
            ) : view === "list" ? (
              <div className="card-grid">
                {results.map((c) => <CardRow key={c.id} card={c} onOpen={() => onNavigate(`/cards/${c.id}`)} />)}
              </div>
            ) : (
              <div className="card-grid">
                {results.map((c) => <CardTile key={c.id} card={c} onOpen={() => onNavigate(`/cards/${c.id}`)} />)}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

window.SearchView = SearchView;
