import { runHostedPriceCapture } from "../price_store/src/hosted/index.js";
import { createWorkerJustTcgConfig, type PriceStoreWorkerEnv } from "./shared/price-store-types.js";

async function executeCapture(env: PriceStoreWorkerEnv): Promise<Response> {
  const result = await runHostedPriceCapture({
    database: env.DB,
    config: createWorkerJustTcgConfig(env)
  });

  return Response.json(result);
}

export default {
  async fetch(_request: Request, env: PriceStoreWorkerEnv): Promise<Response> {
    return executeCapture(env);
  },

  async scheduled(_controller: unknown, env: PriceStoreWorkerEnv): Promise<void> {
    await executeCapture(env);
  }
};
