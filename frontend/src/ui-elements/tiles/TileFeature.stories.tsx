import type { Meta, StoryObj } from "@storybook/react";
import { TileFeature } from "./TileFeature";

const meta = {
  title: "UI/TileFeature",
  component: TileFeature,
  parameters: { layout: "padded" },
  args: { onNavigate: () => undefined },
} satisfies Meta<typeof TileFeature>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Search: Story = {
  args: {
    icon: "search",
    title: "Card Search",
    description: "Find cards by name, type, keyword and more.",
    href: "/cards",
  },
};

export const Trade: Story = {
  args: {
    icon: "trade",
    title: "Trade Balancer",
    description: "Compare offers, price cards, and tune fair swaps.",
    href: "/tools/trade-balancer",
  },
};

export const Sealed: Story = {
  args: {
    icon: "sealed",
    title: "Sealed Simulator",
    description: "Generate pools from any format. Build and save decks.",
    href: "/tools/sealed-pools",
  },
};

export const AllThree: Story = {
  args: { title: "Card Search", description: "Find cards by name, type, keyword and more.", href: "/cards", icon: "search" },
  render: (args) => (
    <div className="grid gap-[0.85rem] max-w-[900px]" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
      <TileFeature {...args} icon="trade" title="Trade Balancer" description="Compare offers, price cards, and tune fair swaps." href="/tools/trade-balancer" />
      <TileFeature {...args} icon="search" title="Card Search" description="Find cards by name, type, keyword and more." href="/cards" />
      <TileFeature {...args} icon="sealed" title="Sealed Simulator" description="Generate pools from any format. Build and save decks." href="/tools/sealed-pools" />
    </div>
  ),
};
