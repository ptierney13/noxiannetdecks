/**
 * Takes targeted crops of the card zones for close inspection.
 * Run: node scripts/crop-check.cjs
 */
const { chromium } = require("playwright");
const { spawn }    = require("child_process");
const http         = require("http");
const path         = require("path");
const fs           = require("fs");

const PORT = 5175;
const BASE = `http://localhost:${PORT}`;
const ROOT = path.resolve(__dirname, "..");
const OUT  = path.join(__dirname, "out");
fs.mkdirSync(OUT, { recursive: true });

const DEBUG_CSS = `
  .csg-hotspot { border: 2px solid; opacity:1 !important; }
  .csg-hotspot[title="Cost"]        { border-color:#f59e0b; background:#f59e0b33; }
  .csg-hotspot[title="Energy"]      { border-color:#3b82f6; background:#3b82f633; }
  .csg-hotspot[title="Power"]       { border-color:#10b981; background:#10b98133; }
  .csg-hotspot[title="Might"]       { border-color:#10b981; background:#10b98133; }
  .csg-hotspot[title="Name"]        { border-color:#8b5cf6; background:#8b5cf633; }
  .csg-hotspot[title="Type line"]   { border-color:#ef4444; background:#ef444433; }
  .csg-hotspot[title="Card type"]   { border-color:#f97316; background:#f9731633; }
  .csg-hotspot[title="Supertype"]   { border-color:#f97316; background:#f9731633; }
  .csg-hotspot[title="Tag"]         { border-color:#fb923c; background:#fb923c55; }
  .csg-hotspot[title="Keyword"]     { border-color:#ec4899; background:#ec489933; }
  .csg-hotspot[title="Rules text"]  { border-color:#6366f1; background:#6366f133; }
  .csg-hotspot[title="Set"]         { border-color:#64748b; background:#64748b55; }
  .csg-hotspot[title="Rarity"]      { border-color:#c9813a; background:#c9813a55; }
  .csg-hotspot[title="Collector #"] { border-color:#94a3b8; background:#94a3b855; }
  .csg-hotspot[title="Artist"]      { border-color:#e2e8f0; background:#e2e8f044; }
`;

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
  console.log("Starting preview…");
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
  await page.addStyleTag({ content: DEBUG_CSS });

  const box = await page.locator(".csg-card-frame").boundingBox();
  const { x, y, width: w, height: h } = box;

  async function crop(name, clipY, clipH) {
    const p = path.join(OUT, `${name}.png`);
    await page.screenshot({ path: p,
      clip: { x: x - 4, y: clipY, width: w + 8, height: clipH } });
    console.log(`${name} → ${p}`);
  }

  // Full card
  await crop("full-card", y, h);
  // Top 20%: cost/energy orbs
  await crop("top",       y,                  h * 0.20);
  // Typeline band (55–75%)
  await crop("typeline",  y + h * 0.55,       h * 0.20);
  // Rules text (72–90%)
  await crop("rules",     y + h * 0.72,       h * 0.20);
  // Bottom 20%: power/might/footer
  await crop("bottom",    y + h * 0.80,       h * 0.22);

  await browser.close();
  server.kill();
  console.log("Done.");
})().catch(e => { console.error(e.message); process.exit(1); });
