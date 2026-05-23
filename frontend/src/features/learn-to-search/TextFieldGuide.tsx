import { QueryChip } from "../../ui-elements";
import type { QueryFieldGuide } from "../../types";
import type { LtsDetailItem } from "./GuideDetailCard";

// Parent fields that have named children displayed below them.
const SECTION_CHILDREN: Record<string, string[]> = {
  "Cost":      ["Energy", "Power"],
  "Type line": ["Card type", "Supertype", "Tag"],
};

type TextFieldGuideProps = {
  fields: QueryFieldGuide[];
  onSelect: (item: LtsDetailItem) => void;
  onAppend: (text: string) => void;
};

function fieldToDetail(field: QueryFieldGuide): LtsDetailItem {
  return {
    label: field.property,
    category: field.property.toUpperCase(),
    description: field.searches,
    query: field.query,
    shorthand: field.shorthand ?? undefined,
    examples: [field.example],
  };
}

type FieldRowProps = {
  field: QueryFieldGuide;
  child?: boolean;
  onSelect: (item: LtsDetailItem) => void;
  onAppend: (text: string) => void;
};

function FieldRow({ field, child = false, onSelect, onAppend }: FieldRowProps) {
  return (
    <div
      className={[
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-[100ms]",
        child ? "ml-5 border-l-2 border-border-subtle pl-4" : "",
      ].join(" ")}
    >
      <button
        type="button"
        className="flex flex-1 items-center gap-1.5 min-w-0 text-left group hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] rounded"
        onClick={() => onSelect(fieldToDetail(field))}
        aria-label={`${field.property} — details`}
      >
        <span className={[
          "text-sm font-medium truncate transition-colors duration-[100ms]",
          child ? "text-text-secondary" : "text-text-primary",
        ].join(" ")}>
          {field.property}
        </span>
        <svg
          className="w-3.5 h-3.5 shrink-0 text-text-tertiary transition-[color,transform] duration-[100ms] group-hover:text-accent group-hover:translate-x-0.5"
          aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <QueryChip text={field.query} onAppend={onAppend} />
    </div>
  );
}

export function TextFieldGuide({ fields, onSelect, onAppend }: TextFieldGuideProps) {
  const childSet = new Set(Object.values(SECTION_CHILDREN).flat());
  const fieldByName = new Map(fields.map((f) => [f.property, f]));

  return (
    <ul className="flex flex-col gap-0.5" aria-label="Searchable fields">
      {fields.flatMap((field) => {
        if (childSet.has(field.property)) return [];
        const children = SECTION_CHILDREN[field.property];
        return [
          <li key={field.property}>
            <FieldRow field={field} onSelect={onSelect} onAppend={onAppend} />
            {children && (
              <ul className="flex flex-col gap-0.5 mt-0.5">
                {children.flatMap((childName) => {
                  const child = fieldByName.get(childName);
                  return child
                    ? [<li key={childName}><FieldRow field={child} child onSelect={onSelect} onAppend={onAppend} /></li>]
                    : [];
                })}
              </ul>
            )}
          </li>,
        ];
      })}
    </ul>
  );
}
