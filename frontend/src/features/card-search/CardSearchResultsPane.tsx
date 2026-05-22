import { useEffect, useMemo, useState } from "react";
import {
  queryRequestsAllPrintings,
  stripUniqueFromNormalized,
  useCardSearchResults,
} from "../../data";
import {
  buildCardSearchResultGroups,
  normalizeCardFinish,
  sortCardsByKey,
  usePublishedPriceIndex,
  type CardFinish,
  type CardSearchSortKey,
  type CardSearchVariantMode,
} from "../../lib";
import type { CardRecord } from "../../types";
import { CardSummaryPopup } from "../card/CardSummaryPopup";
import { CardSearchResultsContent } from "./CardSearchResultsContent";

export type CardSearchResultsPaneProps = {
  query: string;
};

type SelectedPreview = {
  group: CardRecord[];
  card: CardRecord;
  finish: CardFinish;
};

export function CardSearchResultsPane({ query }: CardSearchResultsPaneProps) {
  const resultsQuery = useCardSearchResults(query);
  const { index: publishedPriceIndex } = usePublishedPriceIndex();
  const [sort, setSort] = useState<CardSearchSortKey>("energy-asc");
  const [variantMode, setVariantMode] = useState<CardSearchVariantMode>(
    queryRequestsAllPrintings(query) ? "unique-printings" : "unique-cards"
  );
  const [showPrice, setShowPrice] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<SelectedPreview | null>(null);

  useEffect(() => {
    setVariantMode(queryRequestsAllPrintings(query) ? "unique-printings" : "unique-cards");
    setSelectedPreview(null);
  }, [query]);

  const cards = resultsQuery.data?.items ?? [];
  const sortedCards = useMemo(() => sortCardsByKey(cards, sort), [cards, sort]);
  const groups = useMemo(
    () => buildCardSearchResultGroups(sortedCards, variantMode),
    [sortedCards, variantMode]
  );
  const normalizedQuery = stripUniqueFromNormalized(resultsQuery.data?.normalizedQuery ?? "");
  const visibleResultCount = variantMode === "unique-cards" ? groups.length : cards.length;

  return (
    <div className="@container min-h-[28rem] overflow-hidden rounded-[28px] border border-border-default bg-surface-glass shadow-surface-1">
      <CardSearchResultsContent
        groups={groups}
        rawResultCount={cards.length}
        visibleResultCount={visibleResultCount}
        normalizedQuery={normalizedQuery}
        diagnostics={resultsQuery.data?.diagnostics ?? []}
        isPending={resultsQuery.isPending}
        isError={resultsQuery.isError}
        errorMessage={resultsQuery.error instanceof Error ? resultsQuery.error.message : undefined}
        sort={sort}
        variantMode={variantMode}
        showPrice={showPrice}
        showVariants={showVariants}
        publishedPriceIndex={publishedPriceIndex}
        onSortChange={setSort}
        onVariantModeChange={setVariantMode}
        onShowPriceChange={(value) => {
          setShowPrice(value);
          if (value) setShowVariants(true);
        }}
        onShowVariantsChange={(value) => {
          setShowVariants(value);
          if (!value) setShowPrice(false);
        }}
        onCardClick={(card, group, finish) => {
          setSelectedPreview({ group, card, finish: normalizeCardFinish(finish) });
        }}
      />

      {selectedPreview ? (
        <CardSummaryPopup
          group={selectedPreview.group}
          initialCard={selectedPreview.card}
          initialFinish={selectedPreview.finish}
          onClose={() => setSelectedPreview(null)}
        />
      ) : null}
    </div>
  );
}
