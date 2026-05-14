// Trade Balancer — two sides, running balance pillar in the middle.

const CONDITIONS = [
  { id: "nm", label: "NM", mult: 1.0 },
  { id: "lp", label: "LP", mult: 0.80 },
  { id: "mp", label: "MP", mult: 0.60 },
  { id: "hp", label: "HP", mult: 0.40 },
];

function priceFor(card, finish, conditionId) {
  if (!card.price) return 0;
  const base = finish === "foil" ? (card.price.foilNm ?? 0) : (card.price.nm ?? 0);
  const mult = CONDITIONS.find((c) => c.id === conditionId)?.mult ?? 1;
  return base * mult;
}

function TradeBalancer({ onNavigate }) {
  const [mine, setMine] = React.useState([]);
  const [yours, setYours] = React.useState([]);
  const [activeSearch, setActiveSearch] = React.useState(null); // 'mine' | 'yours' | null
  const [searchQ, setSearchQ] = React.useState("");

  const seedMine = () => setMine([
    { id: "darius-trifarian", finish: "foil", cond: "nm", qty: 1 },
    { id: "draven-showboat",  finish: "nonfoil", cond: "lp", qty: 2 },
  ].map((row) => ({ ...row, key: `${row.id}-${row.finish}-${Math.random().toString(36).slice(2, 7)}` })));
  const seedYours = () => setYours([
    { id: "jinx-demolitionist", finish: "nonfoil", cond: "nm", qty: 1 },
    { id: "ekko-recurrent",     finish: "nonfoil", cond: "nm", qty: 1 },
    { id: "captain-farron",     finish: "nonfoil", cond: "nm", qty: 1 },
  ].map((row) => ({ ...row, key: `${row.id}-${row.finish}-${Math.random().toString(36).slice(2, 7)}` })));

  React.useEffect(() => { seedMine(); seedYours(); /* eslint-disable-next-line */ }, []);

  const addCard = (side, cardId) => {
    const setter = side === "mine" ? setMine : setYours;
    setter((rows) => [
      ...rows,
      {
        id: cardId,
        finish: "nonfoil",
        cond: "nm",
        qty: 1,
        key: `${cardId}-nonfoil-${Math.random().toString(36).slice(2, 7)}`,
      },
    ]);
    setActiveSearch(null);
    setSearchQ("");
  };

  const updateRow = (side, key, patch) => {
    const setter = side === "mine" ? setMine : setYours;
    setter((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };
  const removeRow = (side, key) => {
    const setter = side === "mine" ? setMine : setYours;
    setter((rows) => rows.filter((r) => r.key !== key));
  };

  const totalFor = (rows) => rows.reduce((sum, r) => {
    const card = window.CARDS.find((c) => c.id === r.id);
    if (!card) return sum;
    return sum + priceFor(card, r.finish, r.cond) * (r.qty || 0);
  }, 0);

  const mineTotal = totalFor(mine);
  const yoursTotal = totalFor(yours);
  const delta = yoursTotal - mineTotal; // positive = you gain
  const absDelta = Math.abs(delta);
  const big = Math.max(mineTotal, yoursTotal, 1);
  const pct = (delta / big) * 100;

  let verdict = { tone: "even", label: "Even — fair swap.", desc: "Within $1 either way." };
  if (absDelta > 1 && absDelta < 8) verdict = { tone: "fair", label: delta > 0 ? "You gain a slight edge." : "You give a slight edge.", desc: "Within 10% market spread." };
  if (absDelta >= 8) verdict = { tone: "unfair", label: delta > 0 ? "You gain — significantly." : "You give up value.", desc: "Outside fair spread. Negotiate." };

  const markerLeft = (() => {
    const clamped = Math.max(-100, Math.min(100, pct));
    return `calc(50% + ${clamped / 2}% - 1px)`;
  })();

  return (
    <div className="page">
      <section className="section" style={{ paddingTop: 32 }}>
        <div className="section-head">
          <div className="section-head__title">
            <span className="eyebrow">Tools · Trade Balancer</span>
            <h2>Settle a <em>fair</em> trade.</h2>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn btn--ghost" onClick={() => { setMine([]); setYours([]); }}>Clear both</button>
            <button type="button" className="btn">Share trade</button>
          </div>
        </div>

        <div className="trade-shell">
          <TradeSide
            title="My side"
            rows={mine}
            total={mineTotal}
            onSearch={() => setActiveSearch("mine")}
            isSearching={activeSearch === "mine"}
            searchQ={searchQ}
            setSearchQ={setSearchQ}
            onAdd={(id) => addCard("mine", id)}
            onUpdate={(key, patch) => updateRow("mine", key, patch)}
            onRemove={(key) => removeRow("mine", key)}
          />

          {/* BALANCE PILLAR */}
          <div className="trade-balance">
            <span className="trade-balance__label">Trade Verdict</span>
            <span className="trade-balance__value">
              {delta === 0 ? <em>Even</em> : delta > 0 ? <>+{fmtUsd(delta).slice(1)}</> : <>−{fmtUsd(Math.abs(delta)).slice(1)}</>}
            </span>
            <span className="trade-balance__sub">{delta > 0 ? "in your favor" : delta < 0 ? "you give up" : "perfectly square"}</span>

            <div className="trade-balance__scale" aria-hidden="true">
              <span className="trade-balance__scale-marker" style={{ left: markerLeft }} />
              {/* center tick */}
              <span style={{ position: "absolute", left: "50%", top: "-3px", bottom: "-3px", width: 1, background: "var(--line-2)" }} />
            </div>
            <div className="trade-balance__legend">
              <span>← You give</span>
              <span>You gain →</span>
            </div>

            <div className="trade-balance__summary">
              <div className="trade-balance__summary-row"><span>My side</span><strong>{fmtUsd(mineTotal)}</strong></div>
              <div className="trade-balance__summary-row"><span>Their side</span><strong>{fmtUsd(yoursTotal)}</strong></div>
              <div className="trade-balance__summary-row"><span>Cards exchanged</span><strong>{mine.reduce((s, r) => s + r.qty, 0)} ↔ {yours.reduce((s, r) => s + r.qty, 0)}</strong></div>
            </div>

            <div className={`trade-balance__verdict ${verdict.tone}`}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{verdict.label}</div>
              <div className="mono faint" style={{ color: "inherit", opacity: 0.8, fontSize: 11 }}>{verdict.desc}</div>
            </div>
          </div>

          <TradeSide
            title="Their side"
            rows={yours}
            total={yoursTotal}
            onSearch={() => setActiveSearch("yours")}
            isSearching={activeSearch === "yours"}
            searchQ={searchQ}
            setSearchQ={setSearchQ}
            onAdd={(id) => addCard("yours", id)}
            onUpdate={(key, patch) => updateRow("yours", key, patch)}
            onRemove={(key) => removeRow("yours", key)}
            mirrored
          />
        </div>
      </section>

      <Footer />
    </div>
  );
}

function TradeSide({ title, rows, total, onSearch, isSearching, searchQ, setSearchQ, onAdd, onUpdate, onRemove, mirrored }) {
  const searchResults = React.useMemo(() => {
    if (!searchQ.trim()) return window.CARDS.slice(0, 8);
    const q = searchQ.toLowerCase();
    return window.CARDS.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 12);
  }, [searchQ]);

  return (
    <div className="trade-side">
      <div className="trade-side__head">
        <h3 className="trade-side__title">{title.split(" ")[0]} <em>{title.split(" ")[1]}</em></h3>
        <span className="trade-side__total">{fmtUsd(total)}</span>
      </div>
      <div className="trade-search" style={{ position: "relative" }}>
        <span className="search-bar__icon" style={{ padding: "0 4px 0 6px", color: "var(--bone-2)" }}><IconSearch /></span>
        <input
          placeholder="Add a card to this side…"
          value={isSearching ? searchQ : ""}
          onFocus={onSearch}
          onChange={(e) => setSearchQ(e.target.value)}
        />
        {isSearching && (
          <div className="trade-search-results">
            {searchResults.map((c) => (
              <button
                key={c.id}
                type="button"
                className="trade-search-result"
                onClick={() => onAdd(c.id)}
              >
                <img src={c.img} alt="" />
                <div>
                  <div className="trade-search-result__name">{c.name}</div>
                  <div className="mono faint" style={{ fontSize: 10.5 }}>
                    <DomainDots domains={c.domains} /> &nbsp;{c.set} · {c.num}
                  </div>
                </div>
                <span className="trade-search-result__price">{fmtUsd(c.price?.nm)}</span>
              </button>
            ))}
            {searchResults.length === 0 && (
              <div style={{ padding: "16px", textAlign: "center", color: "var(--bone-1)", fontFamily: "var(--mono)", fontSize: 11 }}>No match.</div>
            )}
          </div>
        )}
      </div>

      <div className="trade-items">
        {rows.length === 0 ? (
          <div className="trade-empty">No cards. Tap the field above to add.</div>
        ) : (
          rows.map((r) => {
            const card = window.CARDS.find((c) => c.id === r.id);
            if (!card) return null;
            const unit = priceFor(card, r.finish, r.cond);
            return (
              <div key={r.key} className="trade-item">
                <img src={card.img} alt="" />
                <div style={{ minWidth: 0 }}>
                  <div className="trade-item__name">{card.name}</div>
                  <div className="trade-item__meta">
                    <DomainDots domains={card.domains} /> &nbsp;
                    {card.set} · {card.num}
                  </div>
                  <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                    {/* condition */}
                    <select
                      value={r.cond}
                      onChange={(e) => onUpdate(r.key, { cond: e.target.value })}
                      style={{
                        background: "var(--ink-1)",
                        border: "1px solid var(--line-1)",
                        borderRadius: "var(--radius)",
                        color: "var(--bone-3)",
                        fontFamily: "var(--mono)",
                        fontSize: 10.5,
                        padding: "3px 5px",
                        outline: "none",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {CONDITIONS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                    {/* finish */}
                    <select
                      value={r.finish}
                      onChange={(e) => onUpdate(r.key, { finish: e.target.value })}
                      style={{
                        background: "var(--ink-1)",
                        border: "1px solid var(--line-1)",
                        borderRadius: "var(--radius)",
                        color: r.finish === "foil" ? "oklch(0.85 0.10 75)" : "var(--bone-3)",
                        fontFamily: "var(--mono)",
                        fontSize: 10.5,
                        padding: "3px 5px",
                        outline: "none",
                        letterSpacing: "0.05em",
                      }}
                    >
                      <option value="nonfoil">Nonfoil</option>
                      <option value="foil">Foil</option>
                    </select>
                  </div>
                </div>
                <input
                  className="qty-input"
                  type="number"
                  min="1"
                  max="99"
                  value={r.qty}
                  onChange={(e) => onUpdate(r.key, { qty: Math.max(1, Math.min(99, Number(e.target.value) || 1)) })}
                />
                <div className="trade-item__price">{fmtUsd(unit * r.qty)}</div>
                <button type="button" className="trade-item__remove" onClick={() => onRemove(r.key)} aria-label="Remove"><IconX /></button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

window.TradeBalancer = TradeBalancer;
