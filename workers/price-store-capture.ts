import {
  handleCaptureWorkerFetch,
  handleCaptureWorkerScheduled,
  jsonResponse,
  type PriceStoreCaptureWorkerEnv
} from "./shared/price-store-worker.js";

interface ScheduledControllerLike {
  readonly cron: string;
  readonly scheduledTime: number;
}

interface ExecutionContextLike {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException?(): void;
}

export default {
  async fetch(_request: Request, _env: PriceStoreCaptureWorkerEnv): Promise<Response> {
    try {
      return await handleCaptureWorkerFetch();
    } catch (caught) {
      console.error("Price store capture worker error", caught);

      return jsonResponse(500, {
        message: caught instanceof Error ? caught.message : "Internal server error."
      });
    }
  },
  async scheduled(
    _controller: ScheduledControllerLike,
    env: PriceStoreCaptureWorkerEnv,
    _ctx: ExecutionContextLike
  ): Promise<void> {
    await handleCaptureWorkerScheduled(env);
  }
};
