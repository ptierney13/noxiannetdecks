import type { ParsedQuery, QueryNode } from "./ast.js";
import { resolveField } from "./fields.js";

function nodeReferencesCanonicalField(node: QueryNode, canonicalField: string): boolean {
  switch (node.type) {
    case "all":
    case "term":
      return false;
    case "predicate":
      return resolveField(node.field)?.canonical === canonicalField;
    case "not":
      return nodeReferencesCanonicalField(node.child, canonicalField);
    case "and":
    case "or":
      return node.children.some((child) => nodeReferencesCanonicalField(child, canonicalField));
  }
}

export function parsedQueryReferencesField(parsed: ParsedQuery, canonicalField: string): boolean {
  if (parsed.diagnostics.length > 0) {
    return false;
  }

  return nodeReferencesCanonicalField(parsed.ast, canonicalField);
}
