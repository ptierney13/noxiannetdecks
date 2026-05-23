import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useAppError } from "../app/ErrorContext";
import { useHeaderSearch } from "../app/HeaderSearchContext";
import { queryFeaturesQueryOptions } from "../data";
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

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-12 pt-4 flex flex-col gap-6">
      <LearnModeBar active={mode} onChange={handleTabChange} />

      {mode === "visual-guide" && (
        <ResponsiveGuideDetails onAppend={appendQuery}>
          {(onSelect) => <VisualCardGuide onSelect={onSelect} />}
        </ResponsiveGuideDetails>
      )}

      {mode === "text-guide" && (
        <ResponsiveGuideDetails onAppend={appendQuery}>
          {(onSelect) => (
            <TextFieldGuide
              fields={fields}
              onSelect={onSelect}
              onAppend={appendQuery}
            />
          )}
        </ResponsiveGuideDetails>
      )}

      {mode === "syntax-guide" && <SyntaxGuide />}
    </div>
  );
}
