import { queryOptions } from "@tanstack/react-query";
import { loadQueryFeatures } from "../api";

export const queryFeaturesKeys = {
  all: ["query-features"] as const,
};

export const queryFeaturesQueryOptions = queryOptions({
  queryKey: queryFeaturesKeys.all,
  queryFn: () => loadQueryFeatures(),
  staleTime: Infinity,
});
