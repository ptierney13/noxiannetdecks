import { runHostedPriceIngestion } from "../price_store/src/hosted/ingestion.js";
import type { QueueBatchLike } from "../price_store/src/hosted/types.js";
import { createWorkerJustTcgConfig, type PriceStoreWorkerEnv } from "./shared/price-store-types.js";

function readNumber(value: string | null | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default {
  async queue(batch: QueueBatchLike<Parameters<typeof runHostedPriceIngestion>[0]["message"]>, env: PriceStoreWorkerEnv): Promise<void> {
    if (!env.PRICE_STORE_COOK_QUEUE) {
      throw new Error("PRICE_STORE_COOK_QUEUE is not configured.");
    }

    const config = await createWorkerJustTcgConfig(env);
    for (const message of batch.messages) {
      await runHostedPriceIngestion(
        {
          cookQueue: env.PRICE_STORE_COOK_QUEUE,
          database: env.DB,
          message: message.body,
          requestDelayMs: readNumber(env.NOXIANNET_PRICE_CAPTURE_REQUEST_DELAY_MS)
        },
        config
      );
    }
  }
};
