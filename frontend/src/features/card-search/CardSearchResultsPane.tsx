import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  queryRequestsAllPrintings,
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
  navSlot?: ReactNode;
  hideSummary?: boolean;
};

type SelectedPreview = {
  group: CardRecord[];
  card: CardRecord;
  finish: CardFinish;
};

export function CardSearchResultsPane({ query, navSlot, hideSummary }: CardSearchResultsPaneProps) {
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
  const visibleResultCount = variantMode === "unique-cards" ? groups.length : cards.length;

  return (
    <div className="@container flex-1 flex flex-col min-h-[28rem]">
      <CardSearchResultsContent
        groups={groups}
        rawResultCount={cards.length}
        visibleResultCount={visibleResultCount}
        executedTokens={resultsQuery.data?.executedTokens ?? []}
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
        navSlot={navSlot}
        hideSummary={hideSummary}
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
