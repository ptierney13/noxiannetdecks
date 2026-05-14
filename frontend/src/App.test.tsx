import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { CardRecord } from "./types";

function createCard({
  id,
  riotName,
  cleanName,
  setId,
  setLabel,
  collectorNumber,
  tcgplayerId = null,
  rarity = "Rare",
  finishes = ["foil"],
  cardtype = "Unit",
  supertype = null,
  tags = [],
  typeline = "Unit",
  domain = ["Body"],
  layout = "portrait",
  cost = "{3}",
  energy = 3,
  might = 4,
  power = 2,
  richText = null,
  plainText = null
}: {
  id: string;
  riotName: string;
  cleanName: string;
  setId: string;
  setLabel: string;
  collectorNumber: string;
  tcgplayerId?: string | null;
  rarity?: string;
  finishes?: Array<"foil" | "nonfoil">;
  cardtype?: string;
  supertype?: string | null;
  tags?: string[];
  typeline?: string;
  domain?: string[];
  layout?: "portrait" | "landscape";
  cost?: string | null;
  energy?: number | null;
  might?: number | null;
  power?: number | null;
  richText?: string | null;
  plainText?: string | null;
}): CardRecord {
  return {
    id,
    riot_name: riotName,
    clean_name: cleanName,
    riftbound_id: id,
    tcgplayer_id: tcgplayerId,
    collector_number: collectorNumber,
    language: "en",
    rarity,
    variant: { alternate_art: false, overnumbered: false, signed: false },
    finishes,
    attributes: { cost, energy, might, power, domain },
    type: { cardtype, supertype, tags, typeline },
    text: {
      rich: richText ?? `${riotName} rules text.`,
      plain: plainText ?? `${riotName} rules text.`,
      flavour: null,
      keywords: []
    },
    set: { set_id: setId, label: setLabel },
    media: {
      image_url: `https://example.test/${id}.png`,
      artist: "Example Artist",
      accessibility_text: `${riotName} card image.`,
      layout
    }
  };
}

const voidGate = createCard({
  id: "card-1",
  riotName: "Void Gate",
  cleanName: "void gate",
  setId: "OGN",
  setLabel: "Origins",
  collectorNumber: "1",
  tcgplayerId: "1001",
  finishes: ["foil", "nonfoil"],
  tags: ["Dragon"],
  typeline: "Unit - Dragon",
  cost: "{3}{B}{B}",
  richText: "<p>:rb_exhaust:: Deal +2 :rb_might: this turn. Pay :rb_energy_3::rb_rune_chaos:.</p>",
  plainText: ":rb_exhaust:: Deal +2 :rb_might: this turn. Pay :rb_energy_3::rb_rune_chaos:."
});

const legendCard = createCard({
  id: "legend-1",
  riotName: "Lux - Lady of Luminosity",
  cleanName: "lux lady of luminosity",
  setId: "OGN",
  setLabel: "Origins",
  collectorNumber: "12",
  cardtype: "Legend",
  typeline: "Legend - Lux",
  tags: ["Lux"],
  domain: ["Calm", "Mind"],
  cost: null,
  energy: null,
  might: null,
  power: null
});

const championCard = createCard({
  id: "champion-1",
  riotName: "Jinx - Rebel",
  cleanName: "jinx rebel",
  setId: "SFD",
  setLabel: "Spiritforged",
  collectorNumber: "47",
  supertype: "Champion",
  tags: ["Jinx"],
  typeline: "Unit - Champion - Jinx",
  domain: ["Fury"],
  cost: "{4}",
  energy: 4,
  might: 5
});

const spellCard = createCard({
  id: "spell-1",
  riotName: "Mystic Burst",
  cleanName: "mystic burst",
  setId: "SFD",
  setLabel: "Spiritforged",
  collectorNumber: "53",
  cardtype: "Spell",
  typeline: "Spell",
  domain: ["Mind"],
  cost: "{2}",
  energy: 2,
  might: null,
  power: null
});

const multicolorSpellCard = createCard({
  id: "spell-2",
  riotName: "Twin Paths",
  cleanName: "twin paths",
  setId: "UNL",
  setLabel: "Unleashed",
  collectorNumber: "71",
  cardtype: "Spell",
  typeline: "Spell",
  domain: ["Calm", "Mind"],
  cost: "{3}{C/M}{C/M}",
  energy: 3,
  might: null,
  power: null
});

const gearCard = createCard({
  id: "gear-1",
  riotName: "Hexdrill Harness",
  cleanName: "hexdrill harness",
  setId: "SFD",
  setLabel: "Spiritforged",
  collectorNumber: "54",
  cardtype: "Gear",
  typeline: "Gear",
  domain: ["Body"],
  cost: "{1}",
  energy: 1,
  might: null,
  power: null
});

const ognRune = createCard({
  id: "rune-ogn-1",
  riotName: "Focus Rune",
  cleanName: "focus rune",
  setId: "OGN",
  setLabel: "Origins",
  collectorNumber: "88",
  cardtype: "Rune",
  typeline: "Rune",
  tags: [],
  domain: [],
  cost: null,
  energy: null,
  might: null,
  power: null
});

const battlefieldCard: CardRecord = createCard({
  id: "battlefield-1",
  riotName: "Abandoned Hall",
  cleanName: "abandoned hall",
  setId: "OGN",
  setLabel: "Origins",
  collectorNumber: "103",
  cardtype: "Battlefield",
  typeline: "Battlefield",
  tags: [],
  domain: [],
  layout: "landscape",
  cost: null,
  energy: null,
  might: null,
  power: null
});

const unlLegend = createCard({
  id: "legend-2",
  riotName: "Annie - Ashen Outlaw",
  cleanName: "annie ashen outlaw",
  setId: "UNL",
  setLabel: "Unleashed",
  collectorNumber: "14",
  cardtype: "Legend",
  typeline: "Legend - Annie",
  tags: ["Annie"],
  domain: ["Chaos"],
  cost: null,
  energy: null,
  might: null,
  power: null
});

const unlChampion = createCard({
  id: "champion-2",
  riotName: "Vi - Breakpoint",
  cleanName: "vi breakpoint",
  setId: "UNL",
  setLabel: "Unleashed",
  collectorNumber: "52",
  supertype: "Champion",
  tags: ["Vi"],
  typeline: "Unit - Champion - Vi",
  domain: ["Body"],
  cost: "{5}",
  energy: 5,
  might: 6
});

const unlRune = createCard({
  id: "rune-unl-1",
  riotName: "Chaos Rune",
  cleanName: "chaos rune",
  setId: "UNL",
  setLabel: "Unleashed",
  collectorNumber: "91",
  cardtype: "Rune",
  typeline: "Rune",
  tags: [],
  domain: [],
  cost: null,
  energy: null,
  might: null,
  power: null
});

