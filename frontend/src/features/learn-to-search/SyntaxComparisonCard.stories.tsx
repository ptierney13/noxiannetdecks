import type { Meta, StoryObj } from "@storybook/react";
import { SyntaxComparisonCard } from "./SyntaxComparisonCard";

const meta: Meta<typeof SyntaxComparisonCard> = {
  title: "features/learn-to-search/SyntaxComparisonCard",
  component: SyntaxComparisonCard,
  parameters: { layout: "padded" },
  args: { onClick: (q: string) => console.log("clicked:", q) },
};
export default meta;

type Story = StoryObj<typeof SyntaxComparisonCard>;

export const ContainsVsExact: Story = {
  args: {
    left: {
      query: "name:jinx",
      label: 'Contains "jinx"',
      description: 'Matches cards whose name contains the text "jinx". Broad match — useful when you know part of the name.',
    },
    right: {
      query: 'name="Jinx"',
      label: 'Exactly "Jinx"',
      description: 'Matches only the exact name "Jinx". Narrow match — use when only that precise value should match.',
    },
  },
};

export const DomainContainsVsExact: Story = {
  args: {
    left: {
      query: "d:purple",
      label: "Domains include Purple",
      description: "Matches cards that have Purple among their domains. The card may have additional domains.",
    },
    right: {
      query: "d=purple",
      label: "Domains are exactly Purple",
      description: "Matches cards whose domain set is only Purple. No other domains allowed.",
    },
  },
};

export const Mobile: Story = {
  args: ContainsVsExact.args,
  parameters: { viewport: { defaultViewport: "mobile1" } },
};
