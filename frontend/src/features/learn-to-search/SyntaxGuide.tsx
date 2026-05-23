import { useState } from "react";
import { SyntaxQueryChip } from "../../ui-elements";
import { SyntaxSandbox } from "./SyntaxSandbox";
import { SyntaxComparisonCard } from "./SyntaxComparisonCard";

type SyntaxSectionProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

function SyntaxSection({ title, description, children }: SyntaxSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-bold text-text-primary">{title}</h3>
        <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ExampleChips({ queries, onClick }: { queries: string[]; onClick: (q: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-xs text-text-tertiary shrink-0">Try:</span>
      {queries.map((q) => (
        <SyntaxQueryChip key={q} query={q} onClick={onClick} />
      ))}
    </div>
  );
}

export function SyntaxGuide() {
  const [sandboxQuery, setSandboxQuery] = useState("t:unit c>=3 -tag:dragon");

  function useExample(q: string) {
    setSandboxQuery(q);
  }

  return (
    <div className="flex flex-col gap-10 max-w-3xl mx-auto">

      {/* ── Hero + sandbox ── */}
      <div className="flex flex-col gap-4 text-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Learn Query Syntax</h2>
          <p className="mt-1 text-sm text-text-secondary">Understand how Noxian search queries behave. Click any example to try it.</p>
        </div>
        <SyntaxSandbox query={sandboxQuery} onChange={setSandboxQuery} />
      </div>

      {/* ── Main sections ── */}
      <div className="flex flex-col gap-8 divide-y divide-border-subtle">

        {/* Section 1 — Matching Text */}
        <SyntaxSection
          title="Matching Text"
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
            onClick={useExample}
          />
          <ExampleChips queries={["name:jin*", "name:*dragon*", 'n:"loose cannon"']} onClick={useExample} />
        </SyntaxSection>

        {/* Section 2 — Comparing Values */}
        <SyntaxSection
          title="Comparing Values"
          description="Use comparison operators for numeric fields and domain/rarity containment vs. exact-set matching."
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
            onClick={useExample}
          />
          <ExampleChips queries={["c>=3", "m<5", "e=2", "d<=mf", "d>p"]} onClick={useExample} />
        </SyntaxSection>

        {/* Section 3 — Combining Queries */}
        <SyntaxSection
          title="Combining Queries"
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
              description: "The parentheses make the OR apply first — then only Units within that set.",
            }}
            onClick={useExample}
          />
          <ExampleChips queries={["-tag:dragon", "not rarity:Common", "d:fury t:unit rarity:Rare"]} onClick={useExample} />
        </SyntaxSection>

        {/* Section 4 — Controlling Results */}
        <SyntaxSection
          title="Controlling Results"
          description="These terms affect which printings appear, not which cards match."
        >
          <div className="flex flex-wrap gap-2">
            {["unique:legal", "unique:art", "unique:prints", "is:foil", "is:Signed", "is:altart"].map((q) => (
              <SyntaxQueryChip key={q} query={q} onClick={useExample} />
            ))}
          </div>
          <p className="text-xs text-text-tertiary leading-relaxed">
            <code className="font-mono text-accent-warm">unique:</code> controls which version of each card is shown. <code className="font-mono text-accent-warm">is:</code> filters by finish or treatment.
          </p>
        </SyntaxSection>

      </div>

      {/* ── Coming from Scryfall ── */}
      <aside className="rounded-xl border border-border-default bg-surface-2 px-5 py-4 flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-tertiary">Coming from Scryfall?</p>
        <ul className="flex flex-col gap-2">
          {[
            { topic: "Set semantics",           note: "d:fury includes any card with Fury. d=fury requires only Fury — not a subset check." },
            { topic: "Default uniqueness",       note: "Results default to unique cards (one per name). Use unique:prints to see all printings." },
            { topic: "Wildcard",                 note: "Wildcards use * (e.g. name:jin*). Not all fields support wildcards." },
            { topic: "Normalized matching",      note: "Searches are case-insensitive and ignore accent marks." },
          ].map(({ topic, note }) => (
            <li key={topic} className="flex gap-2 items-baseline">
              <span className="shrink-0 text-xs font-semibold text-text-tertiary w-36">{topic}</span>
              <span className="text-sm text-text-secondary leading-snug">{note}</span>
            </li>
          ))}
        </ul>
      </aside>

    </div>
  );
}
