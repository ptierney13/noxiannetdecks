// Main app — hash-based router + tweaks integration.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "blood",
  "density": "balanced",
  "tileStyle": "grid",
  "navStyle": "editorial",
  "domainTreatment": "hybrid"
}/*EDITMODE-END*/;

function useHashRoute() {
  const [route, setRoute] = React.useState(() => parseHash(window.location.hash));
  React.useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  const navigate = React.useCallback((path, replace = false) => {
    const target = `#${path}`;
    if (replace) {
      window.history.replaceState(null, "", target);
      setRoute(parseHash(target));
    } else {
      window.location.hash = path;
    }
  }, []);
  return [route, navigate];
}

function parseHash(hash) {
  const raw = (hash || "#/").replace(/^#/, "");
  const [pathname, search = ""] = raw.split("?");
  const segs = pathname.split("/").filter(Boolean);
  if (segs.length === 0) return { id: "home", path: "/" };
  if (segs[0] === "cards" && segs.length === 1) {
    return { id: "cards", path: "/cards", query: new URLSearchParams(search).get("q") ?? "" };
  }
  if (segs[0] === "cards" && segs.length === 2) {
    return { id: "card-detail", path: pathname, cardId: decodeURIComponent(segs[1]) };
  }
  if (segs[0] === "trade") return { id: "trade", path: "/trade" };
  if (segs[0] === "tier")  return { id: "tier",  path: "/tier" };
  if (segs[0] === "decks") return { id: "decks", path: "/decks" };
  return { id: "not-found", path: pathname };
}

function routeSection(route) {
  if (route.id === "card-detail" || route.id === "cards") return "cards";
  return route.id;
}

function App() {
  const [route, navigate] = useHashRoute();
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-density", t.density);
  }, [t.density]);

  // accent variation
  React.useEffect(() => {
    const root = document.documentElement;
    const accents = {
      blood: { c1: "0.30 0.10 25", c2: "0.42 0.15 25", c3: "0.52 0.18 25", c4: "0.62 0.20 25", c5: "0.74 0.16 30" },
      iron:  { c1: "0.30 0.04 35", c2: "0.42 0.06 35", c3: "0.55 0.08 35", c4: "0.65 0.10 35", c5: "0.80 0.07 40" },
      ember: { c1: "0.30 0.10 50", c2: "0.45 0.14 55", c3: "0.62 0.16 60", c4: "0.72 0.18 65", c5: "0.85 0.14 65" },
    };
    const a = accents[t.accent] ?? accents.blood;
    root.style.setProperty("--blood-1", `oklch(${a.c1})`);
    root.style.setProperty("--blood-2", `oklch(${a.c2})`);
    root.style.setProperty("--blood-3", `oklch(${a.c3})`);
    root.style.setProperty("--blood-4", `oklch(${a.c4})`);
    root.style.setProperty("--blood-5", `oklch(${a.c5})`);
  }, [t.accent]);

  const section = routeSection(route);

  return (
    <div className="app-shell">
      <TopNav route={section} onNavigate={navigate} />

      {route.id === "home" && <Home onNavigate={navigate} />}
      {route.id === "cards" && (
        <SearchView
          query={route.query}
          onNavigate={navigate}
          tweaks={t}
        />
      )}
      {route.id === "card-detail" && <CardDetail cardId={route.cardId} onNavigate={navigate} />}
      {route.id === "trade" && <TradeBalancer onNavigate={navigate} />}
      {route.id === "tier" && <Placeholder title="Tier list" description="Drag-rank decks and cards." onNavigate={navigate} />}
      {route.id === "decks" && <Placeholder title="Deck explorer" description="Events, top decks, legend archetypes." onNavigate={navigate} />}
      {route.id === "not-found" && <Placeholder title="Off the path" description="That route doesn't exist." onNavigate={navigate} />}

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme" />
        <TweakRadio
          label="Accent"
          value={t.accent}
          options={["blood", "iron", "ember"]}
          onChange={(v) => setTweak("accent", v)}
        />

        <TweakSection label="Layout" />
        <TweakRadio
          label="Density"
          value={t.density}
          options={["dense", "balanced", "spacious"]}
          onChange={(v) => setTweak("density", v)}
        />
        <TweakRadio
          label="Card tile"
          value={t.tileStyle}
          options={["grid", "compact", "list"]}
          onChange={(v) => setTweak("tileStyle", v)}
        />

        <TweakSection label="Quick nav" />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {NAV_ITEMS.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => navigate(it.path)}
              style={{
                textAlign: "left",
                background: "transparent",
                border: "1px solid var(--line-1)",
                color: "var(--bone-2)",
                padding: "8px 10px",
                borderRadius: "var(--radius)",
                fontFamily: "var(--mono)",
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              → {it.label}
            </button>
          ))}
        </div>
      </TweaksPanel>
    </div>
  );
}

function Placeholder({ title, description, onNavigate }) {
  return (
    <div className="page">
      <section className="section" style={{ paddingTop: 80 }}>
        <div className="section-head">
          <div className="section-head__title">
            <span className="eyebrow">Coming soon</span>
            <h2>{title.split(" ")[0]} <em>{title.split(" ").slice(1).join(" ") || "soon"}</em></h2>
          </div>
        </div>
        <div style={{
          padding: "80px 32px",
          background: "var(--ink-2)",
          border: "1px dashed var(--line-2)",
          borderRadius: "var(--radius-lg)",
          textAlign: "center",
        }}>
          <p style={{ color: "var(--bone-2)", maxWidth: 520, margin: "0 auto 24px", lineHeight: 1.6 }}>
            {description} This rework focused on Home, Card search, Card detail, and Trade Balancer.
          </p>
          <button type="button" className="btn btn--primary" onClick={() => onNavigate("/")}>← Back home</button>
        </div>
      </section>
      <Footer />
    </div>
  );
}

// nav minimal variant via class
const observer = new MutationObserver(() => {});

// Style hook for nav style
function applyNavStyle() {
  // handled inline / not needed — placeholder
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
