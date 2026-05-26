import { resolveField } from "@noxiannet/card-store/query";
import { FIELD_COLOR } from "../lib";

type QuerySpan =
  | { kind: "space" | "structural" | "connector"; text: string }
  | {
      kind: "predicate";
      text: string;
      negated: string;
      field: string;
      op: string;
      value: string;
      color?: string;
    }
  | { kind: "bare" | "error"; text: string };

export type QuerySyntaxTextProps = {
  query: string;
  emptyText?: string;
  className?: string;
  emptyClassName?: string;
};

function tokenizeQueryText(source: string): QuerySpan[] {
  const spans: QuerySpan[] = [];
  let i = 0;

  while (i < source.length) {
    const rest = source.slice(i);

    const whitespace = rest.match(/^\s+/);
    if (whitespace) {
      spans.push({ kind: "space", text: whitespace[0] });
      i += whitespace[0].length;
      continue;
    }

    if (rest[0] === "(" || rest[0] === ")") {
      spans.push({ kind: "structural", text: rest[0] });
      i += 1;
      continue;
    }

    const connector = rest.match(/^(or|and|not)(?=[\s()]|$)/i);
    if (connector) {
      spans.push({ kind: "connector", text: connector[0] });
      i += connector[0].length;
      continue;
    }

    const predicate = rest.match(
      /^(-?)([A-Za-z_][A-Za-z0-9_]*)(:|=|>=?|<=?)("(?:[^"\\]|\\.)*"|[^\s()]+)/
    );
    if (predicate) {
      const [text, negated, field, op, value] = predicate;
      const definition = resolveField(field);
      if (!definition) {
        spans.push({ kind: "error", text });
        i += text.length;
        continue;
      }

      spans.push({
        kind: "predicate",
        text,
        negated,
        field,
        op,
        value,
        color: FIELD_COLOR[definition.canonical],
      });
      i += text.length;
      continue;
    }

    const bare = rest.match(/^[^\s()]+/);
    if (bare) {
      spans.push({ kind: "bare", text: bare[0] });
      i += bare[0].length;
      continue;
    }

    spans.push({ kind: "structural", text: rest[0] });
    i += 1;
  }

  return spans;
}

export function QuerySyntaxText({
  query,
  emptyText,
  className,
  emptyClassName,
}: QuerySyntaxTextProps) {
  if (!query.trim()) {
    return emptyText ? (
      <span className={emptyClassName ?? "text-text-tertiary/50 italic"}>{emptyText}</span>
    ) : null;
  }

  const spans = tokenizeQueryText(query);

  return (
    <code className={["font-mono whitespace-pre-wrap break-words", className ?? ""].join(" ")}>
      {spans.map((span, index) => {
        if (span.kind === "space") {
          return <span key={index}>{span.text}</span>;
        }

        if (span.kind === "structural") {
          return (
            <span key={index} className="text-text-tertiary/50">
              {span.text}
            </span>
          );
        }

        if (span.kind === "connector") {
          return (
            <span key={index} className="text-accent-warm/80 italic">
              {span.text}
            </span>
          );
        }

        if (span.kind === "error") {
          return (
            <span key={index} className="text-negative">
              {span.text}
            </span>
          );
        }

        if (span.kind === "bare") {
          return (
            <span key={index} className="text-text-primary">
              {span.text}
            </span>
          );
        }

        if (span.kind !== "predicate") {
          return null;
        }

        const fieldColor = span.color ?? "var(--color-accent-warm)";

        return (
          <span key={index}>
            {span.negated ? <span className="text-accent">{span.negated}</span> : null}
            <span style={{ color: fieldColor }}>{span.field}</span>
            <span className="text-text-tertiary">{span.op}</span>
            <span className="text-text-primary">{span.value}</span>
          </span>
        );
      })}
    </code>
  );
}