const unlBattlefield = createCard({
  id: "battlefield-2",
  riotName: "Sunken Plaza",
  cleanName: "sunken plaza",
  setId: "UNL",
  setLabel: "Unleashed",
  collectorNumber: "119",
  cardtype: "Battlefield",
  typeline: "Battlefield",
  tags: [],
  domain: [],
  layout: "landscape",
  cost: null,
  energy: null,
  might: null,
  power: null
});

const cards: CardRecord[] = [
  voidGate,
  legendCard,
  championCard,
  spellCard,
  multicolorSpellCard,
  gearCard,
  ognRune,
  battlefieldCard,
  unlLegend,
  unlChampion,
  unlRune,
  unlBattlefield
];

const packOptions = {
  sets: [
    { id: "OGN", label: "Origins", supportsStandard: true, supportsPreRift: false },
    { id: "SFD", label: "Spiritforged", supportsStandard: true, supportsPreRift: true },
    { id: "UNL", label: "Unleashed", supportsStandard: true, supportsPreRift: true }
  ],
  seededPacks: [
    { id: "sfd-ezreal", setId: "SFD", label: "Ezreal", cardCount: 15 },
    { id: "unl-vi", setId: "UNL", label: "Vi", cardCount: 16 }
  ]
};

function poolEntry(card: CardRecord, id: string, packIndex = 0) {
  return {
    id,
    packId: `pack-${packIndex + 1}`,
    packIndex,
    slot: "common",
    finish: "nonfoil",
    seeded: false,
    card
  };
}

function generatedPool(body: Record<string, unknown> = {}) {
  return {
    id: "pool-1",
    format: body.format ?? "standard",
    setId: body.setId ?? null,
    seededPackId: body.seededPackId ?? null,
    generatedAt: "2026-04-20T00:00:00.000Z",
    packs: Array.from({ length: 6 }, (_, index) => ({
      id: `pack-${index + 1}`,
      index,
      label: `${body.format === "custom" ? "Custom" : "SFD"} Pack ${index + 1}`,
      kind: "booster",
      setId: Array.isArray(body.packs) ? body.packs[index] : body.setId ?? "SFD",
      seededPackId: null,
      cards: index === 0
        ? [poolEntry(cards[0], "pool-card-1", index), poolEntry(legendCard, "pool-card-legend", index), poolEntry(championCard, "pool-card-champion", index)]
        : [poolEntry({ ...cards[0], id: `card-${index + 1}`, riot_name: `Pack Card ${index + 1}` }, `pool-card-${index + 1}`, index)]
    }))
  };
}

function generatedPoolWithDuplicate(body: Record<string, unknown> = {}) {
  const pool = generatedPool(body);
  pool.packs[1].cards = [poolEntry(cards[0], "pool-card-duplicate-pack-2", 1)];
  return pool;
}

function generatedPoolWithBattlefield(body: Record<string, unknown> = {}) {
  const pool = generatedPool(body);
  pool.packs[0].cards = [
    poolEntry(cards[0], "pool-card-1", 0),
    poolEntry(battlefieldCard, "pool-card-battlefield", 0),
    poolEntry(legendCard, "pool-card-legend", 0),
    poolEntry(championCard, "pool-card-champion", 0)
  ];
  return pool;
}

function generatedPoolWithDeckTypeMix(body: Record<string, unknown> = {}) {
  const pool = generatedPool(body);
  pool.packs[0].cards = [
    poolEntry(voidGate, "pool-card-unit", 0),
    poolEntry(spellCard, "pool-card-spell", 0),
    poolEntry(gearCard, "pool-card-gear", 0)
  ];
  return pool;
}

function generatedPoolWithMulticolor(body: Record<string, unknown> = {}) {
  const pool = generatedPool(body);
  pool.packs[0].cards = [
    poolEntry(voidGate, "pool-card-unit", 0),
    poolEntry(multicolorSpellCard, "pool-card-multicolor-spell", 0),
    poolEntry(legendCard, "pool-card-multicolor-legend", 0),
    poolEntry(spellCard, "pool-card-single-spell", 0)
  ];
  return pool;
}

const fields = [
  {
    property: "Name",
    query: "name:<text>",
    shorthand: "n:<text>",
    searches: "riot_name and clean_name",
    example: "n:jinx"
  },
  {
    property: "Type line",
    query: "Use shorthand t:<text>",
    shorthand: "t:<text>",
    searches: "type.typeline, with multiword type terms matched in any order",
    example: "t:\"Champion Unit\""
  }
];

const syntax = [
  {
    operation: "Numeric comparisons",
    examples: ["e>=3"],
    behavior: "Supports numeric filters."
  }
];

const priceManifest = {
  version: 1,
  game: { slug: "riftbound", key: "riftbound", label: "Riftbound" },
  priceSource: { id: "tcgplayer", label: "TCGPlayer" },
  publishedAt: "2026-05-07T23:11:01.327Z",
  sourceCapturedAt: "2026-05-07T22:55:56.911Z",
  snapshotPath: "riftbound/latest.json",
  rowCount: 5,
  variantCount: 5,
  freshness: {
    rowCount: 5,
    pricedRowCount: 5,
    freshestPriceAt: "2026-05-07T19:20:43.000Z",
    stalestPriceAt: "2026-05-01T00:00:00.000Z"
  },
  provenance: {
    upstreamProvider: { id: "justtcg", label: "JustTCG" },
    canonicalRelativeSnapshotPath: "canonical/justtcg/test.json",
    rawRelativePayloadPaths: [],
    rawRelativeMetadataPaths: []
  }
};

function buildHistory(amounts: number[], startDay = 1) {
  return amounts.map((amount, index) => ({
    observedAt: `2026-05-${String(startDay + index).padStart(2, "0")}T00:00:00.000Z`,
    amount
  }));
}

