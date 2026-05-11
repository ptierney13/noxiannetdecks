/**
 * Visual accuracy check for the Card Search Guide hotspot overlays.
 *
 * Usage:
 *   node scripts/card-guide-check.js [mode]
 *
 * Modes:
 *   debug     (default) — render all hotspots simultaneously with colour-coded
 *                         outlines + labels so you can see their coverage
 *   normal    — screenshot the guide as a real user sees it (no extra CSS)
 *   measure   — dump the bounding boxes of every hotspot and the card image
 *               as JSON; useful for precise offset calculations
 *
 * The script builds the frontend, serves it on a free port, takes the
 * screenshots, then stops everything.  Output PNGs land in scripts/out/.
 */

const { chromium } = require("playwright");
const { execSync, spawn } = require("child_process");
const http = require("http");
const path = require("path");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "..");
const OUT  = path.join(__dirname, "out");
fs.mkdirSync(OUT, { recursive: true });

const MODE = process.argv[2] || "debug";
const PORT = 5174;
const BASE = `http://localhost:${PORT}`;

// ── Build ────────────────────────────────────────────────────────────────────
console.log("Building frontend…");
execSync("npm run build -w @noxiannet/frontend", { cwd: ROOT, stdio: "inherit" });

// ── Serve ────────────────────────────────────────────────────────────────────
console.log(`Starting preview on ${BASE}…`);
const server = spawn(
  "npx", ["vite", "preview", "--port", String(PORT), "--strictPort"],
  { cwd: path.join(ROOT, "frontend"), shell: true, stdio: "pipe" }
);

async function waitForServer(url, retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      await new Promise((res, rej) => {
        http.get(url, r => (r.statusCode < 500 ? res() : rej())).on("error", rej);
      });
      return;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error(`Server at ${url} never became ready`);
}

// ── Debug CSS — show every hotspot at once with zone colours ─────────────────
const ZONE_COLOURS = {
  cost:             "#f59e0b",
  energy:           "#3b82f6",
  power:            "#10b981",
  might:            "#10b981",
  name:             "#8b5cf6",
  typeline:         "#ef4444",
  cardtype:         "#f97316",
  supertype:        "#f97316",
  "tag-mech":       "#f97316",
  "tag-blitzcrank": "#f97316",
  "tag-zaun":       "#f97316",
  keyword:          "#ec4899",
  text:             "#6366f1",
  set:              "#64748b",
  rarity:           "#c9813a",
  number:           "#64748b",
  artist:           "#64748b",
};

