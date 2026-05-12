import {
  applyHostedPriceStoreMigrations,
  createHostedPriceStoreRepository,
  ensureHostedPriceStoreLayout,
  LocalD1Database,
  resolveHostedPriceStoreLayout
} from "../src/hosted/index.js";

async function main() {
  const layout = resolveHostedPriceStoreLayout();
  await ensureHostedPriceStoreLayout(layout);
  const database = new LocalD1Database(layout.databasePath);

  try {
    await applyHostedPriceStoreMigrations(database, layout.migrationsDir);
    const repository = createHostedPriceStoreRepository(database);
    const expiresBefore = process.env.NOXIANNET_PRICE_CLEANUP_BEFORE ?? new Date().toISOString();
    const deleted = await repository.deleteExpiredCapturePages(expiresBefore);
    console.log(JSON.stringify({ expiresBefore, deleted }, null, 2));
  } finally {
    database.close();
  }
}

void main();
