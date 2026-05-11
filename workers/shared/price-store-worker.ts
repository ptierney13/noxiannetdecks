import {
  parseJustTcgConfig,
  runHostedJustTcgCaptureWorker,
  runHostedJustTcgPublishWorker,
  type HostedObjectStore,
  type HostedPublishWorkerInput,
  type JustTcgEnvironment
} from "../../price_store/src/index.js";

export interface R2ObjectBodyLike {
  text(): Promise<string>;
}

export interface R2BucketLike {
  put(key: string, value: string): Promise<void>;
  get(key: string): Promise<R2ObjectBodyLike | null>;
  delete(key: string): Promise<void>;
  list(options: { prefix: string; cursor?: string }): Promise<{
    objects: Array<{ key: string }>;
    truncated: boolean;
    cursor?: string;
  }>;
}

export interface ServiceBindingLike {
  fetch(request: Request): Promise<Response>;
}

export type PriceStoreCaptureWorkerEnv = JustTcgEnvironment & {
  PRICE_STORE_BUCKET: R2BucketLike;
  PRICE_STORE_PUBLISHER: ServiceBindingLike;
  PRICE_STORE_CAPTURE_MAX_REQUESTS?: string;
  PRICE_STORE_CAPTURE_REQUEST_DELAY_MS?: string;
};

export type PriceStorePublishWorkerEnv = {
  PRICE_STORE_BUCKET: R2BucketLike;
};

export function createR2HostedObjectStore(bucket: R2BucketLike): HostedObjectStore {
  return {
    async putText(key, value) {
      await bucket.put(key, value);
    },
    async getText(key) {
      const object = await bucket.get(key);
      return object ? object.text() : undefined;
    },
    async delete(key) {
      await bucket.delete(key);
    },
    async list(prefix) {
      const keys: string[] = [];
      let cursor: string | undefined;

      while (true) {
        const result = await bucket.list({
          prefix,
          cursor
        });
        keys.push(...result.objects.map((entry) => entry.key));
        if (!result.truncated) {
          break;
        }
        cursor = result.cursor;
      }

      return keys.sort();
    }
  };
}

export async function handleCaptureWorkerScheduled(
  env: PriceStoreCaptureWorkerEnv,
  options: {
    runCapture?: typeof runHostedJustTcgCaptureWorker;
    publishFetch?: (request: Request) => Promise<Response>;
  } = {}
): Promise<Response> {
  const store = createR2HostedObjectStore(env.PRICE_STORE_BUCKET);
  const config = parseJustTcgConfig(env);
  const runCapture = options.runCapture ?? runHostedJustTcgCaptureWorker;
  const publishFetch = options.publishFetch ?? ((request: Request) => env.PRICE_STORE_PUBLISHER.fetch(request));
  const captureResult = await runCapture(store, config, {
    mode: "incremental",
    maxRequests: parseOptionalPositiveInteger(env.PRICE_STORE_CAPTURE_MAX_REQUESTS),
    requestDelayMs: parseOptionalNonNegativeInteger(env.PRICE_STORE_CAPTURE_REQUEST_DELAY_MS)
  });

  const publishResponse = await publishFetch(
    new Request("https://price-store.internal/publish", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        captureRunId: captureResult.runId
      } satisfies HostedPublishWorkerInput)
    })
  );

  if (!publishResponse.ok) {
    const detail = await publishResponse.text();
    throw new Error(
      `Capture succeeded for ${captureResult.runId}, but internal publish failed with ${publishResponse.status}: ${detail}`
    );
  }

  const publishResult = await publishResponse.json();

  return jsonResponse(200, {
    capture: captureResult,
    publish: publishResult
  });
}

export async function handleCaptureWorkerFetch(): Promise<Response> {
  return jsonResponse(405, {
    message: "This worker is schedule-driven. Use Cloudflare Cron Triggers to run it."
  });
}

export async function handlePublishWorkerRequest(
  request: Request,
  env: PriceStorePublishWorkerEnv,
  options: {
    runPublish?: typeof runHostedJustTcgPublishWorker;
  } = {}
): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse(405, {
      message: "Publish worker only supports POST."
    });
  }

  const url = new URL(request.url);
  if (url.pathname !== "/publish") {
    return jsonResponse(404, {
      message: `Worker route "${url.pathname}" was not found.`
    });
  }

  const body = await parseJsonBody<HostedPublishWorkerInput>(request);
  const store = createR2HostedObjectStore(env.PRICE_STORE_BUCKET);
  const runPublish = options.runPublish ?? runHostedJustTcgPublishWorker;
  const result = await runPublish(store, body);

  return jsonResponse(200, result);
}

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

async function parseJsonBody<T>(request: Request): Promise<T> {
  if (request.headers.get("content-type")?.includes("application/json") !== true) {
    throw new Error("Request body must be JSON.");
  }

  return request.json() as Promise<T>;
}

function parseOptionalPositiveInteger(value: string | undefined): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Expected a positive integer environment value, received: ${value}`);
  }

  return parsed;
}

function parseOptionalNonNegativeInteger(value: string | undefined): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Expected a non-negative integer environment value, received: ${value}`);
  }

  return parsed;
}
