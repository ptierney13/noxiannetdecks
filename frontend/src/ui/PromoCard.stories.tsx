import type { Meta, StoryObj } from "@storybook/react";
import { PromoCard } from "./PromoCard";

const meta = {
  title: "UI/PromoCard",
  component: PromoCard,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: { onNavigate: () => undefined },
} satisfies Meta<typeof PromoCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: {
    label: "Tool",
    title: "Tier List Generator",
    description: "Create and share tier lists.",
    href: "/tools/tier-list",
  },
};

export const Muted: Story = {
  args: {
    label: "Learn",
    title: "Learn to Search",
    description: "Open the query builder and learn the search language.",
    muted: true,
  },
};

export const BothVariants: Story = {
  args: { label: "Tool", title: "Tier List Generator", description: "Create and share tier lists." },
  render: (args) => (
    <div className="grid gap-[0.85rem]" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", maxWidth: 700 }}>
      <PromoCard {...args} label="Tool" title="Tier List Generator" description="Create and share tier lists." href="/tools/tier-list" />
      <PromoCard {...args} label="Learn" title="Learn to Search" description="Open the query builder and learn the search language." muted />
    </div>
  ),
};
