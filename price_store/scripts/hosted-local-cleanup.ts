import {
  applyHostedPriceStoreMigrations,
  ensureHostedPriceStoreLayout,
  LocalD1Database,
  resolveHostedPriceStoreLayout,
  runHostedPriceMaintenance
} from "../src/hosted/index.js";

async function main() {
  const layout = resolveHostedPriceStoreLayout();
  await ensureHostedPriceStoreLayout(layout);
  const database = new LocalD1Database(layout.databasePath);

  try {
    await applyHostedPriceStoreMigrations(database, layout.migrationsDir);
    const result = await runHostedPriceMaintenance({
      database
    });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    database.close();
  }
}

void main();
