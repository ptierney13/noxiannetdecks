import { queryOptions, useQuery } from "@tanstack/react-query";
import { getCard, searchCards } from "../api";

export const cardSearchKeys = {
  all: ["cards"] as const,
  search: (query: string) => [...cardSearchKeys.all, "search", buildCardSearchApiQuery(query)] as const,
};

export const cardKeys = {
  detail: (cardId: string) => ["cards", "detail", cardId] as const,
  printings: (query: string) => ["cards", "printings", query] as const,
};

export const cardDetailQueryOptions = (cardId: string) =>
  queryOptions({
    queryKey: cardKeys.detail(cardId),
    queryFn: () => getCard(cardId),
  });

export const cardPrintingsQueryOptions = (query: string) =>
  queryOptions({
    queryKey: cardKeys.printings(query),
    queryFn: () => searchCards(query),
    enabled: Boolean(query),
    staleTime: 60_000,
  });

export function stripUniqueFromQuery(query: string): string {
  return query.replace(/\bunique:\S+/g, "").trim();
}

export function queryRequestsAllPrintings(query: string): boolean {
  return /\bunique:prints\b/.test(query);
}

export function stripUniqueFromNormalized(normalized: string): string {
  return normalized.replace(/\bunique:\S+/g, "").trim();
}

export function buildCardSearchApiQuery(rawQuery: string): string {
  const stripped = stripUniqueFromQuery(rawQuery);
  return stripped.length > 0 ? `${stripped} unique:id` : "unique:id";
}

export function cardSearchQueryOptions(query: string) {
  const apiQuery = buildCardSearchApiQuery(query);

  return queryOptions({
    queryKey: cardSearchKeys.search(query),
    queryFn: () => searchCards(apiQuery),
    staleTime: 60_000,
  });
}

export function useCardSearchResults(query: string) {
  return useQuery(cardSearchQueryOptions(query));
}
