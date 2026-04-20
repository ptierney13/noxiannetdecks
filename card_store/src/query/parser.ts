import { createToken, Lexer, type IToken, type TokenType } from "chevrotain";
import { normalizeVariantQuery } from "../data/variant.js";
import type { ParsedQuery, QueryDiagnostic, QueryNode, QueryOperator } from "./ast.js";
import { resolveField } from "./fields.js";
import { quoteIfNeeded, unquote } from "./normalize.js";
import { defaultSearchUniqueMode, normalizeUniqueMode, type SearchUniqueMode } from "./unique.js";

const WhiteSpace = createToken({ name: "WhiteSpace", pattern: /\s+/, group: Lexer.SKIPPED });
const LParen = createToken({ name: "LParen", pattern: /\(/ });
const RParen = createToken({ name: "RParen", pattern: /\)/ });
const Gte = createToken({ name: "Gte", pattern: />=/ });
const Lte = createToken({ name: "Lte", pattern: /<=/ });
const Gt = createToken({ name: "Gt", pattern: />/ });
const Lt = createToken({ name: "Lt", pattern: /</ });
const Eq = createToken({ name: "Eq", pattern: /=/ });
const Colon = createToken({ name: "Colon", pattern: /:/ });
const Minus = createToken({ name: "Minus", pattern: /-/ });
const QuotedString = createToken({ name: "QuotedString", pattern: /"([^"\\]|\\.)*"/ });
const BareWord = createToken({
  name: "BareWord",
  pattern: /[A-Za-z0-9_*][A-Za-z0-9_.*\/',-]*/
});
const NumberLiteral = createToken({ name: "NumberLiteral", pattern: /\d+/, longer_alt: BareWord });
const And = createToken({ name: "And", pattern: /and/i, longer_alt: BareWord });
const Or = createToken({ name: "Or", pattern: /or/i, longer_alt: BareWord });
const Not = createToken({ name: "Not", pattern: /not/i, longer_alt: BareWord });

const allTokens = [
  WhiteSpace,
  LParen,
  RParen,
  Gte,
  Lte,
  Gt,
  Lt,
  Eq,
  Colon,
  Minus,
  QuotedString,
  And,
  Or,
  Not,
  NumberLiteral,
  BareWord
];

const lexer = new Lexer(allTokens);

const operatorTokenToQueryOperator = new Map<TokenType, QueryOperator>([
  [Colon, "contains"],
  [Eq, "eq"],
  [Lt, "lt"],
  [Lte, "lte"],
  [Gt, "gt"],
  [Gte, "gte"]
]);

class QueryParser {
  private index = 0;
  private readonly diagnostics: QueryDiagnostic[] = [];

  constructor(private readonly tokens: IToken[]) {}

  parse(): { ast: QueryNode; diagnostics: QueryDiagnostic[] } {
    if (this.tokens.length === 0) {
      return { ast: { type: "all" }, diagnostics: [] };
    }

    const ast = this.parseOr();
    while (!this.isAtEnd()) {
      const token = this.advance();
      this.diagnostics.push({
        message: `Unexpected token "${token.image}".`,
        offset: token.startOffset,
        length: token.image.length
      });
    }

    return {
      ast: this.diagnostics.length > 0 ? { type: "all" } : ast,
      diagnostics: this.diagnostics
    };
  }

  private parseOr(): QueryNode {
    const children = [this.parseAnd()];

    while (this.match(Or)) {
      children.push(this.parseAnd());
    }

    return children.length === 1 ? children[0] : { type: "or", children };
  }

  private parseAnd(): QueryNode {
    const children = [this.parseUnary()];

    while (this.canContinueAnd()) {
      this.match(And);
      children.push(this.parseUnary());
    }

    return children.length === 1 ? children[0] : { type: "and", children };
  }

  private parseUnary(): QueryNode {
    let negationCount = 0;

    while (this.match(Not) || this.match(Minus)) {
      negationCount += 1;
    }

    let node = this.parsePrimary();
    for (let i = 0; i < negationCount; i += 1) {
      node = { type: "not", child: node };
    }

    return node;
  }

  private parsePrimary(): QueryNode {
    if (this.match(LParen)) {
      const expression = this.parseOr();
      if (!this.match(RParen)) {
        const token = this.peek();
        this.diagnostics.push({
          message: "Expected closing parenthesis.",
          offset: token?.startOffset,
          length: token?.image.length
        });
      }
      return expression;
    }

    if (this.isFieldPredicateStart()) {
      return this.parsePredicate();
    }

    if (this.isValueToken(this.peek())) {
      return { type: "term", value: this.parseValue() };
    }

    const token = this.peek();
    this.diagnostics.push({
      message: token ? `Expected query term before "${token.image}".` : "Expected query term.",
      offset: token?.startOffset,
      length: token?.image.length
    });

    if (token) this.advance();
    return { type: "all" };
  }

  private parsePredicate(): QueryNode {
    const fieldToken = this.consume(BareWord);
    const operatorToken = this.advance();
    const operator = operatorTokenToQueryOperator.get(operatorToken.tokenType);

    if (!operator) {
      this.diagnostics.push({
        message: `Expected query operator after "${fieldToken.image}".`,
        offset: operatorToken.startOffset,
        length: operatorToken.image.length
      });
      return { type: "all" };
    }

    if (!this.isValueToken(this.peek())) {
      const token = this.peek();
      this.diagnostics.push({
        message: `Expected value after operator "${operatorToken.image}".`,
        offset: token?.startOffset ?? operatorToken.endOffset,
        length: token?.image.length
      });
      return { type: "all" };
    }

    return {
      type: "predicate",
      field: fieldToken.image,
      operator,
      value: this.parseValue()
    };
  }

  private parseValue(): string {
    const token = this.advance();
    return token.tokenType === QuotedString ? unquote(token.image) : token.image;
  }

  private canContinueAnd(): boolean {
    const token = this.peek();
    if (!token || token.tokenType === RParen || token.tokenType === Or) return false;
    return token.tokenType === And || this.canStartUnary(token);
  }

  private canStartUnary(token: IToken | undefined): boolean {
    if (!token) return false;
    return (
      token.tokenType === LParen ||
      token.tokenType === Minus ||
      token.tokenType === Not ||
      this.isValueToken(token)
    );
  }

  private isFieldPredicateStart(): boolean {
    const field = this.peek();
    const operator = this.peek(1);
    if (!field || field.tokenType !== BareWord || !operator) return false;
    return operatorTokenToQueryOperator.has(operator.tokenType);
  }

  private isValueToken(token: IToken | undefined): boolean {
    if (!token) return false;
    return (
      token.tokenType === QuotedString ||
      token.tokenType === BareWord ||
      token.tokenType === NumberLiteral ||
      token.tokenType === And ||
      token.tokenType === Or ||
      token.tokenType === Not
    );
  }

  private match(tokenType: TokenType): boolean {
    if (!this.check(tokenType)) return false;
    this.advance();
    return true;
  }

  private consume(tokenType: TokenType): IToken {
    if (this.check(tokenType)) return this.advance();
    throw new Error(`Parser invariant failed: expected ${tokenType.name}.`);
  }

  private check(tokenType: TokenType): boolean {
    return this.peek()?.tokenType === tokenType;
  }

  private advance(): IToken {
    const token = this.tokens[this.index];
    this.index += 1;
    return token;
  }

  private peek(offset = 0): IToken | undefined {
    return this.tokens[this.index + offset];
  }

  private isAtEnd(): boolean {
    return this.index >= this.tokens.length;
  }
}

function normalizeOperator(operator: QueryOperator): string {
  switch (operator) {
    case "contains":
      return ":";
    case "eq":
      return "=";
    case "lt":
      return "<";
    case "lte":
      return "<=";
    case "gt":
      return ">";
    case "gte":
      return ">=";
  }
}

function astToQuery(node: QueryNode, parent?: QueryNode["type"]): string {
  switch (node.type) {
    case "all":
      return "";
    case "term":
      return quoteIfNeeded(node.value);
    case "predicate": {
      const field = resolveField(node.field)?.canonical ?? node.field.toLowerCase();
      return `${field}${normalizeOperator(node.operator)}${quoteIfNeeded(node.value)}`;
    }
    case "not":
      return `not ${astToQuery(node.child, "not")}`;
    case "and": {
      const query = node.children.map((child) => astToQuery(child, "and")).join(" ");
      return parent === "or" ? `(${query})` : query;
    }
    case "or":
      return node.children.map((child) => astToQuery(child, "or")).join(" or ");
  }
}

type QueryOptionState = {
  uniqueMode: SearchUniqueMode;
  uniqueModeSpecified: boolean;
};

type QueryOptionContext = {
  insideOr: boolean;
  negated: boolean;
};

function isUniquePredicate(node: QueryNode): node is Extract<QueryNode, { type: "predicate" }> {
  return node.type === "predicate" && node.field.toLowerCase() === "unique";
}

function stripQueryOptions(
  node: QueryNode,
  diagnostics: QueryDiagnostic[],
  state: QueryOptionState,
  context: QueryOptionContext
): QueryNode | null {
  switch (node.type) {
    case "all":
    case "term":
      return node;
    case "predicate": {
      if (!isUniquePredicate(node)) return node;

      if (context.insideOr || context.negated) {
        diagnostics.push({ message: `Field "unique" must be used as a positive top-level query option.` });
        return node;
      }

      if (node.operator !== "contains" && node.operator !== "eq") {
        diagnostics.push({ message: `Field "unique" supports only ":" or "=".` });
        return node;
      }

      const uniqueMode = normalizeUniqueMode(node.value);
      if (!uniqueMode) {
        diagnostics.push({ message: `Field "unique" requires legal, art, id, or cn.` });
        return node;
      }

      if (state.uniqueModeSpecified && state.uniqueMode !== uniqueMode) {
        diagnostics.push({ message: `Only one unique option may be used.` });
        return node;
      }

      state.uniqueMode = uniqueMode;
      state.uniqueModeSpecified = true;
      return null;
    }
    case "not": {
      const child = stripQueryOptions(node.child, diagnostics, state, { ...context, negated: true });
      return child ? { type: "not", child } : node;
    }
    case "and": {
      const children = node.children
        .map((child) => stripQueryOptions(child, diagnostics, state, context))
        .filter((child): child is QueryNode => Boolean(child));

      if (children.length === 0) return null;
      return children.length === 1 ? children[0] : { type: "and", children };
    }
    case "or": {
      const children = node.children
        .map((child) => stripQueryOptions(child, diagnostics, state, { ...context, insideOr: true }))
        .filter((child): child is QueryNode => Boolean(child));

      if (children.length === 0) return null;
      return children.length === 1 ? children[0] : { type: "or", children };
    }
  }
}

function extractQueryOptions(ast: QueryNode, diagnostics: QueryDiagnostic[]): { ast: QueryNode } & QueryOptionState {
  const state: QueryOptionState = {
    uniqueMode: defaultSearchUniqueMode,
    uniqueModeSpecified: false
  };

  return {
    ast: stripQueryOptions(ast, diagnostics, state, { insideOr: false, negated: false }) ?? { type: "all" },
    ...state
  };
}

function normalizedQueryWithOptions(ast: QueryNode, uniqueMode: SearchUniqueMode, uniqueModeSpecified: boolean): string {
  const parts = [astToQuery(ast)];
  if (uniqueModeSpecified) {
    parts.push(`unique:${uniqueMode}`);
  }
  return parts.filter(Boolean).join(" ");
}

function validateNode(node: QueryNode, diagnostics: QueryDiagnostic[]): void {
  switch (node.type) {
    case "all":
    case "term":
      return;
    case "not":
      validateNode(node.child, diagnostics);
      return;
    case "and":
    case "or":
      node.children.forEach((child) => validateNode(child, diagnostics));
      return;
    case "predicate": {
      const field = resolveField(node.field);
      if (!field) {
        diagnostics.push({ message: `Unknown query field "${node.field}".` });
        return;
      }

      const isNumericOperator = ["lt", "lte", "gt", "gte"].includes(node.operator);
      const isMissingCheck = node.value.toLowerCase() === "none";

      if (field.canonical === "is" && !normalizeVariantQuery(node.value)) {
        diagnostics.push({ message: `Field "is" requires a known finish or treatment value.` });
      }

      if (field.kind === "string" && isNumericOperator) {
        diagnostics.push({ message: `Field "${field.canonical}" does not support numeric comparisons.` });
      }

      if (field.kind === "number" && !isMissingCheck && Number.isNaN(Number(node.value))) {
        diagnostics.push({ message: `Field "${field.canonical}" requires a numeric value or "none".` });
      }
    }
  }
}

export function parseQuery(source: string): ParsedQuery {
  const trimmedSource = source.trim();
  if (trimmedSource.length === 0) {
    return {
      source,
      normalizedQuery: "",
      ast: { type: "all" },
      uniqueMode: defaultSearchUniqueMode,
      uniqueModeSpecified: false,
      diagnostics: []
    };
  }

  const lexResult = lexer.tokenize(trimmedSource);
  const diagnostics: QueryDiagnostic[] = lexResult.errors.map((error) => ({
    message: error.message,
    offset: error.offset,
    length: error.length
  }));

  const parser = new QueryParser(lexResult.tokens);
  const parsed = parser.parse();
  diagnostics.push(...parsed.diagnostics);

  let ast = parsed.ast;
  let uniqueMode = defaultSearchUniqueMode;
  let uniqueModeSpecified = false;

  if (diagnostics.length === 0) {
    const extracted = extractQueryOptions(ast, diagnostics);
    ast = extracted.ast;
    uniqueMode = extracted.uniqueMode;
    uniqueModeSpecified = extracted.uniqueModeSpecified;
  }

  if (diagnostics.length === 0) {
    validateNode(ast, diagnostics);
  }

  return {
    source,
    normalizedQuery: diagnostics.length > 0 ? trimmedSource : normalizedQueryWithOptions(ast, uniqueMode, uniqueModeSpecified),
    ast: diagnostics.length > 0 ? { type: "all" } : ast,
    uniqueMode: diagnostics.length > 0 ? defaultSearchUniqueMode : uniqueMode,
    uniqueModeSpecified: diagnostics.length > 0 ? false : uniqueModeSpecified,
    diagnostics
  };
}
