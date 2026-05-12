import { loadJustTcgConfig } from "../src/index.js";
import {
  applyHostedPriceStoreMigrations,
  ensureHostedPriceStoreLayout,
  LocalD1Database,
  resolveHostedPriceStoreLayout,
  runHostedPriceCapture
} from "../src/hosted/index.js";

async function main() {
  const config = loadJustTcgConfig();
  const layout = resolveHostedPriceStoreLayout();
  await ensureHostedPriceStoreLayout(layout);
  const database = new LocalD1Database(layout.databasePath);

  try {
    await applyHostedPriceStoreMigrations(database, layout.migrationsDir);
    const result = await runHostedPriceCapture({
      database,
      config,
      game: process.env.NOXIANNET_PRICE_CAPTURE_GAME,
      mode: process.env.NOXIANNET_PRICE_CAPTURE_MODE === "full" ? "full" : "incremental",
      updatedAfter: process.env.NOXIANNET_PRICE_CAPTURE_UPDATED_AFTER,
      maxPages: process.env.NOXIANNET_PRICE_CAPTURE_MAX_PAGES ? Number(process.env.NOXIANNET_PRICE_CAPTURE_MAX_PAGES) : undefined,
      maxRequests: process.env.NOXIANNET_PRICE_CAPTURE_MAX_REQUESTS
        ? Number(process.env.NOXIANNET_PRICE_CAPTURE_MAX_REQUESTS)
        : undefined,
      requestDelayMs: process.env.NOXIANNET_PRICE_CAPTURE_REQUEST_DELAY_MS
        ? Number(process.env.NOXIANNET_PRICE_CAPTURE_REQUEST_DELAY_MS)
        : 0
    });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    database.close();
  }
}

void main();
