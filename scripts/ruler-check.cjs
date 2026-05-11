/**
 * Overlays horizontal ruler lines at 5% increments on the card image.
 * Helps visually calibrate hotspot positions.
 * Run: node scripts/ruler-check.cjs
 */
const { chromium } = require("playwright");
const { spawn }    = require("child_process");
const http         = require("http");
const path         = require("path");
const fs           = require("fs");

const PORT = 5177;
const BASE = `http://localhost:${PORT}`;
const ROOT = path.resolve(__dirname, "..");
const OUT  = path.join(__dirname, "out");
fs.mkdirSync(OUT, { recursive: true });

async function waitForServer(url, retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      await new Promise((res, rej) => {
        http.get(url, r => (r.statusCode < 500 ? res() : rej())).on("error", rej);
      });
      return;
    } catch { await new Promise(r => setTimeout(r, 500)); }
  }
  throw new Error(`Server never ready`);
}

(async () => {
  const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"],
    { cwd: path.join(ROOT, "frontend"), shell: true, stdio: "pipe" });

  await waitForServer(BASE);

  const browser = await chromium.launch();
  const page    = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 1800 });

  await page.route("**/api/**", async route => {
    const url = route.request().url();
    if (url.includes("features")) {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ fields: [], syntax: [], fieldGuides: [], syntaxGuides: [] }) });
    } else {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    }
  });

  await page.goto(`${BASE}/cards`);
  await page.locator('button[aria-label*="Search by Card Element"]').click();
  await page.waitForSelector(".csg-card-frame img");
  await page.waitForTimeout(800);

  // Add ruler lines at every 5% of card height + labels, and show current hotspot positions
  await page.addStyleTag({ content: `
    /* Show all hotspots at once */
    .csg-hotspot {
      opacity: 1 !important;
      border: 2px solid rgba(255,255,255,0.5) !important;
      background: rgba(255,255,255,0.08) !important;
    }
    .csg-hotspot[title="Type line"]   { border-color:#f97316 !important; background:#f9731622 !important; }
    .csg-hotspot[title="Card type"]   { border-color:#f97316 !important; background:#f9731644 !important; }
    .csg-hotspot[title="Supertype"]   { border-color:#f97316 !important; background:#f9731644 !important; }
    .csg-hotspot[title="Tag"]         { border-color:#fb923c !important; background:#fb923c44 !important; }
    .csg-hotspot[title="Name"]        { border-color:#8b5cf6 !important; background:#8b5cf633 !important; }
    .csg-hotspot[title="Cost"]        { border-color:#f59e0b !important; background:#f59e0b33 !important; }
    .csg-hotspot[title="Energy"]      { border-color:#3b82f6 !important; background:#3b82f633 !important; }
    .csg-hotspot[title="Power"]       { border-color:#10b981 !important; background:#10b98133 !important; }
    .csg-hotspot[title="Might"]       { border-color:#10b981 !important; background:#10b98133 !important; }
    .csg-hotspot[title="Keyword"]     { border-color:#ec4899 !important; background:#ec489933 !important; }
    .csg-hotspot[title="Rules text"]  { border-color:#6366f1 !important; background:#6366f122 !important; }
    .csg-hotspot[title="Set"]         { border-color:#64748b !important; background:#64748b44 !important; }
    .csg-hotspot[title="Rarity"]      { border-color:#c9813a !important; background:#c9813a44 !important; }
    .csg-hotspot[title="Collector #"] { border-color:#94a3b8 !important; background:#94a3b844 !important; }
    .csg-hotspot[title="Artist"]      { border-color:#e2e8f0 !important; background:#e2e8f022 !important; }
  `});

  // Inject ruler lines via JS
  await page.evaluate(() => {
    const frame = document.querySelector(".csg-card-frame");
    if (!frame) return;
    // Ruler lines at every 5%
    for (let pct = 5; pct < 100; pct += 5) {
      const line = document.createElement("div");
      line.style.cssText = `
        position: absolute; left: 0; right: 0;
        top: ${pct}%; height: 1px;
        background: rgba(255,255,0,0.6);
        z-index: 100; pointer-events: none;
      `;
      const label = document.createElement("span");
      label.textContent = `${pct}%`;
      label.style.cssText = `
        position: absolute; right: 2px; top: -10px;
        font-size: 9px; color: #ff0; font-family: monospace;
        background: rgba(0,0,0,0.6); padding: 0 2px; border-radius: 2px;
        line-height: 10px;
      `;
      line.appendChild(label);
      frame.appendChild(line);
    }
  });

  const box = await page.locator(".csg-card-frame").boundingBox();
  const { x, y, width: w, height: h } = box;

  // Full card with rulers
  await page.screenshot({
    path: path.join(OUT, "ruler-full.png"),
    clip: { x: x - 4, y, width: w + 8, height: h }
  });
  console.log("ruler-full.png saved");

  // Lower section 50-100%
  await page.screenshot({
    path: path.join(OUT, "ruler-lower.png"),
    clip: { x: x - 4, y: y + h * 0.50, width: w + 8, height: h * 0.52 }
  });
  console.log("ruler-lower.png saved");

  // Mid-lower section 55-80%
  await page.screenshot({
    path: path.join(OUT, "ruler-mid.png"),
    clip: { x: x - 4, y: y + h * 0.55, width: w + 8, height: h * 0.30 }
  });
  console.log("ruler-mid.png saved");

  await browser.close();
  server.kill();
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
