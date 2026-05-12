import { runHostedPriceCapture } from "../price_store/src/hosted/index.js";
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

async function executeCapture(request: Request, env: PriceStoreWorkerEnv): Promise<Response> {
  const url = new URL(request.url);
  const requestedCaptureMode = url.searchParams.get("mode") ?? env.NOXIANNET_PRICE_CAPTURE_MODE;
  const captureMode = requestedCaptureMode === "incremental" ? "incremental" : "full";
  const updatedAfter = url.searchParams.get("updatedAfter") ?? env.NOXIANNET_PRICE_CAPTURE_UPDATED_AFTER;
  const game = url.searchParams.get("game") ?? env.NOXIANNET_PRICE_CAPTURE_GAME;
  const maxPages = readNumber(url.searchParams.get("maxPages") ?? env.NOXIANNET_PRICE_CAPTURE_MAX_PAGES);
  const maxRequests = readNumber(
    url.searchParams.get("maxRequests") ?? env.NOXIANNET_PRICE_CAPTURE_MAX_REQUESTS
  );
  const requestDelayMs = readNumber(
    url.searchParams.get("requestDelayMs") ?? env.NOXIANNET_PRICE_CAPTURE_REQUEST_DELAY_MS
  );
  const verifyLimit = readBoolean(
    url.searchParams.get("verifyLimit") ?? env.NOXIANNET_PRICE_CAPTURE_VERIFY_LIMIT
  );
  const result = await runHostedPriceCapture({
    database: env.DB,
    config: createWorkerJustTcgConfig(env),
    game,
    mode: captureMode,
    updatedAfter,
    maxPages,
    maxRequests,
    requestDelayMs,
    verifyLimit
  });

  return Response.json(result);
}

export default {
  async fetch(request: Request, env: PriceStoreWorkerEnv): Promise<Response> {
    return executeCapture(request, env);
  },

  async scheduled(_controller: unknown, env: PriceStoreWorkerEnv): Promise<void> {
    await executeCapture(new Request("https://internal.price-store.local/capture"), env);
  }
};
