import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useAppError } from "../app/ErrorContext";
import { useHeaderSearch } from "../app/HeaderSearchContext";
import { queryFeaturesQueryOptions } from "../data";
import { ToolSection } from "../ui-elements";
import {
  LearnModeBar,
  ResponsiveGuideDetails,
  VisualCardGuide,
  TextFieldGuide,
  SyntaxGuide,
  type LearnTab,
} from "../features/learn-to-search";
export default function LearnToSearchView() {
  const setError = useAppError();
  const { appendQuery } = useHeaderSearch();
  const navigate = useNavigate();
  const { mode } = useSearch({ from: "/cards/learn-to-search" });

  const { data, isError } = useQuery({
    ...queryFeaturesQueryOptions,
    throwOnError: false,
  });

  if (isError) {
    setError("Unable to load query features.");
  }

  const fields = data?.fields ?? [];

  function handleTabChange(tab: LearnTab) {
    void navigate({ to: "/cards/learn-to-search", search: { mode: tab } });
  }

  const modeTitle =
    mode === "visual-guide" ? "Visual card guide" :
    mode === "text-guide" ? "Text field guide" :
    "Query syntax guide";

  const modeHint =
    mode === "visual-guide" ? "tap card parts" :
    mode === "text-guide" ? "choose a field" :
    "read examples";

  return (
    <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-5 px-4 pb-10 pt-4">
      <div className="rounded-2xl border border-border-subtle bg-[linear-gradient(180deg,rgba(18,23,34,0.92),rgba(7,9,14,0.72))] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-2">
            <span className="text-[0.72rem] font-black uppercase leading-none tracking-[0.14em] text-accent-warm/75">
              Learn to Search
            </span>
            <h1 className="text-3xl font-black leading-none tracking-tight text-text-primary sm:text-4xl">
              Turn card text into precise queries.
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-text-secondary">
              Use the card diagram, field index, and syntax examples to learn the same query language used by Card Search and Query Builder.
            </p>
          </div>
          <LearnModeBar active={mode} onChange={handleTabChange} />
        </div>
      </div>

      <ToolSection title={modeTitle} hint={modeHint} bodyClassName="p-3 sm:p-4">
        {mode === "visual-guide" && (
          <ResponsiveGuideDetails onAppend={appendQuery}>
            {(onSelect, selectedQueries) => (
              <VisualCardGuide onSelect={onSelect} selectedQueries={selectedQueries} />
            )}
          </ResponsiveGuideDetails>
        )}

        {mode === "text-guide" && (
          <ResponsiveGuideDetails onAppend={appendQuery}>
            {(onSelect, selectedQueries) => (
              <TextFieldGuide
                fields={fields}
                onSelect={onSelect}
                onAppend={appendQuery}
                selectedQueries={selectedQueries}
              />
            )}
          </ResponsiveGuideDetails>
        )}

        {mode === "syntax-guide" && <SyntaxGuide onAppend={appendQuery} />}
      </ToolSection>
    </div>
  );
}
