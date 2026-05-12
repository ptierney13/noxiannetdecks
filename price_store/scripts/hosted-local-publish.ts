import {
  applyHostedPriceStoreMigrations,
  ensureHostedPriceStoreLayout,
  LocalD1Database,
  resolveHostedPriceStoreLayout,
  runHostedPricePublish
} from "../src/hosted/index.js";

async function main() {
  const layout = resolveHostedPriceStoreLayout();
  await ensureHostedPriceStoreLayout(layout);
  const database = new LocalD1Database(layout.databasePath);

  try {
    await applyHostedPriceStoreMigrations(database, layout.migrationsDir);
    const result = await runHostedPricePublish({
      database,
      processRunId: process.env.NOXIANNET_PRICE_PROCESS_RUN_ID
    });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    database.close();
  }
}

void main();
