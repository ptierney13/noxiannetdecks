import {
  applyHostedPriceStoreMigrations,
  ensureHostedPriceStoreLayout,
  LocalD1Database,
  resolveHostedPriceStoreLayout
} from "../src/hosted/index.js";

async function main() {
  const layout = resolveHostedPriceStoreLayout();
  await ensureHostedPriceStoreLayout(layout);
  const database = new LocalD1Database(layout.databasePath);

  try {
    const applied = await applyHostedPriceStoreMigrations(database, layout.migrationsDir);
    console.log(
      JSON.stringify(
        {
          databasePath: layout.databasePath,
          migrationsDir: layout.migrationsDir,
          applied
        },
        null,
        2
      )
    );
  } finally {
    database.close();
  }
}

void main();
