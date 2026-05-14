import { loadJustTcgConfig } from "../src/index.js";
import {
  applyHostedPriceStoreMigrations,
  createFilesystemPublishedArtifactWriter,
  ensureHostedPriceStoreLayout,
  LocalD1Database,
  resolveHostedPriceStoreLayout,
  runHostedPriceCook,
  runHostedPriceDiscovery,
  runHostedPricePublish,
  runHostedPriceIngestion
} from "../src/hosted/index.js";
import type {
  HostedCookMessage,
  HostedIngestionChunkMessage,
  HostedPublishMessage,
  QueueSenderLike
} from "../src/hosted/types.js";

class LocalQueue<T> implements QueueSenderLike<T> {
  readonly messages: T[] = [];

  async send(body: T): Promise<void> {
    this.messages.push(body);
  }
}

async function main() {
  const config = loadJustTcgConfig();
  const layout = resolveHostedPriceStoreLayout();
  await ensureHostedPriceStoreLayout(layout);
  const database = new LocalD1Database(layout.databasePath);

  try {
    await applyHostedPriceStoreMigrations(database, layout.migrationsDir);
    const ingestionQueue = new LocalQueue<HostedIngestionChunkMessage>();
    const cookQueue = new LocalQueue<HostedCookMessage>();
    const publishQueue = new LocalQueue<HostedPublishMessage>();

    const discovery = await runHostedPriceDiscovery({
      database,
      config,
      ingestionQueue,
      game: process.env.NOXIANNET_PRICE_CAPTURE_GAME,
      mode: process.env.NOXIANNET_PRICE_CAPTURE_MODE === "incremental" ? "incremental" : "full",
      updatedAfter: process.env.NOXIANNET_PRICE_CAPTURE_UPDATED_AFTER,
      chunkRequestBudget: process.env.NOXIANNET_PRICE_REQUEST_BUDGET_PER_CHUNK
        ? Number(process.env.NOXIANNET_PRICE_REQUEST_BUDGET_PER_CHUNK)
        : undefined,
      verifyLimit: false
    });

    while (ingestionQueue.messages.length > 0) {
      const message = ingestionQueue.messages.shift();
      if (!message) {
        continue;
      }

      await runHostedPriceIngestion(
        {
          cookQueue,
          database,
          message,
          requestDelayMs: process.env.NOXIANNET_PRICE_CAPTURE_REQUEST_DELAY_MS
            ? Number(process.env.NOXIANNET_PRICE_CAPTURE_REQUEST_DELAY_MS)
            : 0
        },
        config
      );
    }

    while (cookQueue.messages.length > 0) {
      const message = cookQueue.messages.shift();
      if (!message) {
        continue;
      }

      await runHostedPriceCook({
        database,
        message,
        publishQueue
      });
    }

    const publishes = [];
    while (publishQueue.messages.length > 0) {
      const message = publishQueue.messages.shift();
      if (!message) {
        continue;
      }

      publishes.push(
        await runHostedPricePublish({
          database,
          message,
          publishedArtifactWriter: createFilesystemPublishedArtifactWriter()
        })
      );
    }

    console.log(
      JSON.stringify(
        {
          discovery,
          publishResults: publishes
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
