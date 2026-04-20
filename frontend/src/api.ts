import type { CardSearchResponse, QueryFeaturesResponse } from "./types";

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
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

export function loadQueryFeatures(): Promise<QueryFeaturesResponse> {
  return getJson<QueryFeaturesResponse>("/api/query/features");
}

