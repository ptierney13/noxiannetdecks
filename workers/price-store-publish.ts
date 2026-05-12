import { runHostedPriceProcess, runHostedPricePublish } from "../price_store/src/hosted/index.js";
import type { PriceStoreWorkerEnv } from "./shared/price-store-types.js";

async function executePublish(env: PriceStoreWorkerEnv, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const captureRunId = url.searchParams.get("captureRunId") ?? undefined;
  const processRunId = url.searchParams.get("processRunId") ?? undefined;

  const processResult = processRunId
    ? null
    : await runHostedPriceProcess({
        database: env.DB,
        captureRunId
      });
  const publishResult = await runHostedPricePublish({
    database: env.DB,
    processRunId: processRunId ?? processResult?.processRunId
  });

  return Response.json({
    processResult,
    publishResult
  });
}

export default {
  async fetch(request: Request, env: PriceStoreWorkerEnv): Promise<Response> {
    return executePublish(env, request);
  }
};
