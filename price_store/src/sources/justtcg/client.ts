import type { JustTcgConfig } from "./config.js";
import type { JustTcgCardsResponse } from "./schema.js";
import { justTcgCardsResponseSchema } from "./schema.js";

export type JustTcgCardsQuery = {
  game?: string;
  limit?: number;
  offset?: number;
  includePriceHistory?: boolean;
  includeStatistics?: boolean;
  includeNullPrices?: boolean;
  updatedAfter?: number;
  orderBy?: "price" | "24h" | "7d" | "30d" | "90d";
  order?: "asc" | "desc";
};

export type JustTcgRequestResult<T> = {
  data: T;
  requestUrl: string;
};

export class JustTcgRequestError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly detail?: string;

  constructor(status: number, statusText: string, detail?: string) {
    super(
      detail
        ? `JustTCG request failed with ${status} ${statusText}: ${detail}`
        : `JustTCG request failed with ${status} ${statusText}`
    );
    this.name = "JustTcgRequestError";
    this.status = status;
    this.statusText = statusText;
    this.detail = detail;
  }
}

export async function fetchJustTcgCards(
  config: JustTcgConfig,
  query: JustTcgCardsQuery = {}
): Promise<JustTcgRequestResult<JustTcgCardsResponse>> {
  const url = new URL("cards", ensureTrailingSlash(config.baseUrl));
  url.searchParams.set("game", query.game ?? config.defaultGame);
  url.searchParams.set("limit", String(query.limit ?? config.defaultLimit));
  if (query.offset !== undefined) {
    url.searchParams.set("offset", String(query.offset));
  }
  url.searchParams.set(
    "include_price_history",
    String(query.includePriceHistory ?? config.includePriceHistory)
  );

  if (query.includeStatistics ?? config.includeStatistics) {
    url.searchParams.set("include_statistics", "7d");
  }

  if (query.includeNullPrices !== undefined) {
    url.searchParams.set("include_null_prices", String(query.includeNullPrices));
  }

  if (query.updatedAfter !== undefined) {
    url.searchParams.set("updated_after", String(query.updatedAfter));
  }

  if (query.orderBy) {
    url.searchParams.set("orderBy", query.orderBy);
  }

  if (query.order) {
    url.searchParams.set("order", query.order);
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-api-key": config.apiKey
    }
  });

  const rawText = await response.text();
  const parsed = tryParseJson(rawText);

  if (!response.ok) {
    const detail =
      parsed && typeof parsed === "object"
        ? extractApiErrorDetail(parsed)
        : sanitizeErrorDetail(rawText);
    throw new JustTcgRequestError(response.status, response.statusText, detail);
  }

  const payload = justTcgCardsResponseSchema.parse({
    data: parsed && typeof parsed === "object" && "data" in parsed ? parsed.data : undefined,
    meta: parsed && typeof parsed === "object" && "meta" in parsed ? parsed.meta : undefined,
    _metadata:
      parsed && typeof parsed === "object" && "_metadata" in parsed ? parsed._metadata : undefined
  });

  return {
    data: payload,
    requestUrl: url.toString()
  };
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function extractApiErrorDetail(value: object): string {
  if ("error" in value && typeof value.error === "string") {
    if ("code" in value && typeof value.code === "string") {
      return `${value.code}: ${value.error}`;
    }

    return value.error;
  }

  return sanitizeErrorDetail(JSON.stringify(value));
}

function sanitizeErrorDetail(value: string): string {
  return value.replace(/\s+/gu, " ").trim().slice(0, 300);
}
