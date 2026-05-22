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

export type ExecutedTokenState = "executed" | "dropped";

// One condition from the original query, tagged with whether the backend ran it.
// field is the raw field name as written (null for bare-text searches).
// canonicalField is the resolved canonical from fields.ts (null when unknown or bare text).
// op is the normalised operator string (":", "=", ">", ">=", "<", "<=").
export type ExecutedCondition = {
  field: string | null;
  canonicalField: string | null;
  op: string;
  value: string;
  negated: boolean;
  state: ExecutedTokenState;
  errorMessage?: string;
};

// Flat list of conditions interleaved with logical connectors — mirrors ParsedQueryItem shape.
export type ExecutedQueryItem = ExecutedCondition | "AND" | "OR";

export type ParsedQuery = {
  source: string;
  normalizedQuery: string;
  ast: QueryNode;
  uniqueMode: SearchUniqueMode;
  uniqueModeSpecified: boolean;
  diagnostics: QueryDiagnostic[];
  executedTokens: ExecutedQueryItem[];
};
