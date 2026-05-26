import type { Meta, StoryObj } from "@storybook/react";
import { PriceHistoryChart } from "./PriceHistoryChart";
import type { PublishedPriceRow } from "../../lib";

const meta: Meta<typeof PriceHistoryChart> = {
  title: "Features/Card/PriceHistoryChart",
  component: PriceHistoryChart,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof PriceHistoryChart>;

function makeRow(
  rowId: string,
  printing: string,
  condition: string,
  history: { observedAt: string; amount: number }[]
): PublishedPriceRow {
  return {
    rowId,
    cardName: "Jinx, Loose Cannon",
    sourceCardId: "JNX-001",
    sourceVariantId: `${rowId}-variant`,
    set: { slug: "ogn", label: "Origins" },
    collectorNumber: "001",
    rarity: "Rare",
    language: "en_us",
    condition,
    printing,
    externalIds: { tcgplayerId: "123", tcgplayerSkuId: "456" },
    currentPrice: { currency: "USD", amount: history[history.length - 1]?.amount ?? null },
    priceHistory: history,
  };
}

const DATES = ["2025-05-19", "2025-05-20", "2025-05-21", "2025-05-22", "2025-05-23", "2025-05-24", "2025-05-25"];

const foilRow = makeRow("foil-nm", "foil", "Near Mint", [
  { observedAt: DATES[0], amount: 12.5 },
  { observedAt: DATES[1], amount: 13.1 },
  { observedAt: DATES[2], amount: 11.8 },
  { observedAt: DATES[3], amount: 14.2 },
  { observedAt: DATES[4], amount: 13.6 },
  { observedAt: DATES[5], amount: 15.0 },
  { observedAt: DATES[6], amount: 14.4 },
]);

const normalRow = makeRow("normal-nm", "Normal", "Near Mint", [
  { observedAt: DATES[0], amount: 5.2 },
  { observedAt: DATES[1], amount: 4.9 },
  { observedAt: DATES[2], amount: 5.5 },
  { observedAt: DATES[3], amount: 6.1 },
  { observedAt: DATES[4], amount: 5.8 },
  { observedAt: DATES[5], amount: 6.4 },
  { observedAt: DATES[6], amount: 6.0 },
]);

const colorsByRowId: Record<string, string> = {
  "foil-nm": "var(--chart-series-1)",
  "normal-nm": "var(--chart-series-2)",
};

export const Default: Story = {
  args: {
    rows: [foilRow, normalRow],
    colorsByRowId,
  },
};

export const Empty: Story = {
  args: {
    rows: [
      makeRow("foil-nm", "foil", "Near Mint", []),
    ],
    colorsByRowId,
  },
};

export const SinglePoint: Story = {
  args: {
    rows: [
      makeRow("foil-nm", "foil", "Near Mint", [{ observedAt: DATES[0], amount: 12.5 }]),
    ],
    colorsByRowId: { "foil-nm": "var(--chart-series-1)" },
  },
};
