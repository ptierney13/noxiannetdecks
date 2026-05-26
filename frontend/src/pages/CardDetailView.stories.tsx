import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Meta, StoryObj } from "@storybook/react";
import { cardKeys } from "../data";
import type { CardRecord, CardSearchResponse } from "../types";
import CardDetailView from "./CardDetailView";

// ── Shared fixtures ────────────────────────────────────────────────────────────

const sampleCard = {
  id: "JNX-001",
  riftbound_id: "JNX",
  riot_name: "Jinx, Loose Cannon",
  clean_name: "Jinx",
  type: { supertype: "Champion", cardtype: "Unit", tags: ["Noxus"] },
  attributes: { cost: "{3}", energy: 3, might: 2, power: 4, domain: ["Fury"] },
  text: {
    rich: "When you play me, deal 1 damage to an enemy unit.\nIf that unit is damaged, draw a card.",
    flavour: "The city's a powder keg. I'm just the spark.",
  },
  set: { set_id: "OGN", label: "Origins" },
  collector_number: "001",
  rarity: "Rare",
  language: "en_us",
  finishes: ["foil", "nonfoil"],
  media: {
    image_url: "",
    accessibility_text: "Jinx, Loose Cannon card art",
    artist: "Riot Games",
    layout: "portrait",
  },
  variant: { alternate_art: false, signed: false, overnumbered: false },
  tcgplayer_id: "123",
} as CardRecord;

const altArtPrinting = {
  ...sampleCard,
  id: "JNX-201",
  collector_number: "201",
  variant: { alternate_art: true, signed: false, overnumbered: false },
  finishes: ["foil"],
} as CardRecord;

const printingsResponse = {
  items: [sampleCard, altArtPrinting],
  total: 2,
  normalizedQuery: 'riftbound_id="JNX" unique:prints',
  uniqueMode: "id",
  diagnostics: [],
  executedTokens: [],
} as CardSearchResponse;

// ── Story harness ──────────────────────────────────────────────────────────────

type HarnessMode = "loading" | "error" | "loaded";

function Harness({
  mode,
  card = sampleCard,
  printings,
}: {
  mode: HarnessMode;
  card?: CardRecord;
  printings?: CardSearchResponse;
}) {
  const [client] = useState(() => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });

    if (mode === "loaded") {
      qc.setQueryData(cardKeys.detail(card.id), card);
      const printingsQuery = card.riftbound_id
        ? `riftbound_id="${card.riftbound_id}" unique:prints`
        : card.clean_name
        ? `n="${card.clean_name}" unique:prints`
        : null;
      if (printingsQuery && printings) {
        qc.setQueryData(cardKeys.printings(printingsQuery), printings);
      }
    }

    if (mode === "loading") {
      // Prefetch with a never-resolving fn — keeps query in isPending state
      void qc.prefetchQuery({
        queryKey: cardKeys.detail(card.id),
        queryFn: () => new Promise<CardRecord>(() => {}),
      });
    }

    if (mode === "error") {
      // setState is an internal TanStack Query API — casting to any is intentional
      const query = qc.getQueryCache().build(qc, { queryKey: cardKeys.detail(card.id) });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (query as any).setState({
        status: "error",
        error: new Error("Request failed: 404"),
        fetchStatus: "idle",
        dataUpdateCount: 0,
        errorUpdateCount: 1,
        errorUpdatedAt: Date.now(),
        dataUpdatedAt: 0,
        isInvalidated: false,
      });
    }

    return qc;
  });

  return (
    <QueryClientProvider client={client}>
      <div className="min-h-screen bg-app-bg text-text-primary">
        <CardDetailView cardId={card.id} />
      </div>
    </QueryClientProvider>
  );
}

// ── Meta ───────────────────────────────────────────────────────────────────────

const meta = {
  title: "Pages/CardDetailView",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ────────────────────────────────────────────────────────────────────

export const Loading: Story = {
  name: "Loading",
  render: () => <Harness mode="loading" />,
};

export const ErrorState: Story = {
  name: "Error",
  render: () => <Harness mode="error" />,
};

export const Default: Story = {
  name: "Default (no price data)",
  render: () => (
    <Harness mode="loaded" card={{ ...sampleCard, tcgplayer_id: null } as CardRecord} />
  ),
};

export const WithPriceData: Story = {
  name: "WithPriceData",
  render: () => <Harness mode="loaded" card={sampleCard} />,
};

export const WithPrintings: Story = {
  name: "WithPrintings",
  render: () => <Harness mode="loaded" card={sampleCard} printings={printingsResponse} />,
};