const priceSnapshot = {
  version: 1,
  game: { slug: "riftbound", key: "riftbound", label: "Riftbound" },
  priceSource: { id: "tcgplayer", label: "TCGPlayer" },
  publishedAt: "2026-05-07T23:11:01.327Z",
  sourceCapturedAt: "2026-05-07T22:55:56.911Z",
  freshness: {
    rowCount: 5,
    pricedRowCount: 5,
    freshestPriceAt: "2026-05-07T19:20:43.000Z",
    stalestPriceAt: "2026-05-01T00:00:00.000Z"
  },
  rows: [
    {
      rowId: "void-gate-foil-nm",
      cardName: "Void Gate",
      sourceCardId: "void-gate",
      sourceVariantId: "void-gate-foil-nm",
      set: { slug: "origins", label: "Origins" },
      collectorNumber: "1/300",
      rarity: "Rare",
      language: "English",
      condition: "Near Mint",
      printing: "Foil",
      externalIds: { tcgplayerId: "1001", tcgplayerSkuId: "1001-foil-nm" },
      currentPrice: { currency: "USD", amount: 12.34, lastUpdatedAt: "2026-05-07T19:20:43.000Z" },
      priceHistory: buildHistory([11.1, 11.4, 11.6, 11.9, 12.0, 12.2, 12.34])
    },
    {
      rowId: "void-gate-foil-lp",
      cardName: "Void Gate",
      sourceCardId: "void-gate",
      sourceVariantId: "void-gate-foil-lp",
      set: { slug: "origins", label: "Origins" },
      collectorNumber: "1/300",
      rarity: "Rare",
      language: "English",
      condition: "Lightly Played",
      printing: "Foil",
      externalIds: { tcgplayerId: "1001", tcgplayerSkuId: "1001-foil-lp" },
      currentPrice: { currency: "USD", amount: 10.5, lastUpdatedAt: "2026-05-07T19:20:43.000Z" },
      priceHistory: buildHistory([10.8, 10.7, 10.6, 10.55, 10.52, 10.51, 10.5])
    },
    {
      rowId: "void-gate-normal-nm",
      cardName: "Void Gate",
      sourceCardId: "void-gate",
      sourceVariantId: "void-gate-normal-nm",
      set: { slug: "origins", label: "Origins" },
      collectorNumber: "1/300",
      rarity: "Rare",
      language: "English",
      condition: "Near Mint",
      printing: "Normal",
      externalIds: { tcgplayerId: "1001", tcgplayerSkuId: "1001-normal-nm" },
      currentPrice: { currency: "USD", amount: 8.9, lastUpdatedAt: "2026-05-07T19:20:43.000Z" },
      priceHistory: buildHistory([8.1, 8.2, 8.35, 8.4, 8.55, 8.7, 8.9])
    },
    {
      rowId: "void-gate-normal-dmg",
      cardName: "Void Gate",
      sourceCardId: "void-gate",
      sourceVariantId: "void-gate-normal-dmg",
      set: { slug: "origins", label: "Origins" },
      collectorNumber: "1/300",
      rarity: "Rare",
      language: "English",
      condition: "Damaged",
      printing: "Normal",
      externalIds: { tcgplayerId: "1001", tcgplayerSkuId: "1001-normal-dmg" },
      currentPrice: { currency: "USD", amount: 3.25, lastUpdatedAt: "2026-05-07T19:20:43.000Z" },
      priceHistory: buildHistory([3.25], 7)
    },
    {
      rowId: "other-card-foil-nm",
      cardName: "Other Card",
      sourceCardId: "other-card",
      sourceVariantId: "other-card-foil-nm",
      set: { slug: "origins", label: "Origins" },
      collectorNumber: "2/300",
      rarity: "Rare",
      language: "English",
      condition: "Near Mint",
      printing: "Foil",
      externalIds: { tcgplayerId: "2002", tcgplayerSkuId: "2002-foil-nm" },
      currentPrice: { currency: "USD", amount: 9.99, lastUpdatedAt: "2026-05-07T19:20:43.000Z" },
      priceHistory: buildHistory([9.1, 9.2, 9.3, 9.5, 9.7, 9.8, 9.99])
    }
  ]
};

const d1PriceManifest = {
  ...priceManifest,
  publishedAt: "2026-05-11T02:15:00.000Z",
  sourceCapturedAt: "2026-05-11T01:45:00.000Z",
  freshness: {
    rowCount: 5,
    pricedRowCount: 5,
    freshestPriceAt: "2026-05-11T01:40:00.000Z",
    stalestPriceAt: "2026-05-05T00:00:00.000Z"
  }
};

const d1PriceSnapshot = {
  ...priceSnapshot,
  publishedAt: "2026-05-11T02:15:00.000Z",
  sourceCapturedAt: "2026-05-11T01:45:00.000Z",
  freshness: {
    rowCount: 5,
    pricedRowCount: 5,
    freshestPriceAt: "2026-05-11T01:40:00.000Z",
    stalestPriceAt: "2026-05-05T00:00:00.000Z"
  },
  rows: priceSnapshot.rows.map((row) =>
    row.rowId === "void-gate-foil-nm"
      ? {
          ...row,
          currentPrice: {
            ...row.currentPrice,
            amount: 12.54,
            lastUpdatedAt: "2026-05-11T01:40:00.000Z"
          }
        }
      : row.rowId === "void-gate-normal-nm"
        ? {
            ...row,
            currentPrice: {
              ...row.currentPrice,
              amount: 8.75,
              lastUpdatedAt: "2026-05-11T01:35:00.000Z"
            }
          }
        : row
  )
};

function normalized(value: string | null | undefined): string {
  return (value ?? "").toLowerCase();
}

function matchesQuery(card: CardRecord, query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return true;

  return trimmed.split(/\s+/).every((term) => {
    const [rawField, ...rawValueParts] = term.split(":");

    if (rawValueParts.length === 0) {
      return normalized(card.riot_name).includes(normalized(term));
    }

    const field = normalized(rawField);
    const value = rawValueParts.join(":").replace(/^"|"$/g, "").toLowerCase();

    switch (field) {
      case "name":
      case "n":
        return normalized(card.riot_name).includes(value) || normalized(card.clean_name).includes(value);
      case "t":
        return normalized(card.type.typeline).includes(value);
      case "type":
        return normalized(card.type.cardtype).includes(value);
      case "u":
      case "supertype":
        return normalized(card.type.supertype).includes(value);
      case "s":
      case "set":
        return normalized(card.set.set_id).includes(value) || normalized(card.set.label).includes(value);
      default:
        return normalized(card.riot_name).includes(value);
    }
  });
}

