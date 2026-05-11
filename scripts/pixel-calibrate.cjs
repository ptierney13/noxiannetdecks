/**
 * Takes a screenshot of JUST the card image (no overlays) and overlays
 * horizontal lines every 2% to calibrate hotspot positions.
 * Also samples pixel colors at each 2% step to identify visual boundaries.
 */
const { chromium } = require("playwright");
const { spawn }    = require("child_process");
const http         = require("http");
const path         = require("path");
const fs           = require("fs");

const PORT = 5178;
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
  await page.waitForTimeout(1000);

  // HIDE all hotspots
  await page.addStyleTag({ content: `.csg-hotspot { display: none !important; }` });

  // Add ruler lines every 2% with bold lines at 5% increments
  await page.evaluate(() => {
    const frame = document.querySelector(".csg-card-frame");
    if (!frame) return;
    for (let pct = 2; pct < 100; pct += 2) {
      const isMajor = pct % 10 === 0;
      const isMinor5 = pct % 5 === 0;
      const line = document.createElement("div");
      line.style.cssText = `
        position: absolute; left: 0; right: 0;
        top: ${pct}%;
        height: ${isMajor ? 2 : 1}px;
        background: ${isMajor ? 'rgba(255,50,50,0.9)' : isMinor5 ? 'rgba(255,255,0,0.7)' : 'rgba(255,255,255,0.3)'};
        z-index: 200; pointer-events: none;
      `;
      if (isMinor5 || isMajor) {
        const label = document.createElement("span");
        label.textContent = `${pct}%`;
        label.style.cssText = `
          position: absolute; right: 2px; top: ${isMajor ? -1 : -10}px;
          font-size: ${isMajor ? 10 : 9}px;
          color: ${isMajor ? '#ff3333' : '#ffff00'};
          font-family: monospace; font-weight: bold;
          background: rgba(0,0,0,0.7); padding: 0 2px; border-radius: 2px;
          line-height: 11px; z-index: 201;
        `;
        line.appendChild(label);
      }
      frame.appendChild(line);
    }
  });

  const box = await page.locator(".csg-card-frame").boundingBox();
  const { x, y, width: w, height: h } = box;

  // Full card with rulers, NO hotspots
  await page.screenshot({
    path: path.join(OUT, "calibrate-full.png"),
    clip: { x: x - 4, y, width: w + 8, height: h }
  });

  // Lower half with fine rulers
  await page.screenshot({
    path: path.join(OUT, "calibrate-lower.png"),
    clip: { x: x - 4, y: y + h * 0.48, width: w + 8, height: h * 0.55 }
  });

  // Zone around typeline/name/rules
  await page.screenshot({
    path: path.join(OUT, "calibrate-zone.png"),
    clip: { x: x - 4, y: y + h * 0.52, width: w + 8, height: h * 0.35 }
  });

  console.log("Saved calibrate-full.png, calibrate-lower.png, calibrate-zone.png");

  // Now get pixel colors to find visual boundaries
  const colors = await page.evaluate(([cx, cy, cw, ch]) => {
    // Sample 50 rows at 2% intervals from card top
    const results = [];
    // We'll measure via a canvas drawn from the card image
    const img = document.querySelector(".csg-card-frame img");
    if (!img) return results;

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    for (let pct = 50; pct <= 98; pct += 2) {
      const py = Math.round(pct / 100 * img.naturalHeight);
      // Sample middle pixel
      const mid = ctx.getImageData(Math.round(img.naturalWidth / 2), py, 1, 1).data;
      // Sample left 10% pixel
      const left = ctx.getImageData(Math.round(img.naturalWidth * 0.1), py, 1, 1).data;
      // Sample right 90% pixel
      const right = ctx.getImageData(Math.round(img.naturalWidth * 0.9), py, 1, 1).data;
      results.push({
        pct,
        mid:  `rgb(${mid[0]},${mid[1]},${mid[2]})`,
        left: `rgb(${left[0]},${left[1]},${left[2]})`,
        right:`rgb(${right[0]},${right[1]},${right[2]})`,
      });
    }
    return results;
  }, [x, y, w, h]);

  console.log("\nPixel color samples (every 2% from 50%):");
  console.log("pct%  | mid pixel              | left 10%              | right 90%");
  console.log("------+------------------------+-----------------------+-----------------------");
  for (const { pct, mid, left, right } of colors) {
    console.log(`${String(pct).padStart(4)}% | ${mid.padEnd(22)} | ${left.padEnd(21)} | ${right}`);
  }

  await browser.close();
  server.kill();
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
