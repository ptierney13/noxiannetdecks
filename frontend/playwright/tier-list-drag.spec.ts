import { expect, test, type Locator, type Page } from "@playwright/test";

const placeholderImage =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 744 1039'><rect width='744' height='1039' fill='#dfe6e2'/></svg>"
  );

function createCard({
  id,
  riotName,
  cleanName,
  setId,
  setLabel,
  collectorNumber,
  cardtype = "Unit",
  supertype = null,
  typeline = "Unit",
  layout = "portrait",
  domain = ["Body"]
}: {
  id: string;
  riotName: string;
  cleanName: string;
  setId: string;
  setLabel: string;
  collectorNumber: string;
  cardtype?: string;
  supertype?: string | null;
  typeline?: string;
  layout?: "portrait" | "landscape";
  domain?: string[];
}) {
  return {
    id,
    riot_name: riotName,
    clean_name: cleanName,
    riftbound_id: id,
    tcgplayer_id: null,
    collector_number: collectorNumber,
    language: "en",
    rarity: "Rare",
    variant: { alternate_art: false, overnumbered: false, signed: false },
    finishes: ["foil"],
    attributes: { cost: 3, energy: 3, might: 4, power: 2, domain },
    type: { cardtype, supertype, tags: [], typeline },
    text: { rich: `${riotName} text.`, plain: `${riotName} text.`, flavour: null, keywords: [] },
    set: { set_id: setId, label: setLabel },
    media: {
      image_url: placeholderImage,
      artist: "Example Artist",
      accessibility_text: `${riotName} card image.`,
      layout
    }
  };
}

const cards = [
  createCard({
    id: "card-1",
    riotName: "Void Gate",
    cleanName: "void gate",
    setId: "OGN",
    setLabel: "Origins",
    collectorNumber: "1",
    typeline: "Unit - Dragon"
  }),
  createCard({
    id: "legend-1",
    riotName: "Lux - Lady of Luminosity",
    cleanName: "lux lady of luminosity",
    setId: "OGN",
    setLabel: "Origins",
    collectorNumber: "12",
    cardtype: "Legend",
    typeline: "Legend - Lux",
    domain: ["Calm", "Mind"]
  }),
  createCard({
    id: "champion-1",
    riotName: "Jinx - Rebel",
    cleanName: "jinx rebel",
    setId: "SFD",
    setLabel: "Spiritforged",
    collectorNumber: "47",
    supertype: "Champion",
    typeline: "Unit - Champion - Jinx",
    domain: ["Fury"]
  }),
  createCard({
    id: "rune-ogn-1",
    riotName: "Focus Rune",
    cleanName: "focus rune",
    setId: "OGN",
    setLabel: "Origins",
    collectorNumber: "88",
    cardtype: "Rune",
    typeline: "Rune",
    domain: []
  })
];

function createCardBatch(total: number, prefix: string) {
  return Array.from({ length: total }, (_, index) =>
    createCard({
      id: `${prefix}-${index + 1}`,
      riotName: `${prefix} card ${index + 1}`,
      cleanName: `${prefix} card ${index + 1}`,
      setId: "OGN",
      setLabel: "Origins",
      collectorNumber: String(index + 1).padStart(3, "0")
    })
  );
}

const queryCardMap = new Map<string, ReturnType<typeof createCard>[]>([
  ["rows:1", createCardBatch(9, "rows-one")],
  ["rows:3", createCardBatch(27, "rows-three")],
  ["rows:5", createCardBatch(45, "rows-five")]
]);

async function installTierListApiMocks(page: Page) {
  await page.route("**/api/query/features", async (route) => {
    await route.fulfill({
      json: {
        fields: [],
        syntax: []
      }
    });
  });

  await page.route("**/api/cards**", async (route) => {
    const query = new URL(route.request().url()).searchParams.get("q") ?? "";
    const items = queryCardMap.get(query) ?? cards;

    await route.fulfill({
      json: {
        total: items.length,
        normalizedQuery: query,
        diagnostics: [],
        items
      }
    });
  });
}

