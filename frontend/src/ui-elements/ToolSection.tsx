import type { ReactNode } from "react";
import { useState } from "react";
import { ChevronIcon } from "./Icon";

export const TOOL_SECTION_TOKENS = {
  section:
    "overflow-hidden rounded-xl bg-[rgba(14,18,28,0.92)] shadow-[0_0_0_1px_rgba(197,50,71,0.14),0_0_28px_rgba(197,50,71,0.08),0_4px_14px_rgba(0,0,0,0.28)]",
  sectionHeader: "flex items-center gap-2.5 px-4 pt-3.5 pb-2",
  sectionBody: "flex flex-col gap-3.5 px-4 pb-4",
  sectionTitle: "text-[0.77rem] font-bold tracking-[0.04em] text-accent-warm/75 leading-none",
  sectionHint:
    "rounded-md border border-border-default bg-[rgba(8,11,18,0.82)] px-1.5 py-0.5 font-mono text-[0.66rem] text-accent-warm leading-none shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  subsection:
    "rounded-lg border border-border-subtle bg-[linear-gradient(180deg,rgba(20,25,36,0.72),rgba(10,13,20,0.78))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  subsectionRaised:
    "border-border-default bg-[linear-gradient(180deg,rgba(25,31,43,0.82),rgba(12,15,23,0.88))]",
} as const;

type ToolSectionProps = {
  title: string;
  hint?: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
  bodyClassName?: string;
  headerSlot?: ReactNode;
};

export function ToolSection({
  title,
  hint,
  children,
  collapsible = false,
  defaultOpen = true,
  className,
  bodyClassName,
  headerSlot,
}: ToolSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const headerContent = (
    <>
      <h2 className={TOOL_SECTION_TOKENS.sectionTitle}>{title}</h2>
      {hint ? <code className={TOOL_SECTION_TOKENS.sectionHint}>{hint}</code> : null}
      {headerSlot ? <div className="ml-auto">{headerSlot}</div> : null}
      {collapsible ? (
        <span className={headerSlot ? "text-text-tertiary opacity-60" : "ml-auto text-text-tertiary opacity-60"}>
          <ChevronIcon expanded={isOpen} />
        </span>
      ) : null}
    </>
  );

  return (
    <section className={[TOOL_SECTION_TOKENS.section, className ?? ""].join(" ")}>
      {collapsible ? (
        <button
          type="button"
          className={`w-full ${TOOL_SECTION_TOKENS.sectionHeader} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-inset`}
          onClick={() => setIsOpen((value) => !value)}
          aria-expanded={isOpen}
        >
          {headerContent}
        </button>
      ) : (
        <div className={TOOL_SECTION_TOKENS.sectionHeader}>{headerContent}</div>
      )}
      {isOpen ? (
        <div className={[TOOL_SECTION_TOKENS.sectionBody, bodyClassName ?? ""].join(" ")}>
          {children}
        </div>
      ) : null}
    </section>
  );
}

type ToolSubsectionProps = {
  label?: string;
  hint?: string;
  raised?: boolean;
  children: ReactNode;
  className?: string;
};

export function ToolSubsection({ label, hint, raised = false, children, className }: ToolSubsectionProps) {
  return (
    <div
      className={[
        TOOL_SECTION_TOKENS.subsection,
        raised ? TOOL_SECTION_TOKENS.subsectionRaised : "",
        className ?? "",
      ].join(" ")}
    >
      {label || hint ? (
        <div className="mb-2.5 flex items-center gap-2">
          {label ? (
            <span className="text-[0.7rem] font-bold uppercase leading-none tracking-[0.1em] text-accent-warm/65">
              {label}
            </span>
          ) : null}
          {hint ? <code className={TOOL_SECTION_TOKENS.sectionHint}>{hint}</code> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
