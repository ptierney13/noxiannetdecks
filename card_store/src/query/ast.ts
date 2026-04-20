import type { SearchUniqueMode } from "./unique.js";

export type StringOperator = "contains" | "eq";
export type NumericOperator = "eq" | "lt" | "lte" | "gt" | "gte";
export type QueryOperator = StringOperator | NumericOperator;

export type QueryNode =
  | { type: "all" }
  | { type: "term"; value: string }
  | { type: "predicate"; field: string; operator: QueryOperator; value: string }
  | { type: "not"; child: QueryNode }
  | { type: "and"; children: QueryNode[] }
  | { type: "or"; children: QueryNode[] };

export type QueryDiagnostic = {
  message: string;
  offset?: number;
  length?: number;
};

export type ParsedQuery = {
  source: string;
  normalizedQuery: string;
  ast: QueryNode;
  uniqueMode: SearchUniqueMode;
  uniqueModeSpecified: boolean;
  diagnostics: QueryDiagnostic[];
};
