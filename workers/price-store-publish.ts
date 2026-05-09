import { handlePublishWorkerRequest, jsonResponse, type PriceStorePublishWorkerEnv } from "./shared/price-store-worker.js";

export default {
  async fetch(request: Request, env: PriceStorePublishWorkerEnv): Promise<Response> {
    try {
      return await handlePublishWorkerRequest(request, env);
    } catch (caught) {
      console.error("Price store publish worker error", caught);

      return jsonResponse(500, {
        message: caught instanceof Error ? caught.message : "Internal server error."
      });
    }
  }
};
