type KvNamespaceLike = {
  get(key: string, type: "text"): Promise<string | null>;
};

type PagesFunctionContext = {
  request: Request;
  env: {
    PRICE_STORE_PUBLISHED_DATA?: KvNamespaceLike;
  };
  params: {
    path?: string | string[];
  };
  next(): Promise<Response>;
};

function normalizePathParam(path: string | string[] | undefined): string[] {
  if (!path) {
    return [];
  }

  return Array.isArray(path) ? path : [path];
}

function resolveContentType(key: string): string {
  if (key.endsWith(".json")) {
    return "application/json; charset=utf-8";
  }

  return "application/octet-stream";
}

export async function onRequest(context: PagesFunctionContext): Promise<Response> {
  const pathParts = normalizePathParam(context.params.path);

  if (pathParts[0] !== "prices-d1") {
    return context.next();
  }

  const key = pathParts.join("/");
  const payload = await context.env.PRICE_STORE_PUBLISHED_DATA?.get(key, "text");
  if (!payload) {
    return new Response("Not found", {
      status: 404,
      headers: {
        "cache-control": "no-store"
      }
    });
  }

  return new Response(payload, {
    status: 200,
    headers: {
      "content-type": resolveContentType(key),
      "cache-control": "public, max-age=300"
    }
  });
}
