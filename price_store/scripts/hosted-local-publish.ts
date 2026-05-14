import {
  applyHostedPriceStoreMigrations,
  createFilesystemPublishedArtifactWriter,
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
    const runId = process.env.NOXIANNET_PRICE_RUN_ID;
    if (!runId) {
      throw new Error("NOXIANNET_PRICE_RUN_ID is required.");
    }

    const result = await runHostedPricePublish({
      database,
      message: { runId },
      publishedArtifactWriter: createFilesystemPublishedArtifactWriter()
    });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    database.close();
  }
}

void main();
