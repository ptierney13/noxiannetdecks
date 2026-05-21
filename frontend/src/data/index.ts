// Data layer: API clients, TanStack Query keys, queryOptions definitions,
// and route-loader helpers. See frontend/AGENTS.md for placement rules.
//
// Query key factories and queryOptions for each resource will be added here
// as pages are rewritten in Stage 7. Do not add presentational or routing
// code to this layer.

export { queryClient } from "./queryClient";
export {
  cardSearchKeys,
  cardSearchQueryOptions,
  useCardSearchResults,
  buildCardSearchApiQuery,
  stripUniqueFromQuery,
  stripUniqueFromNormalized,
  queryRequestsAllPrintings,
} from "./cards";
