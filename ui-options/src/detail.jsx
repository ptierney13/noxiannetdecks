// Card Detail — large art on left, info + price history on right.

function CardDetail({ cardId, onNavigate }) {
  const card = React.useMemo(
    () => window.CARDS.find((c) => c.id === cardId) ?? window.CARDS[0],
    [cardId]
  );

  const [printingIdx, setPrintingIdx] = React.useState(0);

  if (!card) return <div className="page"><p>Card not found.</p></div>;

  const history = window.priceHistory(card, 30);

  // Build printing list — main + alt art when present
  const printings = [{ label: "Normal", img: card.img }];
  if (card.altArt) printings.push({ label: "Showcase", img: card.altArt });

  const activeImg = printings[printingIdx]?.img ?? card.img;

  // Render name with optional italic chunk after em-dash
  const renderName = () => {
    if (card.name.includes(" — ")) {
      const [a, b] = card.name.split(" — ");
      return <>{a} — <em>{b}</em></>;
    }
    return card.name;
  };

  return (
    <div className="page">
      <div className="detail-shell">
        {/* LEFT: art */}
        <div className="detail-art">
          <div className="detail-art__frame">
            <img src={activeImg} alt={card.name} />
          </div>
          {printings.length > 1 && (
            <div className="detail-printings" role="tablist" aria-label="Printings">
              {printings.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-pressed={i === printingIdx}
                  onClick={() => setPrintingIdx(i)}
                  title={p.label}
                >
                  <img src={p.img} alt={p.label} />
                </button>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button type="button" className="btn btn--ghost" style={{ flex: 1 }}>Add to deck</button>
            <button type="button" className="btn btn--ghost" style={{ flex: 1 }}>Add to trade</button>
          </div>
          <p className="mono faint" style={{ fontSize: 11, marginTop: 14, lineHeight: 1.6 }}>
            Art by {card.artist ?? "Six More Vodka"} · {card.setLabel} · #{card.num}
          </p>
        </div>

        {/* RIGHT: detail */}
        <div>
          <div className="detail-header">
            <button type="button" className="detail-back" onClick={() => onNavigate("/cards")}>← Back to search</button>
            <div className="detail-typeline">
              {[card.type, card.supertype].filter(Boolean).join(" · ")}
              {card.tags?.length > 0 && <> · {card.tags.join(" · ")}</>}
            </div>
            <h1 className="detail-name">{renderName()}</h1>
            <div className="detail-tags" style={{ marginTop: 14, gap: 8 }}>
              {card.domains.map((d) => (
                <span key={d} className="tag" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Rune domain={d} /> {d}
                </span>
              ))}
              <span className="tag">{card.rarity}</span>
              <span className="tag">{card.set} · {card.num}</span>
            </div>
          </div>

          <div className="detail-stats">
            <div className="stat-cell">
              <span className="stat-cell__label">Cost</span>
              <span className="stat-cell__value">{renderCost(card.cost) ?? "—"}</span>
            </div>
            <div className="stat-cell">
              <span className="stat-cell__label">Energy</span>
              <span className="stat-cell__value">{card.energy ?? "—"}</span>
            </div>
            <div className="stat-cell">
              <span className="stat-cell__label">Might</span>
              <span className="stat-cell__value">{card.might ?? "—"}{card.might != null && <span className="stat-cell__suffix">/{card.power ?? 0}</span>}</span>
            </div>
            <div className="stat-cell">
              <span className="stat-cell__label">Type</span>
              <span className="stat-cell__value" style={{ fontSize: 20 }}>{card.type}</span>
            </div>
          </div>

          <div className="detail-rules">
            {renderRulesText(card.text) || <span className="faint">No rules text.</span>}
            {card.flavor && <em className="flavor">"{card.flavor}"</em>}
          </div>

          {/* PRICE */}
          <section style={{ marginTop: 40 }}>
            <div className="section-head" style={{ marginBottom: 18 }}>
              <div className="section-head__title">
                <span className="eyebrow">Market · TCGplayer</span>
                <h2 style={{ fontSize: 32 }}>The <em>price</em> of war.</h2>
              </div>
              <span className="mono faint">Synced 2h ago</span>
            </div>

            <div className="price-section">
              <div className="price-card">
                <span className="price-card__label">Near Mint · Nonfoil</span>
                <span className="price-card__value">
                  {fmtUsd(card.price?.nm)}
                  {card.price?.change != null && (
                    <span className={`price-card__delta ${card.price.change > 0 ? "pos" : card.price.change < 0 ? "neg" : ""}`}>
                      {fmtPct(card.price.change)}
                    </span>
                  )}
                </span>
                <div className="price-card__meta">
                  <span>LP · {fmtUsd(card.price?.lp)}</span>
                  <span>30-day low · {fmtUsd((card.price?.nm ?? 0) * 0.88)}</span>
                  <span>30-day high · {fmtUsd((card.price?.nm ?? 0) * 1.14)}</span>
                </div>
              </div>
              <div className="price-card">
                <span className="price-card__label">Near Mint · Foil</span>
                <span className="price-card__value">
                  {fmtUsd(card.price?.foilNm)}
                  <span className="price-card__delta pos">{fmtPct((card.price?.change ?? 0) * 1.4)}</span>
                </span>
                <div className="price-card__meta">
                  <span>Showcase · {fmtUsd((card.price?.foilNm ?? 0) * 1.8)}</span>
                  <span>30-day low · {fmtUsd((card.price?.foilNm ?? 0) * 0.92)}</span>
                  <span>30-day high · {fmtUsd((card.price?.foilNm ?? 0) * 1.22)}</span>
                </div>
              </div>
            </div>

            <div className="price-chart">
              <div className="price-chart__head">
                <h3 className="price-chart__title">30-day <em>history</em></h3>
                <div className="price-chart__legend">
                  <span><span className="price-chart__legend-dot" style={{ background: "var(--blood-3)" }} />NM Nonfoil</span>
                  <span><span className="price-chart__legend-dot" style={{ background: "var(--d-order)" }} />NM Foil</span>
                </div>
              </div>
              <PriceChart card={card} />
            </div>
          </section>

          {/* RELATED PRINTINGS / SIMILAR */}
          <section style={{ marginTop: 40 }}>
            <div className="section-head" style={{ marginBottom: 18 }}>
              <div className="section-head__title">
                <span className="eyebrow">Also in this domain</span>
                <h2 style={{ fontSize: 32 }}>Allies & <em>rivals</em>.</h2>
              </div>
            </div>
            <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
              {window.CARDS
                .filter((c) => c.id !== card.id && c.domains.some((d) => card.domains.includes(d)))
                .slice(0, 8)
                .map((c) => <CardTile key={c.id} card={c} onOpen={() => onNavigate(`/cards/${c.id}`)} />)
              }
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function PriceChart({ card }) {
  const [hover, setHover] = React.useState(null);
  const history = window.priceHistory(card, 30);
  if (!history.length || card.price?.nm == null) {
    return <div style={{ padding: 30, textAlign: "center", color: "var(--bone-1)", fontFamily: "var(--mono)", fontSize: 12 }}>No history available.</div>;
  }

  const w = 760, h = 260;
  const M = { l: 56, r: 20, t: 18, b: 36 };
  const cw = w - M.l - M.r, ch = h - M.t - M.b;

  const nmSeries = history.map((p) => p.v);
  const foilSeries = history.map((p) => p.v * ((card.price?.foilNm ?? card.price?.nm ?? 1) / (card.price?.nm ?? 1)));
  const allVals = [...nmSeries, ...foilSeries];
  const min = Math.min(...allVals) * 0.95;
  const max = Math.max(...allVals) * 1.05;
  const xFor = (i) => M.l + (i / (history.length - 1)) * cw;
  const yFor = (v) => M.t + ch - ((v - min) / (max - min)) * ch;

  const pathFor = (series) => series.map((v, i) => `${i === 0 ? "M" : "L"}${xFor(i).toFixed(1)},${yFor(v).toFixed(1)}`).join(" ");
  const areaFor = (series) => `${pathFor(series)} L${xFor(series.length - 1)},${M.t + ch} L${xFor(0)},${M.t + ch} Z`;

  const yTicks = 4;
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) => min + ((max - min) * i) / yTicks);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="30-day price history">
      <defs>
        <linearGradient id="grad-nm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--blood-3)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--blood-3)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="grad-foil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--d-order)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--d-order)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* gridlines */}
      {tickVals.map((v, i) => (
        <g key={i}>
          <line x1={M.l} x2={M.l + cw} y1={yFor(v)} y2={yFor(v)} stroke="var(--line-1)" strokeDasharray="2 4" />
          <text x={M.l - 10} y={yFor(v) + 4} textAnchor="end" style={{ fill: "var(--bone-1)", fontFamily: "var(--mono)", fontSize: 10 }}>
            ${v.toFixed(2)}
          </text>
        </g>
      ))}

      {/* date axis (every 5 days) */}
      {history.map((p, i) => (i % 5 === 0 || i === history.length - 1) && (
        <text key={i} x={xFor(i)} y={h - 10} textAnchor="middle" style={{ fill: "var(--bone-1)", fontFamily: "var(--mono)", fontSize: 10 }}>
          D−{29 - i}
        </text>
      )) }

      {/* foil area + line */}
      <path d={areaFor(foilSeries)} fill="url(#grad-foil)" />
      <path d={pathFor(foilSeries)} fill="none" stroke="var(--d-order)" strokeWidth="1.5" />

      {/* nm area + line */}
      <path d={areaFor(nmSeries)} fill="url(#grad-nm)" />
      <path d={pathFor(nmSeries)} fill="none" stroke="var(--blood-3)" strokeWidth="2.2" />

      {/* dots */}
      {history.map((p, i) => (
        <circle
          key={i}
          cx={xFor(i)} cy={yFor(p.v)} r={hover === i ? 4 : 2.5}
          fill="var(--blood-3)"
          stroke="var(--ink-1)"
          strokeWidth="1.5"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
          style={{ cursor: "pointer" }}
        />
      ))}

      {/* tooltip */}
      {hover != null && (() => {
        const tx = xFor(hover), ty = yFor(history[hover].v);
        const label = `D−${29 - hover}  $${history[hover].v.toFixed(2)}`;
        const tw = 130, th = 36;
        const tlx = Math.max(M.l, Math.min(tx - tw / 2, w - tw - M.r));
        const tly = ty - th - 8 < M.t ? ty + 10 : ty - th - 8;
        return (
          <g style={{ pointerEvents: "none" }}>
            <line x1={tx} x2={tx} y1={M.t} y2={M.t + ch} stroke="var(--blood-3)" strokeOpacity="0.4" strokeDasharray="3 3" />
            <rect x={tlx} y={tly} width={tw} height={th} rx={3} fill="var(--ink-3)" stroke="var(--blood-3)" />
            <text x={tlx + tw / 2} y={tly + 22} textAnchor="middle" style={{ fill: "var(--bone-4)", fontFamily: "var(--mono)", fontSize: 12 }}>
              {label}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}

window.CardDetail = CardDetail;
