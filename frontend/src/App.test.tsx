import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const cards = [
  {
    id: "card-1",
    riot_name: "Void Gate",
    clean_name: "void gate",
    riftbound_id: "card-1",
    tcgplayer_id: null,
    collector_number: "1",
    language: "en",
    rarity: "Rare",
    variant: { alternate_art: false, overnumbered: false, signed: false },
    finishes: ["foil"],
    attributes: { cost: 3, energy: 3, might: 4, power: 2, domain: ["Body"] },
    type: { cardtype: "Unit", supertype: null, tags: ["Dragon"], typeline: "Unit - Dragon" },
    text: { rich: "Draw a card.", plain: "Draw a card.", flavour: null, keywords: [] },
    set: { set_id: "OGN", label: "Origins" },
    media: { image_url: "https://example.test/card.png", artist: "Example Artist", accessibility_text: "Void Gate card image.", layout: "portrait" }
  }
];

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

function mockFetch() {
  const fetchMock = vi.fn(async (url: string) => {
    if (url === "/api/query/features") {
      return Response.json({ fields, syntax });
    }

    if (url.startsWith("/api/cards")) {
      if (url.includes("energy%3E%3E3")) {
        return Response.json({
          total: 0,
          normalizedQuery: "energy>>3",
          diagnostics: [{ message: "Expected value after operator \">\"." }],
          items: []
        });
      }

      return Response.json({
        total: cards.length,
        normalizedQuery: url.includes("?") ? "name:void" : "",
        diagnostics: [],
        items: cards
      });
    }

    return new Response(null, { status: 404 });
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("App", () => {
  beforeEach(() => {
    mockFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the feature chart without initial search results", async () => {
    const fetchMock = mockFetch();
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Query Language" })).toBeInTheDocument();
    expect(screen.getByText("Searchable Fields")).toBeInTheDocument();
    expect(screen.getByText("Type line")).toBeInTheDocument();
    expect(screen.getByText("Query Syntax")).toBeInTheDocument();
    expect(screen.queryByAltText("Void Gate card image.")).not.toBeInTheDocument();
    expect(screen.queryByTestId("card-grid")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringMatching(/^\/api\/cards/));
  });

  it("collapses and expands query helper tables", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("Type line")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hide Searchable Fields" }));
    expect(screen.queryByText("Type line")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show Searchable Fields" }));
    expect(screen.getByText("Type line")).toBeInTheDocument();
  });

  it("searches when the user clicks Search", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch();

    render(<App />);
    await screen.findByRole("heading", { name: "Query Language" });

    await user.type(screen.getByLabelText("Query"), "name:void");
    await user.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/cards?q=name%3Avoid");
    });
    expect(await screen.findByAltText("Void Gate card image.")).toBeInTheDocument();
    expect(screen.getByTestId("card-grid")).toHaveAttribute("data-columns", "4");
  });

  it("shows parse diagnostics", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "Query Language" });

    await user.type(screen.getByLabelText("Query"), "energy>>3");
    await user.click(screen.getByRole("button", { name: "Search" }));

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText(/Expected value/)).toBeInTheDocument();
  });
});
