/**
 * Fetches the current published price snapshot from the live production site
 * and writes it into the local frontend static asset tree.
 *
 * This is the canonical way to refresh local price data for development.
 * Do NOT use hosted:local:refresh for this — that path burns JustTCG API
 * budget and is reserved for running the full pipeline locally.
 *
 * Production source: https://noxiannetdecks.com/data/prices-d1/
 * Output: frontend/public/data/price_snapshots/<date>/
 *
 * After running, update ACTIVE_PRICE_PATH_PREFIX in frontend/src/lib/priceData.ts
 * to match the printed path prefix.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { resolvePriceStorePackageRoot } from "../src/package-root.js";

const PRODUCTION_BASE = "https://noxiannetdecks.com/data/prices-d1";

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function main() {
  const packageRoot = resolvePriceStorePackageRoot();
  const repoRoot = join(packageRoot, "..");
  const frontendDataRoot = join(repoRoot, "frontend", "public", "data");

  console.log("Fetching manifest from production...");
  const manifest = await fetchJson(`${PRODUCTION_BASE}/manifest.json`);
  const publishedAt = (manifest as { publishedAt?: string }).publishedAt;
  if (!publishedAt) {
    throw new Error("Manifest missing publishedAt field.");
  }
  const dateSlug = publishedAt.slice(0, 10);
  const pathPrefix = `price_snapshots/${dateSlug}`;
  const outDir = join(frontendDataRoot, "price_snapshots", dateSlug);

  console.log(`Fetching snapshot for game key: riftbound...`);
  const snapshot = await fetchJson(`${PRODUCTION_BASE}/riftbound/latest.json`);

  await mkdir(join(outDir, "riftbound"), { recursive: true });
  await writeFile(join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(join(outDir, "riftbound", "latest.json"), `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  console.log(`\nWrote price snapshot to frontend/public/data/${pathPrefix}/`);
  console.log(`\nNext step: update ACTIVE_PRICE_PATH_PREFIX in frontend/src/lib/priceData.ts:`);
  console.log(`  const ACTIVE_PRICE_PATH_PREFIX = "/data/${pathPrefix}";`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