async function openGeneratedTierList(page: Page, query = "") {
  await page.goto("/");
  await page.getByRole("button", { name: "Tier List Generator" }).click();
  await expect(page.getByRole("heading", { name: "Tier List Generator" })).toBeVisible();
  await page.getByLabel("Query").fill(query);
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByTestId("tier-editor")).toBeVisible();
}

async function startDraggingCard(page: Page, cardTestId: string) {
  const card = page.getByTestId(cardTestId);
  await card.scrollIntoViewIfNeeded();
  const cardBox = await card.boundingBox();

  if (!cardBox) {
    throw new Error(`Unable to resolve drag geometry for ${cardTestId}`);
  }

  const startX = cardBox.x + cardBox.width / 2;
  const startY = cardBox.y + cardBox.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await expect(page.getByTestId("tier-drag-preview")).toBeVisible();

  return { x: startX, y: startY };
}

async function dragCardToSlot(page: Page, cardTestId: string, slotTestId: string) {
  const slot = page.getByTestId(slotTestId);
  await slot.scrollIntoViewIfNeeded();
  const slotBox = await slot.boundingBox();

  if (!slotBox) {
    throw new Error(`Unable to resolve drag geometry for ${slotTestId}`);
  }

  await startDraggingCard(page, cardTestId);
  await page.mouse.move(slotBox.x + slotBox.width / 2, slotBox.y + slotBox.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect(page.locator("[data-testid='tier-drag-preview']")).toHaveCount(0);
}

async function laneCardNames(lane: Locator): Promise<string[]> {
  return lane.locator("button[aria-label^='Drag ']").evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("aria-label")?.replace(/^Drag /, "") ?? "")
  );
}