function mockFetch(poolFactory = generatedPool) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url === "/data/prices-d1/manifest.json") {
      return Response.json(d1PriceManifest);
    }

    if (url === "/data/prices-d1/riftbound/latest.json") {
      return Response.json(d1PriceSnapshot);
    }

    if (url === "/api/query/features") {
      return Response.json({ fields, syntax });
    }

    if (url === "/api/pack-generator/options") {
      return Response.json(packOptions);
    }

    if (url === "/api/pack-generator/pools") {
      const body = init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : {};
      return Response.json(poolFactory(body));
    }

    if (/^\/api\/cards\/[^/?]+$/.test(url)) {
      const cardId = decodeURIComponent(url.slice("/api/cards/".length));
      const found = cards.find((card) => card.id === cardId);
      return found ? Response.json(found) : new Response(null, { status: 404 });
    }

    if (url.startsWith("/api/cards")) {
      const parsedUrl = new URL(url, "https://example.test");
      const query = parsedUrl.searchParams.get("q") ?? "";

      if (query === "energy>>3") {
        return Response.json({
          total: 0,
          normalizedQuery: "energy>>3",
          diagnostics: [{ message: "Expected value after operator \">\"." }],
          items: []
        });
      }

      if (query.includes("unique:prints")) {
        const matchedName = /n:"([^"]+)"/i.exec(query)?.[1]?.toLowerCase() ?? "";
        const items = cards.filter((card) => normalized(card.clean_name) === matchedName);
        return Response.json({
          total: items.length,
          normalizedQuery: query,
          diagnostics: [],
          items
        });
      }

      const items = cards.filter((card) => matchesQuery(card, query));

      return Response.json({
        total: items.length,
        normalizedQuery: query,
        diagnostics: [],
        items
      });
    }

    return new Response(null, { status: 404 });
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function openTierListGenerator(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Tools" }));
  await user.click(screen.getByRole("link", { name: "Tier List Generator" }));
  expect(await screen.findByRole("heading", { name: "Tier List" })).toBeInTheDocument();
}

async function openSealedPools(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Tools" }));
  await user.click(screen.getByRole("link", { name: "Sealed Simulator" }));
  expect(await screen.findByRole("heading", { name: "Sealed Simulator" })).toBeInTheDocument();
}

async function submitCardsSearch(user: ReturnType<typeof userEvent.setup>, query: string) {
  const input = screen.getByLabelText("Query");
  await user.clear(input);
  if (query) {
    await user.type(input, query);
  }
  const form = input.closest("form");
  expect(form).not.toBeNull();
  await user.click(within(form as HTMLFormElement).getByRole("button", { name: "Search" }));
}

async function generateTierList(user: ReturnType<typeof userEvent.setup>, query: string) {
  const input = screen.getByLabelText("Query");
  await user.clear(input);
  if (query) {
    await user.type(input, query);
  }
  await user.click(screen.getByRole("button", { name: "Generate" }));
  expect(await screen.findByTestId("tier-editor")).toBeInTheDocument();
}

function laneCardNames(lane: HTMLElement): string[] {
  return within(lane)
    .queryAllByRole("button", { name: /^Drag / })
    .map((button) => button.getAttribute("aria-label")?.replace(/^Drag /, "") ?? "");
}

function dragCardToSlot(cardName: string, slotTestId: string, pointerId: number) {
  const card = screen.getByRole("button", { name: `Drag ${cardName}` });
  fireEvent.pointerDown(card, { button: 0, pointerId, clientX: 36, clientY: 42 });
  const slot = screen.getByTestId(slotTestId);
  fireEvent.pointerEnter(slot, { pointerId, clientX: 96, clientY: 54 });
  fireEvent.pointerMove(slot, { pointerId, clientX: 96, clientY: 54 });
  fireEvent.pointerUp(window, { pointerId, clientX: 96, clientY: 54 });
}

