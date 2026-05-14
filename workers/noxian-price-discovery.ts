import { runHostedPriceDiscovery } from "../price_store/src/hosted/discovery.js";
import { createWorkerJustTcgConfig, type PriceStoreWorkerEnv } from "./shared/price-store-types.js";

function readNumber(value: string | null | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readBoolean(value: string | null | undefined): boolean | undefined {
  if (!value) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
}

async function executeDiscovery(request: Request, env: PriceStoreWorkerEnv): Promise<Response> {
  if (!env.PRICE_STORE_INGESTION_QUEUE) {
    throw new Error("PRICE_STORE_INGESTION_QUEUE is not configured.");
  }

  const url = new URL(request.url);
  const result = await runHostedPriceDiscovery({
    database: env.DB,
    config: await createWorkerJustTcgConfig(env),
    ingestionQueue: env.PRICE_STORE_INGESTION_QUEUE,
    game: url.searchParams.get("game") ?? env.NOXIANNET_PRICE_CAPTURE_GAME,
    mode: (url.searchParams.get("mode") ?? env.NOXIANNET_PRICE_CAPTURE_MODE) === "incremental" ? "incremental" : "full",
    updatedAfter: url.searchParams.get("updatedAfter") ?? env.NOXIANNET_PRICE_CAPTURE_UPDATED_AFTER,
    chunkRequestBudget: readNumber(
      url.searchParams.get("chunkRequestBudget") ?? env.NOXIANNET_PRICE_REQUEST_BUDGET_PER_CHUNK
    ),
    verifyLimit: readBoolean(
      url.searchParams.get("verifyLimit") ?? env.NOXIANNET_PRICE_CAPTURE_VERIFY_LIMIT
    )
  });

  return Response.json(result);
}

export default {
  async fetch(request: Request, env: PriceStoreWorkerEnv): Promise<Response> {
    return executeDiscovery(request, env);
  },

  async scheduled(_controller: unknown, env: PriceStoreWorkerEnv): Promise<void> {
    await executeDiscovery(new Request("https://internal.price-store.local/discovery"), env);
  }
};
