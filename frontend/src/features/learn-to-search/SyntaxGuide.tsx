import type { ReactNode } from "react";
import { SyntaxQueryChip, ToolSubsection } from "../../ui-elements";
import { SyntaxComparisonCard } from "./SyntaxComparisonCard";

type SyntaxSectionProps = {
  title: string;
  hint?: string;
  description: string;
  children: ReactNode;
};

function SyntaxSection({ title, hint, description, children }: SyntaxSectionProps) {
  return (
    <ToolSubsection label={title} hint={hint} raised>
      <p className="mb-4 text-sm leading-relaxed text-text-secondary">{description}</p>
      <div className="flex flex-col gap-3">{children}</div>
    </ToolSubsection>
  );
}

function ExampleChips({ queries, onClick }: { queries: string[]; onClick: (q: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="shrink-0 text-xs font-bold uppercase tracking-[0.1em] text-text-tertiary">
        Try
      </span>
      {queries.map((query) => (
        <SyntaxQueryChip key={query} query={query} onClick={onClick} />
      ))}
    </div>
  );
}

type SyntaxGuideProps = {
  onAppend: (query: string) => void;
};

export function SyntaxGuide({ onAppend }: SyntaxGuideProps) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <div className="rounded-xl border border-border-subtle bg-surface-inset/75 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <p className="text-sm leading-relaxed text-text-secondary">
          Examples preserve the exact query text, including spaces and parentheses. Click a chip to add it to the header search.
        </p>
      </div>

      <SyntaxSection
        title="Matching Text"
        hint="name:"
        description="Use field:value for partial matches, field=value for exact matches, and wildcards for flexible searches."
      >
        <SyntaxComparisonCard
          left={{
            query: "name:jinx",
            label: 'Contains "jinx"',
            description: 'Matches any card whose name contains the text "jinx". Useful when you know part of a name.',
          }}
          right={{
            query: 'name="Jinx"',
            label: 'Exactly "Jinx"',
            description: 'Matches only the precise name "Jinx". Use when only that exact value should match.',
          }}
          onClick={onAppend}
        />
        <ExampleChips queries={["name:jin*", "name:*dragon*", 'n:"loose cannon"']} onClick={onAppend} />
      </SyntaxSection>

      <SyntaxSection
        title="Comparing Values"
        hint=">= <= ="
        description="Use comparison operators for numeric fields and domain or rarity containment vs. exact-set matching."
      >
        <SyntaxComparisonCard
          left={{
            query: "d:purple",
            label: "Domains include Purple",
            description: "Matches cards that have Purple among their domains. The card may also have other domains.",
          }}
          right={{
            query: "d=purple",
            label: "Domains are exactly Purple",
            description: "Matches cards whose full domain set is only Purple. No other domains.",
          }}
          onClick={onAppend}
        />
        <ExampleChips queries={["c>=3", "m<5", "e=2", "d<=mf", "d>p"]} onClick={onAppend} />
      </SyntaxSection>

      <SyntaxSection
        title="Combining Queries"
        hint="or ( )"
        description="Multiple terms implicitly AND together. Use or for alternatives and parentheses to control precedence."
      >
        <SyntaxComparisonCard
          left={{
            query: "d:body or d:fury",
            label: "Body or Fury cards",
            description: "Matches any card that includes Body or includes Fury. Either domain qualifies.",
          }}
          right={{
            query: "(d:body or d:fury) t:unit",
            label: "Body or Fury Units",
            description: "The parentheses make the OR apply first, then only Units within that set.",
          }}
          onClick={onAppend}
        />
        <ExampleChips queries={["-tag:dragon", "not rarity:Common", "d:fury t:unit rarity:Rare"]} onClick={onAppend} />
      </SyntaxSection>
    </div>
  );
}
