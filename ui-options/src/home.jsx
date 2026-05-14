// Home — Manavault-style hero with a Noxian backdrop placeholder + tool tiles.

function Home({ onNavigate }) {
  const [query, setQuery] = React.useState("");
  const submit = (e) => { e.preventDefault(); onNavigate(`/cards?q=${encodeURIComponent(query)}`); };

  return (
    <div className="page page--full">
      {/* HERO */}
      <section className="hero" aria-label="Hero">
        <div className="hero__bg" aria-hidden="true" />
        <span className="hero__placeholder-note">↳ drop a Noxian hero image here</span>

        <div className="hero__content">
          <div className="hero__copy">
            <div className="hero__eyebrow">
              <span className="eyebrow">A Riftbound archive</span>
            </div>
            <h1 className="hero__title">
              The <em>Noxian</em><br/>Netdeck Index.
            </h1>
            <p className="hero__sub">
              A reference for every card, printing, and price in Riftbound — searchable with the same query DSL the pros use, and built for the late-night brewer.
            </p>

            <form className="hero-search" onSubmit={submit}>
              <span className="hero-search__icon"><IconSearch size={18} /></span>
              <input
                className="hero-search__input"
                placeholder="t:champion d:fury energy>=4"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              <button type="submit" className="hero-search__btn">Search</button>
            </form>
            <div className="hero-search__hint">
              <span>Try:</span>
              <button type="button" className="hero-search__chip" onClick={() => onNavigate("/cards?q=t:champion+d:fury")}>t:champion d:fury</button>
              <button type="button" className="hero-search__chip" onClick={() => onNavigate("/cards?q=name:darius")}>name:darius</button>
              <button type="button" className="hero-search__chip" onClick={() => onNavigate("/cards?q=energy>=6+is:foil")}>energy≥6 is:foil</button>
              <button type="button" className="hero-search__chip" onClick={() => onNavigate("/cards?q=set:OGN")}>set:OGN</button>
            </div>
          </div>

          <aside className="hero__stats" aria-label="Archive stats">
            <div className="hero__stat">
              <span className="hero__stat-value">1,247</span>
              <span className="hero__stat-label">Cards indexed</span>
            </div>
            <div className="hero__stat">
              <span className="hero__stat-value">3</span>
              <span className="hero__stat-label">Sets · OGN · SFD · UNL</span>
            </div>
            <div className="hero__stat">
              <span className="hero__stat-value">2h&nbsp;ago</span>
              <span className="hero__stat-label">Latest price sync</span>
            </div>
          </aside>
        </div>
      </section>

      <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "0 var(--page-pad)" }}>
        {/* TOOLS */}
        <section className="section" aria-labelledby="tools">
          <div className="section-head">
            <div className="section-head__title">
              <span className="eyebrow">The Tools</span>
              <h2 id="tools">Brew, <em>balance</em>, prowl.</h2>
            </div>
            <span className="mono faint">04 surfaces</span>
          </div>

          <div className="tools-grid">
            <button type="button" className="tool-tile" onClick={() => onNavigate("/cards")}>
              <span className="tool-tile__index">01 — Card Search</span>
              <div className="tool-tile__title">A query <em>language</em> built for cards.</div>
              <p className="tool-tile__desc">Scryfall-style search across name, domain, energy, keywords, and rulings. Aliases, ranges, wildcards, negation.</p>
              <span className="tool-tile__arrow">Open <IconArrowRight /></span>
            </button>

            <button type="button" className="tool-tile" onClick={() => onNavigate("/cards/darius-trifarian")}>
              <span className="tool-tile__index">02 — Card Detail</span>
              <div className="tool-tile__title">Printings, <em>rulings</em>, and a real price chart.</div>
              <p className="tool-tile__desc">Foil/nonfoil splits, condition rows, 30-day history. Compare across alt arts and showcase frames.</p>
              <span className="tool-tile__arrow">Open <IconArrowRight /></span>
            </button>

            <button type="button" className="tool-tile" onClick={() => onNavigate("/trade")}>
              <span className="tool-tile__index">03 — Trade Balancer</span>
              <div className="tool-tile__title">Settle a <em>fair</em> trade in thirty seconds.</div>
              <p className="tool-tile__desc">Drop cards into either side, pick conditions, watch the balance tip. Verdicts based on TCGplayer market.</p>
              <span className="tool-tile__arrow">Open <IconArrowRight /></span>
            </button>

            <button type="button" className="tool-tile" onClick={() => onNavigate("/tier")}>
              <span className="tool-tile__index">04 — Tier list</span>
              <div className="tool-tile__title">Drag, rank, <em>ship it</em>.</div>
              <p className="tool-tile__desc">Community-driven tier lists with image previews, draggable rows, and shareable snapshots.</p>
              <span className="tool-tile__arrow">Open <IconArrowRight /></span>
            </button>
          </div>
        </section>

        {/* SPOTLIGHT DECKS */}
        <section className="section" aria-labelledby="spotlight">
          <div className="section-head">
            <div className="section-head__title">
              <span className="eyebrow">From the meta</span>
              <h2 id="spotlight">This week's <em>spotlight</em> decks.</h2>
            </div>
            <button type="button" className="btn btn--ghost" onClick={() => onNavigate("/decks")}>All decks <IconArrowRight /></button>
          </div>

          <div className="spotlight-grid">
            {window.FEATURED_DECKS.map((d, i) => (
              <article key={d.id} className={`spotlight-card${i === 0 ? " spotlight-card--lead" : ""}`}>
                <div className="spotlight-card__art" aria-hidden="true">
                  {/* domain wash */}
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    background: i === 0
                      ? "radial-gradient(circle at 30% 40%, var(--d-fury-wash), transparent 60%), radial-gradient(circle at 80% 70%, var(--d-fury-wash), transparent 50%)"
                      : i === 1
                        ? "radial-gradient(circle at 30% 40%, var(--d-calm-wash), transparent 60%), radial-gradient(circle at 70% 70%, var(--d-body-wash), transparent 50%)"
                        : "radial-gradient(circle at 50% 40%, var(--d-order-wash), transparent 60%)",
                  }} />
                  <div style={{
                    position: "absolute", left: 20, bottom: 16,
                    display: "flex", gap: 6, alignItems: "center"
                  }}>
                    {d.domain.split("/").map((dom) => <Rune key={dom} domain={dom.trim()} size="lg" />)}
                  </div>
                </div>
                <div className="spotlight-card__deck">{d.name.split(" — ")[0]}{d.name.includes("—") ? <> — <em>{d.name.split(" — ")[1]}</em></> : null}</div>
                <p style={{ color: "var(--bone-2)", fontSize: 13.5, lineHeight: 1.55 }}>{d.note}</p>
                <div className="spotlight-card__meta">
                  <span>{d.format}</span>
                  <span style={{ color: "var(--blood-5)" }}>{d.winrate} wr</span>
                  <span>{fmtUsd(d.price)}</span>
                </div>
                <div className="spotlight-card__pilot">
                  <span className="pilot-avatar">{d.pilot}</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    <span style={{ fontSize: 12.5, color: "var(--bone-3)", fontWeight: 600 }}>Piloted by {d.pilot}</span>
                    <span className="mono faint" style={{ fontSize: 10.5 }}>2 days ago · 32 wins</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* RECENT CARDS — uses real card art as a teaser */}
        <section className="section" aria-labelledby="recent">
          <div className="section-head">
            <div className="section-head__title">
              <span className="eyebrow">Recently added</span>
              <h2 id="recent">New <em>printings</em> & promos.</h2>
            </div>
            <button type="button" className="btn btn--ghost" onClick={() => onNavigate("/cards")}>Browse all <IconArrowRight /></button>
          </div>
          <div className="card-grid">
            {window.CARDS.slice(0, 8).map((c) => (
              <CardTile key={c.id} card={c} onOpen={() => onNavigate(`/cards/${c.id}`)} />
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}

window.Home = Home;
