import type { Meta, StoryObj } from "@storybook/react";
import { TilePromo } from "./TilePromo";

const meta = {
  title: "UI/TilePromo",
  component: TilePromo,
  parameters: { layout: "padded" },
  args: { onNavigate: () => undefined },
} satisfies Meta<typeof TilePromo>;

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

export const Pair: Story = {
  args: { label: "Tool", title: "Tier List Generator", description: "Create and share tier lists." },
  render: (args) => (
    <div className="grid gap-[0.85rem]" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", maxWidth: 700 }}>
      <TilePromo {...args} label="Tool" title="Tier List Generator" description="Create and share tier lists." href="/tools/tier-list" />
      <TilePromo {...args} label="Learn" title="Learn to Search" description="Open the query builder and learn the search language." href="/cards/learn-to-search" />
    </div>
  ),
};
