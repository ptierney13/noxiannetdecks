import { queryOptions } from "@tanstack/react-query";
import { queryFieldGuides, querySyntaxGuides } from "@noxiannet/card-store/query";
import { loadQueryFeatures } from "../api";

export const queryFeaturesKeys = {
  all: ["query-features"] as const,
};

export const queryFeaturesQueryOptions = queryOptions({
  queryKey: queryFeaturesKeys.all,
  queryFn: async () => {
    try {
      return await loadQueryFeatures();
    } catch {
      return {
        fields: queryFieldGuides,
        syntax: querySyntaxGuides,
      };
    }
  },
  staleTime: Infinity,
});
