import { runHostedPriceCook } from "../price_store/src/hosted/cook.js";
import type { QueueBatchLike } from "../price_store/src/hosted/types.js";
import { type PriceStoreWorkerEnv } from "./shared/price-store-types.js";

export default {
  async queue(batch: QueueBatchLike<Parameters<typeof runHostedPriceCook>[0]["message"]>, env: PriceStoreWorkerEnv): Promise<void> {
    if (!env.PRICE_STORE_PUBLISH_QUEUE) {
      throw new Error("PRICE_STORE_PUBLISH_QUEUE is not configured.");
    }

    for (const message of batch.messages) {
      await runHostedPriceCook({
        database: env.DB,
        message: message.body,
        publishQueue: env.PRICE_STORE_PUBLISH_QUEUE
      });
    }
  }
};
