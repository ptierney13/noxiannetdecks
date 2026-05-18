import type { Meta, StoryObj } from "@storybook/react";
import { StorybookFeatureCardsPreview, StorybookViewportFrame } from "../home";

const meta = {
  title: "Design System/Shared/Feature Cards",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  render: () => (
    <StorybookViewportFrame mode="desktop">
      <StorybookFeatureCardsPreview />
    </StorybookViewportFrame>
  )
};

export const Mobile: Story = {
  render: () => (
    <StorybookViewportFrame mode="mobile">
      <StorybookFeatureCardsPreview />
    </StorybookViewportFrame>
  )
};
