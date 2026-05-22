import { ResultCard } from "../../ui-elements";
import { VariantSelectorRow } from "../VariantSelectorRow";
import {
  CARD_SEARCH_SORT_OPTIONS,
  normalizeCardFinish,
  type CardFinish,
  type CardSearchResultGroup,
  type CardSearchSortKey,
  type CardSearchVariantMode,
  type PublishedPriceIndex,
} from "../../lib";
import type { CardRecord, QueryDiagnostic } from "../../types";

export type CardSearchResultsContentProps = {
  groups: CardSearchResultGroup[];
  rawResultCount: number;
  visibleResultCount: number;
  normalizedQuery: string;
  diagnostics: QueryDiagnostic[];
  isPending: boolean;
  isError: boolean;
  errorMessage?: string;
  sort: CardSearchSortKey;
  variantMode: CardSearchVariantMode;
  showPrice: boolean;
  showVariants: boolean;
  publishedPriceIndex: PublishedPriceIndex | null;
  onSortChange: (sort: CardSearchSortKey) => void;
  onVariantModeChange: (variantMode: CardSearchVariantMode) => void;
  onShowPriceChange: (showPrice: boolean) => void;
  onShowVariantsChange: (showVariants: boolean) => void;
  onCardClick: (card: CardRecord, group: CardRecord[], finish: CardFinish) => void;
};

// Controls flex row — dropdowns + checkbox stack wrap at narrow widths.
const CONTROL_LAYOUT_CLASSES = "flex flex-wrap items-end gap-4";

// Banner padding mirrors the content padding so controls align with card grid.
const BANNER_PADDING_CLASSES = "px-3 py-4 @[640px]:px-4 @[1024px]:px-5";

// The grid intentionally uses fixed columns, not auto-fill, to match search-plan review rules.
const RESULTS_GRID_CLASSES =
  "grid grid-cols-2 gap-3 @[768px]:grid-cols-3 @[1024px]:grid-cols-4 @[1280px]:grid-cols-5 @[1536px]:grid-cols-6";

// Padding is centralized so pane edge spacing can be tuned without hunting through JSX.
const PANE_PADDING_CLASSES = "p-3 @[640px]:p-4 @[1024px]:p-5";

function FieldLabel({ children }: { children: string }) {
  return (
    <span className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-white">
      {children}
    </span>
  );
}

