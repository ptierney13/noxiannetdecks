import { createHostedPriceStoreRepository } from "../price_store/src/hosted/index.js";
import type { PriceStoreWorkerEnv } from "./shared/price-store-types.js";

async function executeCleanup(env: PriceStoreWorkerEnv): Promise<Response> {
  const repository = createHostedPriceStoreRepository(env.DB);
  const expiresBefore = new Date().toISOString();
  const deleted = await repository.deleteExpiredCapturePages(expiresBefore);

  return Response.json({
    expiresBefore,
    deleted
  });
}

export default {
  async fetch(_request: Request, env: PriceStoreWorkerEnv): Promise<Response> {
    return executeCleanup(env);
  },

  async scheduled(_controller: unknown, env: PriceStoreWorkerEnv): Promise<void> {
    await executeCleanup(env);
  }
};
