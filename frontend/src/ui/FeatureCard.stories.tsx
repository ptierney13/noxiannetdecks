import type { Meta, StoryObj } from "@storybook/react";
import { FeatureCard } from "./FeatureCard";

const meta = {
  title: "UI/FeatureCard",
  component: FeatureCard,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: { onNavigate: () => undefined },
} satisfies Meta<typeof FeatureCard>;

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
      <FeatureCard {...args} icon="trade" title="Trade Balancer" description="Compare offers, price cards, and tune fair swaps." href="/tools/trade-balancer" />
      <FeatureCard {...args} icon="search" title="Card Search" description="Find cards by name, type, keyword and more." href="/cards" />
      <FeatureCard {...args} icon="sealed" title="Sealed Simulator" description="Generate pools from any format. Build and save decks." href="/tools/sealed-pools" />
    </div>
  ),
};
