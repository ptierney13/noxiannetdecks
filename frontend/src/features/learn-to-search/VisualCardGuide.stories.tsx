import type { Meta, StoryObj } from "@storybook/react";
import { VisualCardGuide } from "./VisualCardGuide";

const meta: Meta<typeof VisualCardGuide> = {
  title: "features/learn-to-search/VisualCardGuide",
  component: VisualCardGuide,
  parameters: { layout: "padded" },
  args: { onSelect: (item) => console.log("selected:", item.label) },
};
export default meta;

type Story = StoryObj<typeof VisualCardGuide>;

export const Default: Story = {};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
};