function buildDebugCSS() {
  const base = `
    .csg-hotspot {
      border: 2px solid rgba(255,255,255,0.6) !important;
      background: rgba(255,255,255,0.08) !important;
      opacity: 1 !important;
    }
  `;
  // Per-zone colours via aria-label prefix matching
  const perZone = Object.entries(ZONE_COLOURS).map(([id, colour]) => `
    .csg-hotspot[aria-label^="${ZONES_LABEL[id] ?? id}"][title="${ZONES_TITLE[id] ?? id}"] {
      border-color: ${colour} !important;
      background: ${colour}33 !important;
    }
  `).join("\n");
  return base;  // simplified: just use uniform overlay
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  await waitForServer(BASE);
  console.log("Server ready. Launching browser…");

  const browser = await chromium.launch();
  const page    = await browser.newPage();

  // Tall viewport so the full card is always in view
  await page.setViewportSize({ width: 1280, height: 1600 });

  // Mock the API so we don't need the backend running
  await page.route("**/api/**", async route => {
    const url = route.request().url();
    if (url.includes("/api/query/features")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ fields: [], syntax: [], fieldGuides: [], syntaxGuides: [] }),
      });
    } else if (url.includes("/api/metadata")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ sets: [], rarities: [] }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ cards: [], total: 0, diagnostics: [] }),
      });
    }
  });

  await page.goto(`${BASE}/cards`);

  // Open the "Search by Card Element" collapsible
  const toggleBtn = page.locator('button[aria-label*="Search by Card Element"]');
  await toggleBtn.waitFor({ timeout: 8000 });
  await toggleBtn.click();

  // Wait for card image to load
  await page.waitForSelector(".csg-card-frame img", { timeout: 8000 });
  await page.waitForTimeout(600);   // let image fully paint

  if (MODE === "measure") {
    // ── MEASURE MODE: dump bounding boxes ──────────────────────────────────
    const data = await page.evaluate(() => {
      const cardImg = document.querySelector(".csg-card-frame");
      const hotspots = [...document.querySelectorAll(".csg-hotspot")];
      const r = el => { const b = el.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
      return {
        card: r(cardImg),
        hotspots: hotspots.map(el => ({ id: el.title, ...r(el) })),
      };
    });
    const out = path.join(OUT, "measure.json");
    fs.writeFileSync(out, JSON.stringify(data, null, 2));
    console.log("Bounding boxes written to", out);
    console.log(JSON.stringify(data, null, 2));

  } else {
    // ── SCREENSHOT MODE ────────────────────────────────────────────────────
    if (MODE === "debug") {
      // Show every hotspot outlined simultaneously, each zone a distinct colour
      await page.addStyleTag({ content: `
        /* Make all hotspots visible at once */
        .csg-hotspot {
          opacity: 1 !important;
          border-width: 2px !important;
          border-style: solid !important;
        }
        /* Colour by aria-label keyword so each category is distinct */
        .csg-hotspot[title="Cost"]        { border-color:#f59e0b; background:#f59e0b22; }
        .csg-hotspot[title="Energy"]      { border-color:#3b82f6; background:#3b82f622; }
        .csg-hotspot[title="Power"]       { border-color:#10b981; background:#10b98122; }
        .csg-hotspot[title="Might"]       { border-color:#10b981; background:#10b98122; }
        .csg-hotspot[title="Name"]        { border-color:#8b5cf6; background:#8b5cf622; }
        .csg-hotspot[title="Type line"]   { border-color:#ef4444; background:#ef444422; }
        .csg-hotspot[title="Card type"]   { border-color:#f97316; background:#f9731622; }
        .csg-hotspot[title="Supertype"]   { border-color:#f97316; background:#f9731622; }
        .csg-hotspot[title="Tag"]         { border-color:#f97316; background:#f9731622; }
        .csg-hotspot[title="Keyword"]     { border-color:#ec4899; background:#ec489922; }
        .csg-hotspot[title="Rules text"]  { border-color:#6366f1; background:#6366f122; }
        .csg-hotspot[title="Set"]         { border-color:#64748b; background:#64748b22; }
        .csg-hotspot[title="Rarity"]      { border-color:#c9813a; background:#c9813a22; }
        .csg-hotspot[title="Collector #"] { border-color:#64748b; background:#64748b22; }
        .csg-hotspot[title="Artist"]      { border-color:#94a3b8; background:#94a3b822; }
      `});
    }

    // Full-page screenshot
    const fullOut = path.join(OUT, `${MODE}-full.png`);
    await page.screenshot({ path: fullOut });
    console.log("Full screenshot →", fullOut);

    // Cropped to just the card guide section
    const frame = page.locator(".csg-card-frame");
    const wrap  = page.locator(".csg-wrap");
    const wrapBox = await wrap.boundingBox();
    if (wrapBox) {
      const cropOut = path.join(OUT, `${MODE}-guide.png`);
      await page.screenshot({
        path: cropOut,
        clip: { x: wrapBox.x - 8, y: wrapBox.y - 8, width: wrapBox.width + 16, height: wrapBox.height + 16 },
      });
      console.log("Guide crop →", cropOut);
    }

    // Card-only crop
    const cardBox = await frame.boundingBox();
    if (cardBox) {
      const cardOut = path.join(OUT, `${MODE}-card.png`);
      await page.screenshot({
        path: cardOut,
        clip: { x: cardBox.x, y: cardBox.y, width: cardBox.width, height: cardBox.height },
      });
      console.log("Card crop →", cardOut);
    }
  }

  await browser.close();
  server.kill();
  process.exit(0);
})().catch(err => {
  console.error(err);
  server.kill();
  process.exit(1);
});
