import { mkdir } from "node:fs/promises";
import type { PriceDataLayout } from "./config.js";

async function ensureDirectory(path: string) {
  await mkdir(path, { recursive: true });
}

export async function initializePriceDataLayout(layout: PriceDataLayout) {
  await ensureDirectory(layout.rootDir);
  await ensureDirectory(layout.rawDir);
  await ensureDirectory(layout.canonicalDir);
  await ensureDirectory(layout.exportsDir);
  await ensureDirectory(layout.runsDir);
}
