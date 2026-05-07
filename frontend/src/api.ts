import type {
  CardRecord,
  CardSearchResponse,
  GeneratedSealedPool,
  GenerateSealedPoolRequest,
  PackGeneratorOptions,
  QueryFeaturesResponse
} from "./types";

function apiUrl(path: string): string {
  const configuredOrigin = import.meta.env.VITE_API_ORIGIN?.trim();
  if (!configuredOrigin) {
    return path;
  }

  return new URL(path, configuredOrigin.endsWith("/") ? configuredOrigin : `${configuredOrigin}/`).toString();
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(apiUrl(url));
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(apiUrl(url), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(payload?.message ?? `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function searchCards(query: string): Promise<CardSearchResponse> {
  const params = new URLSearchParams();
  if (query.trim().length > 0) {
    params.set("q", query);
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return getJson<CardSearchResponse>(`/api/cards${suffix}`);
}

export function getCard(id: string): Promise<CardRecord> {
  return getJson<CardRecord>(`/api/cards/${encodeURIComponent(id)}`);
}

export function loadQueryFeatures(): Promise<QueryFeaturesResponse> {
  return getJson<QueryFeaturesResponse>("/api/query/features");
}

export function loadPackGeneratorOptions(): Promise<PackGeneratorOptions> {
  return getJson<PackGeneratorOptions>("/api/pack-generator/options");
}

export function generateSealedPool(request: GenerateSealedPoolRequest): Promise<GeneratedSealedPool> {
  return postJson<GeneratedSealedPool>("/api/pack-generator/pools", request);
}
