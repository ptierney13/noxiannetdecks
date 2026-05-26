import { QueryChip } from "../../ui-elements";
import type { QueryFieldGuide } from "../../types";
import type { LtsDetailItem } from "./GuideDetailCard";
import { guideDetailForQueryField } from "./guideDetails";

// Parent fields that have named children displayed below them.
const SECTION_CHILDREN: Record<string, string[]> = {
  "Cost":      ["Energy", "Might", "Power"],
  "Type line": ["Card type", "Supertype", "Tag"],
};

type TextFieldGuideProps = {
  fields: QueryFieldGuide[];
  onSelect: (item: LtsDetailItem) => void;
  onAppend: (text: string) => void;
  selectedQueries: ReadonlySet<string>;
};

type FieldRowProps = {
  field: QueryFieldGuide;
  child?: boolean;
  detail: LtsDetailItem;
  isSelected: boolean;
  onSelect: (item: LtsDetailItem) => void;
  onAppend: (text: string) => void;
};

function FieldRow({ field, child = false, detail, isSelected, onSelect, onAppend }: FieldRowProps) {
  const query = detail.query ?? field.query;

  return (
    <div
      className={[
        "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-[background,border-color,box-shadow] duration-[120ms]",
        child ? "ml-5 border-l-2 pl-4" : "",
        child && isSelected ? "border-accent/50" : child ? "border-border-subtle" : "",
        isSelected
          ? "bg-accent-soft/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          : "hover:bg-[rgba(255,255,255,0.035)]",
      ].join(" ")}
    >
      <button
        type="button"
        className="group flex min-w-0 flex-1 items-center gap-1.5 rounded text-left hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
        onClick={() => onSelect(detail)}
        aria-label={`${field.property} details`}
        aria-pressed={isSelected}
      >
        <span className={[
          "text-sm font-medium truncate transition-colors duration-[100ms]",
          isSelected ? "text-accent-warm" : child ? "text-text-secondary" : "text-text-primary",
        ].join(" ")}>
          {field.property}
        </span>
        <svg
          className={[
            "w-3.5 h-3.5 shrink-0 transition-[color,transform] duration-[100ms] group-hover:translate-x-0.5",
            isSelected ? "text-accent group-hover:text-accent" : "text-text-tertiary group-hover:text-accent",
          ].join(" ")}
          aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <QueryChip text={query} onAppend={onAppend} />
    </div>
  );
}

export function TextFieldGuide({ fields, onSelect, onAppend, selectedQueries }: TextFieldGuideProps) {
  const childSet = new Set(Object.values(SECTION_CHILDREN).flat());
  const fieldByName = new Map(fields.map((f) => [f.property, f]));

  return (
    <ul className="flex flex-col gap-1 rounded-xl border border-border-subtle bg-surface-inset/80 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]" aria-label="Searchable fields">
      {fields.flatMap((field) => {
        if (childSet.has(field.property)) return [];
        const children = SECTION_CHILDREN[field.property];
        const detail = guideDetailForQueryField(field);
        return [
          <li key={field.property}>
            <FieldRow
              field={field}
              detail={detail}
              isSelected={selectedQueries.has(detail.query ?? detail.label)}
              onSelect={onSelect}
              onAppend={onAppend}
            />
            {children && (
              <ul className="flex flex-col gap-0.5 mt-0.5">
                {children.flatMap((childName) => {
                  const child = fieldByName.get(childName);
                  const childDetail = child ? guideDetailForQueryField(child) : null;
                  return child
                    ? [
                        <li key={childName}>
                          <FieldRow
                            field={child}
                            child
                            detail={childDetail!}
                            isSelected={selectedQueries.has(childDetail!.query ?? childDetail!.label)}
                            onSelect={onSelect}
                            onAppend={onAppend}
                          />
                        </li>,
                      ]
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