describe("App", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
    mockFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the feature chart without initial search results", async () => {
    const fetchMock = mockFetch();
    window.history.pushState({}, "", "/cards");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Query Language" })).toBeInTheDocument();
    expect(screen.getByText("Searchable Fields")).toBeInTheDocument();
    expect(screen.queryByText("Type line")).not.toBeInTheDocument();
    expect(screen.getByText("Query Syntax")).toBeInTheDocument();
    expect(screen.queryByAltText("Void Gate card image.")).not.toBeInTheDocument();
    expect(screen.queryByTestId("card-grid")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringMatching(/^\/api\/cards/));
  });

  it("starts with query helper tables collapsed and expands them on demand", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/cards");
    render(<App />);

    expect(await screen.findByRole("button", { name: "Show Searchable Fields" })).toBeInTheDocument();
    expect(screen.queryByText("Type line")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show Searchable Fields" }));
    expect(screen.getByText("Type line")).toBeInTheDocument();
  });

  it("searches when the user clicks Search", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch();

    window.history.pushState({}, "", "/cards");
    render(<App />);
    await screen.findByRole("heading", { name: "Query Language" });

    await submitCardsSearch(user, "name:void");

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/cards?q=name%3Avoid");
    });
    expect(await screen.findByAltText("Void Gate card image.")).toBeInTheDocument();
    expect(screen.getByTestId("card-grid")).toHaveAttribute("data-columns", "4");
  });

  it("shows the published near mint market price in the quick-look modal", async () => {
    const user = userEvent.setup();

    window.history.pushState({}, "", "/cards");
    render(<App />);
    await screen.findByRole("heading", { name: "Query Language" });

    await submitCardsSearch(user, "name:void");
    await screen.findByAltText("Void Gate card image.");

    await user.click(screen.getByText("Void Gate"));

    const dialog = await screen.findByRole("dialog", { name: "Void Gate" });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("$12.54")).toBeInTheDocument();
    expect(within(dialog).queryByText("Near Mint $12.54")).not.toBeInTheDocument();
  });

  it("renders inline symbols in quick-look card text and combines multi-domain chips", async () => {
    const user = userEvent.setup();

    window.history.pushState({}, "", "/cards");
    render(<App />);
    await screen.findByRole("heading", { name: "Query Language" });

    await submitCardsSearch(user, "name:twin");
    await screen.findByAltText("Twin Paths card image.");

    await user.click(screen.getByText("Twin Paths"));

    const dialog = await screen.findByRole("dialog", { name: "Twin Paths" });
    const domainChips = dialog.querySelectorAll(".card-attr-chip--domain");
    expect(domainChips).toHaveLength(1);
    expect(within(dialog).getByText("Calm, Mind")).toBeInTheDocument();
    expect(dialog.querySelectorAll('[data-symbol-token="P"]')).toHaveLength(2);

    await user.click(screen.getByLabelText("Close"));
    await user.clear(screen.getByLabelText("Query"));
    await submitCardsSearch(user, "name:void");
    await screen.findByAltText("Void Gate card image.");

    await user.click(screen.getByText("Void Gate"));

    const symbolDialog = await screen.findByRole("dialog", { name: "Void Gate" });
    expect(symbolDialog.querySelector('[data-symbol-token="E"]')).not.toBeNull();
    expect(symbolDialog.querySelector('[data-symbol-token="T"]')).not.toBeNull();
    expect(symbolDialog.querySelectorAll('.card-attr-chip [data-symbol-token="B"]')).toHaveLength(2);
    expect(symbolDialog.querySelector('[data-symbol-token="H"]')).not.toBeNull();
    expect(within(symbolDialog).getByText(/Pay 3/)).toBeInTheDocument();
  });

  it("uses published price rows on the card detail page and shows a toggleable history chart", async () => {
    const user = userEvent.setup();

    window.history.pushState({}, "", "/cards/card-1");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Void Gate" })).toBeInTheDocument();
    expect(screen.getAllByText("Near Mint $12.54").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Near Mint $8.75" })).toBeInTheDocument();
    expect(screen.queryByText(/^Market Price$/)).not.toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Pricing" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Buy Foil on TCGPlayer ↗" }).getAttribute("href")).toContain("https://partner.tcgplayer.com/B5PQx1?u=");
    expect(screen.getByRole("link", { name: "Buy Foil on TCGPlayer ↗" }).getAttribute("href")).toContain("Printing%3DFoil");
    expect(screen.getByRole("link", { name: "Buy Nonfoil on TCGPlayer ↗" }).getAttribute("href")).toContain("Printing%3DNormal");
    expect(screen.getByRole("button", { name: "Near Mint $12.54" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Lightly Played $10.50" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Damaged $3.25" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByTestId("price-history-chart")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Near Mint $12.54" }));
    expect(await screen.findByTestId("price-history-chart")).toBeInTheDocument();
    expect(screen.getByText("Foil • Near Mint")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Lightly Played $10.50" }));
    expect(screen.getByText("Foil • Lightly Played")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Near Mint $12.54" }));
    await user.click(screen.getByRole("button", { name: "Lightly Played $10.50" }));
    expect(screen.queryByTestId("price-history-chart")).not.toBeInTheDocument();
  });

  it("renders inline cost, might, and text symbols on the card detail page", async () => {
    window.history.pushState({}, "", "/cards/card-1");
    render(<App />);

    const heading = await screen.findByRole("heading", { name: "Void Gate" });
    expect(heading).toBeInTheDocument();

    const detailView = heading.closest(".card-detail-view");
    expect(detailView).not.toBeNull();
    expect(within(detailView as HTMLElement).getByText("3")).toBeInTheDocument();
    expect(detailView?.querySelectorAll('.card-attr-value [data-symbol-token="B"]')).toHaveLength(2);
    expect(detailView?.querySelector('.card-attr-value [data-symbol-token="T"]')).not.toBeNull();
    expect(detailView?.querySelector('.card-detail-body-text [data-symbol-token="E"]')).not.toBeNull();
    expect(detailView?.querySelector('.card-detail-body-text [data-symbol-token="H"]')).not.toBeNull();
    expect(within(detailView as HTMLElement).getByText(/Pay 3/)).toBeInTheDocument();
  });

  it("keeps a selected price series color stable while other series are toggled", async () => {
    const user = userEvent.setup();

    window.history.pushState({}, "", "/cards/card-1");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Void Gate" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Near Mint $12.54" }));
    expect(await screen.findByTestId("price-history-chart")).toBeInTheDocument();

    const nearMintLegend = screen.getByText(/Foil .* Near Mint/).parentElement;
    const initialNearMintColor = (nearMintLegend?.querySelector(".price-chart-legend-swatch") as HTMLElement | null)?.style.backgroundColor;

    await user.click(screen.getByRole("button", { name: "Lightly Played $10.50" }));
    const colorAfterAddingSecondSeries = (screen.getByText(/Foil .* Near Mint/).parentElement?.querySelector(".price-chart-legend-swatch") as HTMLElement | null)?.style.backgroundColor;
    expect(colorAfterAddingSecondSeries).toBe(initialNearMintColor);

    await user.click(screen.getByRole("button", { name: "Lightly Played $10.50" }));
    const colorAfterRemovingSecondSeries = (screen.getByText(/Foil .* Near Mint/).parentElement?.querySelector(".price-chart-legend-swatch") as HTMLElement | null)?.style.backgroundColor;
    expect(colorAfterRemovingSecondSeries).toBe(initialNearMintColor);
  });

  it("shows parse diagnostics", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/cards");
    render(<App />);
    await screen.findByRole("heading", { name: "Query Language" });

    await submitCardsSearch(user, "energy>>3");

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText(/Expected value/)).toBeInTheDocument();
  });

  it("submits homepage search through the cards route and keeps the query visible", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch();

    render(<App />);

    await user.type(screen.getByRole("textbox"), "name:void");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(window.location.pathname).toBe("/cards");
      expect(window.location.search).toBe("?q=name%3Avoid");
      expect(fetchMock).toHaveBeenCalledWith("/api/cards?q=name%3Avoid");
    });

    expect(await screen.findByRole("heading", { name: "Riftbound Card Search" })).toBeInTheDocument();
    expect(screen.getByLabelText("Query")).toHaveValue("name:void");
    expect(await screen.findByAltText("Void Gate card image.")).toBeInTheDocument();
  });

  it("shows the tier list tool inside the top-bar tools section", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "Tools" }));
    expect(screen.getByRole("link", { name: "Tier List Generator" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sealed Simulator" })).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Tier List Generator" }));
    expect(await screen.findByRole("heading", { name: "Tier List" })).toBeInTheDocument();

    expect(window.location.pathname).toBe("/tools/tier-list");
    expect(screen.getByRole("button", { name: "Tools" })).toHaveClass("active");
    await user.click(screen.getByRole("button", { name: "Tools" }));
    expect(screen.getByRole("link", { name: "Tier List Generator" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Generate a filtered card pool")).toBeInTheDocument();
  });

  it("routes Deck Explorer by legend without falling back to card search", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("link", { name: "Deck Explorer" }));

    expect(await screen.findByRole("heading", { name: "Deck Explorer" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/deck-explorer");
    expect(screen.queryByRole("heading", { name: "Riftbound Card Search" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "By Legend" }));
    expect(await screen.findByRole("heading", { name: "Legends" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/deck-explorer/legends");

    await user.click(screen.getByRole("link", { name: /Lux - Lady of Luminosity/ }));
    expect(await screen.findByRole("heading", { name: "Lux - Lady of Luminosity" })).toBeInTheDocument();
    expect(screen.getByText("No decks added for this legend")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/deck-explorer/legends/lux-lady-of-luminosity");
  });

  it("supports canonical tool routes on direct load", async () => {
    window.history.pushState({}, "", "/tools/sealed-pools");

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Sealed Simulator" })).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Tools" }));
    expect(screen.getByRole("link", { name: "Sealed Simulator" })).toHaveAttribute("aria-current", "page");
  });

  it("closes the tools menu after navigation and when clicking away", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole("button", { name: "Tools" }));
    expect(screen.getByRole("link", { name: "Sealed Simulator" })).toBeInTheDocument();

    await user.click(document.body);
    expect(screen.queryByRole("link", { name: "Sealed Simulator" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tools" }));
    await user.click(screen.getByRole("link", { name: "Sealed Simulator" }));

    expect(await screen.findByRole("heading", { name: "Sealed Simulator" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Tier List Generator" })).not.toBeInTheDocument();
  });

  it("keeps the generated query fixed until Generate is clicked again", async () => {
    const user = userEvent.setup();

    render(<App />);
    await openTierListGenerator(user);
    await generateTierList(user, "type:Legend");

    const unrankedLane = screen.getByTestId("tier-unranked-lane");
    expect(laneCardNames(unrankedLane)).toEqual(["Lux - Lady of Luminosity", "Annie - Ashen Outlaw"]);
    expect(screen.getByText("Tier List for", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("type:Legend")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tier List Editor" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Unmatched Cards" })).toBeInTheDocument();
    expect(screen.queryByText("Tier list editor is synced to the current generated query.")).not.toBeInTheDocument();
    expect(screen.queryByText("Drag cards directly into each row. Row labels stay editable between generations.")).not.toBeInTheDocument();
    expect(screen.queryByText("These are exactly the cards returned by the generated query.")).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Query"));
    await user.type(screen.getByLabelText("Query"), "type:Rune");

    expect(screen.queryByText("Current editor still uses: type:Legend")).not.toBeInTheDocument();
    expect(laneCardNames(unrankedLane)).toEqual(["Lux - Lady of Luminosity", "Annie - Ashen Outlaw"]);

    await user.click(screen.getByRole("button", { name: "Generate" }));

    await waitFor(() => {
      expect(laneCardNames(screen.getByTestId("tier-unranked-lane"))).toEqual(["Focus Rune", "Chaos Rune"]);
    });
    expect(screen.getByText("type:Rune")).toBeInTheDocument();
  });

  it.each([
    ["type:Legend", ["Lux - Lady of Luminosity", "Annie - Ashen Outlaw"]],
    ["s:OGN type:Legend", ["Lux - Lady of Luminosity"]],
    ["u:Champion type:Unit", ["Jinx - Rebel", "Vi - Breakpoint"]],
    ["s:UNL u:Champion type:Unit", ["Vi - Breakpoint"]],
    ["type:Rune", ["Focus Rune", "Chaos Rune"]],
    ["s:OGN type:Rune", ["Focus Rune"]],
    ["type:Battlefield", ["Abandoned Hall", "Sunken Plaza"]],
    ["s:UNL type:Battlefield", ["Sunken Plaza"]]
  ])("uses the generated filter exactly for %s", async (query, expectedCards) => {
    const user = userEvent.setup();

    render(<App />);
    await openTierListGenerator(user);
    await generateTierList(user, query);

    expect(laneCardNames(screen.getByTestId("tier-unranked-lane"))).toEqual(expectedCards);
  });

  it("shows a visible floating preview while dragging and supports front and middle insertion", async () => {
    const user = userEvent.setup();

    render(<App />);
    await openTierListGenerator(user);
    await generateTierList(user, "");

    const voidGateButton = screen.getByRole("button", { name: "Drag Void Gate" });
    fireEvent.pointerDown(voidGateButton, { button: 0, pointerId: 31, clientX: 44, clientY: 52 });

    const preview = screen.getByTestId("tier-drag-preview");
    expect(preview).toBeInTheDocument();
    expect(within(preview).getByAltText("Void Gate card image.")).toBeInTheDocument();

    fireEvent.pointerEnter(screen.getByTestId("tier-drop-tier-row-1-0"), { pointerId: 31, clientX: 96, clientY: 54 });
    fireEvent.pointerMove(screen.getByTestId("tier-drop-tier-row-1-0"), { pointerId: 31, clientX: 96, clientY: 54 });
    fireEvent.pointerUp(window, { pointerId: 31, clientX: 96, clientY: 54 });

    await waitFor(() => {
      expect(screen.queryByTestId("tier-drag-preview")).not.toBeInTheDocument();
    });

    dragCardToSlot("Lux - Lady of Luminosity", "tier-drop-tier-row-1-1", 32);
    dragCardToSlot("Jinx - Rebel", "tier-drop-tier-row-1-1", 33);
    dragCardToSlot("Focus Rune", "tier-drop-tier-row-1-0", 34);

    const sTierRow = screen.getByLabelText("S tier row");
    expect(laneCardNames(sTierRow)).toEqual([
      "Focus Rune",
      "Void Gate",
      "Jinx - Rebel",
      "Lux - Lady of Luminosity"
    ]);
  });

  it("keeps cards in exactly one location while moving between rows and back to unranked", async () => {
    const user = userEvent.setup();

    render(<App />);
    await openTierListGenerator(user);
    await generateTierList(user, "");

    dragCardToSlot("Void Gate", "tier-drop-tier-row-1-0", 41);

    expect(laneCardNames(screen.getByLabelText("S tier row"))).toEqual(["Void Gate"]);
    expect(laneCardNames(screen.getByTestId("tier-unranked-lane"))).not.toContain("Void Gate");
    expect(screen.getAllByRole("button", { name: "Drag Void Gate" })).toHaveLength(1);

    dragCardToSlot("Void Gate", "tier-drop-tier-row-2-0", 42);

    expect(laneCardNames(screen.getByLabelText("S tier row"))).toEqual([]);
    expect(laneCardNames(screen.getByLabelText("A tier row"))).toEqual(["Void Gate"]);
    expect(screen.getAllByRole("button", { name: "Drag Void Gate" })).toHaveLength(1);

    dragCardToSlot("Void Gate", "tier-drop-unranked-0", 43);

    expect(laneCardNames(screen.getByLabelText("A tier row"))).toEqual([]);
    expect(laneCardNames(screen.getByTestId("tier-unranked-lane"))).toContain("Void Gate");
    expect(screen.getAllByRole("button", { name: "Drag Void Gate" })).toHaveLength(1);
  });

  it("resets rankings back to the current filter's base unmatched state", async () => {
    const user = userEvent.setup();

    render(<App />);
    await openTierListGenerator(user);
    await generateTierList(user, "");

    const resetButton = screen.getByRole("button", { name: "Reset Rankings" });
    expect(resetButton).toBeDisabled();

    dragCardToSlot("Void Gate", "tier-drop-tier-row-1-0", 61);
    dragCardToSlot("Lux - Lady of Luminosity", "tier-drop-tier-row-2-0", 62);

    expect(resetButton).not.toBeDisabled();
    expect(laneCardNames(screen.getByLabelText("S tier row"))).toEqual(["Void Gate"]);
    expect(laneCardNames(screen.getByLabelText("A tier row"))).toEqual(["Lux - Lady of Luminosity"]);

    await user.click(resetButton);

    expect(resetButton).toBeDisabled();
    expect(laneCardNames(screen.getByLabelText("S tier row"))).toEqual([]);
    expect(laneCardNames(screen.getByLabelText("A tier row"))).toEqual([]);
    expect(laneCardNames(screen.getByTestId("tier-unranked-lane"))).toEqual(cards.map((card) => card.riot_name));
  });

  it("lets row count and labels change, and returns cards to unranked when a row is removed", async () => {
    const user = userEvent.setup();

    render(<App />);
    await openTierListGenerator(user);
    await generateTierList(user, "type:Legend");

    await user.click(screen.getByRole("button", { name: "Add Row" }));
    const newRowLabel = screen.getByDisplayValue("Tier 6");
    await user.clear(newRowLabel);
    await user.type(newRowLabel, "My Tier");

    dragCardToSlot("Lux - Lady of Luminosity", "tier-drop-tier-row-6-0", 51);

    expect(laneCardNames(screen.getByLabelText("My Tier tier row"))).toEqual(["Lux - Lady of Luminosity"]);

    const removeButton = screen.getByRole("button", { name: "Remove My Tier row" });
    expect(removeButton).toHaveTextContent("X");
    await user.click(removeButton);

    expect(screen.queryByLabelText("My Tier tier row")).not.toBeInTheDocument();
    expect(laneCardNames(screen.getByTestId("tier-unranked-lane"))).toEqual(["Annie - Ashen Outlaw", "Lux - Lady of Luminosity"]);
  });

  it("generates an Unleashed Pre-Rift sealed pool by default", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch();

    render(<App />);
    await openSealedPools(user);
    expect(screen.getByLabelText("Pool type")).toHaveValue("pre-rift-UNL");
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Choose pre-rift seed" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "New Pool" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/pack-generator/pools",
        expect.objectContaining({ method: "POST", body: JSON.stringify({ format: "pre-rift", setId: "UNL", seededPackId: "random" }) })
      );
    });
    expect(await screen.findByRole("button", { name: "Add Void Gate" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Packs" })).toHaveAttribute("aria-pressed", "true");
  });

  it("submits the current custom six-pack recipe from the selector layer", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch();

    render(<App />);
    await openSealedPools(user);

    await user.selectOptions(screen.getByLabelText("Pool type"), "custom");

    expect(screen.getByRole("dialog", { name: "Choose packs" })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Pack 1"), "UNL");
    expect(screen.queryByRole("button", { name: "Done" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "New Pool" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/pack-generator/pools",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ format: "custom", packs: ["UNL", "OGN", "SFD", "SFD", "UNL", "UNL"] })
        })
      );
    });
  });

  it("submits the current Pre-Rift seed selector value", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch();

    render(<App />);
    await openSealedPools(user);

    await user.selectOptions(screen.getByLabelText("Pool type"), "pre-rift-SFD");
    expect(screen.getByRole("dialog", { name: "Choose pre-rift seed" })).toBeInTheDocument();
    await screen.findByRole("option", { name: "Ezreal" });
    await user.selectOptions(screen.getByLabelText("Seed"), "sfd-ezreal");
    await user.click(screen.getByRole("button", { name: "New Pool" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/pack-generator/pools",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ format: "pre-rift", setId: "SFD", seededPackId: "sfd-ezreal" })
        })
      );
    });
  });

  it("greys only the exact pool entry added to the decklist and clicking it again removes it", async () => {
    const user = userEvent.setup();
    mockFetch(generatedPoolWithDuplicate);

    render(<App />);
    await openSealedPools(user);
    await user.click(screen.getByRole("button", { name: "New Pool" }));

    const voidButtons = await screen.findAllByRole("button", { name: "Add Void Gate" });
    expect(voidButtons).toHaveLength(2);
    expect(voidButtons[0]).toHaveAttribute("data-in-deck", "false");
    expect(voidButtons[1]).toHaveAttribute("data-in-deck", "false");

    await user.click(voidButtons[0]);

    await waitFor(() => {
      expect(voidButtons[0]).toHaveAttribute("data-in-deck", "true");
    });
    expect(voidButtons[1]).toHaveAttribute("data-in-deck", "false");

    await user.click(voidButtons[0]);

    await waitFor(() => {
      expect(voidButtons[0]).toHaveAttribute("data-in-deck", "false");
    });
    expect(voidButtons[1]).toHaveAttribute("data-in-deck", "false");
    expect(screen.getByTestId("main-deck-count")).toHaveTextContent("0/25");
  });

  it("shows the decklist in sort-by-cost columns with unit, spell, and gear summary counts", async () => {
    const user = userEvent.setup();
    mockFetch(generatedPoolWithDeckTypeMix);

    render(<App />);
    await openSealedPools(user);
    await user.click(screen.getByRole("button", { name: "New Pool" }));

    await user.click(screen.getByRole("button", { name: "Add Void Gate" }));
    await user.click(screen.getByRole("button", { name: "Add Mystic Burst" }));
    await user.click(screen.getByRole("button", { name: "Add Hexdrill Harness" }));

    const decklist = screen.getByTestId("decklist-strip");
    const energies = within(decklist)
      .getAllByTestId("energy-column")
      .map((column) => column.getAttribute("data-energy"));

    expect(energies).toEqual(["1", "2", "3"]);
    expect(screen.getByLabelText("Deck type summary")).toHaveTextContent("Units 1");
    expect(screen.getByLabelText("Deck type summary")).toHaveTextContent("Spells 1");
    expect(screen.getByLabelText("Deck type summary")).toHaveTextContent("Gear 1");
  });

  it("keeps battlefield cards landscape in the rightmost no-cost column", async () => {
    const user = userEvent.setup();
    mockFetch(generatedPoolWithBattlefield);

    render(<App />);
    await openSealedPools(user);
    await user.click(screen.getByRole("button", { name: "New Pool" }));

    const pack = await screen.findByLabelText("SFD Pack 1");
    const columns = within(pack).getAllByTestId("energy-column");
    const battlefieldButton = within(pack).getByRole("button", { name: "Add Abandoned Hall" });
    const battlefieldColumn = battlefieldButton.closest("[data-testid='energy-column']");

    expect(battlefieldButton).toHaveAttribute("data-layout", "landscape");
    expect(battlefieldColumn).toHaveAttribute("data-energy", "none");
    expect(columns.at(-1)).toBe(battlefieldColumn);
  });

  it("tracks battlefields in three separate deck slots with count status", async () => {
    const user = userEvent.setup();
    mockFetch(generatedPoolWithBattlefield);

    render(<App />);
    await openSealedPools(user);
    await user.click(screen.getByRole("button", { name: "New Pool" }));

    expect(screen.getByTestId("main-deck-count")).toHaveAttribute("data-valid", "false");
    expect(screen.getByTestId("battlefields-deck-count")).toHaveAttribute("data-valid", "true");
    expect(screen.getByTestId("battlefields-deck-count")).toHaveTextContent("0/3");
    expect(screen.getAllByLabelText(/Empty battlefield slot/)).toHaveLength(3);

    await user.click(await screen.findByRole("button", { name: "Add Abandoned Hall" }));

    expect(screen.getByRole("button", { name: "Battlefield 1: Abandoned Hall" })).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Empty battlefield slot/)).toHaveLength(2);
    expect(screen.getByTestId("battlefields-deck-count")).toHaveTextContent("1/3");
    expect(screen.getByRole("button", { name: "Add Abandoned Hall" })).toHaveAttribute("data-in-deck", "true");
  });

  it("shows a cursor-positioned zoom preview on card hover", async () => {
    const user = userEvent.setup();

    render(<App />);
    await openSealedPools(user);
    await user.click(screen.getByRole("button", { name: "New Pool" }));

    const cardButton = await screen.findByRole("button", { name: "Add Void Gate" });
    fireEvent.pointerEnter(cardButton, { clientX: 120, clientY: 140 });

    const preview = screen.getByTestId("card-zoom-preview");
    expect(preview).toBeInTheDocument();
    expect(preview).toHaveStyle({ left: "138px", top: "158px", width: "300px" });
    expect(within(preview).getByAltText("Void Gate card image.")).toBeInTheDocument();

    fireEvent.pointerLeave(cardButton);
    expect(screen.queryByTestId("card-zoom-preview")).not.toBeInTheDocument();
  });

  it("switches generated pool views", async () => {
    const user = userEvent.setup();

    render(<App />);
    await openSealedPools(user);
    await user.click(screen.getByRole("button", { name: "New Pool" }));
    await screen.findByRole("button", { name: "Add Void Gate" });

    await user.click(screen.getByRole("button", { name: "Domain" }));

    expect(screen.getByRole("button", { name: "Domain" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("domain view")).toBeInTheDocument();
  });

  it("groups multi-domain cards into a Multicolor section in grouped views", async () => {
    const user = userEvent.setup();
    mockFetch(generatedPoolWithMulticolor);

    render(<App />);
    await openSealedPools(user);
    await user.click(screen.getByRole("button", { name: "New Pool" }));
    await screen.findByRole("button", { name: "Add Twin Paths" });

    await user.click(screen.getByRole("button", { name: "Domain" }));

    const multicolorDomainBlock = screen.getByLabelText("Multicolor");
    expect(within(multicolorDomainBlock).getByRole("button", { name: "Add Twin Paths" })).toBeInTheDocument();
    expect(within(multicolorDomainBlock).getByRole("button", { name: "Add Lux - Lady of Luminosity" })).toBeInTheDocument();
    expect(within(screen.getByLabelText("Calm")).queryByRole("button", { name: "Add Twin Paths" })).not.toBeInTheDocument();
    expect(within(screen.getByLabelText("Mind")).queryByRole("button", { name: "Add Twin Paths" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Spells" }));

    const multicolorSpellBlock = screen.getByLabelText("Multicolor");
    expect(within(multicolorSpellBlock).getByRole("button", { name: "Add Twin Paths" })).toBeInTheDocument();
    expect(within(screen.getByLabelText("Mind")).getByRole("button", { name: "Add Mystic Burst" })).toBeInTheDocument();
    expect(within(screen.getByLabelText("Calm")).queryByRole("button", { name: "Add Twin Paths" })).not.toBeInTheDocument();
  });

  it("selects legends and champions from pool dropdowns", async () => {
    const user = userEvent.setup();

    render(<App />);
    await openSealedPools(user);
    await user.click(screen.getByRole("button", { name: "New Pool" }));

    await user.click(screen.getByRole("button", { name: "Add Jinx - Rebel" }));
    expect(screen.getByRole("button", { name: "Remove Jinx - Rebel" })).toBeInTheDocument();
    expect(screen.getByTestId("main-deck-count")).toHaveTextContent("1/25");

    await user.selectOptions(screen.getByLabelText("Legend selection"), "pool-card-legend");
    await user.selectOptions(screen.getByLabelText("Champion selection"), "pool-card-champion");

    expect(within(screen.getByLabelText("Legend zone")).getByRole("button", { name: "Legend: Lux - Lady of Luminosity" })).toBeInTheDocument();
    expect(within(screen.getByLabelText("Champion zone")).getByRole("button", { name: "Champion: Jinx - Rebel" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Lux - Lady of Luminosity" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Jinx - Rebel" })).not.toBeInTheDocument();
    expect(screen.getByTestId("main-deck-count")).toHaveTextContent("0/25");
    expect(screen.getByTestId("legend-deck-count")).toHaveTextContent("1/1");
    expect(screen.getByTestId("champion-deck-count")).toHaveTextContent("1/1");
  });

  it("saves, clears, and restores decklist snapshots", async () => {
    const user = userEvent.setup();

    render(<App />);
    await openSealedPools(user);
    await user.click(screen.getByRole("button", { name: "New Pool" }));
    await user.click(await screen.findByRole("button", { name: "Add Void Gate" }));

    await user.click(screen.getByRole("button", { name: "Snapshot" }));
    const dialog = screen.getByRole("dialog", { name: "Name snapshot" });
    await user.type(within(dialog).getByLabelText("Snapshot name"), "Curve One");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryByRole("button", { name: "Remove Void Gate" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Curve One" }));

    expect(await screen.findByRole("button", { name: "Remove Void Gate" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Void Gate" })).toHaveAttribute("data-in-deck", "true");
  });

  it("keeps more than four snapshots in a scrollable strip", async () => {
    const user = userEvent.setup();

    render(<App />);
    await openSealedPools(user);
    await user.click(screen.getByRole("button", { name: "New Pool" }));
    await user.click(await screen.findByRole("button", { name: "Add Void Gate" }));

    for (const name of ["Build 1", "Build 2", "Build 3", "Build 4", "Build 5"]) {
      await user.click(screen.getByRole("button", { name: "Snapshot" }));
      const dialog = screen.getByRole("dialog", { name: "Name snapshot" });
      await user.type(within(dialog).getByLabelText("Snapshot name"), name);
      await user.click(within(dialog).getByRole("button", { name: "Save" }));
    }

    expect(screen.getByTestId("snapshot-strip")).toHaveAttribute("data-snapshot-count", "5");
    expect(screen.getByRole("button", { name: "Build 5" })).toBeInTheDocument();
  });
});