function Diagnostics({ diagnostics }: { diagnostics: QueryDiagnostic[] }) {
  if (diagnostics.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-negative-border bg-negative-soft p-4 text-sm text-text-primary" role="alert">
      <strong className="block text-sm font-black">Query needs attention</strong>
      <ul className="mt-2 grid gap-1 pl-5">
        {diagnostics.map((diagnostic, index) => (
          <li key={`${diagnostic.message}-${index}`} className="list-disc">
            {diagnostic.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className={RESULTS_GRID_CLASSES} aria-label="Loading card results">
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          className="aspect-[5/7] animate-pulse rounded-[18px] border border-border-subtle bg-surface-inset"
        />
      ))}
    </div>
  );
}

function ResultSummary({
  isPending,
  visibleResultCount,
  rawResultCount,
  normalizedQuery,
}: {
  isPending: boolean;
  visibleResultCount: number;
  rawResultCount: number;
  normalizedQuery: string;
}) {
  if (isPending) {
    return <p className="m-0 text-sm text-text-tertiary">Searching cards...</p>;
  }

  const cardWord = visibleResultCount === 1 ? "card" : "cards";
  const extra =
    rawResultCount !== visibleResultCount ? ` from ${rawResultCount.toLocaleString()} printings` : "";

  return (
    <p className="m-0 text-sm text-text-secondary">
      <span className="font-black text-text-primary">{visibleResultCount.toLocaleString()}</span>{" "}
      matching {cardWord}
      {extra}
      {normalizedQuery ? (
        <>
          {" "}
          for <code className="rounded-md bg-surface-inset px-1.5 py-0.5 text-accent-warm">{normalizedQuery}</code>
        </>
      ) : null}
    </p>
  );
}

export function CardSearchResultsContent({
  groups,
  rawResultCount,
  visibleResultCount,
  normalizedQuery,
  diagnostics,
  isPending,
  isError,
  errorMessage,
  sort,
  variantMode,
  showPrice,
  showVariants,
  publishedPriceIndex,
  onSortChange,
  onVariantModeChange,
  onShowPriceChange,
  onShowVariantsChange,
  onCardClick,
}: CardSearchResultsContentProps) {
  return (
    <section aria-label="Card search results">
      {/* Full-width controls banner — no rounded sub-box, spans edge to edge */}
      <div className={`bg-surface-2 border-b border-border-subtle ${BANNER_PADDING_CLASSES}`}>
        <div className={CONTROL_LAYOUT_CLASSES}>
          <label className="grid gap-2">
            <FieldLabel>Sort</FieldLabel>
            <select
              className="min-h-11 rounded-xl border border-border-default bg-[rgba(255,255,255,0.12)] px-3 text-sm font-bold text-text-primary outline-none focus:border-accent focus:ring-4 focus:ring-focus-ring"
              value={sort}
              onChange={(event) => onSortChange(event.target.value as CardSearchSortKey)}
            >
              {CARD_SEARCH_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <FieldLabel>Variants</FieldLabel>
            <select
              className="min-h-11 rounded-xl border border-border-default bg-[rgba(255,255,255,0.12)] px-3 text-sm font-bold text-text-primary outline-none focus:border-accent focus:ring-4 focus:ring-focus-ring"
              value={variantMode}
              onChange={(event) => onVariantModeChange(event.target.value as CardSearchVariantMode)}
            >
              <option value="unique-cards">Unique Cards</option>
              <option value="unique-printings">Unique Printings</option>
            </select>
          </label>

          {/* Checkboxes as plain stacked rows — gap-2 matches label-to-dropdown spacing */}
          <div className="flex flex-col gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-text-secondary">
              <input
                type="checkbox"
                checked={showPrice}
                onChange={(event) => onShowPriceChange(event.target.checked)}
              />
              Show prices
            </label>
            {variantMode === "unique-cards" ? (
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-text-secondary">
                <input
                  type="checkbox"
                  checked={showVariants}
                  onChange={(event) => onShowVariantsChange(event.target.checked)}
                />
                Show variants
              </label>
            ) : null}
          </div>
        </div>
      </div>

      <div className={`grid gap-4 ${PANE_PADDING_CLASSES}`}>
      <ResultSummary
        isPending={isPending}
        visibleResultCount={visibleResultCount}
        rawResultCount={rawResultCount}
        normalizedQuery={normalizedQuery}
      />

      <Diagnostics diagnostics={diagnostics} />

      {isPending ? <LoadingGrid /> : null}

      {isError ? (
        <div className="rounded-2xl border border-negative-border bg-negative-soft p-5 text-sm text-text-primary">
          <strong className="block font-black">Search failed</strong>
          <span className="mt-1 block text-text-secondary">{errorMessage ?? "Unable to load cards."}</span>
        </div>
      ) : null}

      {!isPending && !isError && groups.length === 0 ? (
        <div className="rounded-2xl border border-border-default bg-surface-2 p-8 text-center text-text-secondary">
          No cards matched this query.
        </div>
      ) : null}

      {!isPending && !isError && groups.length > 0 ? (
        <div className={RESULTS_GRID_CLASSES} data-testid="card-search-results-grid">
          {groups.map((group) => {
            const representative = group.representative;
            const primaryFinish = normalizeCardFinish(representative.finishes[0]);
            const variantCards = showVariants ? group.cards : [];

            return (
              <ResultCard
                key={group.key}
                name={representative.riot_name}
                imageUrl={representative.media.image_url}
                imageAlt={representative.media.accessibility_text ?? representative.riot_name}
                layout={representative.media.layout}
                onClick={() => onCardClick(representative, group.cards, primaryFinish)}
                footer={
                  variantCards.length > 0 ? (
                    <VariantSelectorRow
                      cards={variantCards}
                      showPrice={showPrice}
                      publishedPriceIndex={publishedPriceIndex}
                      onVariantSelect={({ card, finish }) => onCardClick(card, group.cards, finish)}
                    />
                  ) : undefined
                }
              />
            );
          })}
        </div>
      ) : null}
      </div>
    </section>
  );
}
