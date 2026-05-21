import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { CardRecord, QueryDiagnostic } from "../../types";
import {
  buildCardSearchResultGroups,
  sortCardsByKey,
  type CardSearchSortKey,
  type CardSearchVariantMode,
} from "../../lib";
import { CardSearchResultsContent } from "./CardSearchResultsContent";

const sampleCards = [
  {
    id: "JNX-001",
    riftbound_id: "JNX",
    riot_name: "Jinx, Loose Cannon",
    clean_name: "Jinx",
    type: { supertype: "Champion", cardtype: "Unit", tags: ["Noxus"] },
    attributes: { cost: "{3}", energy: 3, might: 2, power: 4, domain: ["Fury"] },
    text: { rich: "When you play me, deal 1 damage.", flavour: null },
    set: { set_id: "OGN", label: "Origins" },
    collector_number: "001",
    rarity: "Rare",
    language: "en_us",
    finishes: ["foil", "nonfoil"],
    media: { image_url: "", accessibility_text: "Jinx card", artist: "Riot Games", layout: "portrait" },
    variant: { alternate_art: false, signed: false, overnumbered: false },
    tcgplayer_id: "123",
  },
  {
    id: "JNX-201",
    riftbound_id: "JNX",
    riot_name: "Jinx, Loose Cannon",
    clean_name: "Jinx",
    type: { supertype: "Champion", cardtype: "Unit", tags: ["Noxus"] },
    attributes: { cost: "{3}", energy: 3, might: 2, power: 4, domain: ["Fury"] },
    text: { rich: "When you play me, deal 1 damage.", flavour: null },
    set: { set_id: "OGN", label: "Origins" },
    collector_number: "201",
    rarity: "Rare",
    language: "en_us",
    finishes: ["foil", "nonfoil"],
    media: { image_url: "", accessibility_text: "Jinx alternate art card", artist: "Riot Games", layout: "portrait" },
    variant: { alternate_art: true, signed: false, overnumbered: false },
    tcgplayer_id: "456",
  },
  {
    id: "YAS-010",
    riftbound_id: "YAS",
    riot_name: "Yasuo, Unforgiven",
    clean_name: "Yasuo",
    type: { supertype: "Champion", cardtype: "Unit", tags: ["Ionia"] },
    attributes: { cost: "{2}", energy: 2, might: 1, power: 3, domain: ["Calm", "Mind"] },
    text: { rich: "Quick attack.", flavour: null },
    set: { set_id: "OGN", label: "Origins" },
    collector_number: "010",
    rarity: "Epic",
    language: "en_us",
    finishes: ["nonfoil"],
    media: { image_url: "", accessibility_text: "Yasuo card", artist: "Riot Games", layout: "portrait" },
    variant: { alternate_art: false, signed: false, overnumbered: false },
    tcgplayer_id: "789",
  },
] as CardRecord[];

const meta = {
  title: "Features/CardSearchResultsContent",
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="@container min-h-screen bg-app-bg p-4 text-text-primary">
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function ContentHarness({
  cards = sampleCards,
  isPending = false,
  isError = false,
  diagnostics = [],
}: {
  cards?: CardRecord[];
  isPending?: boolean;
  isError?: boolean;
  diagnostics?: QueryDiagnostic[];
}) {
  const [sort, setSort] = useState<CardSearchSortKey>("energy-asc");
  const [variantMode, setVariantMode] = useState<CardSearchVariantMode>("unique-cards");
  const [showPrice, setShowPrice] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  const sortedCards = useMemo(() => sortCardsByKey(cards, sort), [cards, sort]);
  const groups = useMemo(
    () => buildCardSearchResultGroups(sortedCards, variantMode),
    [sortedCards, variantMode]
  );

  return (
    <CardSearchResultsContent
      groups={groups}
      rawResultCount={cards.length}
      visibleResultCount={variantMode === "unique-cards" ? groups.length : cards.length}
      normalizedQuery="n:jinx"
      diagnostics={diagnostics}
      isPending={isPending}
      isError={isError}
      errorMessage={isError ? "Request failed: 500" : undefined}
      sort={sort}
      variantMode={variantMode}
      showPrice={showPrice}
      showVariants={showVariants}
      publishedPriceIndex={null}
      onSortChange={setSort}
      onVariantModeChange={setVariantMode}
      onShowPriceChange={setShowPrice}
      onShowVariantsChange={setShowVariants}
      onCardClick={() => undefined}
    />
  );
}

export const Default: Story = {
  render: () => <ContentHarness />,
};

export const Loading: Story = {
  render: () => <ContentHarness isPending />,
};

export const Empty: Story = {
  render: () => <ContentHarness cards={[]} />,
};

export const Error: Story = {
  render: () => <ContentHarness isError cards={[]} />,
};

export const Diagnostics: Story = {
  render: () => (
    <ContentHarness
      diagnostics={[{ message: "Unknown field 'foo'." } as QueryDiagnostic]}
    />
  ),
};
