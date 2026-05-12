import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { resolveDefaultPriceDataDir } from "../config.js";
import { resolvePriceStorePackageRoot } from "../package-root.js";
import type { HostedPriceStoreLayout } from "./types.js";

export function resolveHostedPriceStoreLayout(rootDir = resolveDefaultPriceDataDir()): HostedPriceStoreLayout {
  return {
    databasePath: join(rootDir, "hosted", "local-d1", "price-store.sqlite"),
    migrationsDir: join(resolvePriceStorePackageRoot(), "migrations", "d1")
  };
}

export async function ensureHostedPriceStoreLayout(layout: HostedPriceStoreLayout): Promise<void> {
  await mkdir(dirname(layout.databasePath), { recursive: true });
}
