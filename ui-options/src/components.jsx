// Shared UI primitives: nav, layout, rune icons, symbol rendering.

const { useState, useEffect, useRef, useMemo } = React;

// ───── Domain mapping ─────
const DOMAIN_INITIAL = {
  Fury: "F", Calm: "C", Mind: "M", Body: "B", Chaos: "H", Order: "O",
};
const DOMAIN_NAME_FROM_TOKEN = {
  F: "Fury", C: "Calm", M: "Mind", B: "Body", H: "Chaos", O: "Order",
};

function Rune({ domain, size }) {
  const cls = `rune rune--${domain.toLowerCase()}${size ? ` rune--${size}` : ""}`;
  return <span className={cls} aria-label={domain}>{DOMAIN_INITIAL[domain] ?? "?"}</span>;
}

function RuneRow({ domains, size }) {
  if (!domains || !domains.length) {
    return <span className={`rune rune--neutral${size ? ` rune--${size}` : ""}`}>·</span>;
  }
  return (
    <span className="rune-row">
      {domains.map((d) => <Rune key={d} domain={d} size={size} />)}
    </span>
  );
}

function DomainDots({ domains }) {
  return (
    <span className="row-domains">
      {(domains ?? []).map((d) => (
        <span key={d} className={`dot dot--${d.toLowerCase()}`} title={d} />
      ))}
    </span>
  );
}

// ───── Cost rendering ─────
// {3}{F} → "3" badge + Fury rune.  Splits "5{F}" too.
function renderCost(cost) {
  if (cost == null) return null;
  const tokens = [];
  // Match either a leading numeric run or a {X} group
  const re = /\{([^}]+)\}|(\d+)/g;
  let m;
  while ((m = re.exec(cost)) !== null) {
    if (m[1] != null) {
      const t = m[1];
      if (/^\d+$/.test(t)) tokens.push({ kind: "n", v: t });
      else if (DOMAIN_NAME_FROM_TOKEN[t]) tokens.push({ kind: "d", v: DOMAIN_NAME_FROM_TOKEN[t] });
      else if (t === "P") tokens.push({ kind: "p" });
      else if (t.includes("/")) {
        // hybrid like B/C — show two stacked tiny runes
        const parts = t.split("/").map((c) => DOMAIN_NAME_FROM_TOKEN[c]).filter(Boolean);
        tokens.push({ kind: "hybrid", v: parts });
      } else tokens.push({ kind: "raw", v: t });
    } else if (m[2] != null) {
      tokens.push({ kind: "n", v: m[2] });
    }
  }
  if (!tokens.length) return null;
  return (
    <span className="cost-row">
      {tokens.map((t, i) => {
        if (t.kind === "n") return <span key={i} className="cost-num">{t.v}</span>;
        if (t.kind === "d") return <Rune key={i} domain={t.v} />;
        if (t.kind === "p") return <span key={i} className="rune rune--neutral" title="any">P</span>;
        if (t.kind === "hybrid") return (
          <span key={i} className="cost-hybrid">
            {t.v.map((d) => <Rune key={d} domain={d} />)}
          </span>
        );
        return <span key={i} className="cost-num">{t.v}</span>;
      })}
    </span>
  );
}

function costPlainString(cost) {
  if (cost == null) return "—";
  const re = /\{([^}]+)\}|(\d+)/g;
  let m, out = "";
  while ((m = re.exec(cost)) !== null) {
    if (m[2] != null) out += m[2];
    else if (m[1] != null) out += `{${m[1]}}`;
  }
  return out || "—";
}

// ───── Inline rules text rendering ─────
function renderRulesText(text) {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, li) => (
    <React.Fragment key={li}>
      {renderLineParts(line)}
      {li < lines.length - 1 && <br />}
    </React.Fragment>
  ));
}

function renderLineParts(line) {
  // Split keywords in brackets, costs in braces.
  const parts = [];
  const re = /\[([^\]]+)\]|\{([^}]+)\}/g;
  let last = 0, m;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) parts.push({ kind: "text", v: line.slice(last, m.index) });
    if (m[1] != null) parts.push({ kind: "kw", v: m[1] });
    else if (m[2] != null) parts.push({ kind: "cost", v: m[2] });
    last = m.index + m[0].length;
  }
  if (last < line.length) parts.push({ kind: "text", v: line.slice(last) });
  return parts.map((p, i) => {
    if (p.kind === "text") return <span key={i}>{p.v}</span>;
    if (p.kind === "kw") return <span key={i} className="kw">[{p.v}]</span>;
    if (p.kind === "cost") {
      if (DOMAIN_NAME_FROM_TOKEN[p.v]) {
        return <Rune key={i} domain={DOMAIN_NAME_FROM_TOKEN[p.v]} />;
      }
      if (p.v === "E") return <span key={i} className="inline-cost" title="Exhaust">⟲</span>;
      if (p.v === "T") return <span key={i} className="inline-cost" title="Might">↯</span>;
      return <span key={i} className="inline-cost">{p.v}</span>;
    }
    return null;
  });
}

