import type { QueryDiagnostic } from "../query/ast.js";
import type { SearchResult } from "../query/evaluator.js";
import type { QueryFieldGuide, QuerySyntaxGuide } from "../query/features.js";

export type CardSearchResponse = SearchResult;

export type QueryFeaturesResponse = {
  fields: QueryFieldGuide[];
  syntax: QuerySyntaxGuide[];
};

export type { QueryDiagnostic, QueryFieldGuide, QuerySyntaxGuide };
