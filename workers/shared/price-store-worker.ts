import {
  parseJustTcgConfig,
  runHostedJustTcgCaptureWorker,
  runHostedJustTcgPublishWorker,
  type HostedCaptureWorkerInput,
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

export type PriceStoreWorkerEnv = JustTcgEnvironment & {
  PRICE_STORE_BUCKET: R2BucketLike;
  PRICE_STORE_TRIGGER_TOKEN: string;
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

export function authorizeWorkerRequest(request: Request, token: string): Response | undefined {
  const expected = token.trim();
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/iu, "").trim();
  if (!expected || provided !== expected) {
    return jsonResponse(401, {
      message: "Unauthorized."
    });
  }

  return undefined;
}

export async function handleCaptureWorkerRequest(
  request: Request,
  env: PriceStoreWorkerEnv
): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse(405, {
      message: "Capture worker only supports POST."
    });
  }

  const unauthorized = authorizeWorkerRequest(request, env.PRICE_STORE_TRIGGER_TOKEN);
  if (unauthorized) {
    return unauthorized;
  }

  const body = await parseJsonBody<HostedCaptureWorkerInput>(request);
  const store = createR2HostedObjectStore(env.PRICE_STORE_BUCKET);
  const config = parseJustTcgConfig(env);
  const result = await runHostedJustTcgCaptureWorker(store, config, body);

  return jsonResponse(200, result);
}

export async function handlePublishWorkerRequest(
  request: Request,
  env: PriceStoreWorkerEnv
): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse(405, {
      message: "Publish worker only supports POST."
    });
  }

  const unauthorized = authorizeWorkerRequest(request, env.PRICE_STORE_TRIGGER_TOKEN);
  if (unauthorized) {
    return unauthorized;
  }

  const body = await parseJsonBody<HostedPublishWorkerInput>(request);
  const store = createR2HostedObjectStore(env.PRICE_STORE_BUCKET);
  const result = await runHostedJustTcgPublishWorker(store, body);

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
