import { runHostedPricePublish } from "../price_store/src/hosted/publish.js";
import type { QueueBatchLike } from "../price_store/src/hosted/types.js";
import { type PriceStoreWorkerEnv } from "./shared/price-store-types.js";

function resolvePublishMessage(body: unknown): Parameters<typeof runHostedPricePublish>[0]["message"] {
  const parsed =
    typeof body === "string"
      ? (JSON.parse(body) as unknown)
      : body;

  const candidate = parsed && typeof parsed === "object" ? (parsed as { runId?: unknown }) : null;
  if (!candidate || typeof candidate.runId !== "string" || candidate.runId.trim().length === 0) {
    throw new Error("Publish queue message must include a non-empty runId.");
  }

  return {
    runId: candidate.runId
  };
}

export default {
  async fetch(request: Request, env: PriceStoreWorkerEnv): Promise<Response> {
    if (!env.PRICE_STORE_PUBLISHED_DATA) {
      throw new Error("PRICE_STORE_PUBLISHED_DATA is not configured.");
    }

    const url = new URL(request.url);
    const runId = url.searchParams.get("runId");
    if (!runId) {
      return new Response("Missing runId query parameter.", { status: 400 });
    }

    return Response.json(
      await runHostedPricePublish({
        database: env.DB,
        message: { runId },
        publishedDataKv: env.PRICE_STORE_PUBLISHED_DATA
      })
    );
  },

  async queue(batch: QueueBatchLike<Parameters<typeof runHostedPricePublish>[0]["message"]>, env: PriceStoreWorkerEnv): Promise<void> {
    if (!env.PRICE_STORE_PUBLISHED_DATA) {
      throw new Error("PRICE_STORE_PUBLISHED_DATA is not configured.");
    }

    for (const message of batch.messages) {
      await runHostedPricePublish({
        database: env.DB,
        message: resolvePublishMessage(message.body),
        publishedDataKv: env.PRICE_STORE_PUBLISHED_DATA
      });
    }
  }
};
