import { useState, useMemo } from "react";
import { ModalShell } from "../../ui-elements";
import { useCardSearchResults } from "../../data";
import {
  buildCardSearchResultGroups,
  sortCardsByKey,
  usePublishedPriceIndex,
  type CardSearchSortKey,
  type CardSearchVariantMode,
} from "../../lib";
import { useDebounce } from "../../lib/useDebounce";
import { CardSearchResultsContent } from "../card-search/CardSearchResultsContent";
import type { CardRecord } from "../../types";

type CardPickerModalProps = {
  title: string;
  filterQuery: string;
  onSelect: (card: CardRecord) => void;
  onClose: () => void;
};

export function CardPickerModal({ title, filterQuery, onSelect, onClose }: CardPickerModalProps) {
  const [userQuery, setUserQuery] = useState("");
  const [sort, setSort] = useState<CardSearchSortKey>("energy-asc");
  const [variantMode, setVariantMode] = useState<CardSearchVariantMode>("unique-cards");
  const [showPrice, setShowPrice] = useState(false);
  const [showVariants, setShowVariants] = useState(false);

  const debouncedUserQuery = useDebounce(userQuery, 260);
  const combinedQuery = [filterQuery, debouncedUserQuery.trim()].filter(Boolean).join(" ");

  const resultsQuery = useCardSearchResults(combinedQuery);
  const { index: publishedPriceIndex } = usePublishedPriceIndex();

  const cards = resultsQuery.data?.items ?? [];
  const sortedCards = useMemo(() => sortCardsByKey(cards, sort), [cards, sort]);
  const groups = useMemo(
    () => buildCardSearchResultGroups(sortedCards, variantMode),
    [sortedCards, variantMode],
  );
  const visibleResultCount = variantMode === "unique-cards" ? groups.length : cards.length;

  return (
    <ModalShell
      label={title}
      onClose={onClose}
      panelClassName="flex flex-col"
      className="items-start pt-16 pb-6"
    >
      {/* Title + inline search */}
      <div className="flex-shrink-0 px-5 pt-5 pb-3 pr-14">
        <h2 className="mb-3 text-[0.78rem] font-bold tracking-[0.08em] uppercase text-accent-warm/80">
          {title}
        </h2>
        <div className="flex h-10 items-center gap-2 rounded-xl border border-border-default bg-surface-inset px-3 focus-within:border-border-strong transition-colors">
          <svg
            className="h-4 w-4 flex-shrink-0 text-text-tertiary"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="search"
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-sm text-text-primary placeholder:text-text-dim [&::-webkit-search-cancel-button]:hidden"
            placeholder="Filter cards…"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          {userQuery ? (
            <button
              type="button"
              className="flex-shrink-0 text-xs leading-none text-text-tertiary hover:text-text-secondary"
              onClick={() => setUserQuery("")}
              aria-label="Clear filter"
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>

      {/* Results — CardSearchResultsContent owns the grid and controls */}
      <div className="flex-1 min-h-0 overflow-y-auto w-full" style={{ maxHeight: "70vh" }}>
        <CardSearchResultsContent
          groups={groups}
          rawResultCount={cards.length}
          visibleResultCount={visibleResultCount}
          executedTokens={resultsQuery.data?.executedTokens ?? []}
          isPending={resultsQuery.isPending}
          isError={resultsQuery.isError}
          errorMessage={
            resultsQuery.error instanceof Error ? resultsQuery.error.message : undefined
          }
          sort={sort}
          variantMode={variantMode}
          showPrice={showPrice}
          showVariants={showVariants}
          publishedPriceIndex={publishedPriceIndex}
          onSortChange={setSort}
          onVariantModeChange={setVariantMode}
          onShowPriceChange={(v) => {
            setShowPrice(v);
            if (v) setShowVariants(true);
          }}
          onShowVariantsChange={(v) => {
            setShowVariants(v);
            if (!v) setShowPrice(false);
          }}
          onCardClick={(card) => {
            onSelect(card);
            onClose();
          }}
          hideSummary
        />
      </div>
    </ModalShell>
  );
}
