import { handleCaptureWorkerRequest, jsonResponse, type PriceStoreWorkerEnv } from "./shared/price-store-worker.js";

export default {
  async fetch(request: Request, env: PriceStoreWorkerEnv): Promise<Response> {
    try {
      return await handleCaptureWorkerRequest(request, env);
    } catch (caught) {
      console.error("Price store capture worker error", caught);

      return jsonResponse(500, {
        message: caught instanceof Error ? caught.message : "Internal server error."
      });
    }
  }
};
