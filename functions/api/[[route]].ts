import cards from "../../card_store/data/cards.json";
import { CardApiError, createCardApiService } from "../../card_store/src/api/service.js";
import { createSearchPriceIndex, type PublishedPriceManifest, type PublishedPriceSnapshot } from "../../card_store/src/prices/published.js";
import type { CardRecord } from "../../card_store/src/data/schema.js";

type KvNamespaceLike = {
  get(key: string, type: "text"): Promise<string | null>;
};

type PagesFunctionContext = {
  request: Request;
  env: {
    PRICE_STORE_PUBLISHED_DATA?: KvNamespaceLike;
  };
  params: {
    route?: string | string[];
  };
};

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

async function parseJsonBody(request: Request) {
  if (request.headers.get("content-type")?.includes("application/json") !== true) {
    throw new CardApiError(400, "Request body must be JSON.");
  }

  try {
    return await request.json();
  } catch {
    throw new CardApiError(400, "Request body must be valid JSON.");
  }
}

function normalizeRouteParam(route: string | string[] | undefined) {
  if (!route) {
    return [];
  }

  return Array.isArray(route) ? route : [route];
}

export async function onRequest(context: PagesFunctionContext) {
  const { request } = context;
  const url = new URL(request.url);
  const route = normalizeRouteParam(context.params.route);
  const api = createCardApiService({
    cards: cards as CardRecord[],
    loadSearchPriceIndex: async () => {
      const kv = context.env.PRICE_STORE_PUBLISHED_DATA;
      if (!kv) {
        return null;
      }

      const manifestRaw = await kv.get("prices-d1/manifest.json", "text");
      if (!manifestRaw) {
        return null;
      }

      const manifest = JSON.parse(manifestRaw) as PublishedPriceManifest;
      const snapshotRaw = await kv.get(`prices-d1/${manifest.snapshotPath}`, "text");
      if (!snapshotRaw) {
        return null;
      }

      const snapshot = JSON.parse(snapshotRaw) as PublishedPriceSnapshot;
      return createSearchPriceIndex(snapshot);
    }
  });

  try {
    if (request.method === "GET" && route.length === 1 && route[0] === "health") {
      return jsonResponse(200, api.health());
    }

    if (request.method === "GET" && route.length === 1 && route[0] === "cards") {
      return jsonResponse(200, await api.search(url.searchParams.get("q") ?? ""));
    }

    if (request.method === "GET" && route.length === 2 && route[0] === "cards") {
      return jsonResponse(200, api.cardById(route[1]));
    }

    if (request.method === "POST" && route.length === 2 && route[0] === "query" && route[1] === "parse") {
      return jsonResponse(200, api.parseQuery(await parseJsonBody(request) as { query?: unknown }));
    }

    if (request.method === "GET" && route.length === 2 && route[0] === "query" && route[1] === "features") {
      return jsonResponse(200, api.queryFeatures());
    }

    if (request.method === "GET" && route.length === 1 && route[0] === "metadata") {
      return jsonResponse(200, api.metadata());
    }

    if (request.method === "GET" && route.length === 2 && route[0] === "metagame" && route[1] === "pilot") {
      return jsonResponse(200, await api.metagamePilot());
    }

    if (request.method === "GET" && route.length === 2 && route[0] === "pack-generator" && route[1] === "options") {
      return jsonResponse(200, api.packGeneratorOptions());
    }

    if (request.method === "POST" && route.length === 2 && route[0] === "pack-generator" && route[1] === "pools") {
      return jsonResponse(200, api.generateSealedPool(await parseJsonBody(request)));
    }

    return jsonResponse(404, { message: `API route "${url.pathname}" was not found.` });
  } catch (caught) {
    if (caught instanceof CardApiError) {
      return jsonResponse(caught.status, { message: caught.message });
    }

    console.error("Cloudflare Pages Function error", caught);
    return jsonResponse(500, { message: "Internal server error." });
  }
}