test.describe("tier list dragging", () => {
  test.beforeEach(async ({ page }) => {
    await installTierListApiMocks(page);
  });

  test("shows the normalized tier-list banner text and reveals row removal on hover", async ({ page }) => {
    await openGeneratedTierList(page);

    await expect(page.locator(".tier-query-banner")).toContainText("Tier List for All cards");
    await expect(page.getByRole("heading", { name: "Tier List Editor" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Unmatched Cards" })).toBeVisible();
    await expect(page.getByText("Tier list editor is synced to the current generated query.")).toHaveCount(0);
    await expect(page.getByText("Drag cards directly into each row. Row labels stay editable between generations.")).toHaveCount(0);
    await expect(page.getByText("These are exactly the cards returned by the generated query.")).toHaveCount(0);

    const row = page.getByTestId("tier-row-shell-tier-row-1");
    const rowBefore = await row.boundingBox();
    if (!rowBefore) {
      throw new Error("Unable to resolve initial tier row geometry");
    }

    await dragCardToSlot(page, "tier-card-card-1", "tier-drop-tier-row-1-0");

    const rowAfter = await row.boundingBox();
    const rankedCard = page.getByLabel("S tier row").getByRole("button", { name: "Drag Void Gate" });
    const trayCard = page.getByTestId("tier-unranked-lane").getByRole("button", { name: "Drag Lux - Lady of Luminosity" });
    const rankedCardBox = await rankedCard.boundingBox();
    const trayCardBox = await trayCard.boundingBox();

    if (!rowAfter || !rankedCardBox || !trayCardBox) {
      throw new Error("Unable to resolve tier card sizing geometry");
    }

    expect(Math.abs(rowAfter.height - rowBefore.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(rankedCardBox.height - trayCardBox.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(rankedCardBox.width - trayCardBox.width)).toBeLessThanOrEqual(1);

    await page.getByRole("button", { name: "Add Row" }).click();
    const newRow = page.getByTestId("tier-row-shell-tier-row-6");
    const removeButton = page.getByRole("button", { name: "Remove Tier 6 row" });

    await expect(removeButton).toHaveCSS("opacity", "0");
    await newRow.hover();
    await expect(removeButton).toHaveCSS("opacity", "1");
  });

  test("keeps the bottom of the unmatched tray visible for 1, 3, and 5 rendered rows", async ({ page }) => {
    const cases = [
      { query: "rows:1", expectedRows: 1 },
      { query: "rows:3", expectedRows: 3 },
      { query: "rows:5", expectedRows: 5 }
    ];

    for (const { query, expectedRows } of cases) {
      await openGeneratedTierList(page, query);

      const unmatchedPanel = page.locator(".tier-unranked-panel");
      await unmatchedPanel.scrollIntoViewIfNeeded();

      const unmatchedLane = page.getByTestId("tier-unranked-lane");
      const renderedRowCount = await unmatchedLane.locator("button[aria-label^='Drag ']").evaluateAll((elements) => {
        const tops: number[] = [];

        for (const element of elements) {
          const top = Math.round(element.getBoundingClientRect().top);
          if (!tops.some((existingTop) => Math.abs(existingTop - top) <= 4)) {
            tops.push(top);
          }
        }

        return tops.length;
      });

      expect(renderedRowCount).toBe(expectedRows);

      const bottomGap = await unmatchedPanel.evaluate((panel) => {
        const cards = [...panel.querySelectorAll<HTMLElement>("button[aria-label^='Drag ']")];
        const lastCard = cards.at(-1);
        if (!lastCard) return null;

        const panelRect = panel.getBoundingClientRect();
        const lastCardRect = lastCard.getBoundingClientRect();
        return panelRect.bottom - lastCardRect.bottom;
      });

      expect(bottomGap).not.toBeNull();
      expect(bottomGap ?? 0).toBeGreaterThanOrEqual(24);
    }
  });

  test("keeps the tier list rendered while holding a card and moves the preview with the pointer", async ({ page }) => {
    await openGeneratedTierList(page);

    const preview = page.getByTestId("tier-drag-preview");
    const heading = page.getByRole("heading", { name: "Tier List Generator" });
    const editor = page.getByTestId("tier-editor");
    const { x, y } = await startDraggingCard(page, "tier-card-card-1");

    await page.waitForTimeout(250);
    await expect(heading).toBeVisible();
    await expect(editor).toBeVisible();
    await expect(preview).toBeVisible();
    await expect(page).toHaveURL(/\/$/);

    const initialBox = await preview.boundingBox();
    if (!initialBox) {
      throw new Error("Unable to resolve initial drag preview geometry");
    }

    await page.mouse.move(x + 120, y + 40, { steps: 10 });
    await expect
      .poll(async () => {
        const previewBox = await preview.boundingBox();
        if (!previewBox) return false;

        return Math.abs(previewBox.x - initialBox.x) > 10 || Math.abs(previewBox.y - initialBox.y) > 10;
      })
      .toBe(true);

    await expect(heading).toBeVisible();
    await expect(editor).toBeVisible();

    await page.mouse.up();
    await expect(preview).toHaveCount(0);
  });

  test("drags cards into a row and reorders them with a visible preview", async ({ page }) => {
    await openGeneratedTierList(page);

    await dragCardToSlot(page, "tier-card-card-1", "tier-drop-tier-row-1-0");
    await dragCardToSlot(page, "tier-card-legend-1", "tier-drop-tier-row-1-1");
    await dragCardToSlot(page, "tier-card-champion-1", "tier-drop-tier-row-1-0");

    expect(await laneCardNames(page.getByLabel("S tier row"))).toEqual([
      "Jinx - Rebel",
      "Void Gate",
      "Lux - Lady of Luminosity"
    ]);
  });

  test("highlights and drops correctly in the blank area after the last card and inside an empty row", async ({ page }) => {
    await openGeneratedTierList(page);

    await dragCardToSlot(page, "tier-card-card-1", "tier-drop-tier-row-1-0");
    await dragCardToSlot(page, "tier-card-legend-1", "tier-drop-tier-row-1-1");

    const row = page.getByTestId("tier-row-shell-tier-row-1");
    const rowBox = await row.boundingBox();
    if (!rowBox) {
      throw new Error("Unable to resolve populated row geometry");
    }

    await startDraggingCard(page, "tier-card-champion-1");
    await page.mouse.move(rowBox.x + rowBox.width - 20, rowBox.y + rowBox.height / 2, { steps: 12 });
    await expect(page.getByTestId("tier-drop-tier-row-1-2")).toHaveAttribute("data-active", "true");
    await page.mouse.up();
    await expect(page.locator("[data-testid='tier-drag-preview']")).toHaveCount(0);

    expect(await laneCardNames(page.getByLabel("S tier row"))).toEqual([
      "Void Gate",
      "Lux - Lady of Luminosity",
      "Jinx - Rebel"
    ]);

    await page.getByRole("button", { name: "Add Row" }).click();
    const emptyRow = page.getByTestId("tier-row-shell-tier-row-6");
    const emptyRowBox = await emptyRow.boundingBox();
    if (!emptyRowBox) {
      throw new Error("Unable to resolve empty row geometry");
    }

    await startDraggingCard(page, "tier-card-rune-ogn-1");
    await page.mouse.move(emptyRowBox.x + emptyRowBox.width - 24, emptyRowBox.y + emptyRowBox.height / 2, { steps: 12 });
    await expect(page.getByTestId("tier-drop-tier-row-6-0")).toHaveAttribute("data-active", "true");
    await page.mouse.up();
    await expect(page.locator("[data-testid='tier-drag-preview']")).toHaveCount(0);

    await expect(page.getByLabel("Tier 6 tier row").getByRole("button", { name: "Drag Focus Rune" })).toBeVisible();
  });

  test("moves ranked cards back to the unranked tray", async ({ page }) => {
    await openGeneratedTierList(page);

    await dragCardToSlot(page, "tier-card-card-1", "tier-drop-tier-row-1-0");
    await expect(page.getByLabel("S tier row").getByRole("button", { name: "Drag Void Gate" })).toBeVisible();

    await dragCardToSlot(page, "tier-card-card-1", "tier-drop-unranked-0");

    await expect(page.getByLabel("S tier row").getByRole("button", { name: "Drag Void Gate" })).toHaveCount(0);
    await expect(page.getByTestId("tier-unranked-lane").getByRole("button", { name: "Drag Void Gate" })).toBeVisible();
  });

  test("resets rankings back to the current generated filter state", async ({ page }) => {
    await openGeneratedTierList(page);

    const resetButton = page.getByRole("button", { name: "Reset Rankings" });
    await expect(resetButton).toBeDisabled();

    await dragCardToSlot(page, "tier-card-card-1", "tier-drop-tier-row-1-0");
    await dragCardToSlot(page, "tier-card-legend-1", "tier-drop-tier-row-2-0");

    await expect(resetButton).toBeEnabled();
    await expect(page.getByLabel("S tier row").getByRole("button", { name: "Drag Void Gate" })).toBeVisible();
    await expect(page.getByLabel("A tier row").getByRole("button", { name: "Drag Lux - Lady of Luminosity" })).toBeVisible();

    await resetButton.click();

    await expect(resetButton).toBeDisabled();
    await expect(page.getByLabel("S tier row").getByRole("button", { name: "Drag Void Gate" })).toHaveCount(0);
    await expect(page.getByLabel("A tier row").getByRole("button", { name: "Drag Lux - Lady of Luminosity" })).toHaveCount(0);
    expect(await laneCardNames(page.getByTestId("tier-unranked-lane"))).toEqual([
      "Void Gate",
      "Lux - Lady of Luminosity",
      "Jinx - Rebel",
      "Focus Rune"
    ]);
  });
});
