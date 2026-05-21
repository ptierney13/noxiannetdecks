import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Meta, StoryObj } from "@storybook/react";
import { cardSearchKeys } from "../../data";
import type { CardRecord, CardSearchResponse } from "../../types";
import { CardSearchResultsPane } from "./CardSearchResultsPane";

const cards = [
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

const response = {
  items: cards,
  total: cards.length,
  normalizedQuery: "n:jinx unique:id",
  uniqueMode: "id",
  diagnostics: [],
} as CardSearchResponse;

const meta = {
  title: "Features/CardSearchResultsPane",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function PaneHarness({ query = "n:jinx" }: { query?: string }) {
  const [client] = useState(() => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
        },
      },
    });
    queryClient.setQueryData(cardSearchKeys.search(query), response);
    return queryClient;
  });

  return (
    <QueryClientProvider client={client}>
      <div className="min-h-screen bg-app-bg p-4 text-text-primary">
        <CardSearchResultsPane query={query} />
      </div>
    </QueryClientProvider>
  );
}

export const Default: Story = {
  render: () => <PaneHarness />,
};
