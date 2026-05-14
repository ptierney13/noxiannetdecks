import { runHostedPriceMaintenance } from "../price_store/src/hosted/maintenance.js";
import type { PriceStoreWorkerEnv } from "./shared/price-store-types.js";

async function executeMaintenance(env: PriceStoreWorkerEnv): Promise<Response> {
  return Response.json(
    await runHostedPriceMaintenance({
      database: env.DB
    })
  );
}

export default {
  async fetch(_request: Request, env: PriceStoreWorkerEnv): Promise<Response> {
    return executeMaintenance(env);
  },

  async scheduled(_controller: unknown, env: PriceStoreWorkerEnv): Promise<void> {
    await executeMaintenance(env);
  }
};