// ───── Brand mark ─────
function BrandMark() {
  return (
    <span className="brand">
      <span className="brand__mark" aria-hidden="true" />
      <span>Noxian <em>Netdecks</em></span>
    </span>
  );
}

// ───── Top nav ─────
const NAV_ITEMS = [
  { id: "home",   label: "Home",   path: "/" },
  { id: "cards",  label: "Cards",  path: "/cards" },
  { id: "decks",  label: "Decks",  path: "/decks" },
  { id: "tier",   label: "Tier list", path: "/tier" },
  { id: "trade",  label: "Trade",  path: "/trade" },
];

function TopNav({ route, onNavigate }) {
  return (
    <header className="top-nav">
      <div className="top-nav__inner">
        <a href="#/" onClick={(e) => { e.preventDefault(); onNavigate("/"); }} style={{ textDecoration: "none" }}>
          <BrandMark />
        </a>
        <nav className="nav-links" aria-label="Primary">
          {NAV_ITEMS.map((it) => (
            <button
              key={it.id}
              type="button"
              className="nav-link"
              aria-current={route === it.id ? "page" : undefined}
              onClick={() => onNavigate(it.path)}
            >
              {it.label}
            </button>
          ))}
        </nav>
        <div className="nav-utility">
          <span className="kbd">⌘ K</span>
        </div>
      </div>
    </header>
  );
}

// ───── Icons ─────
function IconSearch({ size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
function IconArrowRight({ size = 14 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
    </svg>
  );
}
function IconGrid({ size = 14 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function IconList({ size = 14 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" />
    </svg>
  );
}
function IconImage({ size = 14 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" />
    </svg>
  );
}
function IconX({ size = 14 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}

// ───── Formatting ─────
function fmtUsd(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtPct(n) {
  if (n == null) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${Math.abs(n).toFixed(1)}%`;
}

// ───── Card tile ─────
function CardTile({ card, onOpen, density }) {
  const cost = card.cost ?? (card.energy != null ? String(card.energy) : null);
  return (
    <article
      className="card-tile"
      data-foil={card.price?.foilNm != null && !card.price?.nm ? "true" : "false"}
      onClick={() => onOpen?.(card)}
    >
      <img className="card-tile__img" src={card.img} alt={card.name} loading="lazy" />
      <div className="card-tile__overlay">
        {cost && <span className="card-tile__cost">{renderCost(card.cost)}</span>}
        {card.price?.nm != null && <span className="card-tile__price">{fmtUsd(card.price.nm)}</span>}
      </div>
      <div className="card-tile__caption">
        <span className="card-tile__name">{card.name}</span>
        <span className="card-tile__meta">
          <DomainDots domains={card.domains} />
          <span>{card.set}·{card.num}</span>
        </span>
      </div>
    </article>
  );
}

// ───── Card row (list variant) ─────
function CardRow({ card, onOpen }) {
  return (
    <article className="card-tile" onClick={() => onOpen?.(card)}>
      <img className="card-tile__img" src={card.img} alt="" loading="lazy" />
      <div className="card-tile__caption">
        <span className="card-tile__name">{card.name}</span>
        <span className="card-tile__meta">
          <span>{card.type}{card.supertype ? ` · ${card.supertype}` : ""}</span>
          <span>·</span>
          <span>{card.set} {card.num}</span>
        </span>
      </div>
      <span className="row-cost">{costPlainString(card.cost)}</span>
      <span className="row-cost" style={{ color: "var(--bone-2)" }}>{card.might != null ? `${card.might}↯` : "—"}</span>
      <DomainDots domains={card.domains} />
      <span className="row-price">{fmtUsd(card.price?.nm)}</span>
    </article>
  );
}

// ───── Spark line ─────
function Sparkline({ history, color = "var(--blood-3)", w = 80, h = 24 }) {
  if (!history?.length) return null;
  const min = Math.min(...history.map((p) => p.v));
  const max = Math.max(...history.map((p) => p.v));
  const range = Math.max(0.0001, max - min);
  const points = history.map((p, i) => {
    const x = (i / (history.length - 1)) * w;
    const y = h - ((p.v - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ───── Page footer ─────
function Footer() {
  return (
    <footer className="footer">
      <em>Noxian Netdecks</em> · fan-made search for the Riftbound TCG · prices are illustrative
    </footer>
  );
}

Object.assign(window, {
  Rune, RuneRow, DomainDots, BrandMark, TopNav, NAV_ITEMS,
  CardTile, CardRow, Sparkline, Footer,
  IconSearch, IconArrowRight, IconGrid, IconList, IconImage, IconX,
  renderCost, renderRulesText, costPlainString,
  fmtUsd, fmtPct,
  DOMAIN_INITIAL, DOMAIN_NAME_FROM_TOKEN,
});
