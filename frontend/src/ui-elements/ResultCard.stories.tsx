import type { Meta, StoryObj } from "@storybook/react";
import { ResultCard } from "./ResultCard";

const meta = {
  title: "UI/ResultCard",
  component: ResultCard,
  parameters: {
    layout: "centered",
  },
  args: {
    name: "Jinx, Loose Cannon",
    imageUrl: "",
    imageAlt: "Jinx card art",
    layout: "portrait",
    onClick: () => undefined,
  },
  decorators: [
    (Story) => (
      <div className="w-56 bg-app-bg p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ResultCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MissingImage: Story = {
  args: {
    imageUrl: "",
  },
};

export const WithFooter: Story = {
  args: {
    footer: (
      <div className="grid gap-1 text-xs text-text-secondary">
        <span>OGN AA</span>
        <span className="font-black text-accent-warm">$12.34</span>
      </div>
    ),
  },
};
