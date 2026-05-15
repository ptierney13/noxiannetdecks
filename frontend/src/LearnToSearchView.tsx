import { useEffect, useState } from "react";
import { loadQueryFeatures } from "./api";
import { CardSearchGuide } from "./CardSearchGuide";
import { LtsDetailOverlay, type LtsDetailItem } from "./LtsDetailOverlay";
import { QueryChip } from "./ui";
import type { QueryFieldGuide, QuerySyntaxGuide } from "./types";

type LearnTab = "visual-guide" | "text-guide" | "syntax-guide";

export default function LearnToSearchView({
  onError,
  onAppendToSearch,
}: {
  onError: (message: string | null) => void;
  onAppendToSearch: (fragment: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<LearnTab>("visual-guide");
  const [fieldGuides, setFieldGuides] = useState<QueryFieldGuide[]>([]);
  const [syntaxGuides, setSyntaxGuides] = useState<QuerySyntaxGuide[]>([]);
  const [detailItem, setDetailItem] = useState<LtsDetailItem | null>(null);

  useEffect(() => {
    let ignore = false;

    async function boot() {
      try {
        const result = await loadQueryFeatures();
        if (!ignore) {
          setFieldGuides(result.fields);
          setSyntaxGuides(result.syntax);
        }
      } catch (caught) {
        if (!ignore) {
          onError(caught instanceof Error ? caught.message : "Unable to load query features.");
        }
      }
    }

    void boot();
    return () => {
      ignore = true;
    };
  }, [onError]);

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

  function syntaxToDetail(op: QuerySyntaxGuide): LtsDetailItem {
    return {
      label: op.operation,
      category: "SYNTAX",
      description: op.behavior,
      examples: op.examples,
    };
  }

  return (
    <div className="learn-to-search-view">
      <div className="lts-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "visual-guide"}
          className={`lts-tab${activeTab === "visual-guide" ? " lts-tab--active" : ""}`}
          onClick={() => setActiveTab("visual-guide")}
        >
          Visual Guide
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "text-guide"}
          className={`lts-tab${activeTab === "text-guide" ? " lts-tab--active" : ""}`}
          onClick={() => setActiveTab("text-guide")}
        >
          Text Guide
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "syntax-guide"}
          className={`lts-tab${activeTab === "syntax-guide" ? " lts-tab--active" : ""}`}
          onClick={() => setActiveTab("syntax-guide")}
        >
          Syntax Guide
        </button>
      </div>

      <div className="lts-panel">
        {activeTab === "visual-guide" && (
          <CardSearchGuide
            onSelectZone={setDetailItem}
            onAppend={onAppendToSearch}
          />
        )}

        {activeTab === "text-guide" && (() => {
          const SECTION_CHILDREN: Record<string, string[]> = {
            "Cost":      ["Energy", "Power"],
            "Type line": ["Card type", "Supertype", "Tag"],
          };
          const childSet = new Set(Object.values(SECTION_CHILDREN).flat());
          const fieldByName = new Map(fieldGuides.map((f) => [f.property, f]));

          function FieldRow({ field, child = false }: { field: QueryFieldGuide; child?: boolean }) {
            return (
              <div className={`lts-field-row${child ? " lts-field-row--child" : ""}`}>
                <button
                  type="button"
                  className="lts-field-row-main"
                  onClick={() => setDetailItem(fieldToDetail(field))}
                  aria-label={`${field.property} — details`}
                >
                  <span className="lts-field-row-name">{field.property}</span>
                  <svg className="lts-field-row-arrow" aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <QueryChip text={field.query} onAppend={onAppendToSearch} />
              </div>
            );
          }

          return (
            <ul className="lts-field-list" aria-label="Searchable fields">
              {fieldGuides.flatMap((field) => {
                if (childSet.has(field.property)) return [];
                const children = SECTION_CHILDREN[field.property];
                return [
                  <li key={field.property}>
                    <FieldRow field={field} />
                    {children && (
                      <ul className="lts-field-children">
                        {children.flatMap((childName) => {
                          const child = fieldByName.get(childName);
                          return child ? [
                            <li key={childName}>
                              <FieldRow field={child} child />
                            </li>
                          ] : [];
                        })}
                      </ul>
                    )}
                  </li>
                ];
              })}
            </ul>
          );
        })()}

        {activeTab === "syntax-guide" && (
          <ul className="lts-syntax-list" aria-label="Query syntax">
            {syntaxGuides.map((op) => (
              <li key={op.operation}>
                <div className="lts-syntax-row">
                  <button
                    type="button"
                    className="lts-syntax-row-header"
                    onClick={() => setDetailItem(syntaxToDetail(op))}
                  >
                    <span className="lts-syntax-row-name">{op.operation}</span>
                    <svg className="lts-field-row-arrow" aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <p className="lts-syntax-row-desc">{op.behavior}</p>
                  <div className="lts-syntax-row-chips">
                    {op.examples.map((ex) => (
                      <QueryChip key={ex} text={ex} onAppend={onAppendToSearch} />
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <LtsDetailOverlay
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onAppend={onAppendToSearch}
      />
    </div>
  );
}
