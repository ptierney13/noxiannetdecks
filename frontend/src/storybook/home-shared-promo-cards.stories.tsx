import type { Meta, StoryObj } from "@storybook/react";
import { StorybookPromoCardsPreview, StorybookViewportFrame } from "../siteSystem";

const meta = {
  title: "Design System/Shared/Promo Cards",
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
      <StorybookPromoCardsPreview />
    </StorybookViewportFrame>
  )
};

export const Mobile: Story = {
  render: () => (
    <StorybookViewportFrame mode="mobile">
      <StorybookPromoCardsPreview />
    </StorybookViewportFrame>
  )
};
